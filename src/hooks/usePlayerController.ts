import { useCallback } from 'react';
import type { Track, CurrentAudio, PlayMode } from '@/types';
import { pauseAudioLocal, resumeAudioLocal, getVideoInfo, getPlaylist } from '@/services/api';

interface PlaylistStore {
  tracks: Track[];
  currentIndex: number;
  playMode: PlayMode;
  loading: boolean;
  setTracks: (tracks: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  setLoading: (loading: boolean) => void;
  addTrack: (track: Track) => void;
  deleteTrack: (index: number) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
}

interface RecentStore {
  recentTracks: Track[];
  addRecentTrack: (track: Track) => void;
}

const BV_RE = /BV[a-zA-Z0-9]+/i;
const PLAYLIST_RE = /medialist\/play\/dlista\/\d+\/\d+|space\.bilibili\.com\/\d+\/favlist\?.*fid=\d+/;

function parseInput(input: string): { type: 'playlist'; url: string } | { type: 'bvid'; bvid: string } | null {
  if (PLAYLIST_RE.test(input)) return { type: 'playlist', url: input };
  const m = input.match(BV_RE);
  if (m) return { type: 'bvid', bvid: m[0] };
  return null;
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
  const [loading, setLoading] = [playlist.loading, playlist.setLoading];

  const handlePlayPause = useCallback(() => {
    if (!currentAudio && playlist.tracks[playlist.currentIndex]) {
      const track = playlist.tracks[playlist.currentIndex]!;
      playTrack(track).then(ok => { if (ok) playlist.setCurrentIndex(playlist.currentIndex); });
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
    await playTrack(track);
    recent.addRecentTrack(track);
  }, [playlist, playTrack, recent]);

  const handleDeleteTrack = useCallback((index: number) => {
    const track = playlist.tracks[index];
    if (!track) return;

    const wasPlaying = index === playlist.currentIndex && isPlaying;
    const isLastTrack = playlist.tracks.length <= 1;

    playlist.deleteTrack(index);

    if (wasPlaying && isLastTrack) {
      pauseAudioLocal();
    } else if (wasPlaying) {
      const nextIndex = index < playlist.tracks.length - 1 ? index + 1 : index - 1;
      const nextTrack = playlist.tracks[nextIndex];
      if (nextTrack) playTrack(nextTrack);
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
        setLoading(false);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '加载失败';
      showNotification(`加载失败：${msg}`);
    }
  }, [playlist, setLoading, showNotification]);

  const handleNextButton = useCallback(async () => {
    if (playlist.tracks.length === 0) return;
    let nextIndex: number;
    if (playlist.playMode === 'single') nextIndex = playlist.currentIndex;
    else if (playlist.playMode === 'shuffle') nextIndex = Math.floor(Math.random() * playlist.tracks.length);
    else nextIndex = (playlist.currentIndex + 1) % playlist.tracks.length;
    const track = playlist.tracks[nextIndex];
    if (!track) return;
    const ok = await playTrack(track);
    if (ok) playlist.setCurrentIndex(nextIndex);
  }, [playlist.currentIndex, playlist.playMode, playlist.tracks, playTrack]);

  const handlePrevButton = useCallback(async () => {
    if (playlist.tracks.length === 0) return;
    const prevIndex = playlist.currentIndex - 1 < 0 ? playlist.tracks.length - 1 : playlist.currentIndex - 1;
    const track = playlist.tracks[prevIndex];
    if (!track) return;
    const ok = await playTrack(track);
    if (ok) playlist.setCurrentIndex(prevIndex);
  }, [playlist.currentIndex, playlist.tracks, playTrack]);

  return {
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
  };
}
