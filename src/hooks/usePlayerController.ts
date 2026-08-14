import { useCallback, useMemo, useRef, useState } from 'react';
import type { Track, CurrentAudio, PlayMode } from '@/types';
import { getVideoInfo, getPlaylist, getFavList, getSeriesList, getColleList } from '@/services/api';
import { getAudioEngine } from '@/services/audioEngine';
import { parseInput } from '@/utils/bilibili';
import { mergeUniqueTracks } from '@/utils/track';

/** 播放前确保 cid 可用：收藏夹接口不返回 cid（曲目 cid=0），按需调 view 接口补齐。 */
async function ensureTrackCid(track: Track): Promise<Track> {
  if (track.cid) return track;
  const res = await getVideoInfo(track.bvid);
  if (!res.success) throw new Error(res.error);
  return { ...track, cid: res.data.cid, duration: res.data.duration || track.duration };
}

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

  /** 播放成功后后台预取下一首的 cid，切歌时无需再等 view 接口。 */
  const prefetchNextCid = useCallback((currentIndex: number) => {
    const idx = currentIndex + 1;
    const track = playlist.tracks[idx];
    if (!track || track.cid) return;
    void getVideoInfo(track.bvid).then((res) => {
      if (!res.success) return;
      const list = playlist.tracks;
      if (idx >= list.length || list[idx]?.bvid !== track.bvid || list[idx]!.cid) return;
      const next = [...list];
      next[idx] = { ...next[idx]!, cid: res.data.cid, duration: res.data.duration || next[idx]!.duration };
      playlist.setTracks(next);
    });
  }, [playlist.tracks, playlist]);

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
      void (async () => {
        try {
          const playable = await ensureTrackCid(track);
          if (playable.cid !== track.cid && playlist.tracks[playlist.currentIndex]?.bvid === track.bvid) {
            const next = [...playlist.tracks];
            next[playlist.currentIndex] = playable;
            playlist.setTracks(next);
          }
          await playTrack(playable);
        } catch {
          showNotification('获取视频信息失败，请稍后重试');
        }
      })();
    }
  }, [currentAudio, playlist.tracks, playlist.currentIndex, isPlaying, playTrack, playPause, showNotification]);

  const addTrackToPlaylistAndPlay = useCallback(async (track: Track) => {
    let playable: Track;
    try {
      playable = await ensureTrackCid(track);
    } catch {
      showNotification('获取视频信息失败，请稍后重试');
      return;
    }
    const newIndex = playlist.tracks.length;
    playlist.setTracks([...playlist.tracks, playable]);
    playlist.setCurrentIndex(newIndex);
    await playTrack(playable);
    recent.addRecentTrack(playable);
  }, [playlist, playTrack, recent, showNotification]);

  const handlePlayTrack = useCallback(async (index: number) => {
    if (index < 0 || index >= playlist.tracks.length) return;
    // 与下一首共用防重入，避免加载中点列表再触发并发 play
    if (nextInFlightRef.current) return;
    nextInFlightRef.current = true;
    try {
      const track = playlist.tracks[index]!;
      playlist.setCurrentIndex(index);
      let playable: Track;
      try {
        playable = await ensureTrackCid(track);
      } catch {
        showNotification('获取视频信息失败，请稍后重试');
        onPlayErrorNeedLogin?.();
        return;
      }
      // 补齐 cid 后更新列表缓存，避免下次重复查询
      if (playable.cid !== track.cid) {
        const next = [...playlist.tracks];
        next[index] = playable;
        playlist.setTracks(next);
      }
      const ok = await playTrack(playable);
      if (ok) {
        recent.addRecentTrack(playable);
        prefetchNextCid(index);
      } else {
        showNotification('播放失败，请稍后重试');
        onPlayErrorNeedLogin?.();
      }
    } finally {
      nextInFlightRef.current = false;
    }
  }, [playlist, playTrack, recent, showNotification, onPlayErrorNeedLogin, prefetchNextCid]);

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
      void (async () => {
        try {
          await playTrack(await ensureTrackCid(nextTrack));
        } catch {
          showNotification('获取视频信息失败，请稍后重试');
        }
      })();
    }
  }, [playlist.tracks, playlist.currentIndex, isPlaying, playlist.deleteTrack, playTrack, showNotification]);

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
          playlist.setTracks(mergeUniqueTracks(playlist.tracks, res.data));
        } else if (parsed.type === 'series') {
          const res = await getSeriesList(parsed.mid, parsed.sid);
          if (!res.success) throw new Error(res.error);
          playlist.setTracks(mergeUniqueTracks(playlist.tracks, res.data));
        } else if (parsed.type === 'collection') {
          const res = await getColleList(parsed.mid, parsed.sid);
          if (!res.success) throw new Error(res.error);
          playlist.setTracks(mergeUniqueTracks(playlist.tracks, res.data));
        } else {
          const res = await getPlaylist(parsed.url);
          if (!res.success) throw new Error(res.error);
          playlist.setTracks(mergeUniqueTracks(playlist.tracks, res.data));
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
        } else if (playlist.playMode === 'shuffle' && attempt === 0 && total > 1) {
          // 随机切一首，避开当前曲目
          do {
            nextIndex = Math.floor(Math.random() * total);
          } while (nextIndex === startIndex);
        } else {
          // 顺序推进；shuffle 失败后的重试也走这里，避免无限随机
          nextIndex = (startIndex + 1 + attempt) % total;
        }
        const track = playlist.tracks[nextIndex];
        if (!track) return;
        // 先更新列表高亮，避免加载期间 UI 仍停在上一首
        playlist.setCurrentIndex(nextIndex);
        let playable: Track;
        try {
          playable = await ensureTrackCid(track);
        } catch {
          continue; // 该首信息获取失败，尝试下一首
        }
        if (playable.cid !== track.cid) {
          const next = [...playlist.tracks];
          next[nextIndex] = playable;
          playlist.setTracks(next);
        }
        const ok = await playTrack(playable);
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
    try {
      const playable = await ensureTrackCid(track);
      if (playable.cid !== track.cid) {
        const next = [...playlist.tracks];
        next[prevIndex] = playable;
        playlist.setTracks(next);
      }
      const ok = await playTrack(playable);
      if (!ok) {
        showNotification('播放失败，请稍后重试');
      }
    } catch {
      showNotification('获取视频信息失败，请稍后重试');
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
