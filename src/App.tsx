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

const NOTIFICATION_TIMEOUT_MS = 3000;

function App() {      //数据
  const playlist = usePlaylistStore();        //播放列表store
  const favorites = useFavoritesStore();      //收藏夹store
  const windowStore = useWindowStore();     //窗口store
  const recent = useRecentStore();      //最近播放store
  const [notification, setNotification] = useState<string | null>(null);

  //启动时从磁盘恢复数据
  useEffect(() => {
    windowStore.loadFromStore();
    recent.loadFromStore();
    (async () => {
      const api = window.electronAPI;
      if (!api) return;
      const stored = await api.storeGet('playlist');
      if (stored?.tracks) {
        playlist.setTracks(stored.tracks);
        playlist.setCurrentIndex(stored.currentIndex ?? 0);
      }
      const mode = await api.storeGet('playMode');
      if (mode) playlist.setPlayMode(mode);
      const favs = await api.storeGet('favorites');
      if (favs) favorites.setFavorites(favs);
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

  const playerContextValue = useMemo(() => ({
    onPlayPause: playerCtrl.handlePlayPause,
    onPrev: playerCtrl.handlePrevButton,
    onNext: playerCtrl.handleNextButton,
    onSeek: seek,
    onVolumeChange: volumeChange,
    onPlayModeChange: playlist.setPlayMode,
    onPlayTrack: playerCtrl.handlePlayTrack,
    onDeleteTrack: playerCtrl.handleDeleteTrack,
    onClearPlaylist: playerCtrl.handleClearPlaylist,
    onReorderTracks: playerCtrl.handleReorderTracks,
    onCreateFavorite: favActions.handleCreateFavorite,
    onToggleFavorite: favActions.handleToggleFavorite,
    onAddToFavorite: favActions.handleAddToFavorite,
    onAddToFavoriteFromInput: favActions.handleAddToFavoriteFromInput,
    onPlayFromFavorite: favActions.handlePlayFromFavorite,
    onRemoveFromFavorite: favActions.handleRemoveFromFavorite,
    onDeleteFavorite: favActions.handleDeleteFavorite,
    onReorderFavTracks: favActions.handleReorderFavTracks,
    onAddAllToPlaylist: favActions.handleAddAllToPlaylist,
    onInputSubmit: playerCtrl.handleInputSubmit,
    loading: playerCtrl.loading,
    notification,
  }), [playerCtrl, favActions, seek, volumeChange, playlist.setPlayMode, notification]);

  return (
    <PlayerContext.Provider value={playerContextValue}>
      <FloatingPlayer
        storage={{
          windowPosition: windowStore.windowPosition,
          windowSize: windowStore.windowSize,
          favorites: favorites.favorites,
          recentTracks: recent.recentTracks,
          setWindowPosition: windowStore.setWindowPosition,
          setWindowSize: windowStore.setWindowSize,
        }}
        playerState={playerState}
        playlistState={{ tracks: playlist.tracks, currentIndex: playlist.currentIndex, playMode: playlist.playMode }}
        playerActions={{
          onPlayPause: playerCtrl.handlePlayPause,
          onPrev: playerCtrl.handlePrevButton,
          onNext: playerCtrl.handleNextButton,
          onSeek: seek,
          onVolumeChange: volumeChange,
          onPlayModeChange: playlist.setPlayMode,
        }}
        playlistActions={{
          onPlayTrack: playerCtrl.handlePlayTrack,
          onDeleteTrack: playerCtrl.handleDeleteTrack,
          onClearPlaylist: playerCtrl.handleClearPlaylist,
          onReorderTracks: playerCtrl.handleReorderTracks,
        }}
        favoriteActions={{
          onCreateFavorite: favActions.handleCreateFavorite,
          onToggleFavorite: favActions.handleToggleFavorite,
          onAddToFavorite: favActions.handleAddToFavorite,
          onAddToFavoriteFromInput: favActions.handleAddToFavoriteFromInput,
          onPlayFromFavorite: favActions.handlePlayFromFavorite,
          onRemoveFromFavorite: favActions.handleRemoveFromFavorite,
          onDeleteFavorite: favActions.handleDeleteFavorite,
          onReorderFavTracks: favActions.handleReorderFavTracks,
          onAddAllToPlaylist: favActions.handleAddAllToPlaylist,
        }}
        onInputSubmit={playerCtrl.handleInputSubmit}
        loading={playerCtrl.loading}
        notification={notification}
      />
    </PlayerContext.Provider>
  );
}

export default App;
