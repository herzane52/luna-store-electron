const { streamPacmanCommand, runInTerminal } = require('./operations');
const fs = require('fs').promises;
const path = require('path');

const PACMAN_CONF_PATH = '/etc/pacman.conf';

function installPackage(packageName, webContents, options = {}) {
  const packages = packageName.split(' ').filter(p => p.trim() !== '');
  if (options && options.inTerminal) {
    return runInTerminal('pacman', ['-S', ...packages]);
  }
  return streamPacmanCommand('-S', packages, webContents);
}

/**
 * Paketi IgnorePkg listesine ekler veya çıkarır.
 * @param {string} packageName Paket adı
 * @param {boolean} shouldIgnore true = ekle, false = çıkar
 */
async function toggleIgnorePkg(packageName, shouldIgnore) {
  if (!packageName) return { error: 'Paket adı gerekli.' };

  try {
    const content = await fs.readFile(PACMAN_CONF_PATH, 'utf8');

    // "IgnorePkg = ..." veya "#IgnorePkg = ..." eşleşmesi
    // Gruplar: 1=ön ek(#?), 2=içerik
    const regex = /^(\s*#?\s*IgnorePkg\s*=\s*)(.*)$/m;
    const match = content.match(regex);

    let newIgnored = [];
    let prefix = '';

    if (match) {
      // Satır varsa ayrıştır
      prefix = match[1]; // prefix'i olduğu gibi tut
      const currentList = match[2].trim();
      if (currentList) {
        newIgnored = currentList.split(/\s+/);
      }
    }

    // Listeyi temizle
    newIgnored = newIgnored.filter(p => p && p.trim() !== '');

    if (shouldIgnore) {
      if (!newIgnored.includes(packageName)) {
        newIgnored.push(packageName);
      }
    } else {
      newIgnored = newIgnored.filter(p => p !== packageName);
    }

    let newLine = '';
    if (newIgnored.length === 0) {
      // Liste boş -> Yapılandırmayı temiz tutmak için yorum satırı yap
      newLine = '#IgnorePkg =';
    } else {
      // Liste dolu -> Yorumu kaldır
      newLine = `IgnorePkg = ${newIgnored.join(' ')}`;
    }

    const { exec } = require('child_process');
    const tempFile = path.join(require('os').tmpdir(), 'pacman.conf.tmp');

    // Yeni dosya içeriğini oluştur
    let newFileContent;
    if (match) {
      newFileContent = content.replace(regex, newLine);
    } else {
      // Yedek plan: Mümkünse [options] altına, yoksa dosya sonuna ekle
      if (content.includes('[options]')) {
        newFileContent = content.replace('[options]', `[options]\n${newLine}`);
      } else {
        newFileContent = content + `\n${newLine}\n`;
      }
    }

    // Önce geçici dosyaya yaz
    await fs.writeFile(tempFile, newFileContent, 'utf8');

    // Geçici dosyayı /etc/pacman.conf üzerine taşımak için pkexec kullan
    return new Promise((resolve) => {
      exec(`pkexec mv "${tempFile}" "${PACMAN_CONF_PATH}"`, (err) => {
        if (err) {
          console.error('[IgnorePkg] pkexec hatası:', err.message);
          return resolve({ error: `Erişim reddedildi veya hata: ${err.message}` });
        }
        resolve({ success: true });
      });
    });

  } catch (error) {
    return { error: `Yapılandırma hatası: ${error.message}` };
  }
}

module.exports = {
  installPackage,
  toggleIgnorePkg
};