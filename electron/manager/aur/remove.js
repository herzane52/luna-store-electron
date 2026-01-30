const { streamAURCommand } = require('./operations');

function removeAURPackage(packageName, webContents) {
  const packages = packageName.split(' ').filter(p => p.trim() !== '');
  return streamAURCommand('-R --aur', packages, webContents);
}

module.exports = {
  removeAURPackage,
};