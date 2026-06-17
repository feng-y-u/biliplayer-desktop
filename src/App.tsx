import { useEffect, useCallback, useRef } from 'react';
import { usePlayerStore } from './hooks/usePlayerStore';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import FloatingPlayer from '@/components/floating-player/FloatingPlayer';
import type { Track } from '@/types';

function App() {
  const store = usePlayerStore();

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
    store.setRecentTracks([track, ...filtered].slice(0, 50));
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
      import('./services/api').then(m => m.loadAudioTrack(track.bvid, track.cid));
    }
  }, [store.tracks, store.currentIndex]);

  const handlePlayTrack = async (index: number) => {
    if (index < 0 || index >= store.tracks.length) return;
    const track = store.tracks[index]!;
    store.setCurrentIndex(index);
    await playTrack(track);
    const filtered = store.recentTracks.filter(t => !(t.bvid === track.bvid && t.cid === track.cid));
    store.setRecentTracks([track, ...filtered].slice(0, 50));
  };

  const handleInputSubmit = async (input: string) => {
    try {
      const isPlaylist = /medialist\/play\/dlista\/\d+\/\d+/.test(input) || /space\.bilibili\.com\/\d+\/favlist\?.*fid=\d+/.test(input);
      if (isPlaylist) await store.loadPlaylist(input);
      else {
        const bvidMatch = input.match(/BV[a-zA-Z0-9]+/i);
        if (!bvidMatch) throw new Error('无效的BV号或链接');
        await store.loadVideo(bvidMatch[0]);
      }
    } catch (e) { console.error('加载失败:', e); }
  };

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

  const handleToggleFavorite = useCallback((track: Track) => {
    // Check if already in any fav folder
    const isFav = store.favorites.some(f =>
      f.tracks.some(t => t.bvid === track.bvid && t.cid === track.cid)
    );
    if (isFav) {
      // Remove from all folders
      store.setFavorites(store.favorites.map(f => ({
        ...f,
        tracks: f.tracks.filter(t => !(t.bvid === track.bvid && t.cid === track.cid)),
        updatedAt: Date.now(),
      })));
    } else {
      // Add to the first folder (or create "默认收藏夹")
      if (store.favorites.length === 0) {
        const newFav = { id: Date.now().toString(), name: '默认收藏夹', icon: '♥', tracks: [track], updatedAt: Date.now() };
        store.setFavorites([newFav]);
      } else {
        store.setFavorites(store.favorites.map((f, i) =>
          i === 0
            ? { ...f, tracks: [...f.tracks, track], updatedAt: Date.now() }
            : f
        ));
      }
    }
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
        volume: store.volume,
        playMode: store.playMode,
        tracks: store.tracks,
        currentIndex: store.currentIndex,
        windowPosition: store.windowPosition,
        windowSize: store.windowSize,
        favorites: store.favorites,
        recentTracks: store.recentTracks,
        setVolume: store.setVolume,
        setPlayMode: store.setPlayMode,
        setTracks: store.setTracks,
        setCurrentIndex: store.setCurrentIndex,
        setWindowPosition: store.setWindowPosition,
        setWindowSize: store.setWindowSize,
      }}
      playerState={{ ...playerState, currentAudio: store.tracks[store.currentIndex] || null }}
      playlistState={{ tracks: store.tracks, currentIndex: store.currentIndex, playMode: store.playMode }}
      onPlayPause={handlePlayPause}
      onPlayTrack={handlePlayTrack}
      onPrev={handlePrevButton}
      onNext={handleNextButton}
      onSeek={seek}
      onVolumeChange={volumeChange}
      onDeleteTrack={store.deleteTrack}
      onMoveTrackUp={store.moveTrackUp}
      onPlayModeChange={store.setPlayMode}
      onInputSubmit={handleInputSubmit}
      loading={store.loading}
      onCreateFavorite={handleCreateFavorite}
      onToggleFavorite={handleToggleFavorite}
      onPlayFromFavorite={handlePlayFromFavorite}
    />
  );
}

export default App;
