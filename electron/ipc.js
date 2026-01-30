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

  // Uygulama Seviyesi IPC (Manuel Restart Yaklaşımı)
  ipcMain.handle('app:relaunch', async () => {
    const { app } = require('electron');
    const { killPty } = require('./manager/terminal/index');
    const { killActiveProcess } = require('./manager/pacman/operations');

    try { killPty(); } catch (e) { }
    try { killActiveProcess(); } catch (e) { }

    app.exit(0);
  });

  ipcMain.handle('app:quit', () => {
    const { app } = require('electron');
    app.quit();
  });
}

module.exports = loadIpcHandlers;
