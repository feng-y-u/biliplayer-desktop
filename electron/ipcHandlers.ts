// electron/ipcHandlers.ts
import { ipcMain } from 'electron';
import { appCore } from './appCore';
import { getVideoInfo, parsePlaylistUrl, getPlaylistVideos, getAudioUrl } from './bilibiliApi';

const DEFAULT_WINDOW_SIZE = { width: 320, height: 480 };

export function registerIpcHandlers() {
  ipcMain.handle('api', async (_event, message: { type: string; [key: string]: any }) => {
    try {
      switch (message.type) {
        case 'GET_VIDEO_INFO':
          return { success: true, data: await getVideoInfo(message.bvid) };
        case 'GET_PLAYLIST': {
          const parsed = parsePlaylistUrl(message.url);
          if (!parsed) throw new Error('Invalid playlist URL');
          return { success: true, data: await getPlaylistVideos(parsed.mid, parsed.seasonId) };
        }
        case 'GET_AUDIO_URL':
          return { success: true, data: await getAudioUrl(message.bvid, message.cid) };
        default:
          return { success: false, error: `Unknown message type: ${message.type}` };
      }
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  });

  ipcMain.handle('store:get', (_event, key: string) => appCore.store.get(key as any));
  ipcMain.handle('store:set', (_event, key: string, value: any) => appCore.store.set(key as any, value));

  ipcMain.on('window:move', (_event, x: number, y: number) => {
    if (appCore.mainWindow) appCore.mainWindow.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.handle('window:resize', (_event, width: number, height: number) => {
    if (appCore.mainWindow) appCore.mainWindow.setSize(Math.round(width), Math.round(height));
  });

  ipcMain.handle('window:getPosition', () => {
    if (!appCore.mainWindow) return { x: 0, y: 0, ...DEFAULT_WINDOW_SIZE };
    const [x, y] = appCore.mainWindow.getPosition();
    const [width, height] = appCore.mainWindow.getSize();
    return { x, y, width, height };
  });

  ipcMain.handle('window:setMinimumSize', (_event, w: number, h: number) => {
    if (appCore.mainWindow) appCore.mainWindow.setMinimumSize(Math.round(w), Math.round(h));
  });
}