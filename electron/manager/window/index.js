const { BrowserWindow } = require('electron');

function getMainWindow() {
  // Odaklanmış pencereyi veya ana pencereyi döndür
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
}

function minimizeWindow() {
  const win = getMainWindow();
  if (win) win.minimize();
}

function maximizeWindow() {
  const win = getMainWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
}

function closeWindow() {
  const win = getMainWindow();
  if (win) win.close();
}

const { shell } = require('electron');

async function openExternalUrl(url) {
  await shell.openExternal(url);
}

module.exports = {
  minimizeWindow,
  maximizeWindow,
  closeWindow,
  openExternalUrl
};