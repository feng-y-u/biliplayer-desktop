import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { PlayerState, Track, CurrentAudio } from '../types';
import { getAudioEngine, type AudioStatus } from '../services/audioEngine';

const URL_REFRESH_INTERVAL_MS = 60_000;

export function useAudioPlayer(onTrackEnd?: () => void) {
  const onTrackEndRef = useRef(onTrackEnd);
  onTrackEndRef.current = onTrackEnd;

  const engineRef = useRef(getAudioEngine());

  const [status, setStatus] = useState<AudioStatus>(engineRef.current.status);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(engineRef.current.volume);
  const [currentAudio, setCurrentAudio] = useState<CurrentAudio | null>(null);

  /* ----- 订阅引擎状态 + 注册 onEnd ----- */
  useEffect(() => {
    const engine = engineRef.current;
    engine.onEnd = () => onTrackEndRef.current?.();

    const unsub = engine.subscribe((s) => setStatus(s));

    const el = engine.getMediaElement();
    const onTime = () => {
      setCurrentTime(el.currentTime);
      if (el.buffered.length > 0) {
        setBuffered(el.buffered.end(el.buffered.length - 1));
      }
    };
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onVol = () => setVolume(el.volume);

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('volumechange', onVol);

    // 同步初始值
    setCurrentTime(el.currentTime);
    setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    setVolume(el.volume);

    return () => {
      engine.onEnd = null;
      unsub();
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('volumechange', onVol);
    };
  }, []);

  /* ----- 播放中定时刷新 CDN 链接 ----- */
  useEffect(() => {
    if (status !== 'playing' || !currentAudio) return;

    const id = window.setInterval(() => {
      engineRef.current.backgroundRefresh();
    }, URL_REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [status, currentAudio]);

  /* ----- PlayerState 派生 ----- */
  const state: PlayerState = useMemo(() => ({
    isPlaying: status === 'playing',
    currentTime,
    duration,
    buffered,
    volume,
    currentAudio,
  }), [status, currentTime, duration, buffered, volume, currentAudio]);

  /* ----- 操作 ----- */

  const playPause = useCallback(() => {
    const engine = engineRef.current;
    if (status === 'playing') {
      engine.pause();
    } else {
      void engine.resume();
    }
  }, [status]);

  const playTrack = useCallback(async (track: Track): Promise<boolean> => {
    const engine = engineRef.current;
    // 先更新 UI（封面/标题），避免加载期间仍显示上一首
    const cur: CurrentAudio = {
      bvid: track.bvid,
      cid: track.cid,
      title: track.title,
      author: track.author,
      cover: track.cover,
    };
    setCurrentAudio(cur);
    setCurrentTime(0);
    setDuration(0);

    const ok = await engine.play(track.bvid, track.cid);
    if (ok) {
      setCurrentTime(engine.currentTime);
      setDuration(engine.duration);
    } else {
      setCurrentAudio(null);
    }
    return ok;
  }, []);

  const seek = useCallback((time: number) => {
    engineRef.current.seek(time);
    setCurrentTime(time);
  }, []);

  const volumeChange = useCallback((v: number) => {
    engineRef.current.setVolume(v);
    setVolume(v);
  }, []);

  const syncVolume = useCallback((v: number) => {
    engineRef.current.setVolume(v);
    // 不调 setVolume，避免与 volumechange 事件循环
  }, []);

  return { state, playPause, playTrack, seek, volumeChange, syncVolume };
}
