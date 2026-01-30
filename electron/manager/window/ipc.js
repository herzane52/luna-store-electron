const { ipcMain } = require('electron');
const { minimizeWindow, maximizeWindow, closeWindow, openExternalUrl } = require('./index');

module.exports = (mainWindow) => {
  ipcMain.handle('window:minimize', () => {
    minimizeWindow();
  });

  ipcMain.handle('window:maximize', () => {
    maximizeWindow();
  });

  ipcMain.handle('window:close', () => {
    closeWindow();
  });

  ipcMain.handle('window:open-external', async (event, url) => {
    await openExternalUrl(url);
  });
};