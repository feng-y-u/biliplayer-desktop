import { app } from 'electron';
import { createWindow } from './windowManager';
import { registerIpcHandlers } from './ipcHandlers';

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-cache');

app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  createWindow();
});