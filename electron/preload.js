// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Tüm IPC kanallarını renderer sürecine açar
contextBridge.exposeInMainWorld('api', {
  // Genel API
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  relaunch: () => ipcRenderer.invoke('app:relaunch'),
  quit: () => ipcRenderer.invoke('app:quit'),

  // Pacman API
  pacman: {
    getInstalledPackages: () => ipcRenderer.invoke('pacman:get-installed-packages'),
    search: (query) => ipcRenderer.invoke('pacman:search', query),
    getPackageInfo: (packageName) => ipcRenderer.invoke('pacman:package-info', packageName),
    getPackageIcon: (packageName) => ipcRenderer.invoke('pacman:get-package-icon', packageName),
    getBatchIcons: (packageNames) => ipcRenderer.invoke('pacman:get-icons-batch', packageNames),
    getBatchInfo: (packageNames) => ipcRenderer.invoke('pacman:get-batch-info', packageNames),
    getAURInfo: (packageName) => ipcRenderer.invoke('pacman:get-aur-info', packageName),
    install: (packageName, options) => ipcRenderer.invoke('pacman:install', packageName, options),
    remove: (packageName, options) => ipcRenderer.invoke('pacman:remove', packageName, options),
    toggleIgnore: (packageName, shouldIgnore) => ipcRenderer.invoke('pacman:toggle-ignore', packageName, shouldIgnore),
    getIgnoredPackages: () => ipcRenderer.invoke('pacman:get-ignored-packages'),

    getUpdates: () => ipcRenderer.invoke('pacman:get-updates'),
    checkUpdates: () => ipcRenderer.invoke('pacman:check-updates'),
    updateSystem: (options) => ipcRenderer.invoke('pacman:update-system', options),
    refreshDatabase: () => ipcRenderer.invoke('pacman:refresh-database'),
    launchApp: (packageName) => ipcRenderer.invoke('pacman:launch-app', packageName),
    checkDesktopFile: (packageName) => ipcRenderer.invoke('pacman:check-desktop-file', packageName),
    syncAppCache: () => ipcRenderer.invoke('pacman:sync-app-cache'),
    onCacheProgress: (callback) => ipcRenderer.on('pacman:cache-progress', (event, data) => callback(data)),
    onCacheUpdated: (callback) => {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on('pacman:cache-updated', subscription);
      return () => ipcRenderer.removeListener('pacman:cache-updated', subscription);
    },
    onStreamOutput: (callback) => ipcRenderer.on('pacman:stream-output', (event, data) => callback(data)),
    sendInput: (data) => ipcRenderer.invoke('pacman:send-input', data),
    getOrphans: () => ipcRenderer.invoke('pacman:get-orphans'),
  },



  // AUR API
  aur: {
    search: (query) => ipcRenderer.invoke('aur:search', query),
    getInfo: (packageName) => ipcRenderer.invoke('aur:get-info', packageName),
    getBatchInfo: (packageNames) => ipcRenderer.invoke('aur:get-batch-info', packageNames),
    getIcon: (packageName) => ipcRenderer.invoke('aur:get-icon', packageName),
    getUpdates: () => ipcRenderer.invoke('aur:get-updates'),
    install: (packageName, options) => ipcRenderer.invoke('aur:install', packageName, options),
  },

  // Pencere API
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    openExternal: (url) => ipcRenderer.invoke('window:open-external', url),
  },

  // Ayarlar API
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    checkArch: () => ipcRenderer.invoke('settings:check-arch'),
    checkCommand: (cmd) => ipcRenderer.invoke('settings:check-command', cmd),
    resetSetup: () => ipcRenderer.invoke('settings:reset_setup'),
    clearCache: () => ipcRenderer.invoke('settings:clear_cache'),
    listLocales: () => ipcRenderer.invoke('settings:list-locales'),
    getLocale: (lang) => ipcRenderer.invoke('settings:get-locale', lang),
  },

  // Diyalog API
  dialog: {
    showOpenDialog: (options) => ipcRenderer.invoke('dialog:open-file', options),
  },

  // Terminal API
  terminal: {
    create: () => ipcRenderer.invoke('terminal:create'),
    write: (data) => ipcRenderer.invoke('terminal:write', data),
    resize: (cols, rows) => ipcRenderer.invoke('terminal:resize', { cols, rows }),
    onData: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('terminal:data', subscription);
      return () => ipcRenderer.removeListener('terminal:data', subscription);
    },
    onExit: (callback) => {
      const subscription = (event, data) => callback(data);
      ipcRenderer.on('terminal:exit', subscription);
      return () => ipcRenderer.removeListener('terminal:exit', subscription);
    },
  },
});