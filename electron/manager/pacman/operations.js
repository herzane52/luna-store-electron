const { spawn } = require('child_process');
const { writeToPty } = require('../terminal/index');

// İşlem sırasında aktif olan child process'i tutmak için
let activeProcess = null;

/**
 * Sudo gerektiren komutları çalıştırır ve çıktıyı stream eder.
 * @param {string} command Çalıştırılacak komut (pacman -S, -R, -U).
 * @param {string[]} args Komut argümanları.
 * @param {Electron.WebContents} webContents Çıktının gönderileceği pencere.
 * @returns {Promise<object>} İşlem sonucu.
 */
function streamPacmanCommand(command, args, webContents) {
  return new Promise((resolve, reject) => {
    // Eğer zaten bir işlem aktifse, yenisini başlatma
    if (activeProcess) {
      return reject({ error: 'Zaten aktif bir paket yöneticisi işlemi var.' });
    }

    // pkexec'i pacman komutu ve argümanlarıyla birlikte çalıştır
    const fullArgs = [command, ...args];

    // pkexec'in tam yolu ve pacman'in tam yolu
    activeProcess = spawn('/usr/bin/pkexec', ['/usr/bin/pacman', ...fullArgs], {
      stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr pipe'ları aç
    });

    // Çıktıyı renderer'a stream et
    activeProcess.stdout.on('data', (data) => {
      webContents.send('pacman:stream-output', { type: 'stdout', data: data.toString() });
    });

    activeProcess.stderr.on('data', (data) => {
      webContents.send('pacman:stream-output', { type: 'stderr', data: data.toString() });
    });

    activeProcess.on('close', (code) => {
      activeProcess = null;
      if (code === 0) {
        resolve({ success: true, code });
      } else if (code === 127) {
        // pkexec iptal edilirse (şifre girilmezse)
        resolve({ success: false, cancelled: true, message: 'İşlem kullanıcı tarafından iptal edildi.' });
      } else {
        // Diğer hatalar
        reject({ error: `İşlem ${code} koduyla sonlandı.`, code });
      }
    });

    activeProcess.on('error', (err) => {
      activeProcess = null;
      reject({ error: `İşlem başlatma hatası: ${err.message}` });
    });
  });
}

function cleanCache(webContents) {
  return streamPacmanCommand('-Sc', [], webContents);
}

function removeOrphans(webContents) {
  return new Promise((resolve, reject) => {
    // Önce yetim paketleri bul
    const { exec } = require('child_process');
    exec('pacman -Qtdq', (err, stdout, stderr) => {
      if (err || !stdout.trim()) {
        if (err && err.code !== 1) { // code 1 means no match usually
          return reject({ error: "Yetim paket kontrolü yapılırken hata oluştu: " + err.message });
        }
        return reject({ error: "Silinecek yetim paket bulunamadı." });
      }

      const orphans = stdout.trim().split('\n');
      // Bulunan paketleri sil
      streamPacmanCommand('-Rns', orphans, webContents)
        .then(resolve)
        .catch(reject);
    });
  });
}

/**
 * Komutu doğrudan terminal (pty) üzerine yazar.
 * @param {string} command Komut (pacman, vb.)
 * @param {string[]} args Argümanlar
 * @returns {Promise<object>}
 */
function runInTerminal(command, args) {
  return new Promise((resolve) => {
    // Komutu oluştur (pkexec ile)
    // Argümanları tırnak içine al (boşluk içeren dosya yolları için)
    const escapedArgs = args.map(arg => arg.includes(' ') ? `"${arg}"` : arg);
    const fullCommand = `pkexec ${command} ${escapedArgs.join(' ')}`;

    // Terminale yaz
    writeToPty(`${fullCommand}\n`);

    // Terminalde çalıştığı için anında başarılı dönüyoruz,
    // hata kontrolü kullanıcı etkileşimiyle terminalde olacak.
    resolve({ success: true, inTerminal: true });
  });
}

function killActiveProcess() { if (activeProcess) { try { activeProcess.kill("SIGKILL"); } catch(e) {} activeProcess = null; } }

module.exports = {
  streamPacmanCommand,
  cleanCache,
  removeOrphans,
  activeProcess,
  runInTerminal, killActiveProcess,
};