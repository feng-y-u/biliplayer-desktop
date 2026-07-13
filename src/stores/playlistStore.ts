import { create } from 'zustand';
import type { Track, PlayMode } from '@/types';
import { isSameTrack } from '@/utils/track';

interface PlaylistState {
  tracks: Track[];
  currentIndex: number;
  playMode: PlayMode;
  loading: boolean;
}

interface PlaylistActions {
  setTracks: (tracks: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  setLoading: (loading: boolean) => void;
  addTrack: (track: Track) => void;
  deleteTrack: (index: number) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
}

const persist = (key: string, value: unknown) => {
  window.electronAPI?.storeSet(key, value);
};

export const usePlaylistStore = create<PlaylistState & PlaylistActions>((set, get) => ({
  tracks: [],
  currentIndex: 0,
  playMode: 'loop',
  loading: false,

  setTracks: (tracks) => {
    set({ tracks });
    persist('playlistTracks', tracks);
  },

  setCurrentIndex: (currentIndex) => {
    set({ currentIndex });
    persist('playlistIndex', currentIndex);
  },

  setPlayMode: (playMode) => {
    set({ playMode });
    persist('playMode', playMode);
  },

  setLoading: (loading) => set({ loading }),

  addTrack: (track) => {
    const { tracks } = get();
    if (tracks.some(t => isSameTrack(t, track))) return;
    const next = [...tracks, track];
    set({ tracks: next });
    persist('playlistTracks', next);
  },

  deleteTrack: (index) => {
    const { tracks, currentIndex } = get();
    const next = [...tracks];
    next.splice(index, 1);
    let newIndex = currentIndex;
    if (index < currentIndex && currentIndex > 0) newIndex = currentIndex - 1;
    else if (index === currentIndex && next.length > 0) newIndex = Math.min(index, next.length - 1);
    else if (next.length === 0) newIndex = 0;
    set({ tracks: next, currentIndex: newIndex });
    persist('playlistTracks', next);
    persist('playlistIndex', newIndex);
  },

  reorderTracks: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const { tracks, currentIndex } = get();
    const next = [...tracks];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved!);
    let newIndex = currentIndex;
    if (currentIndex === fromIndex) newIndex = toIndex;
    else if (fromIndex < currentIndex && toIndex >= currentIndex) newIndex = currentIndex - 1;
    else if (fromIndex > currentIndex && toIndex <= currentIndex) newIndex = currentIndex + 1;
    set({ tracks: next, currentIndex: newIndex });
    persist('playlistTracks', next);
    if (newIndex !== currentIndex) persist('playlistIndex', newIndex);
  },
}));
