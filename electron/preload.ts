import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  api: (message: any) => ipcRenderer.invoke('api', message),
  storeGet: (key: string) => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  windowMove: (x: number, y: number) => ipcRenderer.send('window:move', x, y),
  windowResize: (w: number, h: number) => ipcRenderer.invoke('window:resize', w, h),
  windowGetPosition: () => ipcRenderer.invoke('window:getPosition'),
  windowSetMinimumSize: (w: number, h: number) => ipcRenderer.invoke('window:setMinimumSize', w, h),
  loginQrcodeStart: () => ipcRenderer.invoke('login:qrcode:start'),
  loginQrcodePoll: () => ipcRenderer.invoke('login:qrcode:poll'),
  loginQrcodeCancel: () => ipcRenderer.invoke('login:qrcode:cancel'),
  loginCheck: () => ipcRenderer.invoke('login:check'),
  loginLogout: () => ipcRenderer.invoke('login:logout'),
});
