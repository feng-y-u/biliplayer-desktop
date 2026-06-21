import { create } from 'zustand';
import type { Track } from '@/types';
import { isSameTrack } from '@/utils/track';

const MAX_RECENT_TRACKS = 50;

interface RecentState {
  recentTracks: Track[];
}

interface RecentActions {
  setRecentTracks: (tracks: Track[]) => void;
  addRecentTrack: (track: Track) => void;
  loadFromStore: () => Promise<void>;
}

const persist = (value: unknown) => {
  window.electronAPI?.storeSet('recentTracks', value);
};

export const useRecentStore = create<RecentState & RecentActions>((set, get) => ({
  recentTracks: [],

  setRecentTracks: (recentTracks) => {
    set({ recentTracks });
    persist(recentTracks);
  },

  addRecentTrack: (track) => {
    const { recentTracks } = get();
    const filtered = recentTracks.filter(t => !isSameTrack(t, track));
    const next = [track, ...filtered].slice(0, MAX_RECENT_TRACKS);
    set({ recentTracks: next });
    persist(next);
  },

  loadFromStore: async () => {
    const api = window.electronAPI;
    if (!api) return;
    const tracks = await api.storeGet('recentTracks');
    if (tracks) set({ recentTracks: tracks });
  },
}));
