// electron/manager/terminal/ipc.js
const { ipcMain, BrowserWindow } = require('electron');
const terminal = require('./index');

module.exports = (mainWindow) => {
    ipcMain.handle('terminal:create', (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        terminal.createPty(win);
        return true;
    });

    ipcMain.handle('terminal:write', (event, data) => {
        terminal.writeToPty(data);
    });

    ipcMain.handle('terminal:resize', (event, { cols, rows }) => {
        terminal.resizePty(cols, rows);
    });
};
