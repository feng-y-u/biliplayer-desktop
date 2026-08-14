import type { Track } from '@/types';

export function isSameTrack(a: Pick<Track, 'bvid' | 'cid'>, b: Pick<Track, 'bvid' | 'cid'>): boolean {
  return a.bvid === b.bvid && a.cid === b.cid;
}

/** 将 incoming 中与 existing 不重复（bvid:cid 复合键）的曲目追加到列表末尾。 */
export function mergeUniqueTracks(existing: Track[], incoming: Track[]): Track[] {
  const seen = new Set(existing.map(t => `${t.bvid}:${t.cid}`));
  const newTracks = incoming.filter(t => !seen.has(`${t.bvid}:${t.cid}`));
  return [...existing, ...newTracks];
}
