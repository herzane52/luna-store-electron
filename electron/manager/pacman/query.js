const { exec: cp_exec } = require('child_process');
const fs = require('fs').promises;
const PACMAN_CONF_PATH = '/etc/pacman.conf';

let cachedPackages = null;
let cachedUpdates = null;

// Sudo gerektirmeyen komutlar için cp_exec kullanılır
async function getInstalledPackages(force = false) {
  if (!force && cachedPackages) {
    return { packages: cachedPackages, fromCache: true };
  }

  try {
    // 1. Depo haritasını ve yabancı paketleri al
    const [repoStdout, foreignStdout] = await Promise.all([
      execPromise('pacman -Sl'),
      execPromise('pacman -Qm')
    ]);

    const repoMap = new Map();
    repoStdout.split('\n').forEach(line => {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) repoMap.set(parts[1], parts[0]);
    });

    const foreignSet = new Set();
    foreignStdout.split('\n').forEach(line => {
      const name = line.split(/\s+/)[0];
      if (name) foreignSet.add(name);
    });

    // 2. Yerel detaylı bilgileri al
    const qiStdout = await execPromise('pacman -Qi');

    const packages = [];
    // Satır başındaki 'Name' (İsim) kısmına göre böl
    const blocks = qiStdout.split(/\n(?=Name)/);

    for (const block of blocks) {
      if (!block.trim()) continue;

      const pkg = { type: 'dependency', description: '' };
      const lines = block.split('\n');

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim();
        const val = line.substring(colonIndex + 1).trim();

        if (key === 'Name') pkg.name = val;
        else if (key === 'Version') pkg.version = val;
        else if (key === 'Description') pkg.description = val;
        else if (key === 'Installed Size') pkg.installedSize = val;
        else if (key === 'Install Reason') {
          pkg.type = val.toLowerCase().includes('explicitly') ? 'explicit' : 'dependency';
        }
      }

      if (pkg.name) {
        pkg.repo = repoMap.get(pkg.name) || 'aur';
        packages.push(pkg);
      }
    }

    cachedPackages = packages;
    return { packages };
  } catch (error) {
    console.error('Paketler getirilirken hata:', error);
    return { error: error.message, packages: [] };
  }
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    // Tam Qi çıktısı için geniş tampon (buffer) alanı
    cp_exec(`LANG=C ${command}`, { maxBuffer: 15 * 1024 * 1024 }, (error, stdout) => {
      if (error && error.code !== 1) reject(error);
      else resolve(stdout || '');
    });
  });
}

let currentSearchProcess = null;

function searchPackages(query) {
  if (currentSearchProcess) {
    try {
      currentSearchProcess.kill();
    } catch (e) { }
  }

  return new Promise((resolve, reject) => {
    if (!query) return reject({ error: 'Arama sorgusu boş olamaz.' });

    // Boşlukları tireye dönüştürerek 'obs studio' -> 'obs-studio' eşleşmesini sağlar
    const flexibleQuery = query.trim().replace(/\s+/g, '-');

    currentSearchProcess = cp_exec(`pacman -Ss ${flexibleQuery}`, (error, stdout, stderr) => {
      currentSearchProcess = null;

      // Süreç iptal edildiyse
      if (error && error.killed) {
        return resolve({ results: [], killed: true });
      }

      // Hata oluştuysa (Çıkış kodu 1 'hiç sonuç bulunamadı' demektir, hata değildir)
      if (error && error.code !== 1) {
        return reject({ error: error.message, stderr });
      }

      if (!stdout || stdout.trim() === '') {
        return resolve({ results: [] });
      }

      const lines = stdout.trim().split('\n');
      const results = [];
      let currentPackage = null;
      for (const line of lines) {
        const repoMatch = line.match(/^([^\/ ]+\/)([^ ]+) ([^ ]+)/);
        if (repoMatch) {
          if (currentPackage) results.push(currentPackage);
          currentPackage = { repo: repoMatch[1].slice(0, -1), name: repoMatch[2], version: repoMatch[3], description: '' };
        } else if (currentPackage && line.startsWith('    ')) {
          currentPackage.description += line.trim() + ' ';
        }
      }
      if (currentPackage) results.push(currentPackage);
      resolve({ results });
    });
  });
}

