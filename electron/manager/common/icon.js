const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { app } = require('electron');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const findIconPath = require('freedesktop-icons');
const { getIconForPackage, isLaunchable } = require('./launch');

// --- SABİTLER ---

const DESKTOP_FILE_PATHS = [
    '/usr/share/applications',
    '/usr/local/share/applications',
    path.join(os.homedir(), '.local/share/applications'),
    '/var/lib/flatpak/exports/share/applications',
    '/var/lib/snapd/desktop/applications'
];

const EXTENSIONS = ['svg', 'png', 'xpm', 'ico', 'webp'];
const DEFAULT_THEMES = ['hicolor', 'Adwaita', 'gnome', 'breeze', 'Papirus'];

/**
 * İkon bulma ve yönetme servisi (Gelişmiş Oracle + freedesktop-icons)
 */
class IconService {
    constructor() {
        this.cache = {}; // Paket İsmi -> Dosya Yolu
        this.cachePath = null;
        this.isCacheDirty = false;
        this.systemIconTheme = null;
        this._isInitialized = false;
    }

    // --- ÖNBELLEK YÖNETİMİ ---

    async _ensureCachePath() {
        if (!this.cachePath) {
            try {
                this.cachePath = path.join(app.getPath('userData'), 'icon-cache.json');
            } catch (e) {
                console.error("[ICON-SERVICE] Önbellek yolu alınamadı:", e);
            }
        }
        return this.cachePath;
    }

    async loadCache() {
        if (this._isInitialized) return;
        await this._ensureCachePath();
        if (!this.cachePath) return;

        try {
            const data = await fs.readFile(this.cachePath, 'utf8');
            this.cache = JSON.parse(data);
        } catch {
            this.cache = {};
        }
        this._isInitialized = true;
    }

    async saveCache() {
        if (!this.cachePath || !this.isCacheDirty) return;
        try {
            await fs.writeFile(this.cachePath, JSON.stringify(this.cache, null, 2));
            this.isCacheDirty = false;
        } catch (e) {
            console.error("[ICON-SERVICE] Önbellek yazılamadı:", e);
        }
    }

    // --- ANA ÇÖZÜMLEYİCİ ---

    async getIconPath(packageName) {
        if (!this._isInitialized) await this.loadCache();

        // 1. Önce Önbellek
        if (this.cache[packageName]) {
            if (this.cache[packageName] === '__NO_ICON__') return null;
            return `local-resource://${this.cache[packageName]}`;
        }

        try {
            // 1.5 Başlatıcı Kontrolü
            // Eğer paket henüz indekslenmemişse veya başlatılabilir değilse, 
            // şimdilik __NO_ICON__ koyma ama null dön ki Oracle boş yere çalışmasın.
            if (!(await isLaunchable(packageName))) {
                return null;
            }

            const themes = await this._getThemes();
            const cleanName = this._cleanPackageName(packageName);
            let finalPath = null;

            // 2. Masaüstü Dosyası Analizi
            let iconNameHint = await getIconForPackage(packageName);
            if (!iconNameHint) iconNameHint = await this._findIconNameFromDesktopFile(packageName, cleanName);

            const iconToSearch = iconNameHint || cleanName;

            // Eğer mutlak yol ise
            if (iconToSearch && typeof iconToSearch === 'string' && iconToSearch.startsWith('/')) {
                if (await this._fileExists(iconToSearch)) finalPath = iconToSearch;
            }

            // 3. Standart freedesktop-icons Kütüphanesi ile Arama
            if (!finalPath && iconToSearch) {
                finalPath = await findIconPath({ name: iconToSearch, size: 48 }, themes, EXTENSIONS);
            }

            // 4. "Oracle" Stratejisi: Paket İçi Derin Tarama (Yalnızca bulunamazsa)
            if (!finalPath && packageName.length > 2) {
                finalPath = await this._searchIndependentOracle(packageName);
            }

            // 5. Sistem Teması ile Tekrar Deneme
            if (!finalPath && this.systemIconTheme) {
                finalPath = await findIconPath({ name: cleanName, size: 48 }, [this.systemIconTheme], EXTENSIONS);
            }

            // --- SONUÇ KAYDI ---
            if (finalPath) {
                this.cache[packageName] = finalPath;
                this.isCacheDirty = true;
                this.saveCache(); // Anlık kaydet (Async)
                return `local-resource://${finalPath}`;
            } else {
                // Negatif önbellek: Yalnızca gerçekten taranıp hiçbir yerde bulunamadıysa.
                // Zaman aşımına uğramış veya geçici bir hataysa buraya girmesin.
                this.cache[packageName] = '__NO_ICON__';
                this.isCacheDirty = true;
            }

        } catch (error) {
            console.error(`[ICON-SERVICE] ${packageName} için ikon çözümlenirken hata:`, error);
        }

        return null;
    }

