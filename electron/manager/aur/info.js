const { exec: cp_exec } = require('child_process');
const { getAURHelper } = require('./operations');

function getAURInfo(packageName) {
  return new Promise(async (resolve, reject) => {
    if (!packageName) return reject({ error: 'Paket adı boş olamaz.' });

    try {
      const helper = await getAURHelper();
      const parseOutput = (stdout) => {
        const info = {};
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const match = line.match(/^([^:]+)\s*:\s*(.*)$/);
          if (match) {
            const key = match[1].trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const value = match[2].trim();
            info[key] = value;
          }
        }
        return info;
      };

      //  AUR Info (-Si)
      const aurPromise = new Promise((res) => {
        cp_exec(`LC_MESSAGES=C ${helper} -Si ${packageName}`, (error, stdout) => {
          if (error) res(null);
          else res(parseOutput(stdout));
        });
      });

      // Local Info (-Qi) 
      const localPromise = new Promise((res) => {
        cp_exec(`LC_MESSAGES=C pacman -Qi ${packageName}`, (error, stdout) => {
          if (error) res(null);
          else res(parseOutput(stdout));
        });
      });

      const [aurInfo, localInfo] = await Promise.all([aurPromise, localPromise]);

      if (!aurInfo && !localInfo) {
        return reject({ error: 'Paket bilgisi alınamadı (AUR veya Yerel).' });
      }

      // AUR has the metadata details.
      const mergedInfo = { ...(aurInfo || {}), ...(localInfo || {}) };

      resolve({ info: mergedInfo });

    } catch (error) {
      reject({ error: error.message });
    }
  });
}

module.exports = {
  getAURInfo,
};