function getPackageInfo(packageName) {
  return new Promise(async (resolve, reject) => {
    if (!packageName) return reject({ error: 'Paket adı boş olamaz.' });

    const parsePacmanOutput = (stdout) => {
      const info = {};
      const lines = stdout.split('\n');
      let lastKey = null;

      // Standart ve yerel dillerdeki birincil başlıklar
      const KNOWN_HEADERS = [
        'name', 'isim', 'version', 'sürüm', 'description', 'açıklama', 'architecture', 'mimari',
        'url', 'licenses', 'lisanslar', 'groups', 'gruplar', 'provides', 'sağlananlar',
        'depends_on', 'bağımlılıkları', 'optional_deps', 'tercihli_bağımlılıklar',
        'required_by', 'ihtiyaç_duyulanlar', 'optional_for', 'isteğe_bağlı',
        'conflicts_with', 'çakışıyor', 'replaces', 'değiştirilenler',
        'installed_size', 'kurulum_boyutu', 'packager', 'paketçi',
        'build_date', 'inşa_tarihi', 'install_date', 'yükleme_tarihi',
        'install_reason', 'yükleme_sebebi', 'install_script', 'kurulum_betiği',
        'validated_by', 'doğrulayan', 'repository', 'depo', 'download_size', 'indirme_boyutu'
      ];

      for (const line of lines) {
        if (!line.trim()) continue;

        // Başlık kontrolü: Sütun 0'da başlar, ':' içerir ve anahtar listemizde bulunur
        const match = line.match(/^([^:\s][^:]*)\s*:\s*(.*)$/);
        if (match) {
          const rawKey = match[1].trim();
          const slug = rawKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

          if (KNOWN_HEADERS.includes(slug) || !lastKey) {
            info[slug] = match[2].trim();
            lastKey = slug;
            continue;
          }
        }

        // Çok satırlı içeriklerin devamı
        if (lastKey) {
          info[lastKey] += '\n' + line.trim();
        }
      }
      return info;
    };

    try {
      // 1. Yerel Bilgileri Al (-Qi) - Satır kaymasını önlemek için sütun genişliğini yüksek tut
      const localPromise = new Promise((res) => {
        cp_exec(`COLUMNS=1000 LC_MESSAGES=C pacman -Qi ${packageName}`, (err, stdout) => {
          if (err) res(null); // Yüklü değil veya hata
          else res(parsePacmanOutput(stdout));
        });
      });

      // 2. Senkron Bilgilerini Al (-Si)
      const syncPromise = new Promise((res) => {
        cp_exec(`COLUMNS=1000 LC_MESSAGES=C pacman -Si ${packageName}`, (err, stdout) => {
          if (err) res(null); // Depoda yok veya hata
          else res(parsePacmanOutput(stdout));
        });
      });

      const [localInfo, syncInfo] = await Promise.all([localPromise, syncPromise]);

      if (!localInfo && !syncInfo) {
        return reject({ error: 'Paket bilgisi alınamadı.' });
      }

      // Birleştir: Yerel bilgiler senkron bilgilerinin üzerine yazar
      const mergedInfo = { ...(syncInfo || {}), ...(localInfo || {}) };

      // Yerel Paket İşlemleri (Depoda yoksa)
      if (!syncInfo && localInfo) {
        mergedInfo.repository = null;
        mergedInfo.repo = null;
      }

      // Varsa arka uç önbelleğini güncelle
      if (cachedPackages && Array.isArray(cachedPackages)) {
        const pkgIndex = cachedPackages.findIndex(p => p.name === packageName);
        if (pkgIndex !== -1) {
          const p = cachedPackages[pkgIndex];
          cachedPackages[pkgIndex] = {
            ...p,
            version: mergedInfo.version || p.version,
            description: mergedInfo.description || p.description,
            installedSize: mergedInfo.installed_size || p.installedSize,
            type: mergedInfo.install_reason === 'Explicitly installed' ? 'explicit' : p.type
          };
        }
      }

      resolve({ info: mergedInfo });

    } catch (e) {
      reject({ error: e.message });
    }
  });
}

