// AUR yöneticisi - Ana yönlendirici dosya
// Tüm fonksiyonları ilgili modüllerden içe aktarır

const { installAURPackage } = require('./install');
const { searchAURPackages, getAURBatchInfo, getAURUpdates } = require('./query');
const { getPackageIcon: getAURIcon } = require('../common/icon');
const { getAURInfo } = require('./info');
const { streamAURCommand, activeProcess, getAURHelper, runInTerminal } = require('./operations');

module.exports = {
  // Yükleme işlemleri
  installAURPackage,

  // Sorgu işlemleri
  searchAURPackages,
  getAURBatchInfo,
  getAURUpdates,

  // İkon işlemleri
  getAURIcon,

  // Bilgi işlemleri
  getAURInfo,

  // İşlemler (IPC için)
  streamAURCommand,
  activeProcess,
  getAURHelper,
  runInTerminal,
};