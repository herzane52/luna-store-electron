// Pacman manager - Ana yönlendirici dosya
// Tüm fonksiyonları ilgili modüllerden import eder

const { installPackage } = require('./install');
const { removePackage } = require('./remove');
const { updateSystem, refreshDatabase } = require('./update');
const { getInstalledPackages, searchPackages, getPackageInfo, getIgnoredPackages, getUpdates, checkUpdates, getOrphans, getBatchInfo } = require('./query');
const { getPackageIcon, getBatchIcons } = require('../common/icon');
const { launchApp, isLaunchable, initialize, getIconForPackage, syncCache } = require('../common/launch');

module.exports = {

  // Yükleme işlemleri
  installPackage,

  // Kaldırma işlemleri
  removePackage,

  // Güncelleme işlemleri
  updateSystem,
  refreshDatabase,

  // Sorgu işlemleri
  getInstalledPackages,
  checkUpdates,
  searchPackages,
  getPackageInfo,
  getIgnoredPackages,
  getUpdates,

  // İkon işlemleri
  getPackageIcon,
  getBatchIcons,

  // Yardımcılar
  getOrphans,
  getBatchInfo,

  // Başlatma işlemleri
  launchApp,
  isLaunchable,
  initialize,
  getIconForPackage,
  syncCache,
};