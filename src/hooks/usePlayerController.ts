import { useCallback, useMemo, useRef, useState } from 'react';
import type { Track, CurrentAudio, PlayMode } from '@/types';
import { getVideoInfo, getPlaylist, getFavList, getSeriesList, getColleList } from '@/services/api';
import { getAudioEngine } from '@/services/audioEngine';
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
  onPlayErrorNeedLogin?: () => void;
}

export function usePlayerController({
  playlist,
  recent,
  currentAudio,
  isPlaying,
  playTrack,
  playPause,
  showNotification,
  onPlayErrorNeedLogin,
}: UsePlayerControllerOpts) {
  const [loading, setLoading] = useState(false);
  const nextInFlightRef = useRef(false);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      playPause();
      return;
    }
    const track: Track | undefined =
      playlist.tracks[playlist.currentIndex] ?? (currentAudio ? { ...currentAudio } : undefined);
    if (!track) return;
    const engine = getAudioEngine();
    if (engine.canResume(track.bvid, track.cid)) {
      void engine.resume().then((ok) => {
        if (!ok) void playTrack(track);
      });
    } else {
      void playTrack(track);
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
    // 与下一首共用防重入，避免加载中点列表再触发并发 play
    if (nextInFlightRef.current) return;
    nextInFlightRef.current = true;
    try {
      const track = playlist.tracks[index]!;
      playlist.setCurrentIndex(index);
      const ok = await playTrack(track);
      if (ok) {
        recent.addRecentTrack(track);
      } else {
        showNotification('播放失败，请稍后重试');
        onPlayErrorNeedLogin?.();
      }
    } finally {
      nextInFlightRef.current = false;
    }
  }, [playlist, playTrack, recent, showNotification, onPlayErrorNeedLogin]);

  const handleDeleteTrack = useCallback((index: number) => {
    const track = playlist.tracks[index];
    if (!track) return;

    const engine = getAudioEngine();
    const wasPlaying = index === playlist.currentIndex && isPlaying;
    const isLastTrack = playlist.tracks.length <= 1;
    const remaining = playlist.tracks.length - 1;

    let nextTrack: Track | undefined;
    if (wasPlaying && !isLastTrack) {
      const nextIndex = index < remaining ? index : index - 1;
      nextTrack = playlist.tracks[nextIndex];
    }

    playlist.deleteTrack(index);

    if (wasPlaying && isLastTrack) {
      engine.pause();
    } else if (nextTrack) {
      playTrack(nextTrack);
    }
  }, [playlist.tracks, playlist.currentIndex, isPlaying, playlist.deleteTrack, playTrack]);

  const handleClearPlaylist = useCallback(() => {
    playlist.setTracks([]);
    playlist.setCurrentIndex(0);
    getAudioEngine().pause();
    showNotification('播放列表已清空');
  }, [playlist, showNotification]);

  const handleReorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    playlist.reorderTracks(fromIndex, toIndex);
  }, [playlist]);

  const handleInputSubmit = useCallback(async (input: string) => {
    try {
      const parsed = parseInput(input);
      if (!parsed) throw new Error('请输入 B站视频 BV 号、分享链接、收藏夹链接、收藏夹ID 或合集链接');
      setLoading(true);
      try {
        if (parsed.type === 'bvid') {
          const res = await getVideoInfo(parsed.bvid);
          if (!res.success) throw new Error(res.error);
          playlist.addTrack(res.data);
        } else if (parsed.type === 'favId') {
          const res = await getFavList(parsed.id);
          if (!res.success) throw new Error(res.error);
          const existing = new Set(playlist.tracks.map(t => `${t.bvid}:${t.cid}`));
          const newTracks = res.data.filter(t => !existing.has(`${t.bvid}:${t.cid}`));
          playlist.setTracks([...playlist.tracks, ...newTracks]);
        } else if (parsed.type === 'series') {
          const res = await getSeriesList(parsed.mid, parsed.sid);
          if (!res.success) throw new Error(res.error);
          const existing = new Set(playlist.tracks.map(t => `${t.bvid}:${t.cid}`));
          const newTracks = res.data.filter(t => !existing.has(`${t.bvid}:${t.cid}`));
          playlist.setTracks([...playlist.tracks, ...newTracks]);
        } else if (parsed.type === 'collection') {
          const res = await getColleList(parsed.mid, parsed.sid);
          if (!res.success) throw new Error(res.error);
          const existing = new Set(playlist.tracks.map(t => `${t.bvid}:${t.cid}`));
          const newTracks = res.data.filter(t => !existing.has(`${t.bvid}:${t.cid}`));
          playlist.setTracks([...playlist.tracks, ...newTracks]);
        } else {
          const res = await getPlaylist(parsed.url);
          if (!res.success) throw new Error(res.error);
          const existing = new Set(playlist.tracks.map(t => t.bvid));
          const newTracks = res.data.filter(t => !existing.has(t.bvid));
          playlist.setTracks([...playlist.tracks, ...newTracks]);
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
    // 防重入：error 与 play 失败曾同时触发 next，导致并发抢 audioEl、整表失败
    if (nextInFlightRef.current) return;
    nextInFlightRef.current = true;
    try {
      const total = playlist.tracks.length;
      const startIndex = playlist.currentIndex;
      // 最多尝试所有曲目一次，避免无限循环
      for (let attempt = 0; attempt < total; attempt++) {
        let nextIndex: number;
        if (playlist.playMode === 'single') {
          nextIndex = startIndex;
        } else if (playlist.playMode === 'shuffle') {
          if (total === 1) {
            nextIndex = 0;
          } else {
            do {
              nextIndex = Math.floor(Math.random() * total);
            } while (nextIndex === startIndex && total > 1);
            // 后续 attempt 避开已失败的 startIndex；随机即可
            if (attempt > 0) {
              nextIndex = (startIndex + 1 + attempt) % total;
            }
          }
        } else {
          nextIndex = (startIndex + 1 + attempt) % total;
        }
        const track = playlist.tracks[nextIndex];
        if (!track) return;
        // 先更新列表高亮，避免加载期间 UI 仍停在上一首
        playlist.setCurrentIndex(nextIndex);
        const ok = await playTrack(track);
        if (ok) return;
      }
      showNotification('所有曲目播放失败');
    } finally {
      nextInFlightRef.current = false;
    }
  }, [playlist.currentIndex, playlist.playMode, playlist.tracks, playTrack, showNotification]);

  const handlePrevButton = useCallback(async () => {
    if (playlist.tracks.length === 0) return;
    const prevIndex = playlist.currentIndex - 1 < 0 ? playlist.tracks.length - 1 : playlist.currentIndex - 1;
    const track = playlist.tracks[prevIndex];
    if (!track) return;
    playlist.setCurrentIndex(prevIndex);
    const ok = await playTrack(track);
    if (!ok) {
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
