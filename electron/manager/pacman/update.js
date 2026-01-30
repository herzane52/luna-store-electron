const { streamPacmanCommand, runInTerminal } = require('./operations');

// Sistem güncellemesini başlatır
function updateSystem(webContents, options = {}) {
  if (options && options.inTerminal) {
    return runInTerminal('pacman', ['-Syu']);
  }
  return streamPacmanCommand('-Syu', [], webContents);
}

// Paket veritabanını yeniler
function refreshDatabase(webContents) {
  return streamPacmanCommand('-Sy', [], webContents);
}

/* Bir paketi eski sürüme döndürür (veya yerel dosyadan yükler)
function downgradePackage(input, webContents, options = {}) {

  const isFile = input.endsWith('.pkg.tar.zst') || input.endsWith('.pkg.tar.xz') || input.includes('/');

  if (options && options.inTerminal) {
    if (isFile) {
      return runInTerminal('pacman', ['-U', input]);
    } else {
      // Downgrade aracını kullan
      return runInTerminal('downgrade', [input]);
    }
  }
  // Terminal dışı durumlar için yedek plan
  return streamPacmanCommand('-U', [input], webContents);
}
*/
module.exports = {
  updateSystem,
  refreshDatabase,
  //downgradePackage,
};