const { getAURHelper } = require('./operations');

let currentAURSearchProcess = null;

function searchAURPackages(query) {
  const { exec: cp_exec } = require('child_process');
  if (currentAURSearchProcess) {
    try {
      currentAURSearchProcess.kill();
    } catch (e) { }
  }

  return new Promise(async (resolve, reject) => {
    if (!query) return reject({ error: 'Arama sorgusu boş olamaz.' });

    try {
      const helper = await getAURHelper();
      // Boşlukları tireye dönüştürme
      const flexibleQuery = query.trim().replace(/\s+/g, '-');

      currentAURSearchProcess = cp_exec(`${helper} -Ss ${flexibleQuery}`, (error, stdout, stderr) => {
        currentAURSearchProcess = null;

        if (error && !error.killed) {
          // Arama sonucu boşsa error kodu
          if (error.code === 1) return resolve({ results: [] });
          return reject({ error: error.message, stderr });
        }

        if (error && error.killed) {
          return resolve({ results: [], killed: true });
        }

        const lines = stdout.trim().split('\n');
        const results = [];
        let currentPackage = null;
        for (const line of lines) {
          if (line.startsWith('aur/')) {
            const match = line.match(/^aur\/([^ ]+) ([^ ]+)/);
            if (match) {
              if (currentPackage) results.push(currentPackage);
              currentPackage = { repo: 'aur', name: match[1], version: match[2], description: '' };
            }
          } else if (currentPackage && line.startsWith('    ')) {
            currentPackage.description += line.trim() + ' ';
          }
        }
        if (currentPackage) results.push(currentPackage);
        resolve({ results });
      });
    } catch (error) {
      reject({ error: error.message });
    }
  });
}


function getAURUpdates() {
  const { exec: cp_exec } = require('child_process');
  return new Promise(async (resolve) => {
    try {
      const helper = await getAURHelper();
      cp_exec(`LANG=C ${helper} -Qua`, (error, stdout, stderr) => {
        if (error && error.code !== 1) {
          console.error("getAURUpdates Hatası:", error.message);
          return resolve({ updates: [], count: 0, error: error.message });
        }

        const lines = stdout.trim().split('\n').filter(line => line.trim() !== "");
        if (lines.length === 0) {
          return resolve({ updates: [], count: 0 });
        }

        const updates = lines.map(line => {
          const match = line.match(/^(\S+)\s+(\S+)\s+->\s+(\S+)$/);
          if (match) {
            return {
              name: match[1],
              currentVersion: match[2],
              newVersion: match[3],
              repo: 'aur',
              type: 'explicit',
              description: ''
            };
          }
          return null;
        }).filter(u => u);

        resolve({ updates, count: updates.length });
      });
    } catch (error) {
      console.error("AUR Helper bulunamadı:", error.message);
      resolve({ updates: [], count: 0 });
    }
  });
}

function getAURBatchInfo(packageNames) {
  const { exec: cp_exec } = require('child_process');
  return new Promise(async (resolve) => {
    if (!packageNames || packageNames.length === 0) return resolve({ results: {} });

    try {
      const helper = await getAURHelper();
      cp_exec(`LANG=C ${helper} -Si ${packageNames.join(' ')}`, (error, stdout) => {
        const results = {};
        const blocks = (stdout || '').split('\n\n');

        blocks.forEach(block => {
          const lines = block.trim().split('\n');
          let name = '';
          const info = {};

          lines.forEach(line => {
            const match = line.match(/^([^:]+)\s*:\s*(.*)$/);
            if (match) {
              const key = match[1].toLowerCase().replace(/[^a-z0-9]/g, '');
              const value = match[2].trim();
              if (key === 'name') name = value;

              if (['downloadsize', 'installedsize', 'repository', 'version'].includes(key)) {
                info[key] = value;
              }
            }
          });

          if (name) {
            results[name] = { ...info, isInstalled: false };
          }
        });

        // Tüm kurulu paketlerin listesini al (daha hızlı ve güvenilir)
        cp_exec(`pacman -Qq`, async (qsErr, qsStdout) => {
          const installedPackagesSet = new Set((qsStdout || '').split('\n').map(s => s.trim()));
          const { getBatchIcons } = require('../common/icon');
          const iconsMap = await getBatchIcons(packageNames);

          packageNames.forEach(pkgName => {
            if (results[pkgName]) {
              results[pkgName].isInstalled = installedPackagesSet.has(pkgName);
              results[pkgName].icon = iconsMap[pkgName] || null;
            }
          });
          resolve({ results });
        });
      });
    } catch (error) {
      resolve({ results: {}, error: error.message });
    }
  });
}

module.exports = {
  searchAURPackages,
  getAURBatchInfo,
  getAURUpdates,
};