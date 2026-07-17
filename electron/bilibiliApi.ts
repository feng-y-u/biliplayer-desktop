// electron/bilibiliApi.ts
const PLAYLIST_PAGE_SIZE = 20;
const AUDIO_URL_EXPIRY_MS = 10 * 60 * 1000;
const VIDEO_INFO_CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 15_000;
const FETCH_RETRIES = 2;
const FETCH_RETRY_DELAY_MS = 1000;

import { net } from 'electron';

async function biliFetch(url: string, retries = FETCH_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await net.fetch(url, {
        signal: controller.signal,
        headers: { Referer: 'https://www.bilibili.com/', 'User-Agent': 'Mozilla/5.0' },
      });
      clearTimeout(timer);
      return res;
    } catch (e) {
      const willRetry = attempt < retries && !(e instanceof DOMException && e.name === 'AbortError');
      console.error(`[bilibiliApi] fetch 失败 (attempt ${attempt + 1}/${retries + 1}):`, (e as Error).message);
      if (willRetry) await new Promise(r => setTimeout(r, FETCH_RETRY_DELAY_MS));
      else throw e;
    }
  }
  throw new Error('unreachable');
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
  // 限制并发避免被 B站 API 限流
  const results: any[] = [];
  for (let i = 0; i < all.length; i += VIDEO_INFO_CONCURRENCY) {
    const batch = all.slice(i, i + VIDEO_INFO_CONCURRENCY);
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

export async function getAudioUrl(bvid: string, cid: number) {
  const res = await biliFetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=0&fnval=16&fnver=0&fourk=1`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);
  const audioTrack = data.data.dash?.audio?.[0];
  if (!audioTrack) throw new Error('No audio track found');
  const audioUrl = audioTrack.baseUrl || audioTrack.base_url;
  if (!audioUrl) throw new Error('No audio URL');
  return { url: audioUrl, expiresAt: Date.now() + AUDIO_URL_EXPIRY_MS };
}