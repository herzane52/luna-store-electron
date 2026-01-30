const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { execSync, exec: cp_exec } = require('child_process');
const settingsManager = require('./manager');

// Yardımcı fonksiyonlar
function isCommandAvailable(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function detectSystem() {
  const info = {
    distro: 'unknown',
    packageManagers: {
      pacman: false,
      yay: false,
      paru: false,
    }
  };

  try {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8').toLowerCase();
    if (osRelease.includes('arch') || osRelease.includes('manjaro') || osRelease.includes('endeavouros') || osRelease.includes('garuda') || osRelease.includes('artix')) {
      info.distro = 'arch';
    }
  } catch (e) {
    console.warn('OS detection failed:', e);
  }

  // Paket yöneticilerini kontrol et
  if (info.distro === 'arch') {
    info.packageManagers.pacman = true;
    info.packageManagers.yay = isCommandAvailable('yay');
    info.packageManagers.paru = isCommandAvailable('paru');
  }

  return info;
}

module.exports = (mainWindow) => {
  ipcMain.handle('settings:get', async () => {
    const settings = settingsManager.get();
    const sysInfo = detectSystem();
    const updatedSettings = { ...settings, ...sysInfo };
    settingsManager.save(updatedSettings);
    return updatedSettings;
  });

  ipcMain.handle('settings:save', async (event, newSettings) => {
    return settingsManager.save(newSettings);
  });

  ipcMain.handle('settings:reset_setup', async () => {
    return settingsManager.reset();
  });

  ipcMain.handle('settings:clear_cache', async () => {
    return settingsManager.clearCaches();
  });

  ipcMain.handle('settings:check-arch', async () => {
    try {
      const osRelease = fs.readFileSync('/etc/os-release', 'utf8').toLowerCase();
      return osRelease.includes('arch') || osRelease.includes('manjaro') || osRelease.includes('endeavouros') || osRelease.includes('garuda') || osRelease.includes('artix');
    } catch (e) {
      return false;
    }
  });

  ipcMain.handle('settings:check-command', async (event, cmd) => {
    return isCommandAvailable(cmd);
  });

  // Dinamik Dil Desteği Handler'ları
  ipcMain.handle('settings:list-locales', async () => {
    try {
      const possiblePaths = [
        path.join(app.getAppPath(), 'electron', 'locales'),
        path.join(__dirname, '..', '..', 'locales'),
        path.join(process.cwd(), 'electron', 'locales')
      ];

      let localesPath = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          localesPath = p;
          break;
        }
      }

      if (!localesPath) return [{ code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: 'tr' }];

      const files = fs.readdirSync(localesPath).filter(f => f.endsWith('.json'));

      const languages = files.map(file => {
        try {
          const filePath = path.join(localesPath, file);
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const code = file.replace('.json', '');

          return {
            code: code,
            name: content.meta?.name || code,
            nativeName: content.meta?.name || code,
            flag: content.meta?.flag || code
          };
        } catch (err) {
          return null;
        }
      }).filter(Boolean);

      return languages;
    } catch (e) {
      console.error('Failed to list locales:', e);
      return [
        { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: 'tr' },
        { code: 'en', name: 'English', nativeName: 'English', flag: 'gb' }
      ];
    }
  });

  ipcMain.handle('settings:get-locale', async (event, lang) => {
    try {
      const possiblePaths = [
        path.join(app.getAppPath(), 'electron', 'locales'),
        path.join(__dirname, '..', '..', 'locales'),
        path.join(process.cwd(), 'electron', 'locales')
      ];

      let localesPath = '';
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          localesPath = p;
          break;
        }
      }

      if (!localesPath) return null;

      const filePath = path.join(localesPath, `${lang}.json`);
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      return null;
    } catch (e) {
      console.error('Failed to get locale:', e);
      return null;
    }
  });
};