import { create } from 'zustand';
import type { FavoriteFolder, Track } from '@/types';
import { isSameTrack } from '@/utils/track';

interface FavoritesState {
  favorites: FavoriteFolder[];
}

interface FavoritesActions {
  setFavorites: (favorites: FavoriteFolder[]) => void;
  addTrackToFavorite: (favId: string, track: Track) => void;
  removeTrackFromFavorite: (favId: string, trackIndex: number) => void;
  deleteFavorite: (favId: string) => void;
  reorderFavoriteTracks: (favId: string, fromIndex: number, toIndex: number) => void;
}

const persist = (value: unknown) => {
  window.electronAPI?.storeSet('favorites', value);
};

export const useFavoritesStore = create<FavoritesState & FavoritesActions>((set, get) => ({
  favorites: [],

  setFavorites: (favorites) => {
    set({ favorites });
    persist(favorites);
  },

  addTrackToFavorite: (favId, track) => {
    const { favorites } = get();
    const next = favorites.map(f => {
      if (f.id !== favId) return f;
      if (f.tracks.some(t => isSameTrack(t, track))) return f;
      return { ...f, tracks: [...f.tracks, track], updatedAt: Date.now() };
    });
    set({ favorites: next });
    persist(next);
  },

  removeTrackFromFavorite: (favId, trackIndex) => {
    const { favorites } = get();
    const next = favorites.map(f => {
      if (f.id !== favId) return f;
      const tracks = [...f.tracks];
      tracks.splice(trackIndex, 1);
      return { ...f, tracks, updatedAt: Date.now() };
    });
    set({ favorites: next });
    persist(next);
  },

  deleteFavorite: (favId) => {
    const { favorites } = get();
    const next = favorites.filter(f => f.id !== favId);
    set({ favorites: next });
    persist(next);
  },

  reorderFavoriteTracks: (favId, fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const { favorites } = get();
    const next = favorites.map(f => {
      if (f.id !== favId) return f;
      const tracks = [...f.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, moved!);
      return { ...f, tracks, updatedAt: Date.now() };
    });
    set({ favorites: next });
    persist(next);
  },
}));