async function getIgnoredPackages() {
  try {
    const content = await fs.readFile(PACMAN_CONF_PATH, 'utf8');
    // "IgnorePkg = ..." veya "#IgnorePkg = ..." eşleşmesi
    const regex = /^(\s*#?\s*)IgnorePkg\s*=\s*(.*)$/m;
    const match = content.match(regex);

    if (match) {
      if (match[1].includes('#')) {
        return { packages: [] };
      }

      if (match[2] && match[2].trim()) {
        const result = match[2].trim().split(/[\s,]+/);
        return { packages: result };
      }
    }
    return { packages: [] };
  } catch (error) {
    console.error('pacman.conf okuma hatası:', error.message);
    return { packages: [], error: error.message };
  }
}


function getUpdates(force = false) {
  return new Promise((resolve) => {
    if (!force && cachedUpdates) {
      return resolve({ updates: cachedUpdates, count: cachedUpdates.length, fromCache: true });
    }
    // 1. Depo tespiti için global harita oluştur
    cp_exec('LANG=C pacman -Sl', (errSl, stdoutSl) => {
      const repoMap = new Map();
      if (!errSl) {
        stdoutSl.trim().split('\n').forEach(line => {
          const parts = line.split(' ');
          if (parts.length >= 2) {
            repoMap.set(parts[1], parts[0]);
          }
        });
      }

      // 2. Güncelleme listesini al
      cp_exec('pacman -Qu', (error, stdout, stderr) => {
        // Güncelleme bulunamadığında pacman -Qu 1 döner, bu bir hata değildir
        if (error && error.code !== 1) {
          console.error("❌ getUpdates Hatası:", error.message);
          return resolve({ updates: [], count: 0, error: error.message });
        }

        const lines = stdout.trim().split('\n').filter(line => line.trim() !== "");
        const updates = lines.map(line => {
          const match = line.match(/^(\S+)\s+(\S+)\s+->\s+(\S+)$/);
          if (match) {
            const name = match[1];
            return {
              name,
              currentVersion: match[2],
              newVersion: match[3],
              repo: repoMap.get(name) || 'unknown'
            };
          }
          return null;
        }).filter(u => u);

        if (updates.length === 0) {
          return resolve({ updates: [], count: 0 });
        }

        // 3. Metadata zenginleştirme (Tür ve Açıklama için -Qi)
        const names = updates.map(u => u.name);
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < names.length; i += chunkSize) {
          chunks.push(names.slice(i, i + chunkSize));
        }

        const enrichedMap = new Map();
        updates.forEach(u => enrichedMap.set(u.name, { ...u, type: 'dependency', description: '' }));

        Promise.all(chunks.map(chunk => new Promise((res) => {
          // Yerel bilgi (-Qi) ve Senkron bilgi (-Si) için paralel getirme
          const qiPromise = new Promise(r => cp_exec(`LANG=C pacman -Qi ${chunk.join(' ')}`, (err, stdout) => r(stdout || '')));
          const siPromise = new Promise(r => cp_exec(`LANG=C pacman -Si ${chunk.join(' ')}`, (err, stdout) => r(stdout || '')));

          Promise.all([qiPromise, siPromise]).then(([stdoutQi, stdoutSi]) => {
            // -Qi'yi ayrıştır
            const qiBlocks = stdoutQi.split('\n\n');
            qiBlocks.forEach(block => {
              const lines = block.trim().split('\n');
              let name = '', desc = '', reason = '';
              lines.forEach(l => {
                if (l.startsWith('Name')) name = l.split(':')[1].trim();
                else if (l.startsWith('Description')) desc = l.split(':')[1].trim();
                else if (l.startsWith('Install Reason')) reason = l.split(':')[1].trim();
              });
              if (name && enrichedMap.has(name)) {
                const pkg = enrichedMap.get(name);
                pkg.description = desc;
                pkg.type = reason === 'Explicitly installed' ? 'explicit' : 'dependency';
              }
            });

            // -Si'yi ayrıştır
            const siBlocks = stdoutSi.split('\n\n');
            siBlocks.forEach(block => {
              const lines = block.trim().split('\n');
              let name = '', downloadSize = '';
              lines.forEach(l => {
                if (l.startsWith('Name')) name = l.split(':')[1].trim();
                else if (l.startsWith('Download Size')) downloadSize = l.split(':')[1].trim();
              });
              if (name && enrichedMap.has(name)) {
                enrichedMap.get(name).downloadSize = downloadSize;
              }
            });
            res();
          });
        }))).then(() => {
          resolve({ updates: Array.from(enrichedMap.values()), count: updates.length });
        });
      });
    });
  });
}


