/**
 * 渲染进程的音频管理层。
 *
 * 职责：
 * - 封装所有 IPC 调用，渲染进程不直接 fetch
 * - 维护全局唯一的 HTMLAudioElement 单例（audioEl）
 * - 管理 B 站音频 URL 缓存（有效期约 10 分钟）
 * - 提供播放/暂停/跳转/音量等控制接口
 *
 * 三个核心函数的调用链：
 *   loadAudioTrack(bvid, cid)  只缓存 URL，不操作 audioEl
 *          ↓
 *   playAudioLocal(bvid, cid)  调用 loadAudioTrack 获取 URL → 设置 audioEl.src → play()
 *          ↓
 *   refreshAudioUrl(bvid, cid) 播放中定时调用，缓存过期时热替换 audioEl.src
 */

import { audioCache } from './audioCache';

const api = window.electronAPI?.api;

const DEFAULT_VOLUME = 0.7;

let audioEl: HTMLAudioElement | null = new Audio();
audioEl.volume = DEFAULT_VOLUME;

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

// 防止同一曲目的并发重复 fetch
const inflightFetches = new Map<string, Promise<{ url: string; expiresAt: number } | null>>();

/**
 * 预加载音频 URL 到全局缓存，不做任何 audioEl 操作。
 *
 * @remarks 如果 audioCache 缓存命中（同曲目 + 距过期 >60 秒），直接返回，跳过网络请求。
 * 并发调用同一 (bvid,cid) 时自动去重，只发一个 fetch。
 * @param bvid - B 站视频 BV 号
 * @param cid - B 站视频 CID
 * @returns { url, expiresAt } 或 null（请求失败）
 * @sideeffect 请求成功时更新 audioCache
 */
export async function loadAudioTrack(bvid: string, cid: number): Promise<{ url: string; expiresAt: number } | null> {
  if (audioCache.isValid(bvid, cid)) {
    const cached = audioCache.state;
    return { url: cached.url, expiresAt: cached.expiresAt };
  }
  const key = `${bvid}:${cid}`;
  if (inflightFetches.has(key)) return inflightFetches.get(key)!;
  const promise = (async () => {
    try {
      const res = await getAudioUrl(bvid, cid);
      if (!res.success) {
        console.error('[api] loadAudioTrack 失败:', res.error);
        return null;
      }
      audioCache.save(res.data.url, res.data.expiresAt, bvid, cid);
      return { url: res.data.url, expiresAt: res.data.expiresAt };
    } catch (e) {
      console.error('[api] loadAudioTrack 失败:', (e as Error).message);
      return null;
    } finally {
      inflightFetches.delete(key);
    }
  })();
  inflightFetches.set(key, promise);
  return promise;
}

/**
 * 播放指定音频：从缓存或网络获取 URL → 设置 audioEl.src → 等待缓冲 → play()。
 *
 * @remarks
 * - 如果 audioEl.src 与目标 URL 相同且已缓冲足够，跳过设置 src 直接 play()
 * - 使用 `canplay` 事件而非 `canplaythrough`，等待至少 2 秒缓冲圈
 *   解决蓝牙 A2DP 初始化延迟导致的"进度条先走、声音后到"
 * @param bvid - B 站视频 BV 号
 * @param cid - B 站视频 CID
 * @param _title - 仅用于日志（当前未使用）
 * @returns { success, error? }
 * @sideeffect 修改 audioEl.src，启动 audioEl.play()
 */
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
  if (audioCache.isExpiring()) {
    const { bvid, cid } = audioCache.state;
    await refreshAudioUrl(bvid, cid);
  }
  if (audioEl.paused) await audioEl.play().catch(() => {});
}
export function seekAudioLocal(time: number) { if (audioEl) audioEl.currentTime = time; }
export function setVolumeLocal(volume: number) { if (audioEl) audioEl.volume = volume; }

export function getAudioElement(): HTMLAudioElement | null {
  return audioEl;
}

/**
 * 刷新当前音频 URL：获取新 URL 后直接替换 audioEl.src。
 *
 * @remarks
 * - 如果 audioCache 缓存命中，跳过刷新
 * - 替换 src 会中断当前播放，之后自动恢复位置和播放状态
 * @param bvid - B 站视频 BV 号
 * @param cid - B 站视频 CID
 * @sideeffect 替换 audioEl.src 并恢复播放；更新 audioCache
 */
export async function refreshAudioUrl(bvid: string, cid: number) {
  if (audioCache.isValid(bvid, cid)) return;
  try {
    const res = await getAudioUrl(bvid, cid);
    if (!res.success) return;
    audioCache.save(res.data.url, res.data.expiresAt, bvid, cid);
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
