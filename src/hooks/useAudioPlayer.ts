import { useState, useEffect, useCallback, useRef } from 'react';
import type { PlayerState, Track } from '../types';
import {
  playAudioLocal,
  pauseAudioLocal,
  resumeAudioLocal,
  seekAudioLocal,
  setVolumeLocal,
  getAudioElement,
  refreshAudioUrl,
} from '../services/api';

const URL_REFRESH_INTERVAL_MS = 60_000;
const AUDIO_ELEMENT_POLL_MS = 200;

export function useAudioPlayer(onTrackEnd?: () => void) {
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    currentAudio: null,
  });
  const onTrackEndRef = useRef(onTrackEnd);
  onTrackEndRef.current = onTrackEnd;
  const refreshTimerRef = useRef<number | null>(null);
  const currentAudioRef = useRef(state.currentAudio);
  currentAudioRef.current = state.currentAudio;
  const isPlayingRef = useRef(state.isPlaying);
  isPlayingRef.current = state.isPlaying;

  // 后备：有些 B站音频流不会触发 ended，通过 timeupdate 检测播放到底
  const nearEndRef = useRef(false);

  // Attach event listeners to audio element once it exists
  useEffect(() => {
    const cleanup: (() => void)[] = [];

    function attach(el: HTMLAudioElement) {
      const onTimeUpdate = () => {
        setState(prev => ({ ...prev, currentTime: el.currentTime }));
        // 后备逻辑：距末尾 1 秒内触发切歌
        if (el.duration > 0 && el.currentTime >= el.duration - 1) {
          if (!nearEndRef.current) {
            nearEndRef.current = true;
            onTrackEndRef.current?.();
          }
        } else {
          nearEndRef.current = false;
        }
      };
      const onPlay = () => setState(prev => ({ ...prev, isPlaying: true }));
      const onPause = () => setState(prev => ({ ...prev, isPlaying: false }));
      const onMeta = () => {
        nearEndRef.current = false;
        setState(prev => ({ ...prev, duration: el.duration }));
      };
      const onVolume = () => setState(prev => ({ ...prev, volume: el.volume }));
      const onEnded = () => {
        nearEndRef.current = true;
        onTrackEndRef.current?.();
      };
      const onError = () => {
        if (el.error && el.error.code !== MediaError.MEDIA_ERR_ABORTED) {
          console.error('[useAudioPlayer] 音频错误:', {
            code: el.error.code,
            message: el.error.message,
            src: el.currentSrc || el.src,
            networkState: el.networkState,
          });
          onTrackEndRef.current?.();
        }
      };

      el.addEventListener('timeupdate', onTimeUpdate);
      el.addEventListener('play', onPlay);
      el.addEventListener('pause', onPause);
      el.addEventListener('loadedmetadata', onMeta);
      el.addEventListener('volumechange', onVolume);
      el.addEventListener('ended', onEnded);
      el.addEventListener('error', onError);

      cleanup.push(
        () => el.removeEventListener('timeupdate', onTimeUpdate),
        () => el.removeEventListener('play', onPlay),
        () => el.removeEventListener('pause', onPause),
        () => el.removeEventListener('loadedmetadata', onMeta),
        () => el.removeEventListener('volumechange', onVolume),
        () => el.removeEventListener('ended', onEnded),
        () => el.removeEventListener('error', onError),
      );

      // Sync initial state if element already had audio loaded
      setState(prev => ({
        ...prev,
        isPlaying: !el.paused,
        currentTime: el.currentTime,
        duration: el.duration || prev.duration,
        volume: el.volume,
      }));
    }

    const el = getAudioElement();
    if (el) {
      attach(el);
    } else {
      const id = window.setInterval(() => {
        const found = getAudioElement();
        if (found) {
          clearInterval(id);
          attach(found);
        }
      }, AUDIO_ELEMENT_POLL_MS);
      cleanup.push(() => clearInterval(id));
    }

    return () => cleanup.forEach(fn => fn());
  }, []);

  // Refresh audio URL only while playing
  useEffect(() => {
    const clearTimer = () => {
      if (refreshTimerRef.current !== null) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };

    if (state.isPlaying && state.currentAudio) {
      clearTimer();
      refreshTimerRef.current = window.setInterval(() => {
        const audio = currentAudioRef.current;
        if (audio) refreshAudioUrl(audio.bvid, audio.cid);
      }, URL_REFRESH_INTERVAL_MS);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [state.isPlaying, state.currentAudio]);

  const playPause = useCallback(async () => {
    if (isPlayingRef.current) pauseAudioLocal();
    else await resumeAudioLocal();
  }, []);

  const playTrack = useCallback(async (track: Track): Promise<boolean> => {
    const result = await playAudioLocal(track.bvid, track.cid, track.title);
    if (result.success) {
      setState(prev => ({
        isPlaying: true,
        currentTime: 0,
        duration: prev.duration || 0,
        volume: prev.volume,
        currentAudio: { bvid: track.bvid, cid: track.cid, title: track.title, author: track.author, cover: track.cover },
      }));
    } else {
      console.error('[useAudioPlayer] playTrack 失败:', result.error);
    }
    return result.success;
  }, []);

  const seek = useCallback(async (time: number) => {
    seekAudioLocal(time);
  }, []);

  const volumeChange = useCallback(async (v: number) => {
    setVolumeLocal(v);
  }, []);

  const syncVolume = useCallback((v: number) => {
    setVolumeLocal(v);
  }, []);

  return { state, playPause, playTrack, seek, volumeChange, syncVolume };
}
