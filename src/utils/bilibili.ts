const BV_RE = /BV[a-zA-Z0-9]+/i;
const PLAYLIST_RE = /medialist\/play\/dlista\/\d+\/\d+|space\.bilibili\.com\/\d+\/favlist\?.*fid=\d+/;

export function extractBvid(input: string): string | null {
  const m = input.match(BV_RE);
  return m ? m[0]! : null;
}

export function parseInput(input: string): { type: 'playlist'; url: string } | { type: 'bvid'; bvid: string } | null {
  if (PLAYLIST_RE.test(input)) return { type: 'playlist', url: input };
  const bvid = extractBvid(input);
  if (bvid) return { type: 'bvid', bvid };
  return null;
}
