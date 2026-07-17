// src/services/audioCache.ts
const URL_REFRESH_THRESHOLD_MS = 60_000;

export interface AudioCacheState {
  url: string;
  expiresAt: number;
  bvid: string;
  cid: number;
}

export class AudioCache {
  private url = '';
  private expiresAt = 0;
  private bvid = '';
  private cid = 0;

  /** 返回当前缓存状态的快照。 */
  get state(): Readonly<AudioCacheState> {
    return { url: this.url, expiresAt: this.expiresAt, bvid: this.bvid, cid: this.cid };
  }

  /** 缓存命中：同一曲目且距过期 >60 秒。 */
  isValid(bvid: string, cid: number): boolean {
    return this.bvid === bvid && this.cid === cid && !!this.url && this.expiresAt > Date.now() + URL_REFRESH_THRESHOLD_MS;
  }

  /** 缓存即将过期（距过期 <60 秒），需要刷新。 */
  isExpiring(): boolean {
    return !!this.url && this.expiresAt < Date.now() + URL_REFRESH_THRESHOLD_MS;
  }

  /** 写入缓存。 */
  save(url: string, expiresAt: number, bvid: string, cid: number): void {
    this.url = url;
    this.expiresAt = expiresAt;
    this.bvid = bvid;
    this.cid = cid;
  }

  /** 清空缓存（加载失败 / 强制刷新时避免反复命中死链）。 */
  invalidate(): void {
    this.url = '';
    this.expiresAt = 0;
    this.bvid = '';
    this.cid = 0;
  }
}

export const audioCache = new AudioCache();
