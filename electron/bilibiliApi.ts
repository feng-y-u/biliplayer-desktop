// electron/bilibiliApi.ts
const PLAYLIST_PAGE_SIZE = 20;
const AUDIO_URL_EXPIRY_MS = 10 * 60 * 1000;
const VIDEO_INFO_CONCURRENCY = 2;
const FETCH_TIMEOUT_MS = 30_000;
const FETCH_RETRIES = 1;
const FETCH_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 1200;

import { net } from 'electron';

/** 串行队列：后续请求必须等前一个请求发出至少 RATE_LIMIT_DELAY_MS */
let _rateLimitGate: Promise<void> = Promise.resolve();

async function biliFetch(url: string, retries = FETCH_RETRIES): Promise<Response> {
  const prev = _rateLimitGate;
  let release: () => void;
  _rateLimitGate = new Promise<void>(r => { release = r; });
  await prev;
  setTimeout(release!, RATE_LIMIT_DELAY_MS);

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      console.warn(`[bilibiliApi] 超时 (${FETCH_TIMEOUT_MS}ms): ${url}`);
      controller.abort();
    }, FETCH_TIMEOUT_MS);
    const t0 = Date.now();
    try {
      console.log(`[bilibiliApi] 请求开始 attempt=${attempt + 1}: ${url}`);
      const res = await net.fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      console.log(`[bilibiliApi] 请求成功 attempt=${attempt + 1} status=${res.status} 耗时=${Date.now() - t0}ms`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return res;
    } catch (e) {
      const elapsed = Date.now() - t0;
      const err = e as Error;
      console.error(`[bilibiliApi] 请求失败 attempt=${attempt + 1} 耗时=${elapsed}ms: ${err.message} (name=${err.name}, cause=${(err as any).cause})`);
      lastError = e;
      if (attempt < retries) await new Promise(r => setTimeout(r, FETCH_RETRY_DELAY_MS));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function getVideoInfo(bvid: string) {
  const res = await biliFetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  return { bvid: data.data.bvid, cid: data.data.cid, title: data.data.title, author: data.data.owner.name, cover: data.data.pic, duration: data.data.duration };
}

export function parsePlaylistUrl(url: string) {
  const m1 = url.match(/medialist\/play\/dlista\/(\d+)\/(\d+)/);
  if (m1) return { seasonId: m1[1]!, mid: m1[2]! };
  const m2 = url.match(/space\.bilibili\.com\/(\d+)\/favlist\?.*fid=(\d+)/);
  if (m2) return { seasonId: m2[2]!, mid: m2[1]! };
  return null;
}

async function fetchVideoInfoList(items: any[]): Promise<any[]> {
  const results: any[] = [];
  let cidZeroCount = 0;
  for (let i = 0; i < items.length; i += VIDEO_INFO_CONCURRENCY) {
    const batch = items.slice(i, i + VIDEO_INFO_CONCURRENCY);
    const batchResults = await Promise.all(batch.map(async (item: any) => {
      try {
        const info = await getVideoInfo(item.bvid);
        return {
          bvid: item.bvid,
          cid: info.cid,
          title: item.title,
          author: item.upper?.name || '',
          cover: item.cover,
          duration: item.duration,
        };
      } catch (e) {
        cidZeroCount++;
        console.error(`[bilibiliApi] getVideoInfo 失败, bvid=${item.bvid}:`, (e as Error).message);
        return {
          bvid: item.bvid,
          cid: 0,
          title: item.title,
          author: item.upper?.name || '',
          cover: item.cover,
          duration: item.duration,
        };
      }
    }));
    results.push(...batchResults);
    if (i + VIDEO_INFO_CONCURRENCY < items.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  if (cidZeroCount > 0) console.warn(`[bilibiliApi] ${cidZeroCount} 条曲目的视频信息获取失败 (cid=0)，这些曲目将无法播放`);
  return results;
}

export async function getPlaylistVideos(_mid: string, seasonId: string) {
  const all: any[] = [];
  let pn = 1;
  while (true) {
    const res = await biliFetch(`https://api.bilibili.com/x/v3/fav/resource/list?media_id=${seasonId}&pn=${pn}&ps=${PLAYLIST_PAGE_SIZE}`);
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message);
    const medias = data.data?.list || data.data?.medias || [];
    if (medias.length === 0) break;
    all.push(...medias);
    if (!data.data?.has_more || medias.length < PLAYLIST_PAGE_SIZE) break;
    pn++;
  }
  return fetchVideoInfoList(all);
}

export async function getFavListVideos(mediaId: string) {
  const all: any[] = [];
  let pn = 1;
  while (true) {
    const res = await biliFetch(`https://api.bilibili.com/x/v3/fav/resource/list?media_id=${mediaId}&pn=${pn}&ps=${PLAYLIST_PAGE_SIZE}&keyword=&order=mtime&type=0&tid=0&platform=web&jsonp=jsonp`);
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message);
    const medias = data.data?.medias || [];
    if (medias.length === 0) break;
    all.push(...medias);
    if (!data.data?.has_more || medias.length < PLAYLIST_PAGE_SIZE) break;
    pn++;
  }
  return fetchVideoInfoList(all);
}

export async function getSeriesVideos(mid: string, sid: string) {
  const res = await biliFetch(`https://api.bilibili.com/x/series/archives?mid=${mid}&series_id=${sid}&only_normal=true&sort=desc&pn=1&ps=30`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  const archives = data.data?.archives || [];
  return fetchVideoInfoList(archives.map((a: any) => ({ bvid: a.bvid, title: a.title, cover: a.cover, upper: a.owner })));
}

export async function getColleVideos(mid: string, sid: string) {
  const all: any[] = [];
  let pn = 1;
  while (true) {
    const res = await biliFetch(`https://api.bilibili.com/x/polymer/web-space/seasons_archives_list?mid=${mid}&season_id=${sid}&sort_reverse=false&page_num=${pn}&page_size=30`);
    const data = await res.json();
    if (data.code !== 0) throw new Error(data.message);
    const archives = data.data?.archives || [];
    if (archives.length === 0) break;
    all.push(...archives);
    if (!data.data?.page || archives.length < 30) break;
    pn++;
  }
  return fetchVideoInfoList(all);
}

/** 从 CDN URL 的 deadline 查询参数解析过期时间；没有则回退固定窗口。 */
export function expiryFromAudioUrl(url: string, now = Date.now()): number {
  try {
    const deadline = new URL(url).searchParams.get('deadline');
    if (deadline) {
      const sec = Number(deadline);
      if (Number.isFinite(sec) && sec > 0) return sec * 1000;
    }
  } catch {
    // ignore malformed url
  }
  return now + AUDIO_URL_EXPIRY_MS;
}

function pickAudioUrls(audioTrack: { baseUrl?: string; base_url?: string; backupUrl?: string | string[]; backup_url?: string | string[] }): string[] {
  const primary = audioTrack.baseUrl || audioTrack.base_url;
  const raw = audioTrack.backupUrl ?? audioTrack.backup_url;
  const backups = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return [primary, ...backups].filter((u): u is string => typeof u === 'string' && u.length > 0);
}

export async function getAudioUrl(bvid: string, cid: number) {
  if (!cid) throw new Error('Invalid cid');
  const res = await biliFetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=64&fnval=16&fnver=0&fourk=1`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(`B站 API 错误: code=${data.code} message=${data.message}`);
  const audioTrack = data.data?.dash?.audio?.[0];
  if (!audioTrack) throw new Error('No audio track found (该视频可能无 DASH 音频流)');
  const urls = pickAudioUrls(audioTrack);
  const audioUrl = urls[0];
  if (!audioUrl) throw new Error('No audio URL');
  return {
    url: audioUrl,
    backupUrls: urls.slice(1),
    expiresAt: expiryFromAudioUrl(audioUrl),
  };
}