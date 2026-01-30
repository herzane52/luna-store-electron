const { streamAURCommand, runInTerminal } = require('./operations');

function installAURPackage(packageName, webContents, options = {}) {
  const packages = packageName.split(' ').filter(p => p.trim() !== '');
  if (options && options.inTerminal) {
    return runInTerminal('-S --aur', packages);
  }
  return streamAURCommand('-S --aur', packages, webContents);
}

module.exports = {
  installAURPackage,
};