import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  api: (message: any) => ipcRenderer.invoke('api', message),
  storeGet: (key: string) => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  windowMove: (x: number, y: number) => ipcRenderer.send('window:move', x, y),
  windowResize: (w: number, h: number) => ipcRenderer.invoke('window:resize', w, h),
  windowGetPosition: () => ipcRenderer.invoke('window:getPosition'),
  windowSetMinimumSize: (w: number, h: number) => ipcRenderer.invoke('window:setMinimumSize', w, h),
});
