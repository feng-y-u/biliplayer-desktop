import type { Track, FavoriteFolder } from '@/types';

export function isTrackFavorited(track: Track, favorites: FavoriteFolder[]): boolean {
  return favorites.some(f =>
    f.tracks.some(t => t.bvid === track.bvid && t.cid === track.cid)
  );
}

export function isSameTrack(a: Pick<Track, 'bvid' | 'cid'>, b: Pick<Track, 'bvid' | 'cid'>): boolean {
  return a.bvid === b.bvid && a.cid === b.cid;
}
