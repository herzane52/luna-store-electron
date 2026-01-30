const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');
const { app } = require('electron');
const util = require('util');
const execPromise = util.promisify(exec);

// --- CONSTANTS ---
const APPS_DIRS = [
    path.join(os.homedir(), '.local/share/applications'),
    '/usr/share/applications',
    '/usr/local/share/applications',
    '/var/lib/snapd/desktop/applications',
    '/var/lib/flatpak/exports/share/applications'
];

/**
 * .desktop dosyalarını tarayıp indeksleyen ve başlatan servis.
 */
class DesktopEntryService {
    constructor() {
        this.index = [];
        this.cache = new Map(); // Runtime fast lookup
        this.isReady = false;
        this.cachePath = null;
    }

    // --- CACHE MANAGEMENT ---

    getCachePath() {
        if (!this.cachePath) {
            const userData = app.getPath('userData');
            const dataDir = path.join(userData, 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            this.cachePath = path.join(dataDir, 'app-cache.json');
        }
        return this.cachePath;
    }

    async loadCache() {
        try {
            const p = this.getCachePath();
            if (fs.existsSync(p)) {
                const data = fs.readFileSync(p, 'utf-8');
                const json = JSON.parse(data);
                this.index = json.index || [];
                console.log(`[LAUNCHER-SERVICE] Loaded ${this.index.length} entries from cache.`);
                this.isReady = true;
                return true;
            }
        } catch (e) {
            console.error('[LAUNCHER-SERVICE] Error loading cache:', e);
        }
        return false;
    }

    async saveCache() {
        try {
            const p = this.getCachePath();
            const data = JSON.stringify({ index: this.index }, null, 2);
            fs.writeFileSync(p, data);
            //console.log('[LAUNCHER-SERVICE] Cache saved to disk.');
        } catch (e) {
            console.error('[LAUNCHER-SERVICE] Error saving cache:', e);
        }
    }

    // --- INDEXING & SYNC ---

    async syncIndex(onProgress) {
        console.log('[LAUNCHER-SYNC] Starting desktop entry indexing...');
        this._reportProgress(onProgress, 'Ağaç taranıyor...', 5);

        this.index = [];
        this.cache.clear();

        const dirsToScan = APPS_DIRS.filter(dir => fs.existsSync(dir));
        let totalFiles = 0;
        dirsToScan.forEach(dir => {
            try { totalFiles += fs.readdirSync(dir).length; } catch (e) { }
        });

        let processed = 0;
        for (const dir of dirsToScan) {
            processed = await this._scanDirectory(dir, processed, totalFiles, onProgress);
        }

        console.log(`[LAUNCHER-SYNC] Indexed ${this.index.length} desktop entries`);
        await this.saveCache();

        this.isReady = true;
        this._reportProgress(onProgress, 'Tamamlandı!', 100);

        return { index: this.index, count: this.index.length };
    }

    async _scanDirectory(dir, processedCount, totalFiles, onProgress) {
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                processedCount++;
                if (!file.endsWith('.desktop')) continue;

                if (processedCount % 50 === 0 && totalFiles > 0) {
                    const percent = 5 + Math.floor((processedCount / totalFiles) * 80);
                    this._reportProgress(onProgress, `İşleniyor: ${processedCount}/${totalFiles}`, percent);
                }

                const fullPath = path.join(dir, file);
                const entry = this.parseDesktopFile(fullPath, file);
                if (entry) this.index.push(entry);
            }
        } catch (e) { }
        return processedCount;
    }

    _reportProgress(cb, status, progress) {
        if (cb) cb({ status, progress });
    }

    // --- PARSING ---

    parseDesktopFile(filePath, filename) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const nameMatch = content.match(/^Name=(.*)$/m);
            const execMatch = content.match(/^Exec=(.*)$/m);
            const iconMatch = content.match(/^Icon=(.*)$/m);
            const noDisplayMatch = content.match(/^NoDisplay=true$/m);

            if (noDisplayMatch || !execMatch) return null;

            return {
                id: filename.replace('.desktop', '').toLowerCase(),
                filename: filename,
                fullPath: filePath,
                name: nameMatch ? nameMatch[1].trim() : '',
                exec: execMatch ? execMatch[1].trim() : '',
                icon: iconMatch ? iconMatch[1].trim() : null
            };
        } catch { return null; }
    }

    // --- SEARCH / FIND (HYBRID & ORACLE) ---

    async findEntry(packageName) {
        if (!this.isReady) await this.loadCache();
        if (this.cache.has(packageName)) return this.cache.get(packageName);

        const cleanName = this._cleanPackageName(packageName);
        const candidates = this.index.filter(e => this._isValidCandidate(e));

        // 1. Standart Hiyerarşik Arama
        let match =
            this._findExactMatch(candidates, cleanName) ||
            this._findExecMatch(candidates, cleanName) ||
            this._findNameMatch(candidates, cleanName) ||
            this._findPrefixMatch(candidates, cleanName);

        // 2. Oracle Stratejisi: Paket içeriğinden tespiti dene (Yalnızca bulunamazsa)
        if (!match) {
            //console.log(`[LAUNCHER] Oracle starting for: ${packageName}`);
            match = await this._searchOracleForDesktop(packageName);
        }

        if (match) {
            this.cache.set(packageName, match);
            this.saveCache(); // Anlık kaydet
        }

        return match || null;
    }

    async _searchOracleForDesktop(packageName) {
        try {
            // pacman -Ql ile pakete ait .desktop dosyalarını bul
            const { stdout } = await execPromise(`pacman -Ql ${packageName}`);
            const lines = stdout.split('\n');

            // .desktop dosyalarını yakala
            const desktopPaths = lines
                .map(l => l.split(' ').pop())
                .filter(p => p && p.endsWith('.desktop') && p.includes('/share/applications/'));

            for (const p of desktopPaths) {
                if (fs.existsSync(p)) {
                    const filename = path.basename(p);
                    const entry = this.parseDesktopFile(p, filename);
                    if (entry) return entry;
                }
            }
        } catch (e) { }
        return null;
    }

    _cleanPackageName(name) {
        // e.g. visual-studio-code-bin -> visual-studio-code
        return name.replace(/-(bin|git|nightly|beta|edge|lts|stable)$/, '').toLowerCase();
    }

    _isValidCandidate(entry) {
        const id = entry.id.toLowerCase();
        if (id.includes('default-web-browser')) return false;
        if (/[a-z0-9]{32}/.test(id)) return false;
        const genericExcludes = ['user-feedback', 'report-error', 'documentation', 'help'];
        return !genericExcludes.includes(id);
    }

    _findExactMatch(candidates, name) {
        return candidates.find(e => e.id === name);
    }

    _findExecMatch(candidates, name) {
        return candidates.find(e => {
            const cmd = e.exec.split(' ')[0].toLowerCase().replace(/^.*\//, '');
            return cmd === name;
        });
    }

    _findNameMatch(candidates, name) {
        const lowerName = name.replace(/-/g, ' ');
        return candidates.find(e => e.name.toLowerCase() === lowerName || e.name.toLowerCase() === name);
    }

    _findPrefixMatch(candidates, name) {
        return candidates.find(e => e.id.startsWith(name + '.') || e.id.startsWith(name + '-'));
    }

    // --- LAUNCHING ---

    async launchApp(packageName) {
        const entry = await this.findEntry(packageName);
        if (!entry) return { success: false, error: 'Başlatıcı bulunamadı.' };

        try {
            // Parametreleri temizle ve shell üzerinden başlat
            let command = entry.exec.replace(/%[fFuUikc]/g, '').trim();
            console.log(`[LAUNCH] ${packageName} -> ${command}`);

            const subprocess = spawn(command, [], { detached: true, stdio: 'ignore', shell: true });
            subprocess.unref();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

const desktopService = new DesktopEntryService();

module.exports = {
    initialize: () => desktopService.loadCache(),
    syncCache: (cb) => desktopService.syncIndex(cb),
    launchApp: (name) => desktopService.launchApp(name),
    isLaunchable: async (name) => !!(await desktopService.findEntry(name)),
    getIconForPackage: async (name) => {
        const entry = await desktopService.findEntry(name);
        return entry ? entry.icon : null;
    }
};