function getOrphans() {
  return new Promise((resolve, reject) => {
    require("child_process").exec("pacman -Qtdq", (err, stdout) => {
      if (err) return resolve({ packages: [] });
      const packages = stdout.trim().split("\n").filter(p => p);
      resolve({ packages });
    });
  });
}

// checkupdates kullanarak sudo'suz güncelleme kontrolü
function checkUpdates(force = false) {
  return new Promise((resolve) => {
    if (!force && cachedUpdates) {
      return resolve({ updates: cachedUpdates, count: cachedUpdates.length, fromCache: true });
    }
    // 1. Depo tespiti için global harita oluştur
    cp_exec('LANG=C pacman -Sl', (errSl, stdoutSl) => {
      const repoMap = new Map();
      if (!errSl) {
        stdoutSl.trim().split('\n').forEach(line => {
          const parts = line.split(' ');
          if (parts.length >= 2) {
            repoMap.set(parts[1], parts[0]);
          }
        });
      }

      // 2. checkupdates komutunu çalıştır (pacman-contrib paketi)
      cp_exec('checkupdates', (error, stdout, stderr) => {
        if (error && error.code !== 2 && error.code !== 0) {
          console.error("checkUpdates Hatası:", error.message);
        }

        const lines = stdout.trim().split('\n').filter(line => line.trim() !== "");
        if (lines.length === 0) {
          return resolve({ updates: [], count: 0 });
        }

        const updates = lines.map(line => {
          const match = line.match(/^(\S+)\s+(\S+)\s+->\s+(\S+)$/);
          if (match) {
            const name = match[1];
            return {
              name,
              currentVersion: match[2],
              newVersion: match[3],
              repo: repoMap.get(name) || 'unknown'
            };
          }
          return null;
        }).filter(u => u);

        if (updates.length === 0) {
          return resolve({ updates: [], count: 0 });
        }

        // 3. Metadata zenginleştirme (pacman -Qi)
        const names = updates.map(u => u.name);
        const chunkSize = 50;
        const chunks = [];
        for (let i = 0; i < names.length; i += chunkSize) {
          chunks.push(names.slice(i, i + chunkSize));
        }

        const enrichedMap = new Map();
        updates.forEach(u => enrichedMap.set(u.name, { ...u, type: 'dependency', description: '' }));

        Promise.all(chunks.map(chunk => new Promise((res) => {
          // Yerel bilgi (-Qi) ve Senkron bilgi (-Si) için paralel getirme
          const qiPromise = new Promise(r => cp_exec(`LANG=C pacman -Qi ${chunk.join(' ')}`, (err, stdout) => r(stdout || '')));
          const siPromise = new Promise(r => cp_exec(`LANG=C pacman -Si ${chunk.join(' ')}`, (err, stdout) => r(stdout || '')));

          Promise.all([qiPromise, siPromise]).then(([stdoutQi, stdoutSi]) => {
            // -Qi'yi ayrıştır
            const qiBlocks = stdoutQi.split('\n\n');
            qiBlocks.forEach(block => {
              const lines = block.trim().split('\n');
              let name = '', desc = '', reason = '';
              lines.forEach(l => {
                if (l.startsWith('Name')) name = l.split(':')[1].trim();
                else if (l.startsWith('Description')) desc = l.split(':')[1].trim();
                else if (l.startsWith('Install Reason')) reason = l.split(':')[1].trim();
              });
              if (name && enrichedMap.has(name)) {
                const pkg = enrichedMap.get(name);
                pkg.description = desc;
                pkg.type = reason === 'Explicitly installed' ? 'explicit' : 'dependency';
              }
            });

            // -Si'yi ayrıştır
            const siBlocks = stdoutSi.split('\n\n');
            siBlocks.forEach(block => {
              const lines = block.trim().split('\n');
              let name = '', downloadSize = '';
              lines.forEach(l => {
                if (l.startsWith('Name')) name = l.split(':')[1].trim();
                else if (l.startsWith('Download Size')) downloadSize = l.split(':')[1].trim();
              });
              if (name && enrichedMap.has(name)) {
                enrichedMap.get(name).downloadSize = downloadSize;
              }
            });
            res();
          });
        }))).then(() => {
          resolve({ updates: Array.from(enrichedMap.values()), count: updates.length });
        });
      });
    });
  });
}

