const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcher', {
  version:       () => ipcRenderer.invoke('get-version'),
  play:          () => ipcRenderer.send('play'),
  minimize:      () => ipcRenderer.send('minimize'),
  close:         () => ipcRenderer.send('close'),
  installUpdate:       () => ipcRenderer.send('install-update'),
  onUpdateDownloading: (cb) => ipcRenderer.on('update-downloading', cb),
  onUpdateProgress:    (cb) => ipcRenderer.on('update-progress', (_, data) => cb(data)),
  onUpdateReady:       (cb) => ipcRenderer.on('update-ready', cb),
});
