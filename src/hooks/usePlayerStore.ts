import { useState, useEffect, useCallback, useRef } from 'react';
import type { Track, FavoriteFolder, PlayMode, WindowPosition, WindowSize } from '../types';
import { getVideoInfo, getPlaylist } from '../services/api';

const store = window.electronAPI!;
const BATCH_FLUSH_DELAY_MS = 100;
const DEFAULT_WINDOW_SIZE: WindowSize = { width: 400, height: 600 };

/** Debounced batch writer: coalesces rapid store:set calls into one IPC flush. */
function useBatchStore() {
  const batchRef = useRef<Record<string, any>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    timerRef.current = null;
    const batch = batchRef.current;
    if (Object.keys(batch).length === 0) return;
    batchRef.current = {};
    for (const [key, value] of Object.entries(batch)) {
      store.storeSet(key, value);
    }
  }, []);

  const batchSet = useCallback((key: string, value: any) => {
    batchRef.current[key] = value;
    if (!timerRef.current) {
      timerRef.current = setTimeout(flush, BATCH_FLUSH_DELAY_MS);
    }
  }, [flush]);

  // Flush pending writes on unmount
  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      flush();
    }
  }, [flush]);

  return batchSet;
}

export function usePlayerStore() {
  const [volume, setVolumeState] = useState(0.7);
  const [playMode, setPlayModeState] = useState<PlayMode>('loop');
  const [tracks, setTracksState] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndexState] = useState(0);
  const [favorites, setFavoritesState] = useState<FavoriteFolder[]>([]);
  const [recentTracks, setRecentTracksState] = useState<Track[]>([]);
  const [windowPosition, setWindowPositionState] = useState<WindowPosition>({ left: 0, top: 0 });
  const [windowSize, setWindowSizeState] = useState<WindowSize>(DEFAULT_WINDOW_SIZE);
  const [loading, setLoading] = useState(false);

  const tracksRef = useRef(tracks);
  const currentIndexRef = useRef(currentIndex);
  tracksRef.current = tracks;
  currentIndexRef.current = currentIndex;

  const batchSet = useBatchStore();

  useEffect(() => {
    (async () => {
      const v = await store.storeGet('volume');
      if (v !== undefined) setVolumeState(v);
      const m = await store.storeGet('playMode');
      if (m) setPlayModeState(m);
      const t = await store.storeGet('playlist');
      if (t) {
        setTracksState(t.tracks ?? []);
        setCurrentIndexState(t.currentIndex ?? 0);
      }
      const f = await store.storeGet('favorites');
      if (f) setFavoritesState(f);
      const r = await store.storeGet('recentTracks');
      if (r) setRecentTracksState(r);
      const wp = await store.storeGet('windowPosition');
      if (wp) setWindowPositionState(wp);
      const ws = await store.storeGet('windowSize');
      if (ws) setWindowSizeState(ws);
    })();
  }, []);

  const persistPlaylist = useCallback((newTracks: Track[], newIndex: number) => {
    batchSet('playlist', { tracks: newTracks, currentIndex: newIndex });
  }, [batchSet]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    batchSet('volume', v);
  }, [batchSet]);

  const setPlayMode = useCallback((p: PlayMode) => {
    setPlayModeState(p);
    batchSet('playMode', p);
  }, [batchSet]);

  const setTracks = useCallback((t: Track[]) => {
    setTracksState(t);
    persistPlaylist(t, currentIndexRef.current);
  }, [persistPlaylist]);

  const setCurrentIndex = useCallback((i: number) => {
    setCurrentIndexState(i);
    persistPlaylist(tracksRef.current, i);
  }, [persistPlaylist]);

  const setFavorites = useCallback((f: FavoriteFolder[]) => {
    setFavoritesState(f);
    batchSet('favorites', f);
  }, [batchSet]);

  const setRecentTracks = useCallback((t: Track[]) => {
    setRecentTracksState(t);
    batchSet('recentTracks', t);
  }, [batchSet]);

  const setWindowPosition = useCallback((p: WindowPosition) => {
    setWindowPositionState(p);
    batchSet('windowPosition', p);
  }, [batchSet]);

  const setWindowSize = useCallback((s: WindowSize) => {
    setWindowSizeState(s);
    batchSet('windowSize', s);
  }, [batchSet]);

  const loadVideo = useCallback(async (bvid: string): Promise<Track> => {
    setLoading(true);
    try {
      const res = await getVideoInfo(bvid);
      if (!res.success) throw new Error(res.error);
      const track = res.data as unknown as Track;
      setTracksState((prev) => {
        if (prev.some(t => t.bvid === track.bvid)) return prev;
        const next = [...prev, track];
        persistPlaylist(next, currentIndexRef.current);
        return next;
      });
      return track;
    } finally {
      setLoading(false);
    }
  }, [persistPlaylist]);

  const loadPlaylist = useCallback(async (url: string): Promise<Track[]> => {
    setLoading(true);
    try {
      const res = await getPlaylist(url);
      if (!res.success) throw new Error(res.error);
      const data = res.data as unknown as Track[];
      setTracksState((prev) => {
        const existing = new Set(prev.map(t => t.bvid));
        const newTracks = data.filter(t => !existing.has(t.bvid));
        const next = [...prev, ...newTracks];
        persistPlaylist(next, currentIndexRef.current);
        return next;
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, [persistPlaylist]);

  const reorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setTracksState((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved!);
      let newIndex = currentIndexRef.current;
      if (currentIndexRef.current === fromIndex) newIndex = toIndex;
      else {
        if (fromIndex < currentIndexRef.current && toIndex >= currentIndexRef.current) newIndex = currentIndexRef.current - 1;
        else if (fromIndex > currentIndexRef.current && toIndex <= currentIndexRef.current) newIndex = currentIndexRef.current + 1;
      }
      setCurrentIndexState(newIndex);
      persistPlaylist(next, newIndex);
      return next;
    });
  }, [persistPlaylist]);

  const deleteTrack = useCallback((index: number) => {
    setTracksState((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      let newIndex = currentIndexRef.current;
      if (index < currentIndexRef.current && currentIndexRef.current > 0) newIndex = currentIndexRef.current - 1;
      else if (index === currentIndexRef.current && next.length > 0) newIndex = Math.min(index, next.length - 1);
      else if (next.length === 0) newIndex = 0;
      setCurrentIndexState(newIndex);
      persistPlaylist(next, newIndex);
      return next;
    });
  }, [persistPlaylist]);

  const addTrackToFavorite = useCallback((favId: string, track: Track) => {
    setFavoritesState((prev) => {
      const next = prev.map(f => {
        if (f.id !== favId) return f;
        if (f.tracks.some(t => t.bvid === track.bvid && t.cid === track.cid)) return f;
        return { ...f, tracks: [...f.tracks, track], updatedAt: Date.now() };
      });
      batchSet('favorites', next);
      return next;
    });
  }, [batchSet]);

  const deleteFavorite = useCallback((favId: string) => {
    setFavoritesState((prev) => {
      const next = prev.filter(f => f.id !== favId);
      batchSet('favorites', next);
      return next;
    });
  }, [batchSet]);

  const reorderFavoriteTracks = useCallback((favId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setFavoritesState((prev) => {
      const next = prev.map(f => {
        if (f.id !== favId) return f;
        const tracks = [...f.tracks];
        const [moved] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, moved!);
        return { ...f, tracks, updatedAt: Date.now() };
      });
      batchSet('favorites', next);
      return next;
    });
  }, [batchSet]);

  const removeTrackFromFavorite = useCallback((favId: string, trackIndex: number) => {
    setFavoritesState((prev) => {
      const next = prev.map(f => {
        if (f.id !== favId) return f;
        const tracks = [...f.tracks];
        tracks.splice(trackIndex, 1);
        return { ...f, tracks, updatedAt: Date.now() };
      });
      batchSet('favorites', next);
      return next;
    });
  }, [batchSet]);

  return {
    volume, setVolume,
    playMode, setPlayMode,
    tracks, setTracks,
    currentIndex, setCurrentIndex,
    favorites, setFavorites,
    recentTracks, setRecentTracks,
    windowPosition, setWindowPosition,
    windowSize, setWindowSize,
    loading,
    loadVideo, loadPlaylist,
    deleteTrack, reorderTracks,
    addTrackToFavorite, removeTrackFromFavorite,
    deleteFavorite,
    reorderFavoriteTracks,
  };
}
