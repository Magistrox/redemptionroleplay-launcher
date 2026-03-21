const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { exec, spawn }                         = require('child_process');
const https                                   = require('https');
const path                                    = require('path');
const fs                                      = require('fs');
const os                                      = require('os');

// Toujours stocker les données dans AppData du joueur
app.setPath('userData', path.join(app.getPath('appData'), 'RedemptionRP'));

// ── Configuration ──────────────────────────
const SERVER_URL    = 'https://jouer.redemptionrp.xyz';
const GITHUB_OWNER  = 'Magistrox';
const GITHUB_REPO   = 'redemptionroleplay-launcher';

let win;
let downloadedExePath = null;

// ── Comparaison de version ─────────────────
function isNewer(latest, current) {
  const l = latest.replace('v', '').split('.').map(Number);
  const c = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

// ── Requête HTTPS avec suivi des redirections ─
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'redemption-launcher' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(httpsGet(res.headers.location));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

// ── Téléchargement avec progression ───────
function downloadExe(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const doRequest = (url) => {
      https.get(url, { headers: { 'User-Agent': 'redemption-launcher' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doRequest(res.headers.location);
        }
        const total     = parseInt(res.headers['content-length'], 10) || 0;
        let downloaded  = 0;
        const startTime = Date.now();
        const file      = fs.createWriteStream(dest);

        res.on('data', chunk => {
          downloaded += chunk.length;
          const elapsed = (Date.now() - startTime) / 1000 || 0.001;
          onProgress?.({
            percent:        total ? (downloaded / total) * 100 : 0,
            bytesPerSecond: downloaded / elapsed,
          });
        });

        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      }).on('error', reject);
    };
    doRequest(url);
  });
}

// ── Vérification et téléchargement MAJ ────
async function checkAndUpdate() {
  try {
    const { data } = await httpsGet(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    );
    const release       = JSON.parse(data);
    const latestVersion = release.tag_name;
    const current       = app.getVersion();

    if (!isNewer(latestVersion, current)) {
      win?.webContents.send('update-not-available');
      return;
    }

    const asset = release.assets?.find(a => a.name.endsWith('.exe'));
    if (!asset) {
      win?.webContents.send('update-not-available');
      return;
    }

    win?.webContents.send('update-downloading');

    const tmpPath = path.join(os.tmpdir(), 'rp-update.exe');
    await downloadExe(asset.browser_download_url, tmpPath, (progress) => {
      win?.webContents.send('update-progress', progress);
    });

    downloadedExePath = tmpPath;
    win?.webContents.send('update-ready');

  } catch (err) {
    console.error('Update check failed:', err.message);
    win?.webContents.send('update-not-available');
  }
}

// ── Création de la fenêtre ─────────────────
function createWindow() {
  win = new BrowserWindow({
    width:           1100,
    height:          660,
    frame:           false,
    resizable:       false,
    center:          true,
    backgroundColor: '#0e0a23',
    icon:            path.join(__dirname, 'assets/img/logo.ico'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.once('did-finish-load', () => {
    if (!app.isPackaged) {
      win.webContents.send('update-not-available');
      return;
    }
    checkAndUpdate();
    setInterval(checkAndUpdate, 15 * 60 * 1000);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC handlers ──────────────────────────
ipcMain.on('play', () => {
  exec(`explorer.exe "fivem://connect/${SERVER_URL}"`);
});

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.on('install-update', () => {
  const exePath = process.env.PORTABLE_EXECUTABLE_FILE || app.getPath('exe');
  const batPath = path.join(os.tmpdir(), 'rp-update.bat');
  const bat     = `@echo off
timeout /t 2 /nobreak >nul
copy /y "${downloadedExePath}" "${exePath}"
start "" "${exePath}"
del "%~f0"`;

  fs.writeFileSync(batPath, bat);
  const proc = spawn('cmd.exe', ['/c', batPath], {
    detached:    true,
    stdio:       'ignore',
    windowsHide: true,
  });
  proc.unref();
  app.quit();
});

ipcMain.on('minimize', () => win?.minimize());
ipcMain.on('close',    () => win?.close());
