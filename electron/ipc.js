// electron/ipc.js
const { ipcMain, dialog } = require('electron');
const pacmanIpc = require('./manager/pacman/ipc');
const terminalIpc = require('./manager/terminal/ipc');
const settingsIpc = require('./manager/settings/ipc');
const windowIpc = require('./manager/window/ipc');
const aurIpc = require('./manager/aur/ipc');

// Tüm IPC işleyicilerini yükle
function loadIpcHandlers(mainWindow) {
  pacmanIpc(mainWindow);
  terminalIpc(mainWindow);
  settingsIpc(mainWindow);
  windowIpc(mainWindow);
  aurIpc(mainWindow);

  // Diyalog IPC
  ipcMain.handle('dialog:open-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Arch Paketleri', extensions: ['pkg.tar.zst', 'pkg.tar.xz'] }],
      ...options
    });
    return result;
  });
}

module.exports = loadIpcHandlers;
