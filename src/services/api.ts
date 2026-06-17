declare global {
  interface Window {
    electronAPI: {
      api: (message: any) => Promise<any>;
      storeGet: (key: string) => Promise<any>;
      storeSet: (key: string, value: any) => Promise<void>;
      windowMove: (x: number, y: number) => Promise<void>;
      windowResize: (w: number, h: number) => Promise<void>;
      windowGetPosition: () => Promise<{ x: number; y: number; width: number; height: number }>;
      windowSetMinimumSize: (w: number, h: number) => Promise<void>;
    };
  }
}

const api = window.electronAPI?.api;

let audioEl: HTMLAudioElement | null = new Audio();
audioEl.volume = 0.7;
let currentUrl = '';
let currentExpiresAt = 0;
let currentBvid = '';
let currentCid = 0;

function ensureAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.volume = 0.7;
  }
  return audioEl;
}

export async function getVideoInfo(bvid: string) {
  return api({ type: 'GET_VIDEO_INFO', bvid });
}

export async function getPlaylist(url: string) {
  return api({ type: 'GET_PLAYLIST', url });
}

export async function getAudioUrl(bvid: string, cid: number) {
  return api({ type: 'GET_AUDIO_URL', bvid, cid });
}

/** Preload audio URL into the global player cache without playing. */
export async function loadAudioTrack(bvid: string, cid: number): Promise<{ url: string; expiresAt: number } | null> {
  try {
    if (bvid === currentBvid && cid === currentCid && currentUrl && currentExpiresAt > Date.now() + 60_000) {
      return { url: currentUrl, expiresAt: currentExpiresAt };
    }
    const res = await getAudioUrl(bvid, cid);
    if (!res.success) return null;
    currentUrl = res.data.url;
    currentExpiresAt = res.data.expiresAt;
    currentBvid = bvid;
    currentCid = cid;
    return { url: res.data.url, expiresAt: res.data.expiresAt };
  } catch {
    return null;
  }
}

export async function playAudioLocal(bvid: string, cid: number, _title: string) {
  try {
    const result = await loadAudioTrack(bvid, cid);
    if (!result) return { success: false, error: 'Failed to load audio' };
    const audio = ensureAudio();
    if (audio.src !== result.url) audio.src = result.url;
    await audio.play();
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function pauseAudioLocal() { audioEl?.pause(); }
export function resumeAudioLocal() { audioEl?.play(); }
export function seekAudioLocal(time: number) { if (audioEl) audioEl.currentTime = time; }
export function setVolumeLocal(volume: number) { if (audioEl) audioEl.volume = volume; }

export function getAudioElement(): HTMLAudioElement | null {
  return audioEl;
}

export function getLocalPlayerState() {
  return {
    isPlaying: audioEl ? !audioEl.paused : false,
    currentTime: audioEl ? audioEl.currentTime : 0,
    duration: audioEl ? audioEl.duration : 0,
    volume: audioEl ? audioEl.volume : 0.7,
  };
}

export async function refreshAudioUrl(bvid: string, cid: number) {
  const res = await getAudioUrl(bvid, cid);
  if (res.success) {
    currentUrl = res.data.url;
    currentExpiresAt = res.data.expiresAt;
  }
}
