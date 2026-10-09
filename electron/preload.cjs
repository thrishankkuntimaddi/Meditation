const { contextBridge, ipcRenderer } = require('electron');

// The only surface the web app sees — see src/native/index.ts
contextBridge.exposeInMainWorld('meditationDesktop', {
  platform: process.platform,
  keepAwake: on => ipcRenderer.invoke('focus:keepAwake', !!on),
  setSystemMuted: muted => ipcRenderer.invoke('focus:setSystemMuted', !!muted),
  setFocusShortcut: on => ipcRenderer.invoke('focus:setFocusShortcut', !!on),
  getVersion: () => ipcRenderer.invoke('app:version'),
});
