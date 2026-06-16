import { app, BrowserWindow, ipcMain, screen, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-cache');

const store = new Store<{
  windowBounds: { x: number | undefined; y: number | undefined; width: number; height: number };
  volume: number;
  playMode: 'loop' | 'single' | 'shuffle';
  playlist: any[];
  currentIndex: number;
  favorites: any[];
  recentTracks: any[];
  windowPosition: { left: number; top: number };
}>();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const bounds = store.get('windowBounds', {
    x: undefined,
    y: undefined,
    width: 320,
    height: 480,
  });

  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;
  const { x: workX, y: workY } = display.workArea;

  let winX = bounds.x ?? workX + screenW - bounds.width - 40;
  let winY = bounds.y ?? workY + screenH - bounds.height - 40;
  winX = Math.max(workX, Math.min(winX, workX + screenW - bounds.width));
  winY = Math.max(workY, Math.min(winY, workY + screenH - bounds.height));

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: winX,
    y: winY,
    alwaysOnTop: true,
    frame: false,
    backgroundColor: '#f8f9fc',
    resizable: true,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Bilibili CDN blocks requests without Referer
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.hdslb.com/*', '*://*.bilivideo.com/*', '*://*.bilibili.com/*'] },
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
    // F12 opens DevTools in dev mode
    globalShortcut.register('F12', () => {
      mainWindow?.webContents.toggleDevTools();
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', () => {
    if (mainWindow) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ── Bilibili API proxy ──

async function getVideoInfo(bvid: string) {
  const res = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
    headers: { Referer: 'https://www.bilibili.com/', 'User-Agent': 'Mozilla/5.0' },
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  return { bvid: data.data.bvid, cid: data.data.cid, title: data.data.title, author: data.data.owner.name, cover: data.data.pic };
}

function parsePlaylistUrl(url: string) {
  const m1 = url.match(/medialist\/play\/dlista\/(\d+)\/(\d+)/);
  if (m1) return { seasonId: m1[1]!, mid: m1[2]! };
  const m2 = url.match(/space\.bilibili\.com\/(\d+)\/favlist\?.*fid=(\d+)/);
  if (m2) return { seasonId: m2[2]!, mid: m2[1]! };
  return null;
}

async function getPlaylistVideos(_mid: string, seasonId: string) {
  const all: any[] = [];
  let pn = 1;
  while (true) {
    const res = await fetch(`https://api.bilibili.com/x/v3/fav/resource/list?media_id=${seasonId}&pn=${pn}&ps=20`, {
      headers: { Referer: 'https://www.bilibili.com/', 'User-Agent': 'Mozilla/5.0' },
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message);
    const medias = data.data?.list || data.data?.medias || [];
    if (medias.length === 0) break;
    all.push(...medias);
    if (!data.data?.has_more || medias.length < 20) break;
    pn++;
  }
  return all.map((item: any) => ({
    bvid: item.bvid,
    cid: item.id,
    title: item.title,
    author: item.upper?.name || '',
    cover: item.cover,
    duration: item.duration,
  }));
}

async function getAudioUrl(bvid: string, cid: number) {
  const res = await fetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=0&fnval=16&fnver=0&fourk=1`, {
    headers: { Referer: 'https://www.bilibili.com/', 'User-Agent': 'Mozilla/5.0' },
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  const audioTrack = data.data.dash?.audio?.[0];
  if (!audioTrack) throw new Error('No audio track found');
  const audioUrl = audioTrack.baseUrl || audioTrack.base_url;
  if (!audioUrl) throw new Error('No audio URL');
  return { url: audioUrl, expiresAt: Date.now() + 10 * 60 * 1000 };
}

// ── IPC handlers ──

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

ipcMain.handle('store:get', (_event, key: string) => store.get(key as any));
ipcMain.handle('store:set', (_event, key: string, value: any) => store.set(key as any, value));
