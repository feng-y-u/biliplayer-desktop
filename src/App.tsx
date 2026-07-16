import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { usePlaylistStore } from './stores/playlistStore';
import { useFavoritesStore } from './stores/favoritesStore';
import { useWindowStore } from './stores/windowStore';
import { useRecentStore } from './stores/recentStore';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { usePlayerController } from './hooks/usePlayerController';
import { useFavoriteActions } from './hooks/useFavoriteActions';
import FloatingPlayer from '@/components/floating-player/FloatingPlayer';
import { PlayerContext } from './contexts/PlayerContext';
import { usePlayerContextValue } from './contexts/usePlayerContextValue';

const NOTIFICATION_TIMEOUT_MS = 3000;

function App() {      //数据
  const playlist = usePlaylistStore();        //播放列表store
  const favorites = useFavoritesStore();      //收藏夹store
  const windowStore = useWindowStore();     //窗口store
  const recent = useRecentStore();      //最近播放store
  const [notification, setNotification] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  //启动时从磁盘恢复数据
  useEffect(() => {
    (async () => {
      await Promise.all([
        windowStore.loadFromStore(),
        recent.loadFromStore(),
      ]);
      const api = window.electronAPI;
      if (api) {
        const storedTracks = await api.storeGet('playlistTracks');
        const storedIndex = await api.storeGet('playlistIndex');
        if (storedTracks) {
          playlist.setTracks(storedTracks);
          playlist.setCurrentIndex(storedIndex ?? 0);
        }
        const mode = await api.storeGet('playMode');
        if (mode) playlist.setPlayMode(mode);
        const favs = await api.storeGet('favorites');
        if (favs) favorites.setFavorites(favs);
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT_MS);
  }, []);

  const { state: playerState, playPause, playTrack, seek, volumeChange, syncVolume } = useAudioPlayer(() => {
    playerCtrl.handleNextButton();
  });

  useEffect(() => {
    syncVolume(windowStore.volume);
  }, [windowStore.volume, syncVolume]);

  const autoLoaded = useRef(false);
  useEffect(() => {
    if (!autoLoaded.current && playlist.tracks.length > 0 && playlist.tracks[playlist.currentIndex]) {
      autoLoaded.current = true;
      const track = playlist.tracks[playlist.currentIndex]!;
      import('./services/api').then(api => api.loadAudioTrack(track.bvid, track.cid));
    }
  }, [playlist.tracks, playlist.currentIndex]);

  const playerCtrl = usePlayerController({
    playlist,
    recent,
    currentAudio: playerState.currentAudio,
    isPlaying: playerState.isPlaying,
    playTrack,
    playPause,
    showNotification,
  });

  const favActions = useFavoriteActions({
    favorites,
    playlistTracks: playlist.tracks,
    setPlaylistTracks: playlist.setTracks,
    handlePlayTrack: playerCtrl.handlePlayTrack,
    addTrackToPlaylistAndPlay: playerCtrl.addTrackToPlaylistAndPlay,
    showNotification,
  });

  const playerContextValue = usePlayerContextValue({
    playerCtrl,
    favActions,
    seek,
    volumeChange,
    setPlayMode: playlist.setPlayMode,
    notification,
  });

  const storage = useMemo(() => ({
    windowPosition: windowStore.windowPosition,
    windowSize: windowStore.windowSize,
    expandedPanelSize: windowStore.expandedPanelSize,
    favorites: favorites.favorites,
    recentTracks: recent.recentTracks,
    setWindowPosition: windowStore.setWindowPosition,
    setWindowSize: windowStore.setWindowSize,
    setExpandedPanelSize: windowStore.setExpandedPanelSize,
  }), [
    windowStore.windowPosition,
    windowStore.windowSize,
    windowStore.expandedPanelSize,
    favorites.favorites,
    recent.recentTracks,
    windowStore.setWindowPosition,
    windowStore.setWindowSize,
    windowStore.setExpandedPanelSize,
  ]);

  return (
    <PlayerContext.Provider value={playerContextValue}>
      {ready && (
        <FloatingPlayer
          storage={storage}
          playerState={playerState}
          playlistState={{ tracks: playlist.tracks, currentIndex: playlist.currentIndex, playMode: playlist.playMode }}
        />
      )}
    </PlayerContext.Provider>
  );
}

export default App;
