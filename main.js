const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater }                  = require('electron-updater');
const { exec }                         = require('child_process');
const path                             = require('path');

// ── Configuration du serveur ──────────────
const SERVER_URL = 'https://jouer.redemptionrp.xyz';

// ─────────────────────────────────────────
let win;

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
}

app.whenReady().then(() => {
  createWindow();

  // Vérifier les mises à jour (silencieux au démarrage)
  autoUpdater.checkForUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── Auto-update events ────────────────────
autoUpdater.on('update-available', () => {
  win?.webContents.send('update-downloading');
});

autoUpdater.on('download-progress', (progress) => {
  win?.webContents.send('update-progress', progress);
});

autoUpdater.on('update-downloaded', () => {
  win?.webContents.send('update-ready');
});

autoUpdater.on('error', (err) => {
  console.error('Updater error:', err.message);
});

// ── IPC handlers ──────────────────────────
ipcMain.on('play', () => {
  const url = `fivem://connect/${SERVER_URL}`;
  exec(`explorer.exe "${url}"`);
});

ipcMain.on('install-update', () => autoUpdater.quitAndInstall());
ipcMain.on('minimize',       () => win?.minimize());
ipcMain.on('close',          () => win?.close());
