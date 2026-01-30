let pty;
try {
    pty = require('node-pty');
} catch (e) {
    console.error('[PTY] Failed to load node-pty:', e);
}
const os = require('os');
const { ipcMain } = require('electron');

let ptyProcess = null;
let currentWindow = null;

function createPty(mainWindow) {
    currentWindow = mainWindow;

    if (ptyProcess) {
        // Eğer süreç zaten varsa, renderer'a bir boşluk göndererek akışı tetikleyelim
        setTimeout(() => {
            if (ptyProcess && currentWindow && !currentWindow.isDestroyed()) {
                ptyProcess.write('\f'); // Form feed (ekranı temizle/yenile gibi davranabilir)
                // Bazı kabuklarda \f işe yaramayabilir, sadece bir enter veya boşluk da denenebilir
                ptyProcess.write(' ');
                ptyProcess.write('\b');
            }
        }, 300);
        return ptyProcess;
    }

    const shell = process.env.SHELL || 'bash';

    ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: { ...process.env, TERM: 'xterm-256color' }
    });


    ptyProcess.onData((data) => {
        if (currentWindow && !currentWindow.isDestroyed()) {
            currentWindow.webContents.send('terminal:data', data);
        }
    });

    // Bazı sistemlerde bash hemen çıktı vermeyebilir, bir boşluk göndererek tetikleyelim
    setTimeout(() => {
        if (ptyProcess) {
            ptyProcess.write(' ');
            ptyProcess.write('\b'); // geri silme
        }
    }, 500);

    ptyProcess.onExit(({ exitCode, signal }) => {
        if (currentWindow && !currentWindow.isDestroyed()) {
            currentWindow.webContents.send('terminal:exit', { exitCode, signal });
        }
        ptyProcess = null;
    });

    return ptyProcess;
}

function writeToPty(data) {
    if (ptyProcess) {
        ptyProcess.write(data);
    }
}

function resizePty(cols, rows) {
    if (ptyProcess) {
        ptyProcess.resize(cols, rows);
    }
}

function killPty() {
    if (ptyProcess) {
        ptyProcess.kill();
        ptyProcess = null;
    }
}

module.exports = {
    createPty,
    writeToPty,
    resizePty,
    killPty
};
