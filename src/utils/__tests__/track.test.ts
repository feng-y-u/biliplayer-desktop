import { describe, it, expect } from 'vitest';
import { isTrackFavorited } from '../track';
import type { Track, FavoriteFolder } from '@/types';

function makeTrack(bvid: string, cid: number): Track {
  return { bvid, cid, title: 'test', author: 'test', cover: '' };
}

function makeFav(id: string, tracks: Track[]): FavoriteFolder {
  return { id, name: 'test', icon: '♥', tracks, updatedAt: Date.now() };
}

describe('isTrackFavorited', () => {
  it('returns false when no favorites', () => {
    const track = makeTrack('BV123', 1);
    expect(isTrackFavorited(track, [])).toBe(false);
  });

  it('returns false when track not in any folder', () => {
    const track = makeTrack('BV123', 1);
    const favs = [makeFav('1', [makeTrack('BV456', 2)])];
    expect(isTrackFavorited(track, favs)).toBe(false);
  });

  it('returns true when track is in a folder', () => {
    const track = makeTrack('BV123', 1);
    const favs = [makeFav('1', [track])];
    expect(isTrackFavorited(track, favs)).toBe(true);
  });

  it('returns true when track is in any of multiple folders', () => {
    const track = makeTrack('BV123', 1);
    const favs = [
      makeFav('1', [makeTrack('BV456', 2)]),
      makeFav('2', [track]),
    ];
    expect(isTrackFavorited(track, favs)).toBe(true);
  });

  it('matches by bvid AND cid', () => {
    const track = makeTrack('BV123', 1);
    const sameBvidDifferentCid = makeTrack('BV123', 999);
    const favs = [makeFav('1', [track])];
    expect(isTrackFavorited(sameBvidDifferentCid, favs)).toBe(false);
  });
});
