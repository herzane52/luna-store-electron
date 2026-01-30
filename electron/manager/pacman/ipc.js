const { ipcMain } = require('electron');
const { installPackage, toggleIgnorePkg } = require('./install');
const { removePackage } = require('./remove');
const { updateSystem, refreshDatabase } = require('./update');
const { getInstalledPackages, searchPackages, getPackageInfo, getBatchInfo, getIgnoredPackages, getUpdates, checkUpdates, checkCommand, getOrphans } = require('./query');

const { getPackageIcon, getBatchIcons } = require('../common/icon');


const { launchApp, isLaunchable } = require('../common/launch');

module.exports = (mainWindow) => {
  // Sorgular
  ipcMain.handle('pacman:get-installed-packages', async (_, force) => getInstalledPackages(force));
  ipcMain.handle('pacman:package-info', async (_, packageName) => getPackageInfo(packageName));
  ipcMain.handle('pacman:check-command', async (_, command) => checkCommand(command));
  ipcMain.handle('pacman:get-package-icon', async (_, packageName) => getPackageIcon(packageName));
  ipcMain.handle('pacman:get-icons-batch', async (_, packageNames) => {
    const icons = await getBatchIcons(packageNames);
    return { icons };
  });
  ipcMain.handle('pacman:get-batch-info', async (_, packageNames) => getBatchInfo(packageNames));
  ipcMain.handle('pacman:search', async (_, query) => searchPackages(query));


  // İşlemler
  ipcMain.handle('pacman:install', async (_, packageName, options) => installPackage(packageName, mainWindow.webContents, options));
  ipcMain.handle('pacman:remove', async (_, packageName, options) => removePackage(packageName, mainWindow.webContents, options));
  ipcMain.handle('pacman:update-system', async (_, options) => updateSystem(mainWindow.webContents, options));


  // Güncellemeler ve Veritabanı
  ipcMain.handle('pacman:get-ignored-packages', async () => getIgnoredPackages());
  ipcMain.handle('pacman:get-updates', async (_, force) => getUpdates(force));
  ipcMain.handle('pacman:check-updates', async (_, force) => checkUpdates(force));
  ipcMain.handle('pacman:get-orphans', async () => getOrphans());
  ipcMain.handle('pacman:refresh-database', async () => refreshDatabase(mainWindow.webContents));

  ipcMain.handle('pacman:sync-app-cache', async () => {
    const { syncCache } = require('../common/launch');
    return syncCache();
  });

  // Başlatma ve Masaüstü Dosyaları
  ipcMain.handle('pacman:launch-app', async (_, packageName) => launchApp(packageName));
  ipcMain.handle('pacman:check-desktop-file', async (_, packageName) => {
    // Ön yüzün beklediği nesneyi döndür
    try {
      const launchable = await isLaunchable(packageName);
      return { launchable: !!launchable };
    } catch (e) {
      return { launchable: false };
    }
  });

  // IgnorePkg (Paket Göz Ardı Etme)
  ipcMain.handle('pacman:toggle-ignore', async (_, packageName, shouldIgnore) => toggleIgnorePkg(packageName, shouldIgnore));

  // Terminal Giriş/Çıkış
  ipcMain.handle('pacman:send-input', async (_, data) => {
    const { activeProcess } = require('./operations');
    if (activeProcess && activeProcess.stdin) {
      activeProcess.stdin.write(data + '\n');
      return { success: true };
    }
    return { error: 'Aktif işlem yok.' };
  });
};
