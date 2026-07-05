// electron/windowManager.ts
import { BrowserWindow, screen, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { appCore } from './appCore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 64;
const WINDOW_OFFSET = 40;
const BILIBILI_CDN_URLS = ['*://*.hdslb.com/*', '*://*.bilivideo.com/*', '*://*.bilibili.com/*'];

export function createWindow() {
  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;
  const { x: workX, y: workY } = display.workArea;

  let winX = workX + screenW - THUMB_WIDTH - WINDOW_OFFSET;
  let winY = workY + screenH - THUMB_HEIGHT - WINDOW_OFFSET;

  const mainWindow = new BrowserWindow({
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    minWidth: THUMB_WIDTH,
    minHeight: THUMB_HEIGHT,
    x: winX,
    y: winY,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  appCore.mainWindow = mainWindow;

  // Bilibili CDN blocks requests without Referer
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: BILIBILI_CDN_URLS },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.bilibili.com/';
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0';
      callback({ requestHeaders: details.requestHeaders });
    },
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[main] RENDERER CRASHED:', details.reason, details.exitCode);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    globalShortcut.register('F12', () => {
      mainWindow?.webContents.toggleDevTools();
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('close', () => {
    const pos = mainWindow.getPosition();
    appCore.store.set('windowPosition', { left: pos[0], top: pos[1] });
    // 注意：expandedPanelSize 由渲染进程在收起时保存，这里不再重复保存
  });

  mainWindow.on('closed', () => {
    appCore.mainWindow = null;
  });
}