import { useState, useEffect, useCallback, useRef } from 'react';
import type { PlayerState, Track } from '../types';
import {
  playAudioLocal,
  pauseAudioLocal,
  resumeAudioLocal,
  seekAudioLocal,
  setVolumeLocal,
  getLocalPlayerState,
  getAudioElement,
  refreshAudioUrl,
} from '../services/api';

export function useAudioPlayer(onTrackEnd?: () => void) {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    currentAudio: null,
  });
  const intervalRef = useRef<number | null>(null);
  const onTrackEndRef = useRef(onTrackEnd);
  onTrackEndRef.current = onTrackEnd;

  const pollState = useCallback(() => {
    const local = getLocalPlayerState();
    setState((prev) => ({
      ...prev,
      isPlaying: local.isPlaying,
      currentTime: local.currentTime,
      duration: local.duration,
      volume: local.volume,
    }));
  }, []);

  useEffect(() => {
    intervalRef.current = window.setInterval(pollState, 500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pollState]);

  useEffect(() => {
    const handleEnded = () => {
      pollState();
      onTrackEndRef.current?.();
    };

    const audio = getAudioElement();
    if (audio) {
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }

    const id = window.setInterval(() => {
      const el = getAudioElement();
      if (el) {
        clearInterval(id);
        el.addEventListener('ended', handleEnded);
      }
    }, 200);
    return () => clearInterval(id);
  }, [pollState]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const ca = state.currentAudio;
      if (ca) refreshAudioUrl(ca.bvid, ca.cid);
    }, 60000);
    return () => clearInterval(id);
  }, [state.currentAudio]);

  const playPause = useCallback(async () => {
    if (state.isPlaying) pauseAudioLocal();
    else resumeAudioLocal();
    setTimeout(pollState, 100);
  }, [state.isPlaying, pollState]);

  const playTrack = useCallback(async (track: Track) => {
    const result = await playAudioLocal(track.bvid, track.cid, track.title);
    if (result.success) {
      setState((prev) => ({
        ...prev,
        currentAudio: { bvid: track.bvid, cid: track.cid, title: track.title, author: track.author, cover: track.cover },
        isPlaying: true,
      }));
    }
    setTimeout(pollState, 100);
  }, [pollState]);

  const seek = useCallback(async (time: number) => {
    seekAudioLocal(time);
    setTimeout(pollState, 50);
  }, [pollState]);

  const volumeChange = useCallback(async (v: number) => {
    setVolumeLocal(v);
    setState((prev) => ({ ...prev, volume: v }));
  }, []);

  const syncVolume = useCallback((v: number) => {
    setVolumeLocal(v);
  }, []);

  return { state, playPause, playTrack, seek, volumeChange, syncVolume };
}
