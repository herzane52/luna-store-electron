// AUR IPC handlers
const { ipcMain } = require('electron');
const {
  getAURIcon,
  getAURInfo,
  getAURUpdates,
  getAURBatchInfo,
  searchAURPackages,
  installAURPackage,
} = require('./index');

module.exports = (mainWindow) => {
  // Arama işlemi
  ipcMain.handle('aur:search', async (event, query) => {
    try {
      const result = await searchAURPackages(query);
      return result;
    } catch (error) {
      return { error: error.message || 'Arama hatası', results: [] };
    }
  });

  // Toplu bilgi alma
  ipcMain.handle('aur:get-batch-info', async (event, packageNames) => {
    try {
      const result = await getAURBatchInfo(packageNames);
      return result;
    } catch (error) {
      return { error: error.message || 'Bilgi alma hatası', results: {} };
    }
  });

  // Kurulum işlemi
  ipcMain.handle('aur:install', async (event, packageName, options) => {
    try {
      const result = await installAURPackage(packageName, mainWindow.webContents, options);
      return result;
    } catch (error) {
      return { error: error.message || 'Kurulum hatası' };
    }
  });

  // Güncelleme işlemi
  ipcMain.handle('aur:get-updates', async () => {
    try {
      const result = await getAURUpdates();
      return result;
    } catch (error) {
      return { updates: [], count: 0, error: error.message };
    }
  });

  // Icon ve Info işlemleri
  ipcMain.handle('aur:get-icon', async (event, packageName) => {
    try {
      const iconUrl = await getAURIcon(packageName);
      return { iconUrl };
    } catch (error) {
      return { error: error.message || 'Icon alma hatası' };
    }
  });

  ipcMain.handle('aur:get-info', async (event, packageName) => {
    try {
      const result = await getAURInfo(packageName);
      return result;
    } catch (error) {
      return { error: error.error || 'Bilinmeyen Hata', details: error.stderr };
    }
  });
};