import { useEffect, useCallback, useRef, useState } from 'react';
import { usePlayerStore } from './hooks/usePlayerStore';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import FloatingPlayer from '@/components/floating-player/FloatingPlayer';
import type { Track } from '@/types';
import { pauseAudioLocal } from './services/api';

const BV_RE = /BV[a-zA-Z0-9]+/i;
const NOTIFICATION_TIMEOUT_MS = 3000;
const MAX_RECENT_TRACKS = 50;

function App() {
  const store = usePlayerStore();
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT_MS);
  }, []);

  const handleNext = () => {
    if (store.tracks.length === 0) return null;
    let nextIndex: number;
    if (store.playMode === 'single') nextIndex = store.currentIndex;
    else if (store.playMode === 'shuffle') nextIndex = Math.floor(Math.random() * store.tracks.length);
    else nextIndex = (store.currentIndex + 1) % store.tracks.length;
    store.setCurrentIndex(nextIndex);
    return nextIndex;
  };

  const handlePrev = () => {
    if (store.tracks.length === 0) return null;
    const prevIndex = store.currentIndex - 1 < 0 ? store.tracks.length - 1 : store.currentIndex - 1;
    store.setCurrentIndex(prevIndex);
    return prevIndex;
  };

  const { state: playerState, playPause, playTrack, seek, volumeChange, syncVolume } = useAudioPlayer(() => {
    const nextIndex = handleNext();
    if (nextIndex !== null && store.tracks[nextIndex]) {
      playTrack(store.tracks[nextIndex]!);
    }
  });

  const handlePlayPause = useCallback(() => {
    if (!playerState.currentAudio && store.tracks[store.currentIndex]) {
      playTrack(store.tracks[store.currentIndex]!);
    } else {
      playPause();
    }
  }, [playerState.currentAudio, store.tracks, store.currentIndex, playTrack, playPause]);

  const addTrackToPlaylistAndPlay = useCallback(async (track: Track) => {
    const newIndex = store.tracks.length;
    store.setTracks([...store.tracks, track]);
    store.setCurrentIndex(newIndex);
    await playTrack(track);
    const filtered = store.recentTracks.filter(t => !(t.bvid === track.bvid && t.cid === track.cid));
    store.setRecentTracks([track, ...filtered].slice(0, MAX_RECENT_TRACKS));
  }, [store, playTrack]);

  useEffect(() => {
    syncVolume(store.volume);
  }, [store.volume, syncVolume]);

  // Preload current track audio URL on mount (no autoplay)
  const autoLoaded = useRef(false);
  useEffect(() => {
    if (!autoLoaded.current && store.tracks.length > 0 && store.tracks[store.currentIndex]) {
      autoLoaded.current = true;
      const track = store.tracks[store.currentIndex]!;
      // Preload audio URL into player cache
      import('./services/api').then(api => api.loadAudioTrack(track.bvid, track.cid));
    }
  }, [store.tracks, store.currentIndex]);

  const handlePlayTrack = async (index: number) => {
    if (index < 0 || index >= store.tracks.length) return;
    const track = store.tracks[index]!;
    store.setCurrentIndex(index);
    await playTrack(track);
    const filtered = store.recentTracks.filter(t => !(t.bvid === track.bvid && t.cid === track.cid));
    store.setRecentTracks([track, ...filtered].slice(0, MAX_RECENT_TRACKS));
  };

  const handleInputSubmit = async (input: string) => {
    try {
      const isPlaylist = /medialist\/play\/dlista\/\d+\/\d+/.test(input) || /space\.bilibili\.com\/\d+\/favlist\?.*fid=\d+/.test(input);
      if (isPlaylist) await store.loadPlaylist(input);
      else {
        const bvidMatch = input.match(BV_RE);
        if (!bvidMatch) throw new Error('无效的BV号或链接');
        await store.loadVideo(bvidMatch[0]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      showNotification(`加载失败：${msg}`);
    }
  };

  const handleClearPlaylist = useCallback(() => {
    store.setTracks([]);
    store.setCurrentIndex(0);
    pauseAudioLocal();
    showNotification('播放列表已清空');
  }, [store, showNotification]);

  const handleReorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    store.reorderTracks(fromIndex, toIndex);
  }, [store]);

  const handleDeleteTrack = useCallback((index: number) => {
    const track = store.tracks[index];
    if (!track) return;

    const wasPlaying = index === store.currentIndex && playerState.isPlaying;
    const isLastTrack = store.tracks.length <= 1;

    store.deleteTrack(index);

    if (wasPlaying && isLastTrack) {
      pauseAudioLocal();
    } else if (wasPlaying) {
      const nextIndex = index < store.tracks.length - 1 ? index + 1 : index - 1;
      const nextTrack = store.tracks[nextIndex];
      if (nextTrack) playTrack(nextTrack);
    }
  }, [store.tracks, store.currentIndex, playerState.isPlaying, store.deleteTrack, playTrack]);

  const handleNextButton = async () => {
    const nextIndex = handleNext();
    if (nextIndex !== null && store.tracks[nextIndex]) {
      await playTrack(store.tracks[nextIndex]!);
    }
  };

  const handlePrevButton = async () => {
    const prevIndex = handlePrev();
    if (prevIndex !== null && store.tracks[prevIndex]) {
      await playTrack(store.tracks[prevIndex]!);
    }
  };

  const handleCreateFavorite = (name: string) => {
    store.setFavorites([...store.favorites, { id: Date.now().toString(), name, icon: '🎵', tracks: [], updatedAt: Date.now() }]);
  };

  const handleRemoveFromFavorite = useCallback((favId: string, trackIndex: number) => {
    store.removeTrackFromFavorite(favId, trackIndex);
  }, [store]);

  const handleDeleteFavorite = useCallback((favId: string) => {
    store.deleteFavorite(favId);
  }, [store]);

  const handleReorderFavTracks = useCallback((favId: string, fromIndex: number, toIndex: number) => {
    store.reorderFavoriteTracks(favId, fromIndex, toIndex);
  }, [store]);

  const handleAddToFavorite = useCallback((favId: string, track: Track) => {
    store.addTrackToFavorite(favId, track);
  }, [store]);

  const handleAddToFavoriteFromInput = useCallback(async (favId: string, input: string) => {
    try {
      const bvidMatch = input.match(BV_RE);
      if (!bvidMatch) throw new Error('无效的BV号或链接');
      const track = await store.loadVideo(bvidMatch[0]!);
      if (track) {
        store.addTrackToFavorite(favId, track);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '添加失败';
      showNotification(`添加失败：${msg}`);
    }
  }, [store, showNotification]);

  const handleToggleFavorite = useCallback((track: Track) => {
    // Check if already in any fav folder
    const isFav = store.favorites.some(f =>
      f.tracks.some(t => t.bvid === track.bvid && t.cid === track.cid)
    );

    if (isFav) {
      store.setFavorites(store.favorites.map(f => ({
        ...f,
        tracks: f.tracks.filter(t => !(t.bvid === track.bvid && t.cid === track.cid)),
        updatedAt: Date.now(),
      })));
      return;
    }

    if (store.favorites.length === 0) {
      const newFav = { id: Date.now().toString(), name: '默认收藏夹', icon: '♥', tracks: [track], updatedAt: Date.now() };
      store.setFavorites([newFav]);
      return;
    }

    store.setFavorites(store.favorites.map((f, i) =>
      i === 0
        ? { ...f, tracks: [...f.tracks, track], updatedAt: Date.now() }
        : f
    ));
  }, [store.favorites, store.setFavorites]);

  const handlePlayFromFavorite = useCallback(async (track: Track) => {
    const plIndex = store.tracks.findIndex(t => t.bvid === track.bvid && t.cid === track.cid);
    if (plIndex >= 0) {
      await handlePlayTrack(plIndex);
    } else {
      await addTrackToPlaylistAndPlay(track);
    }
  }, [store.tracks, handlePlayTrack, addTrackToPlaylistAndPlay]);

  return (
    <FloatingPlayer
      storage={{
        windowPosition: store.windowPosition,
        windowSize: store.windowSize,
        favorites: store.favorites,
        recentTracks: store.recentTracks,
        setWindowPosition: store.setWindowPosition,
        setWindowSize: store.setWindowSize,
      }}
      playerState={playerState}
      playlistState={{ tracks: store.tracks, currentIndex: store.currentIndex, playMode: store.playMode }}
      playerActions={{
        onPlayPause: handlePlayPause,
        onPrev: handlePrevButton,
        onNext: handleNextButton,
        onSeek: seek,
        onVolumeChange: volumeChange,
        onPlayModeChange: store.setPlayMode,
      }}
      playlistActions={{
        onPlayTrack: handlePlayTrack,
        onDeleteTrack: handleDeleteTrack,
        onClearPlaylist: handleClearPlaylist,
        onReorderTracks: handleReorderTracks,
      }}
      favoriteActions={{
        onCreateFavorite: handleCreateFavorite,
        onToggleFavorite: handleToggleFavorite,
        onAddToFavorite: handleAddToFavorite,
        onAddToFavoriteFromInput: handleAddToFavoriteFromInput,
        onPlayFromFavorite: handlePlayFromFavorite,
        onRemoveFromFavorite: handleRemoveFromFavorite,
        onDeleteFavorite: handleDeleteFavorite,
        onReorderFavTracks: handleReorderFavTracks,
      }}
      onInputSubmit={handleInputSubmit}
      loading={store.loading}
      notification={notification}
    />
  );
}

export default App;
