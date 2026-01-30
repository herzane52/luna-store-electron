const { streamPacmanCommand, runInTerminal } = require('./operations');

// Bir paketi sistemden kaldırır
function removePackage(packageName, webContents, options = {}) {
  const params = options.params || '-R';
  const packages = packageName.split(' ').filter(p => p.trim() !== '');
  if (options && options.inTerminal) {
    return runInTerminal('pacman', [params, ...packages]);
  }
  return streamPacmanCommand(params, packages, webContents);
}

module.exports = {
  removePackage,
};