    // --- TOPLU İŞLEMLER ---

    async getBatchIcons(packageNames) {
        //console.log(`[ICON-BATCH] ${packageNames.length} paket için ikonlar getiriliyor`);
        const results = {};

        await this.loadCache();

        const missing = [];
        for (const pkg of packageNames) {
            if (this.cache[pkg]) {
                if (this.cache[pkg] !== '__NO_ICON__') {
                    results[pkg] = `local-resource://${this.cache[pkg]}`;
                }
            } else {
                missing.push(pkg);
            }
        }

        if (missing.length > 0) {
            await this._processBatchParallel(missing, results);
            await this.saveCache(); // İşlem bittikten sonra tek seferde yaz
        }

        return results;
    }

    async _processBatchParallel(packages, results) {
        const batchSize = 30; // Oracle (pacman -Ql) ağır olduğu için batch küçüldü
        for (let i = 0; i < packages.length; i += batchSize) {
            const batch = packages.slice(i, i + batchSize);
            await Promise.all(batch.map(async (pkg) => {
                try {
                    // Zaman aşımı sınırı
                    const iconUrl = await Promise.race([
                        this.getIconPath(pkg),
                        new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 8000))
                    ]);
                    if (iconUrl) results[pkg] = iconUrl;
                } catch (e) {
                    console.warn(`[ICON-BATCH] ${pkg} için zaman aşımı veya hata`);
                }
            }));
        }
    }

    // --- YARDIMCILAR ---

    _cleanPackageName(name) {
        return name.replace(/-(bin|git|nightly|beta|edge|lts)$/, '');
    }

    async _fileExists(p) {
        try { await fs.access(p); return true; } catch { return false; }
    }

    async _getThemes() {
        if (!this.systemIconTheme) {
            const commands = [
                'gsettings get org.gnome.desktop.interface icon-theme',
                'kreadconfig5 --group "Icons" --key "Theme"',
                'xfconf-query -c xsettings -p /Net/IconThemeName'
            ];
            for (const cmd of commands) {
                try {
                    const { stdout } = await exec(cmd);
                    const theme = stdout.trim().replace(/'/g, '');
                    if (theme && theme !== '') {
                        this.systemIconTheme = theme;
                        break;
                    }
                } catch { }
            }
        }
        return this.systemIconTheme
            ? [this.systemIconTheme, ...DEFAULT_THEMES]
            : DEFAULT_THEMES;
    }

    async _findIconNameFromDesktopFile(packageName, cleanName) {
        const candidates = [
            `${packageName}.desktop`,
            `${cleanName}.desktop`,
            `org.${cleanName}.desktop`,
            `com.${cleanName}.desktop`
        ];

        for (const dir of DESKTOP_FILE_PATHS) {
            if (await this._fileExists(dir)) {
                for (const file of candidates) {
                    const fullPath = path.join(dir, file);
                    if (await this._fileExists(fullPath)) {
                        const icon = await this._extractIconFromDesktop(fullPath);
                        if (icon) return icon;
                    }
                }
            }
        }
        return null;
    }

    async _extractIconFromDesktop(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const match = content.match(/^Icon=(.*)$/m);
            return match ? match[1].trim() : null;
        } catch { return null; }
    }

    async _searchIndependentOracle(packageName) {
        try {
            // pacman -Ql yüklü dosya listesini dökme (Oracle tekniği)
            const { stdout } = await exec(`pacman -Ql ${packageName}`);
            const lines = stdout.split('\n');

            let bestPath = null;
            let maxScore = 0;

            for (const line of lines) {
                const filePath = line.split(' ').pop();
                if (!filePath) continue;

                const lower = filePath.toLowerCase();
                if (!/\.(png|svg|xpm|ico|webp)$/.test(lower)) continue;

                let score = 0;
                if (filePath.includes(packageName)) score += 10;
                if (filePath.includes('/icons/')) score += 5;
                if (filePath.includes('/pixmaps/')) score += 5;
                if (filePath.includes('/opt/')) score += 8;
                if (/256x256|scalable|48x48/.test(filePath)) score += 5;
                if (filePath.includes('symbolic')) score -= 5;

                if (score > maxScore) {
                    maxScore = score;
                    bestPath = filePath;
                }
            }
            return bestPath;
        } catch { return null; }
    }
}

// İkon servisi örneği oluştur
const iconService = new IconService();

module.exports = {
    getPackageIcon: (name) => iconService.getIconPath(name),
    getBatchIcons: (names) => iconService.getBatchIcons(names),
    batchResolveIcons: async (names, onProgress) => {
        await iconService.getBatchIcons(names);
        if (onProgress) onProgress({ current: names.length, total: names.length });
    }
};