function getBatchInfo(packageNames) {
  return new Promise((resolve) => {
    if (!packageNames || packageNames.length === 0) return resolve({ results: {} });

    // 1. Önce genel bilgileri al (-Si)
    cp_exec(`LANG=C pacman -Si ${packageNames.join(' ')}`, (error, stdout) => {
      const results = {};
      const blocks = (stdout || '').split('\n\n');

      blocks.forEach(block => {
        const lines = block.trim().split('\n');
        let name = '';
        const info = {};

        lines.forEach(line => {
          const match = line.match(/^([^:]+)\s*:\s*(.*)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            if (key === 'Name') name = value;

            if (['Download Size', 'Installed Size', 'Repository', 'Version'].includes(key)) {
              const cleanKey = key.toLowerCase().replace(/\s+/g, '_');
              info[cleanKey] = value;
            }
          }
        });

        if (name) {
          results[name] = { ...info, isInstalled: false, icon: null, type: 'unknown' };
        }
      });

      // 2. Kurulu paketleri kontrol et (-Qi)
      cp_exec(`LANG=C pacman -Qi ${packageNames.join(' ')}`, async (qiError, qiStdout) => {
        const qiBlocks = (qiStdout || '').split('\n\n');
        const { getBatchIcons } = require('../common/icon');
        const iconsMap = await getBatchIcons(packageNames);

        qiBlocks.forEach(block => {
          const lines = block.trim().split('\n');
          let name = '', reason = '';
          lines.forEach(l => {
            if (l.startsWith('Name')) name = l.split(':')[1].trim();
            else if (l.startsWith('Install Reason')) reason = l.split(':')[1].trim();
          });

          if (name && results[name]) {
            results[name].isInstalled = true;
            results[name].type = reason === 'Explicitly installed' ? 'explicit' : 'dependency';
            results[name].icon = iconsMap[name] || null;
          }
        });

        resolve({ results });
      });
    });
  });
}

function checkCommand(command) {
  return new Promise((resolve) => {
    cp_exec(`which ${command}`, (error) => {
      resolve({ exists: !error });
    });
  });
}

module.exports = {
  getOrphans,
  getInstalledPackages,
  searchPackages,
  getPackageInfo,
  getBatchInfo,
  getIgnoredPackages,
  getUpdates,
  checkUpdates,
  checkCommand
};