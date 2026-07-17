const BV_RE = /BV[a-zA-Z0-9]+/i;
const PLAYLIST_RE = /medialist\/play\/dlista\/\d+\/\d+|space\.bilibili\.com\/\d+\/favlist\?.*fid=\d+/;
const NUMERIC_RE = /^\d+$/;

export function extractBvid(input: string): string | null {
  const m = input.match(BV_RE);
  return m ? m[0]! : null;
}

function parseSpaceBilibiliUrl(input: string) {
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    if (url.hostname !== 'space.bilibili.com') return null;

    const pathParts = url.pathname.split('/').filter(Boolean);
    const mid = pathParts[0];
    if (!mid || !NUMERIC_RE.test(mid)) return null;

    const part1 = pathParts[1];
    const part2 = pathParts[2];

    if (part1 === 'lists' && part2 && NUMERIC_RE.test(part2)) {
      const sid = part2;
      const listType = url.searchParams.get('type');
      if (listType === 'series') return { type: 'series' as const, mid, sid };
      if (listType === 'season') return { type: 'collection' as const, mid, sid };
    }

    if (part1 === 'channel' && part2 === 'seriesdetail') {
      const sid = url.searchParams.get('sid');
      if (sid && NUMERIC_RE.test(sid)) return { type: 'series' as const, mid, sid };
    }

    if (part1 === 'channel' && part2 === 'collectiondetail') {
      const sid = url.searchParams.get('sid');
      if (sid && NUMERIC_RE.test(sid)) return { type: 'collection' as const, mid, sid };
    }
  } catch {
    return null;
  }

  return null;
}

export type ParsedInput =
  | { type: 'bvid'; bvid: string }
  | { type: 'playlist'; url: string }
  | { type: 'favId'; id: string }
  | { type: 'series'; mid: string; sid: string }
  | { type: 'collection'; mid: string; sid: string };

export function parseInput(input: string): ParsedInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (NUMERIC_RE.test(trimmed)) {
    return { type: 'favId', id: trimmed };
  }

  const bvid = extractBvid(trimmed);
  if (bvid && /^https?:\/\//.test(trimmed)) {
    // Full URL with BV → treat as playlist/series check first
    const spaceResult = parseSpaceBilibiliUrl(trimmed);
    if (spaceResult) return spaceResult;

    if (PLAYLIST_RE.test(trimmed)) return { type: 'playlist', url: trimmed };
    // Fallback: URL containing BV号 → single video
    return { type: 'bvid', bvid };
  }
  if (bvid) return { type: 'bvid', bvid };

  if (/^https?:\/\//.test(trimmed)) {
    const spaceResult = parseSpaceBilibiliUrl(trimmed);
    if (spaceResult) return spaceResult;

    if (PLAYLIST_RE.test(trimmed)) return { type: 'playlist', url: trimmed };
  }

  return null;
}
