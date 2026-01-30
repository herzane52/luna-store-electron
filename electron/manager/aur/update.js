const { streamAURCommand } = require('./operations');

function updateAURSystem(webContents) {
  return streamAURCommand('-Syu --aur', ['--noconfirm'], webContents);
}

function downgradeAURPackage(packagePath, webContents) {
  return streamAURCommand('-U --aur', [packagePath], webContents);
}

module.exports = {
  updateAURSystem,
  downgradeAURPackage,
};