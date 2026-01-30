// electron/main.js
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

process.on('uncaughtException', (error) => {
  console.error('KRİTİK HATA:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('YAKALANAMAYAN REDDETME:', reason);
});

// Performans ve Optimizasyon için Chromium bayrakları
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-dev-shm-usage'); // Linux'ta /dev/shm yetki hatalarını çözer
app.commandLine.appendSwitch('ignore-gpu-blocklist'); // GPU hızlandırmayı zorla
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

let splash;
let mainWindow;

const settingsManager = require('./manager/settings/manager');
// ELECTRON_IS_DEV=false ise her zaman üretim moduna geç
const isDev = process.env.ELECTRON_IS_DEV === 'false' ? false : (!app.isPackaged || process.env.ELECTRON_IS_DEV === 'true');

function getTargetUrl() {
  const settings = settingsManager.get();
  const baseUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/out/index.html')}`;

  const queryParams = settings.setupComplete
    ? `?lang=${settings.language}&theme=${settings.theme}&defaultPage=${settings.defaultPage}`
    : '';

  const route = settings.setupComplete ? '/loading' : '/setup';

  if (!isDev) {
    // Statik export'ta pathler .html ile biter
    return `file://${path.join(__dirname, '../build/out')}${route}.html${queryParams}`;
  }

  return `${baseUrl}${route}${queryParams}`;
}

const targetUrl = getTargetUrl();

// Ana pencereyi oluştur
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // did-finish-load ile gösterilecek
    frame: false,
    //transparent: true,
    backgroundColor: '#00000000',
    icon: path.join(__dirname, 'assets', 'luna.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: true, // RAM tasarrufu için true (arka planda yavaşlat)
      devTools: isDev, // Sadece dev modda açık kalsın
    },
  });

  // Geliştirici araçlarını production'da tamamen engelle
  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  // IPC işleyicilerini yükle
  const loadIpcHandlers = require('./ipc');
  loadIpcHandlers(mainWindow);

  // Uygulama URL'sini yükle
  mainWindow.loadURL(targetUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Splash ekranını oluştur
function createSplash() {
  splash = new BrowserWindow({
    width: 500,
    height: 500,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    icon: path.join(__dirname, 'assets', 'luna.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev,
    },
  });

  if (!isDev) {
    splash.webContents.on('devtools-opened', () => {
      splash.webContents.closeDevTools();
    });
  }

  splash.loadFile(path.join(__dirname, '/splash/splash.html'));
  splash.setMenu(null);
}

// Uygulama hazır olduğunda
app.on('ready', () => {
  const { protocol, net } = require('electron');

  // Pacman Önbelleğini Başlat
  const pacmanManager = require('./manager/pacman/index');
  pacmanManager.initialize();
  pacmanManager.getInstalledPackages();

  protocol.handle('local-resource', (request) => {
    const filePath = decodeURIComponent(request.url.slice('local-resource://'.length));
    const { pathToFileURL } = require('url');
    return net.fetch(pathToFileURL(filePath).href);
  });

  createSplash();
  createMainWindow();
  splash.show();

  // Sayfa yüklendiğinde splash'ı kapat ve ana pencereyi göster
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Sayfa başarıyla yüklendi.');
    setTimeout(() => {
      if (splash && !splash.isDestroyed()) splash.close();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
    }, 300);
  });

  mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Sayfa yüklenemedi:', errorCode, errorDescription);
    if (splash && !splash.isDestroyed()) splash.close();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) createMainWindow();
});