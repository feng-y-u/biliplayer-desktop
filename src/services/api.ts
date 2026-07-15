const api = window.electronAPI?.api;

const DEFAULT_VOLUME = 0.7;
const URL_REFRESH_THRESHOLD_MS = 60_000;

let audioEl: HTMLAudioElement | null = new Audio();
audioEl.volume = DEFAULT_VOLUME;
let currentUrl = '';
let currentExpiresAt = 0;
let currentBvid = '';
let currentCid = 0;

function ensureAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.volume = DEFAULT_VOLUME;
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
    if (bvid === currentBvid && cid === currentCid && currentUrl && currentExpiresAt > Date.now() + URL_REFRESH_THRESHOLD_MS) {
      return { url: currentUrl, expiresAt: currentExpiresAt };
    }
    const res = await getAudioUrl(bvid, cid);
    if (!res.success) return null;
    currentUrl = res.data.url;
    currentExpiresAt = res.data.expiresAt;
    currentBvid = bvid;
    currentCid = cid;
    return { url: res.data.url, expiresAt: res.data.expiresAt };
  } catch (e) {
    console.error('[api] loadAudioTrack 失败:', (e as Error).message);
    return null;
  }
}

export async function playAudioLocal(bvid: string, cid: number, _title: string) {
  try {
    const result = await loadAudioTrack(bvid, cid);
    if (!result) return { success: false, error: 'Failed to load audio' };
    const audio = ensureAudio();
    if (audio.src !== result.url) {
      audio.src = result.url;
      if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        await new Promise<void>((resolve, reject) => {
          const onCanPlay = () => { cleanup(); resolve(); };
          const onError = () => { cleanup(); reject(new Error('Audio load failed')); };
          const cleanup = () => {
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
          };
          audio.addEventListener('canplay', onCanPlay);
          audio.addEventListener('error', onError);
        });
      }
      // 等待至少 2 秒缓冲，防止蓝牙 A2DP 初始化期间"空转无声音"
      while (audio.buffered.length > 0 && audio.buffered.end(0) < 2) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    await audio.play();
    return { success: true };
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[api] playAudioLocal 失败:', msg);
    return { success: false, error: msg };
  }
}

export function pauseAudioLocal() { audioEl?.pause(); }
export async function resumeAudioLocal() {
  if (!audioEl) return;
  if (currentUrl && currentExpiresAt < Date.now() + URL_REFRESH_THRESHOLD_MS) {
    await refreshAudioUrl(currentBvid, currentCid);
  }
  if (audioEl.paused) await audioEl.play().catch(() => {});
}
export function seekAudioLocal(time: number) { if (audioEl) audioEl.currentTime = time; }
export function setVolumeLocal(volume: number) { if (audioEl) audioEl.volume = volume; }

export function getAudioElement(): HTMLAudioElement | null {
  return audioEl;
}

export async function refreshAudioUrl(bvid: string, cid: number) {
  try {
    const res = await getAudioUrl(bvid, cid);
    if (!res.success) return;
    currentUrl = res.data.url;
    currentExpiresAt = res.data.expiresAt;
    if (!audioEl) return;
    const wasPlaying = !audioEl.paused;
    const pos = audioEl.currentTime;
    audioEl.src = res.data.url;
    audioEl.currentTime = pos;
    if (wasPlaying) await audioEl.play().catch(() => {});
  } catch (e) {
    console.error('[api] refreshAudioUrl 失败:', (e as Error).message);
  }
}
