import { useState, useEffect, useCallback, useRef } from 'react';
import type { Track, FavoriteFolder, PlayMode, WindowPosition } from '../types';
import { getVideoInfo, getPlaylist } from '../services/api';

const store = window.electronAPI;

export function usePlayerStore() {
  const [volume, setVolumeState] = useState(0.7);
  const [playMode, setPlayModeState] = useState<PlayMode>('loop');
  const [tracks, setTracksState] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndexState] = useState(0);
  const [favorites, setFavoritesState] = useState<FavoriteFolder[]>([]);
  const [recentTracks, setRecentTracksState] = useState<Track[]>([]);
  const [windowPosition, setWindowPositionState] = useState<WindowPosition>({ left: 0, top: 0 });
  const [loading, setLoading] = useState(false);

  const tracksRef = useRef(tracks);
  const currentIndexRef = useRef(currentIndex);
  tracksRef.current = tracks;
  currentIndexRef.current = currentIndex;

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
    })();
  }, []);

  const persistPlaylist = useCallback((newTracks: Track[], newIndex: number) => {
    store.storeSet('playlist', { tracks: newTracks, currentIndex: newIndex });
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    store.storeSet('volume', v);
  }, []);

  const setPlayMode = useCallback((p: PlayMode) => {
    setPlayModeState(p);
    store.storeSet('playMode', p);
  }, []);

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
    store.storeSet('favorites', f);
  }, []);

  const setRecentTracks = useCallback((t: Track[]) => {
    setRecentTracksState(t);
    store.storeSet('recentTracks', t);
  }, []);

  const setWindowPosition = useCallback((p: WindowPosition) => {
    setWindowPositionState(p);
    store.storeSet('windowPosition', p);
  }, []);

  const loadVideo = useCallback(async (bvid: string): Promise<Track> => {
    setLoading(true);
    try {
      const res = await getVideoInfo(bvid);
      if (!res.success) throw new Error(res.error);
      const track = res.data as unknown as Track;
      setTracksState((prev) => {
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
        const next = [...prev, ...data];
        persistPlaylist(next, currentIndexRef.current);
        return next;
      });
      return data;
    } finally {
      setLoading(false);
    }
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

  const moveTrackUp = useCallback((index: number) => {
    if (index <= 0) return;
    setTracksState((prev) => {
      const next = [...prev] as Track[];
      [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
      if (currentIndexRef.current === index) {
        const newIndex = index - 1;
        setCurrentIndexState(newIndex);
        persistPlaylist(next, newIndex);
      } else if (currentIndexRef.current === index - 1) {
        const newIndex = index;
        setCurrentIndexState(newIndex);
        persistPlaylist(next, newIndex);
      } else {
        persistPlaylist(next, currentIndexRef.current);
      }
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
      store.storeSet('favorites', next);
      return next;
    });
  }, []);

  const removeTrackFromFavorite = useCallback((favId: string, trackIndex: number) => {
    setFavoritesState((prev) => {
      const next = prev.map(f => {
        if (f.id !== favId) return f;
        const tracks = [...f.tracks];
        tracks.splice(trackIndex, 1);
        return { ...f, tracks, updatedAt: Date.now() };
      });
      store.storeSet('favorites', next);
      return next;
    });
  }, []);

  return {
    volume, setVolume,
    playMode, setPlayMode,
    tracks, setTracks,
    currentIndex, setCurrentIndex,
    favorites, setFavorites,
    recentTracks, setRecentTracks,
    windowPosition, setWindowPosition,
    loading,
    loadVideo, loadPlaylist,
    deleteTrack, moveTrackUp,
    addTrackToFavorite, removeTrackFromFavorite,
  };
}
