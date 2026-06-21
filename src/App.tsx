import { useEffect, useCallback, useRef, useState } from 'react';
import { usePlaylistStore } from './stores/playlistStore';
import { useFavoritesStore } from './stores/favoritesStore';
import { useWindowStore } from './stores/windowStore';
import { useRecentStore } from './stores/recentStore';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import FloatingPlayer from '@/components/floating-player/FloatingPlayer';
import type { Track } from '@/types';
import { pauseAudioLocal, getVideoInfo, getPlaylist } from './services/api';
import { isSameTrack, isTrackFavorited } from './utils/track';

const BV_RE = /BV[a-zA-Z0-9]+/i;
const PLAYLIST_RE = /medialist\/play\/dlista\/\d+\/\d+|space\.bilibili\.com\/\d+\/favlist\?.*fid=\d+/;

function parseInput(input: string): { type: 'playlist'; url: string } | { type: 'bvid'; bvid: string } | null {
  if (PLAYLIST_RE.test(input)) return { type: 'playlist', url: input };
  const m = input.match(BV_RE);
  if (m) return { type: 'bvid', bvid: m[0] };
  return null;
}
const NOTIFICATION_TIMEOUT_MS = 3000;

function App() {
  const playlist = usePlaylistStore();
  const favorites = useFavoritesStore();
  const windowStore = useWindowStore();
  const recent = useRecentStore();
  const [notification, setNotification] = useState<string | null>(null);

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

  const handleNext = () => {
    if (playlist.tracks.length === 0) return null;
    let nextIndex: number;
    if (playlist.playMode === 'single') nextIndex = playlist.currentIndex;
    else if (playlist.playMode === 'shuffle') nextIndex = Math.floor(Math.random() * playlist.tracks.length);
    else nextIndex = (playlist.currentIndex + 1) % playlist.tracks.length;
    playlist.setCurrentIndex(nextIndex);
    return nextIndex;
  };

  const handlePrev = () => {
    if (playlist.tracks.length === 0) return null;
    const prevIndex = playlist.currentIndex - 1 < 0 ? playlist.tracks.length - 1 : playlist.currentIndex - 1;
    playlist.setCurrentIndex(prevIndex);
    return prevIndex;
  };

  const { state: playerState, playPause, playTrack, seek, volumeChange, syncVolume } = useAudioPlayer(() => {
    const nextIndex = handleNext();
    if (nextIndex !== null && playlist.tracks[nextIndex]) {
      const track = playlist.tracks[nextIndex]!;
      playTrack(track).then(ok => {
        if (!ok) setTimeout(() => playTrack(track), 1000);
      });
    }
  });

  const handlePlayPause = useCallback(() => {
    if (!playerState.currentAudio && playlist.tracks[playlist.currentIndex]) {
      playTrack(playlist.tracks[playlist.currentIndex]!);
    } else {
      playPause();
    }
  }, [playerState.currentAudio, playlist.tracks, playlist.currentIndex, playTrack, playPause]);

  const addTrackToPlaylistAndPlay = useCallback(async (track: Track) => {
    const newIndex = playlist.tracks.length;
    playlist.setTracks([...playlist.tracks, track]);
    playlist.setCurrentIndex(newIndex);
    await playTrack(track);
    recent.addRecentTrack(track);
  }, [playlist, playTrack, recent]);

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

  const handlePlayTrack = async (index: number) => {
    if (index < 0 || index >= playlist.tracks.length) return;
    const track = playlist.tracks[index]!;
    playlist.setCurrentIndex(index);
    await playTrack(track);
    recent.addRecentTrack(track);
  };

  const handleInputSubmit = async (input: string) => {
    try {
      const parsed = parseInput(input);
      if (!parsed) throw new Error('无效的BV号或链接');
      playlist.setLoading(true);
      try {
        if (parsed.type === 'playlist') {
          const res = await getPlaylist(parsed.url);
          if (!res.success) throw new Error(res.error);
          const data = res.data as unknown as Track[];
          const existing = new Set(playlist.tracks.map(t => t.bvid));
          const newTracks = data.filter(t => !existing.has(t.bvid));
          playlist.setTracks([...playlist.tracks, ...newTracks]);
        } else {
          const res = await getVideoInfo(parsed.bvid);
          if (!res.success) throw new Error(res.error);
          const track = res.data as unknown as Track;
          playlist.addTrack(track);
        }
      } finally {
        playlist.setLoading(false);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      showNotification(`加载失败：${msg}`);
    }
  };

  const handleClearPlaylist = useCallback(() => {
    playlist.setTracks([]);
    playlist.setCurrentIndex(0);
    pauseAudioLocal();
    showNotification('播放列表已清空');
  }, [playlist, showNotification]);

  const handleReorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    playlist.reorderTracks(fromIndex, toIndex);
  }, [playlist]);

  const handleDeleteTrack = useCallback((index: number) => {
    const track = playlist.tracks[index];
    if (!track) return;

    const wasPlaying = index === playlist.currentIndex && playerState.isPlaying;
    const isLastTrack = playlist.tracks.length <= 1;

    playlist.deleteTrack(index);

    if (wasPlaying && isLastTrack) {
      pauseAudioLocal();
    } else if (wasPlaying) {
      const nextIndex = index < playlist.tracks.length - 1 ? index + 1 : index - 1;
      const nextTrack = playlist.tracks[nextIndex];
      if (nextTrack) playTrack(nextTrack);
    }
  }, [playlist.tracks, playlist.currentIndex, playerState.isPlaying, playlist.deleteTrack, playTrack]);

  const handleNextButton = async () => {
    const nextIndex = handleNext();
    if (nextIndex !== null && playlist.tracks[nextIndex]) {
      await playTrack(playlist.tracks[nextIndex]!);
    }
  };

  const handlePrevButton = async () => {
    const prevIndex = handlePrev();
    if (prevIndex !== null && playlist.tracks[prevIndex]) {
      await playTrack(playlist.tracks[prevIndex]!);
    }
  };

  const handleCreateFavorite = (name: string) => {
    favorites.setFavorites([...favorites.favorites, { id: Date.now().toString(), name, icon: '🎵', tracks: [], updatedAt: Date.now() }]);
  };

  const handleRemoveFromFavorite = useCallback((favId: string, trackIndex: number) => {
    favorites.removeTrackFromFavorite(favId, trackIndex);
  }, [favorites]);

  const handleDeleteFavorite = useCallback((favId: string) => {
    favorites.deleteFavorite(favId);
  }, [favorites]);

  const handleReorderFavTracks = useCallback((favId: string, fromIndex: number, toIndex: number) => {
    favorites.reorderFavoriteTracks(favId, fromIndex, toIndex);
  }, [favorites]);

  const handleAddToFavorite = useCallback((favId: string, track: Track) => {
    favorites.addTrackToFavorite(favId, track);
  }, [favorites]);

  const handleAddToFavoriteFromInput = useCallback(async (favId: string, input: string) => {
    try {
      const parsed = parseInput(input);
      if (!parsed) throw new Error('无效的BV号或链接');
      if (parsed.type === 'playlist') {
        const res = await getPlaylist(parsed.url);
        if (!res.success) throw new Error(res.error);
        const tracks = res.data as unknown as Track[];
        for (const track of tracks) {
          favorites.addTrackToFavorite(favId, track);
        }
        showNotification(`已添加 ${tracks.length} 首歌曲到收藏夹`);
      } else {
        const res = await getVideoInfo(parsed.bvid);
        if (!res.success) throw new Error(res.error);
        const track = res.data as unknown as Track;
        favorites.addTrackToFavorite(favId, track);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '添加失败';
      showNotification(`添加失败：${msg}`);
    }
  }, [favorites, showNotification]);

  const handleAddAllToPlaylist = useCallback((tracks: Track[]) => {
    const existing = new Set(playlist.tracks.map(t => t.bvid));
    const newTracks = tracks.filter(t => !existing.has(t.bvid));
    if (newTracks.length === 0) {
      showNotification('所有歌曲已在播放列表中');
      return;
    }
    playlist.setTracks([...playlist.tracks, ...newTracks]);
    showNotification(`已添加 ${newTracks.length} 首歌曲到播放列表`);
  }, [playlist, showNotification]);

  const handleToggleFavorite = useCallback((track: Track) => {
    if (isTrackFavorited(track, favorites.favorites)) {
      favorites.setFavorites(favorites.favorites.map(f => ({
        ...f,
        tracks: f.tracks.filter(t => !isSameTrack(t, track)),
        updatedAt: Date.now(),
      })));
      return;
    }

    if (favorites.favorites.length === 0) {
      const newFav = { id: Date.now().toString(), name: '默认收藏夹', icon: '♥', tracks: [track], updatedAt: Date.now() };
      favorites.setFavorites([newFav]);
      return;
    }

    favorites.setFavorites(favorites.favorites.map((f, i) =>
      i === 0
        ? { ...f, tracks: [...f.tracks, track], updatedAt: Date.now() }
        : f
    ));
  }, [favorites.favorites, favorites.setFavorites]);

  const handlePlayFromFavorite = useCallback(async (track: Track) => {
    const plIndex = playlist.tracks.findIndex(t => isSameTrack(t, track));
    if (plIndex >= 0) {
      await handlePlayTrack(plIndex);
    } else {
      await addTrackToPlaylistAndPlay(track);
    }
  }, [playlist.tracks, handlePlayTrack, addTrackToPlaylistAndPlay]);

  return (
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
        onPlayPause: handlePlayPause,
        onPrev: handlePrevButton,
        onNext: handleNextButton,
        onSeek: seek,
        onVolumeChange: volumeChange,
        onPlayModeChange: playlist.setPlayMode,
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
        onAddAllToPlaylist: handleAddAllToPlaylist,
      }}
      onInputSubmit={handleInputSubmit}
      loading={playlist.loading}
      notification={notification}
    />
  );
}

export default App;
