/**
 * 音频播放引擎 — 基于显式状态机的 HTMLAudioElement 封装。
 *
 * 状态转换图：
 *   idle ──play→ loading ──success→ playing ──pause→ paused ──resume→ playing
 *                │    │                                  │
 *                │    └──fail→ error ──recover→ loading   │
 *                │                │                       │
 *                │                └──giveUp→ ended        │
 *                │                                       │
 *                └──supersede→ loading（新 play）         │
 *                                                        │
 *   playing ──ended事件/timeupdate检测→ ended ──onEnd→ (外部调 play→ loading)
 *   playing ──error事件→ error
 *   paused  ──error→ error
 *   paused  ──ended→ ended
 */

import { audioCache } from './audioCache';
import { getAudioUrl } from './api';
import type { IpcResponse } from '@/types/ipc';

/* ---------- types ---------- */

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

interface AudioUrlResult {
  url: string;
  backupUrls: string[];
  expiresAt: number;
}

type FetchAudioUrl = (bvid: string, cid: number) => Promise<IpcResponse<'GET_AUDIO_URL'>>;

interface TrackRef {
  bvid: string;
  cid: number;
}

type StatusListener = (status: AudioStatus) => void;

/* ---------- constants ---------- */

const DEFAULT_VOLUME = 0.7;
const CANPLAY_TIMEOUT_MS = 8_000;
const BUFFER_TARGET_S = 2;
const BUFFER_WAIT_MAX_MS = 2_000;
const MAX_URL_CANDIDATES = 2;

/* ---------- transition map ---------- */

const VALID_TRANSITIONS: Readonly<Record<AudioStatus, readonly AudioStatus[]>> = {
  idle:    ['loading'],
  loading: ['playing', 'error', 'loading'],
  playing: ['paused', 'ended', 'error'],
  paused:  ['playing', 'loading', 'error', 'ended'],
  ended:   ['loading'],
  error:   ['loading', 'ended'],
};

/* ---------- AudioEngine ---------- */

export class AudioEngine {
  private _status: AudioStatus = 'idle';
  private _audio: HTMLAudioElement;
  private _playSeq = 0;
  private _currentTrack: TrackRef | null = null;
  private _listeners = new Set<StatusListener>();
  private _inflightFetches = new Map<string, Promise<AudioUrlResult | null>>();

  /** 曲目自然结束时调用。由上层注入（通常是切到下一首）。 */
  onEnd: (() => void) | null = null;

  constructor(fetchAudioUrl?: FetchAudioUrl) {
    this._fetchAudioUrl = fetchAudioUrl ?? getAudioUrl;
    this._audio = new Audio();
    this._audio.volume = DEFAULT_VOLUME;
    this._setupListeners();
  }

  /* ---------- 状态 / 媒体元素访问 ---------- */

  get status(): AudioStatus {
    return this._status;
  }

  get currentTrack(): Readonly<TrackRef> | null {
    return this._currentTrack;
  }

  get currentTime(): number {
    return this._audio.currentTime;
  }

  get duration(): number {
    const d = this._audio.duration;
    return Number.isFinite(d) ? d : 0;
  }

  get volume(): number {
    return this._audio.volume;
  }

  /** 只读引用 — 供 React 订阅 timeupdate 等高频事件。 */
  getMediaElement(): HTMLAudioElement {
    return this._audio;
  }

  /* ---------- 订阅 ---------- */

  subscribe(listener: StatusListener): () => void {
    this._listeners.add(listener);
    listener(this._status);
    return () => { this._listeners.delete(listener); };
  }

  /* ---------- 公开操作 ---------- */

