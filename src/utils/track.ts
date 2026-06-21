import type { Track, FavoriteFolder } from '@/types';

export function isSameTrack(a: Pick<Track, 'bvid' | 'cid'>, b: Pick<Track, 'bvid' | 'cid'>): boolean {
  return a.bvid === b.bvid && a.cid === b.cid;
}

export function isTrackFavorited(track: Track, favorites: FavoriteFolder[]): boolean {
  return favorites.some(f =>
    f.tracks.some(t => isSameTrack(t, track))
  );
}
