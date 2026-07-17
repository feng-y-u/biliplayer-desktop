// electron/bilibiliApi.ts
const PLAYLIST_PAGE_SIZE = 20;
const AUDIO_URL_EXPIRY_MS = 10 * 60 * 1000;
const VIDEO_INFO_CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 30_000;
const FETCH_RETRIES = 2;
const FETCH_RETRY_DELAY_MS = 1000;

import { net } from 'electron';

async function biliFetch(url: string, retries = FETCH_RETRIES): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await net.fetch(url, {
        signal: controller.signal,
        headers: { Referer: 'https://www.bilibili.com/', 'User-Agent': 'Mozilla/5.0' },
      });
      return res;
    } catch (e) {
      lastError = e;
      console.error(`[bilibiliApi] fetch 失败 (attempt ${attempt + 1}/${retries + 1}):`, (e as Error).message);
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
      } catch {
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
  }
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
  const res = await biliFetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=0&fnval=16&fnver=0&fourk=1`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  const audioTrack = data.data.dash?.audio?.[0];
  if (!audioTrack) throw new Error('No audio track found');
  const urls = pickAudioUrls(audioTrack);
  const audioUrl = urls[0];
  if (!audioUrl) throw new Error('No audio URL');
  return {
    url: audioUrl,
    backupUrls: urls.slice(1),
    expiresAt: expiryFromAudioUrl(audioUrl),
  };
}