const { spawn } = require('child_process');
const path = require('path');

// İşlem sırasında aktif olan child process'i tutmak için
let activeProcess = null;

/**
 * Sistemde yüklü ve tercih edilen AUR helper'ını belirler.
 * @returns {Promise<string>} Helper adı (yay veya paru).
 */
async function getAURHelper() {
  const helpers = ['yay', 'paru'];
  let preferredHelper = 'yay';

  try {
    const settingsManager = require('../settings/manager');
    const settings = settingsManager.get();
    if (settings.preferredPackageManager && settings.preferredPackageManager !== 'pacman') {
      preferredHelper = settings.preferredPackageManager;
    }
  } catch (error) {
    console.warn('SettingsManager okunamadı, varsayılan yay kullanılıyor:', error.message);
  }

  const { execSync } = require('child_process');

  // Önce tercih edilen helper'ı kontrol et
  try {
    execSync(`which ${preferredHelper}`, { stdio: 'ignore' });
    return preferredHelper;
  } catch { }

  // Tercih edilen yüklü değilse, diğerlerini kontrol et
  for (const h of helpers) {
    try {
      execSync(`which ${h}`, { stdio: 'ignore' });
      return h;
    } catch { }
  }

  throw new Error('Hiçbir AUR paket yöneticisi yüklü değil. Yay veya paru yükleyin.');
}

/**
 * Sudo gerektiren AUR komutları çalıştırır ve çıktıyı stream eder.
 * @param {string} command Çalıştırılacak komut (yay -S, -R, -U).
 * @param {string[]} args Komut argümanları.
 * @param {Electron.WebContents} webContents Çıktının gönderileceği pencere.
 * @returns {Promise<object>} İşlem sonucu.
 */
async function streamAURCommand(command, args, webContents) {
  return new Promise(async (resolve, reject) => {
    // Eğer zaten bir işlem aktifse, yenisini başlatma
    if (activeProcess) {
      return reject({ error: 'Zaten aktif bir AUR paket yöneticisi işlemi var.' });
    }

    try {
      const helper = await getAURHelper();

      // pkexec'i AUR helper komutu ve argümanlarıyla birlikte çalıştır
      const fullArgs = [command, ...args];

      activeProcess = spawn('/usr/bin/pkexec', ['/usr/bin/' + helper, ...fullArgs], {
        stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr pipe'ları aç
      });

      // Çıktıyı renderer'a stream et
      activeProcess.stdout.on('data', (data) => {
        webContents.send('aur:stream-output', { type: 'stdout', data: data.toString() });
      });

      activeProcess.stderr.on('data', (data) => {
        webContents.send('aur:stream-output', { type: 'stderr', data: data.toString() });
      });

      activeProcess.on('close', (code) => {
        activeProcess = null;
        if (code === 0) {
          resolve({ success: true, code });
        } else {
          reject({ error: `İşlem ${code} koduyla sonlandı.`, code });
        }
      });

      activeProcess.on('error', (err) => {
        activeProcess = null;
        reject({ error: `İşlem başlatma hatası: ${err.message}` });
      });
    } catch (error) {
      reject({ error: error.message });
    }
  });
}

/**
 * Komutu doğrudan terminal (pty) üzerine yazar.
 * @param {string} command Komut (yay, paru vb.)
 * @param {string[]} args Argümanlar
 * @returns {Promise<object>}
 */
async function runInTerminal(command, args) {
  return new Promise(async (resolve, reject) => {
    try {
      const helper = await getAURHelper();

      const { writeToPty } = require('../terminal/index');
      const escapedArgs = args.map(arg => arg.includes(' ') ? `"${arg}"` : arg);

      // AUR helper'lar genellikle sudo şifresini kendileri sorar veya pkexec ile çalıştırılabilir. Bu yüzden bu kodda ppkexec  çalışmayadabilir gereksiz de olabilir.
      // Bu yüzden komutu olduğu gibi gönderiyoruz, helper gerekirse diye silmedik unutma.
      const fullCommand = `${helper} ${command} ${escapedArgs.join(' ')}`;

      writeToPty(`${fullCommand}\n`);
      resolve({ success: true, inTerminal: true });
    } catch (error) {
      reject({ error: error.message });
    }
  });
}

module.exports = {
  getAURHelper,
  streamAURCommand,
  activeProcess,
  runInTerminal,
};