// electron/ipcHandlers.ts
import { ipcMain, session } from 'electron';
import { appCore } from './appCore';
import { getVideoInfo, parsePlaylistUrl, getPlaylistVideos, getFavListVideos, getSeriesVideos, getColleVideos, getAudioUrl } from './bilibiliApi';

const DEFAULT_WINDOW_SIZE = { width: 320, height: 480 };
const QR_FETCH_TIMEOUT_MS = 15_000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function passportFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QR_FETCH_TIMEOUT_MS);
  try {
    return await session.defaultSession.fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
    });
  } finally {
    clearTimeout(timer);
  }
}

type QrCodeStatus = 'LOADING' | 'PENDING' | 'SCANNED' | 'CONFIRMED' | 'EXPIRED' | 'ERROR';

interface LoginState {
  oauthKey: string;
}

const loginStates = new Map<number, LoginState>();

function cancelLogin(id: number) {
  loginStates.delete(id);
}

async function pollQrCode(id: number): Promise<{ status: QrCodeStatus; message: string; qrUrl?: string }> {
  const st = loginStates.get(id);
  if (!st) return { status: 'ERROR', message: '登录会话不存在' };

  try {
    const res = await passportFetch(
      `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${st.oauthKey}`,
    );
    const data = await res.json();
    const code = data?.data?.code;
    const msg = data?.data?.message || '';

    if (code === 0) {
      cancelLogin(id);
      const successUrl = data.data.url;
      if (successUrl) {
        await session.defaultSession.fetch(successUrl, { redirect: 'follow', headers: { 'User-Agent': UA } });
      }
      return { status: 'CONFIRMED', message: '登录成功' };
    }
    if (code === 86090) {
      return { status: 'SCANNED', message: '已扫描，请在手机上确认' };
    }
    if (code === 86101) {
      return { status: 'PENDING', message: '请使用 B站 App 扫描二维码' };
    }
    if (code === 86038 || code === -1) {
      cancelLogin(id);
      return { status: 'EXPIRED', message: '二维码已过期，请刷新' };
    }
    return { status: 'PENDING', message: msg || '请使用 B站 App 扫描二维码' };
  } catch (e) {
    return { status: 'PENDING', message: (e as Error).message };
  }
}

export function registerIpcHandlers() {
  /* ---------- API ---------- */
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
        case 'GET_FAV_LIST':
          return { success: true, data: await getFavListVideos(message.mediaId) };
        case 'GET_SERIES_LIST':
          return { success: true, data: await getSeriesVideos(message.mid, message.sid) };
        case 'GET_COLLE_LIST':
          return { success: true, data: await getColleVideos(message.mid, message.sid) };
        case 'GET_AUDIO_URL':
          return { success: true, data: await getAudioUrl(message.bvid, message.cid) };
        default:
          return { success: false, error: `Unknown message type: ${message.type}` };
      }
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  });

  /* ---------- Store ---------- */
  ipcMain.handle('store:get', (_event, key: string) => appCore.store.get(key as any));
  ipcMain.handle('store:set', (_event, key: string, value: any) => appCore.store.set(key as any, value));

  /* ---------- Window ---------- */
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

  /* ---------- 登录 ---------- */
  ipcMain.handle('login:qrcode:start', async (event) => {
    const id = event.sender.id;
    cancelLogin(id);

    try {
      const res = await passportFetch('https://passport.bilibili.com/x/passport-login/web/qrcode/generate');
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.message || '生成二维码失败');

      const oauthKey: string = data.data.qrcode_key;
      const qrUrl: string = data.data.url;

      const st: LoginState = { oauthKey };
      loginStates.set(id, st);

      return { status: 'PENDING' as const, message: '请使用 B站 App 扫描二维码', qrUrl };
    } catch (e) {
      return { status: 'ERROR' as const, message: (e as Error).message };
    }
  });

  ipcMain.handle('login:qrcode:poll', async (event) => {
    const id = event.sender.id;
    const st = loginStates.get(id);
    if (!st) return { status: 'EXPIRED' as const, message: '登录会话已过期' };
    return pollQrCode(id);
  });

  ipcMain.handle('login:qrcode:cancel', async (event) => {
    cancelLogin(event.sender.id);
  });

  ipcMain.handle('login:check', async () => {
    try {
      const cookies = await session.defaultSession.cookies.get({ domain: '.bilibili.com' });
      const hasLogin = cookies.some(c => c.name === 'DedeUserID' || c.name === 'SESSDATA');
      return { loggedIn: hasLogin };
    } catch {
      return { loggedIn: false };
    }
  });

  ipcMain.handle('login:logout', async () => {
    try {
      const cookies = await session.defaultSession.cookies.get({ domain: '.bilibili.com' });
      for (const c of cookies) {
        await session.defaultSession.cookies.remove('https://bilibili.com', c.name);
      }
    } catch { /* ignore */ }
  });
}