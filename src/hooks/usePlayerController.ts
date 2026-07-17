import { useCallback, useMemo, useState } from 'react';
import type { Track, CurrentAudio, PlayMode } from '@/types';
import { pauseAudioLocal, resumeAudioLocal, getVideoInfo, getPlaylist } from '@/services/api';
import { parseInput } from '@/utils/bilibili';

interface PlaylistStore {
  tracks: Track[];
  currentIndex: number;
  playMode: PlayMode;
  setTracks: (tracks: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  addTrack: (track: Track) => void;
  deleteTrack: (index: number) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
}

interface RecentStore {
  recentTracks: Track[];
  addRecentTrack: (track: Track) => void;
}

interface UsePlayerControllerOpts {
  playlist: PlaylistStore;
  recent: RecentStore;
  currentAudio: CurrentAudio | null;
  isPlaying: boolean;
  playTrack: (track: Track) => Promise<boolean>;
  playPause: () => void;
  showNotification: (msg: string) => void;
}

export function usePlayerController({
  playlist,
  recent,
  currentAudio,
  isPlaying,
  playTrack,
  playPause,
  showNotification,
}: UsePlayerControllerOpts) {
  const [loading, setLoading] = useState(false);

  const handlePlayPause = useCallback(() => {
    if (!currentAudio && playlist.tracks[playlist.currentIndex]) {
      const track = playlist.tracks[playlist.currentIndex]!;
      playTrack(track);
    } else if (isPlaying) {
      playPause();
    } else {
      resumeAudioLocal();
    }
  }, [currentAudio, playlist.tracks, playlist.currentIndex, isPlaying, playTrack, playPause]);

  const addTrackToPlaylistAndPlay = useCallback(async (track: Track) => {
    const newIndex = playlist.tracks.length;
    playlist.setTracks([...playlist.tracks, track]);
    playlist.setCurrentIndex(newIndex);
    await playTrack(track);
    recent.addRecentTrack(track);
  }, [playlist, playTrack, recent]);

  const handlePlayTrack = useCallback(async (index: number) => {
    if (index < 0 || index >= playlist.tracks.length) return;
    const track = playlist.tracks[index]!;
    playlist.setCurrentIndex(index);
    const ok = await playTrack(track);
    if (ok) {
      recent.addRecentTrack(track);
    } else {
      showNotification('播放失败，请稍后重试');
    }
  }, [playlist, playTrack, recent, showNotification]);

  const handleDeleteTrack = useCallback((index: number) => {
    const track = playlist.tracks[index];
    if (!track) return;

    const wasPlaying = index === playlist.currentIndex && isPlaying;
    const isLastTrack = playlist.tracks.length <= 1;
    const remaining = playlist.tracks.length - 1;

    // 在删除前算好下一首要播的曲目（删除后 zustand 闭包里的 tracks 还是旧的）
    let nextTrack: Track | undefined;
    if (wasPlaying && !isLastTrack) {
      const nextIndex = index < remaining ? index : index - 1;
      nextTrack = playlist.tracks[nextIndex];
    }

    playlist.deleteTrack(index);

    if (wasPlaying && isLastTrack) {
      pauseAudioLocal();
    } else if (nextTrack) {
      playTrack(nextTrack);
    }
  }, [playlist.tracks, playlist.currentIndex, isPlaying, playlist.deleteTrack, playTrack]);

  const handleClearPlaylist = useCallback(() => {
    playlist.setTracks([]);
    playlist.setCurrentIndex(0);
    pauseAudioLocal();
    showNotification('播放列表已清空');
  }, [playlist, showNotification]);

  const handleReorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    playlist.reorderTracks(fromIndex, toIndex);
  }, [playlist]);

  const handleInputSubmit = useCallback(async (input: string) => {
    try {
      const parsed = parseInput(input);
      if (!parsed) throw new Error('无效的BV号或链接');
      setLoading(true);
      try {
        if (parsed.type === 'playlist') {
          const res = await getPlaylist(parsed.url);
          if (!res.success) throw new Error(res.error);
          const tracks = res.data;
          const existing = new Set(playlist.tracks.map(t => t.bvid));
          const newTracks = tracks.filter(t => !existing.has(t.bvid));
          playlist.setTracks([...playlist.tracks, ...newTracks]);
        } else {
          const res = await getVideoInfo(parsed.bvid);
          if (!res.success) throw new Error(res.error);
          const track = res.data;
          playlist.addTrack(track);
        }
      } finally {
        setLoading(false);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      showNotification(`加载失败：${msg}`);
    }
  }, [playlist, setLoading, showNotification]);
  // setLoading is stable (useState dispatch), safe to include

  const handleNextButton = useCallback(async () => {
    if (playlist.tracks.length === 0) return;
    const total = playlist.tracks.length;
    // 最多尝试所有曲目一次，避免无限循环
    for (let attempt = 0; attempt < total; attempt++) {
      let nextIndex: number;
      if (playlist.playMode === 'single') {
        nextIndex = playlist.currentIndex;
      } else if (playlist.playMode === 'shuffle') {
        if (total === 1) {
          nextIndex = 0;
        } else {
          do {
            nextIndex = Math.floor(Math.random() * total);
          } while (nextIndex === playlist.currentIndex);
        }
      } else {
        nextIndex = (playlist.currentIndex + 1 + attempt) % total;
      }
      const track = playlist.tracks[nextIndex];
      if (!track) return;
      const ok = await playTrack(track);
      if (ok) {
        playlist.setCurrentIndex(nextIndex);
        return;
      }
    }
    showNotification('所有曲目播放失败');
  }, [playlist.currentIndex, playlist.playMode, playlist.tracks, playTrack, showNotification]);

  const handlePrevButton = useCallback(async () => {
    if (playlist.tracks.length === 0) return;
    const prevIndex = playlist.currentIndex - 1 < 0 ? playlist.tracks.length - 1 : playlist.currentIndex - 1;
    const track = playlist.tracks[prevIndex];
    if (!track) return;
    const ok = await playTrack(track);
    if (ok) {
      playlist.setCurrentIndex(prevIndex);
    } else {
      showNotification('播放失败，请稍后重试');
    }
  }, [playlist.currentIndex, playlist.tracks, playTrack, showNotification]);

  return useMemo(() => ({
    handlePlayPause,
    handleNextButton,
    handlePrevButton,
    handlePlayTrack,
    handleDeleteTrack,
    handleClearPlaylist,
    handleReorderTracks,
    handleInputSubmit,
    addTrackToPlaylistAndPlay,
    loading,
  }), [
    handlePlayPause,
    handleNextButton,
    handlePrevButton,
    handlePlayTrack,
    handleDeleteTrack,
    handleClearPlaylist,
    handleReorderTracks,
    handleInputSubmit,
    addTrackToPlaylistAndPlay,
    loading,
  ]);
}
