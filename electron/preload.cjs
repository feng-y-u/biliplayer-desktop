const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  api: (message) => ipcRenderer.invoke('api', message),
  storeGet: (key) => ipcRenderer.invoke('store:get', key),
  storeSet: (key, value) => ipcRenderer.invoke('store:set', key, value),
  windowMove: (x, y) => ipcRenderer.send('window:move', x, y),
  windowResize: (w, h) => ipcRenderer.invoke('window:resize', w, h),
  windowGetPosition: () => ipcRenderer.invoke('window:getPosition'),
});