  /**
   * 播放指定曲目。当前无论什么状态都允许切入（内部会 supersede 旧加载）。
   * @returns 是否成功开播。
   */
  async play(bvid: string, cid: number): Promise<boolean> {
    this._currentTrack = { bvid, cid };
    this.transition('loading');
    const seq = ++this._playSeq;

    try {
      const result = await this._fetchUrlCached(bvid, cid, seq);
      if (this._playSeq !== seq) return false;
      if (!result) throw new Error('无法获取音频链接');

      const candidates = [result.url, ...result.backupUrls].slice(0, MAX_URL_CANDIDATES);
      for (const url of candidates) {
        if (this._playSeq !== seq) return false;
        try {
          await this._trySetAndPlay(url, seq);
          audioCache.save(url, result.expiresAt, bvid, cid);
          return true;
        } catch (e) {
          if ((e as Error).message === 'superseded') return false;
        }
      }

      // 全部候选失败 → 清缓存重拉一次
      audioCache.invalidate();
      const result2 = await this._fetchUrlCached(bvid, cid, seq);
      if (this._playSeq !== seq) return false;
      if (!result2) throw new Error('重试获取音频链接失败');

      const candidates2 = [result2.url, ...result2.backupUrls].slice(0, MAX_URL_CANDIDATES);
      for (const url of candidates2) {
        if (this._playSeq !== seq) return false;
        try {
          await this._trySetAndPlay(url, seq);
          audioCache.save(url, result2.expiresAt, bvid, cid);
          return true;
        } catch (e) {
          if ((e as Error).message === 'superseded') return false;
        }
      }

      throw new Error('所有音频候选均加载失败');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg === 'superseded') return false;
      console.error('[AudioEngine] play 失败:', msg, 'bvid:', bvid, 'cid:', cid);
      if (this._playSeq === seq) {
        this.transition('error');
      }
      return false;
    }
  }

  pause(): void {
    if (this._status !== 'playing' && this._status !== 'loading') return;
    this._audio.pause();
    this.transition('paused');
  }

  async resume(): Promise<boolean> {
    if (this._status !== 'paused') return false;
    const cur = this._currentTrack;
    if (!cur) return false;

    if (audioCache.isExpiring()) {
      const ok = await this._refreshUrlInternal(cur.bvid, cur.cid, true, false);
      if (!ok) return false;
    }

    // refreshUrlInternal 成功时已将引擎置为 playing，无需再 play()
    // 如果缓存未过期且状态仍是 paused，直接 play()
    if (this._status === 'paused') {
      try {
        await this._audio.play();
        this.transition('playing');
        return true;
      } catch {
        this.transition('error');
        return false;
      }
    }

    return this._status === 'playing';
  }

  seek(time: number): void {
    this._audio.currentTime = time;
  }

  setVolume(v: number): void {
    this._audio.volume = v;
  }

  /**
   * 预加载音频 URL 到缓存，不操作音频元素。
   * 应用启动时调用，提前缓存首条曲目 URL。
   */
  async preload(bvid: string, cid: number): Promise<void> {
    if (audioCache.isValid(bvid, cid)) return;
    const key = `${bvid}:${cid}`;
    if (this._inflightFetches.has(key)) return;
    try {
      const res = await getAudioUrl(bvid, cid);
      if (res.success) {
        audioCache.save(res.data.url, res.data.expiresAt, bvid, cid);
      }
    } catch {
      // preload 失败静默忽略
    }
  }

  canResume(bvid: string, cid: number): boolean {
    if (this._status !== 'paused') return false;
    const cur = this._currentTrack;
    if (!cur || cur.bvid !== bvid || cur.cid !== cid) return false;
    return !audioCache.isExpiring();
  }

  /** 播放中后台刷新 CDN 链接（定时器调用）。失败不影响正在播的音频。 */
  async backgroundRefresh(): Promise<void> {
    if (this._status !== 'playing') return;
    const cur = this._currentTrack;
    if (!cur) return;
    if (!audioCache.isExpiring()) return;
    try {
      const res = await getAudioUrl(cur.bvid, cur.cid);
      if (!res.success) return;
      audioCache.save(res.data.url, res.data.expiresAt, cur.bvid, cur.cid);
    } catch {
      // 后台刷新失败静默忽略
    }
  }

  destroy(): void {
    this._audio.pause();
    this._audio.removeAttribute('src');
    this._audio.load();
    this._teardownListeners();
    this._listeners.clear();
    this._inflightFetches.clear();
  }

  /* ---------- 内部：状态转换 ---------- */

  private transition(to: AudioStatus): void {
    const allowed = VALID_TRANSITIONS[this._status];
    if (allowed && (allowed as readonly string[]).includes(to)) {
      this._status = to;
      this._emit();
      if (to === 'ended') {
        this.onEnd?.();
      }
    }
    // 非法转换静默忽略（例如 ended 事件在已 ended 时重复触发）
  }

  private _emit(): void {
    this._listeners.forEach(fn => fn(this._status));
  }

  /* ---------- 内部：音频元素事件 ---------- */

  private _setupListeners(): void {
    this._audio.addEventListener('timeupdate', this._onTimeUpdate);
    this._audio.addEventListener('play', this._onPlay);
    this._audio.addEventListener('pause', this._onPause);
    this._audio.addEventListener('loadedmetadata', this._onMeta);
    this._audio.addEventListener('volumechange', this._onVolume);
    this._audio.addEventListener('ended', this._onEnded);
    this._audio.addEventListener('error', this._onError);
  }

  private _teardownListeners(): void {
    this._audio.removeEventListener('timeupdate', this._onTimeUpdate);
    this._audio.removeEventListener('play', this._onPlay);
    this._audio.removeEventListener('pause', this._onPause);
    this._audio.removeEventListener('loadedmetadata', this._onMeta);
    this._audio.removeEventListener('volumechange', this._onVolume);
    this._audio.removeEventListener('ended', this._onEnded);
    this._audio.removeEventListener('error', this._onError);
  }

  private _onTimeUpdate = (): void => {
    if (this._status === 'playing' && this._audio.ended) {
      this.transition('ended');
    }
  };

  private _onPlay = (): void => {
    // play() 成功后由 _trySetAndPlay 显式 transition，这里不重复
  };

  private _onPause = (): void => {
    // ended 时浏览器也 pause；只处理用户主动暂停
    if (!this._audio.ended && this._status === 'playing') {
      this.transition('paused');
    }
  };

  private _onMeta = (): void => { /* React 订阅方自行读取 duration */ };
  private _onVolume = (): void => { /* React 订阅方自行读取 volume */ };

  private _onEnded = (): void => {
    // loading/error 状态下的 ended 事件来自 src 替换，忽略
    if (this._status === 'loading' || this._status === 'error') return;
    if (this._status === 'playing') {
      this.transition('ended');
    }
  };

  private _onError = (): void => {
    // loading 期间的错误由 trySetAndPlay 内部处理
    if (this._status === 'loading') return;
    if (!this._audio.error || this._audio.error.code === MediaError.MEDIA_ERR_ABORTED) return;

    if (this._status === 'playing') {
      this.transition('error');
      this._handlePlaybackError();
    } else if (this._status === 'paused') {
      this.transition('error');
    }
  };

  /* ---------- 内部：错误恢复 ---------- */

  private async _handlePlaybackError(): Promise<void> {
    const cur = this._currentTrack;
    if (!cur) {
      this.transition('ended');
      return;
    }

    try {
      const ok = await this._refreshUrlInternal(cur.bvid, cur.cid, true, true);
      if (ok) return;
    } catch {
      // 恢复失败，继续到 ended
    }

    if (this._status === 'error') {
      this.transition('ended');
    }
  }

  /* ---------- 内部：URL 获取 ---------- */

  private _fetchAudioUrl: FetchAudioUrl;

  private async _fetchUrlCached(bvid: string, cid: number, seq: number): Promise<AudioUrlResult | null> {
    if (audioCache.isValid(bvid, cid)) {
      const cached = audioCache.state;
      if (this._playSeq !== seq) return null;
      return { url: cached.url, backupUrls: [], expiresAt: cached.expiresAt };
    }

    const key = `${bvid}:${cid}`;
    const existing = this._inflightFetches.get(key);
    if (existing) return existing;

    const promise = this._doFetch(bvid, cid);
    this._inflightFetches.set(key, promise);
    try {
      return await promise;
    } finally {
      this._inflightFetches.delete(key);
    }
  }

  private async _doFetch(bvid: string, cid: number): Promise<AudioUrlResult | null> {
    try {
      const res = await this._fetchAudioUrl(bvid, cid);
      if (!res.success) {
        console.error('[AudioEngine] getAudioUrl 失败:', res.error);
        return null;
      }
      return {
        url: res.data.url,
        backupUrls: res.data.backupUrls ?? [],
        expiresAt: res.data.expiresAt,
      };
    } catch (e) {
      console.error('[AudioEngine] getAudioUrl 异常:', (e as Error).message);
      return null;
    }
  }

  /* ---------- 内部：播放流程 ---------- */

  private async _trySetAndPlay(url: string, seq: number): Promise<void> {
    this._audio.pause();
    this._audio.removeAttribute('src');
    this._audio.load();
    this._audio.src = url;
    await this._waitForCanPlay(seq);
    if (this._playSeq !== seq) throw new Error('superseded');
    await this._waitForBuffer(seq);
    if (this._playSeq !== seq) throw new Error('superseded');
    this._audio.currentTime = 0;
    await this._audio.play();
    this.transition('playing');
  }

  private _waitForCanPlay(seq: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (seq !== this._playSeq) { reject(new Error('superseded')); return; }

      const audio = this._audio;
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) { resolve(); return; }

      const timer = setTimeout(() => { cleanup(); reject(new Error('Audio load timeout')); }, CANPLAY_TIMEOUT_MS);

      const onCanPlay = () => { cleanup(); resolve(); };
      const onErr = () => {
        if (audio.error?.code === MediaError.MEDIA_ERR_ABORTED) return;
        cleanup();
        reject(new Error('Audio load failed'));
      };

      const cleanup = () => {
        clearTimeout(timer);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onErr);
      };

      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onErr);

      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) { cleanup(); resolve(); return; }
      if (audio.error && audio.error.code !== MediaError.MEDIA_ERR_ABORTED) { cleanup(); reject(new Error('Audio load failed')); return; }
      if (seq !== this._playSeq) { cleanup(); reject(new Error('superseded')); }
    });
  }

  private async _waitForBuffer(seq: number): Promise<void> {
    const audio = this._audio;
    const start = Date.now();
    while (Date.now() - start < BUFFER_WAIT_MAX_MS) {
      if (seq !== this._playSeq) return;
      if (audio.buffered.length === 0) { await new Promise(r => setTimeout(r, 100)); continue; }
      const end = audio.buffered.end(0);
      const dur = audio.duration;
      const target = Number.isFinite(dur) && dur > 0
        ? Math.min(BUFFER_TARGET_S, Math.max(0, dur - 0.05))
        : BUFFER_TARGET_S;
      if (end >= target) return;
      await new Promise(r => setTimeout(r, 100));
    }
  }

  /* ---------- 内部：URL 刷新 ---------- */

  private async _refreshUrlInternal(bvid: string, cid: number, force: boolean, autoPlay: boolean): Promise<boolean> {
    if (!force && audioCache.isValid(bvid, cid)) return true;
    if (force) audioCache.invalidate();

    this.transition('loading');
    const seq = this._playSeq;

    try {
      const res = await this._fetchAudioUrl(bvid, cid);
      if (!res.success) { this.transition('error'); return false; }
      if (this._playSeq !== seq) return false;

      const url = res.data.url;
      const backups = res.data.backupUrls ?? [];
      const pos = this._audio.currentTime;

      const candidates = [url, ...backups];
      for (const candidate of candidates) {
        try {
          this._audio.src = candidate;
          this._audio.currentTime = pos;
          if (autoPlay) await this._audio.play();
          audioCache.save(candidate, res.data.expiresAt, bvid, cid);
          this.transition(autoPlay ? 'playing' : 'paused');
          return true;
        } catch {
          // 试下一个候选
        }
      }

      this.transition('error');
      return false;
    } catch {
      this.transition('error');
      return false;
    }
  }
}

/* ---------- 全局单例 ---------- */

let _engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!_engine) _engine = new AudioEngine();
  return _engine;
}

/** 仅测试用：重置单例 */
export function _resetAudioEngine(): void {
  _engine?.destroy();
  _engine = null;
}
