import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaylistStore } from '../playlistStore';
import type { Track } from '@/types';

// reorderTracks 内部调用的 persist 需要 window.electronAPI
Object.defineProperty(globalThis, 'window', {
  value: { electronAPI: { storeSet: () => {} } },
  writable: true,
  configurable: true,
});

function makeTrack(bvid: string): Track {
  return { bvid, cid: 1, title: 't', author: 'a', cover: 'c' };
}

beforeEach(() => {
  usePlaylistStore.setState({ tracks: [], currentIndex: 0 });
});

describe('reorderTracks', () => {
  it('does nothing when fromIndex === toIndex', () => {
    const tracks = [makeTrack('A'), makeTrack('B')];
    usePlaylistStore.setState({ tracks, currentIndex: 0 });
    usePlaylistStore.getState().reorderTracks(0, 0);
    const state = usePlaylistStore.getState();
    expect(state.tracks.map(t => t.bvid)).toEqual(['A', 'B']);
    expect(state.currentIndex).toBe(0);
  });

  it('moves currentIndex to toIndex when dragging the current track forward', () => {
    const tracks = [makeTrack('A'), makeTrack('B'), makeTrack('C'), makeTrack('D')];
    usePlaylistStore.setState({ tracks, currentIndex: 1 });
    usePlaylistStore.getState().reorderTracks(1, 3);
    const state = usePlaylistStore.getState();
    expect(state.tracks.map(t => t.bvid)).toEqual(['A', 'C', 'D', 'B']);
    expect(state.currentIndex).toBe(3);
  });

  it('moves currentIndex to toIndex when dragging the current track backward', () => {
    const tracks = [makeTrack('A'), makeTrack('B'), makeTrack('C'), makeTrack('D')];
    usePlaylistStore.setState({ tracks, currentIndex: 2 });
    usePlaylistStore.getState().reorderTracks(2, 0);
    const state = usePlaylistStore.getState();
    expect(state.tracks.map(t => t.bvid)).toEqual(['C', 'A', 'B', 'D']);
    expect(state.currentIndex).toBe(0);
  });

  it('shifts currentIndex down when dragging above past the current track', () => {
    const tracks = [makeTrack('A'), makeTrack('B'), makeTrack('C'), makeTrack('D')];
    usePlaylistStore.setState({ tracks, currentIndex: 2 });
    usePlaylistStore.getState().reorderTracks(0, 3);
    const state = usePlaylistStore.getState();
    expect(state.tracks.map(t => t.bvid)).toEqual(['B', 'C', 'D', 'A']);
    expect(state.currentIndex).toBe(1);
  });

  it('shifts currentIndex up when dragging below past the current track', () => {
    const tracks = [makeTrack('A'), makeTrack('B'), makeTrack('C'), makeTrack('D')];
    usePlaylistStore.setState({ tracks, currentIndex: 1 });
    usePlaylistStore.getState().reorderTracks(3, 0);
    const state = usePlaylistStore.getState();
    expect(state.tracks.map(t => t.bvid)).toEqual(['D', 'A', 'B', 'C']);
    expect(state.currentIndex).toBe(2);
  });

  it('keeps currentIndex when dragging within same side (from < current, to < current)', () => {
    const tracks = [makeTrack('A'), makeTrack('B'), makeTrack('C'), makeTrack('D')];
    usePlaylistStore.setState({ tracks, currentIndex: 3 });
    usePlaylistStore.getState().reorderTracks(0, 1);
    const state = usePlaylistStore.getState();
    expect(state.currentIndex).toBe(3);
  });

  it('keeps currentIndex when dragging within same side (from > current, to > current)', () => {
    const tracks = [makeTrack('A'), makeTrack('B'), makeTrack('C'), makeTrack('D')];
    usePlaylistStore.setState({ tracks, currentIndex: 0 });
    usePlaylistStore.getState().reorderTracks(2, 3);
    const state = usePlaylistStore.getState();
    expect(state.currentIndex).toBe(0);
  });
});
