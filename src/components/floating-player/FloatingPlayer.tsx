import { useDrag } from '@/hooks/useDrag';
import { useResize } from '@/hooks/useResize';
import { useState, useCallback, useEffect, useRef } from 'react';
import ExpandedPanel from './ExpandedPanel';
import { ModeIcon, modeTitle, nextMode } from './ModeIcon';
import { PlayPauseIcon, NextIcon } from './Icons';
import './FloatingPlayer.css';
import type { CollapsedState, PlayerState, PlaylistState, PlayMode, WindowPosition, WindowSize, Track, FavoriteFolder } from '@/types';

const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 64;
const SPRING_DURATION = 200;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface FloatingPlayerProps {
  storage: {
    windowPosition: WindowPosition;
    windowSize: WindowSize;
    favorites: FavoriteFolder[];
    recentTracks: Track[];
    setWindowPosition: (p: WindowPosition) => void;
    setWindowSize: (s: WindowSize) => void;
  };
  playerState: PlayerState;
  playlistState: PlaylistState;
  playerActions: {
    onPlayPause: () => void;
    onPrev: () => void;
    onNext: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (v: number) => void;
    onPlayModeChange: (mode: PlayMode) => void;
  };
  playlistActions: {
    onPlayTrack: (index: number) => void;
    onDeleteTrack: (index: number) => void;
    onClearPlaylist: () => void;
    onReorderTracks: (fromIndex: number, toIndex: number) => void;
  };
  favoriteActions: {
    onCreateFavorite: (name: string) => void;
    onToggleFavorite: (track: Track) => void;
    onPlayFromFavorite: (track: Track) => void;
    onRemoveFromFavorite: (favId: string, trackIndex: number) => void;
    onDeleteFavorite: (favId: string) => void;
    onReorderFavTracks: (favId: string, fromIndex: number, toIndex: number) => void;
    onAddToFavorite?: (favId: string, track: Track) => void;
    onAddToFavoriteFromInput?: (favId: string, input: string) => Promise<void>;
    onAddAllToPlaylist?: (tracks: Track[]) => void;
  };
  onInputSubmit: (input: string) => void;
  loading: boolean;
  notification: string | null;
}

export default function FloatingPlayer({
  storage,
  playerState,
  playlistState,
  playerActions,
  playlistActions,
  favoriteActions,
  onInputSubmit: _onInputSubmit,
  loading,
  notification,
}: FloatingPlayerProps) {
  const [collapsedState, setCollapsedState] = useState<CollapsedState>('collapsed');
  const [animating, setAnimating] = useState<'expand' | 'collapse' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const collapsedPosRef = useRef<{ x: number; y: number } | null>(null);
  const expandedSizeRef = useRef<{ width: number; height: number }>({
    width: 400,
    height: 600,
  });
  const expandParamsRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const animStartRef = useRef({ w: THUMB_WIDTH, h: THUMB_HEIGHT });
  const animTargetRef = useRef({ w: THUMB_WIDTH, h: THUMB_HEIGHT });
  const collapseRafRef = useRef<number>(0);
  const expandStartTimeRef = useRef(0);

  const { handleMouseDown: handleDragStart, didDrag } = useDrag(
    (pos) => storage.setWindowPosition(pos),
    (target) => {
      if (collapsedState === 'expanded') {
        const el = target as HTMLElement;
        if (!el.closest('.ep-top-bar')) return false;
        if (el.closest('[data-no-drag]')) return false;
      }
      return true;
    },
  );

  // Sync window size when user drags resize handles
  useEffect(() => {
    if (collapsedState !== 'expanded' || animating) return;
    window.electronAPI.windowResize(storage.windowSize.width, storage.windowSize.height);
  }, [storage.windowSize, collapsedState, animating]);

  // Set initial window size and restore saved position on mount
  useEffect(() => {
    (async () => {
      const api = window.electronAPI;
      await api.windowResize(THUMB_WIDTH, THUMB_HEIGHT);
      const pos = await api.windowGetPosition();
      const wp = storage.windowPosition;
      if (wp.left !== 0 || wp.top !== 0) {
        api.windowMove(wp.left, wp.top);
      } else {
        storage.setWindowPosition({ left: pos.x, top: pos.y });
      }
    })();
  }, []);

  
  // 窗口大小随动画进度同步（展开时）
  useEffect(() => {
    if (animating !== 'expand') return;
    let rafId: number;
    expandStartTimeRef.current = performance.now();
    const tick = () => {
      const p = Math.min((performance.now() - expandStartTimeRef.current) / SPRING_DURATION, 1);
      const w = Math.round(lerp(animStartRef.current.w, animTargetRef.current.w, p));
      const h = Math.round(lerp(animStartRef.current.h, animTargetRef.current.h, p));
      window.electronAPI.windowResize(w, h);
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [animating]);

  // React 提交 DOM、thumb 已移除后再移动窗口位置
  useEffect(() => {
    if (animating !== 'expand') return;
    const p = expandParamsRef.current;
    if (!p) return;
    const api = window.electronAPI;
    api.windowMove(p.x, p.y);
  }, [animating]);

  // Expand: animate expand then stop
  useEffect(() => {
    if (animating !== 'expand') return;
    const timer = setTimeout(() => {
      setAnimating(null);
      const api = window.electronAPI;
      const size = expandedSizeRef.current;
      api.windowResize(size.width, size.height);
    }, SPRING_DURATION);
    return () => clearTimeout(timer);
  }, [animating]);

  // Collapse: set collapsedState after animation completes
  useEffect(() => {
    if (animating !== 'collapse') return;
    const timer = setTimeout(() => {
      setCollapsedState('collapsed');
      setAnimating(null);
    }, SPRING_DURATION);
    return () => clearTimeout(timer);
  }, [animating]);

  const { handleResizeStart } = useResize(
    storage.windowSize,
    (size) => storage.setWindowSize(size),
    (size) => { expandedSizeRef.current = size; },
  );

  const collapseWindow = useCallback(() => {
    setAnimating('collapse');
    const api = window.electronAPI;
    const currentW = storage.windowSize.width;
    const currentH = storage.windowSize.height;
    const startTime = performance.now();

    const animateCollapse = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const t = Math.min(elapsed / SPRING_DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      api.windowResize(
        Math.round(lerp(currentW, THUMB_WIDTH, eased)),
        Math.round(lerp(currentH, THUMB_HEIGHT, eased))
      );
      if (t < 1) {
        collapseRafRef.current = requestAnimationFrame(animateCollapse);
      } else {
        if (collapsedPosRef.current) {
          api.windowMove(collapsedPosRef.current.x, collapsedPosRef.current.y);
        }
        api.windowResize(THUMB_WIDTH, THUMB_HEIGHT);
      }
    };
    cancelAnimationFrame(collapseRafRef.current);
    collapseRafRef.current = requestAnimationFrame(animateCollapse);
  }, [storage.windowSize]);

  const handleThumbClick = useCallback(async () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    const api = window.electronAPI;

    if (collapsedState === 'collapsed') {
      const pos = await api.windowGetPosition();
      collapsedPosRef.current = { x: pos.x, y: pos.y };
      const thumbCenterX = pos.x + THUMB_WIDTH / 2;
      const remembered = expandedSizeRef.current;
      const targetW = Math.min(remembered.width, window.screen.width - 40);
      const targetH = Math.min(remembered.height, window.screen.height - 40);
      let expandedX = thumbCenterX - targetW / 2;
      let expandedY = pos.y;
      expandedX = Math.max(20, Math.min(expandedX, window.screen.width - targetW - 20));
      expandedY = Math.max(20, Math.min(expandedY, window.screen.height - targetH - 20));

      expandParamsRef.current = { x: expandedX, y: expandedY, w: targetW, h: targetH };
      animStartRef.current = { w: THUMB_WIDTH, h: THUMB_HEIGHT };
      animTargetRef.current = { w: targetW, h: targetH };

      setCollapsedState('expanded');
      setAnimating('expand');
    } else {
      collapseWindow();
    }
  }, [collapsedState, collapseWindow]);

  const handleClose = useCallback(() => {
    collapseWindow();
  }, [collapseWindow]);

  return (
    <div
      ref={containerRef}
      className={[
        'float-player',
        collapsedState === 'expanded' && !animating && 'expanded',
        animating === 'expand' && 'animating-expand',
        animating === 'collapse' && 'animating-collapse',
        playerState.isPlaying && 'playing',
      ].filter(Boolean).join(' ')}
      onMouseDown={handleDragStart}
    >
      {collapsedState !== 'expanded' && (
        <>
          <div className="hover-bar">
            <button data-no-drag onClick={(e) => { e.stopPropagation(); playerActions.onPlayPause(); }} title="播放/暂停">
              <PlayPauseIcon isPlaying={playerState.isPlaying} />
            </button>
            <button data-no-drag onClick={(e) => { e.stopPropagation(); playerActions.onNext(); }} title="下一首">
              <NextIcon />
            </button>
            <button data-no-drag onClick={(e) => { e.stopPropagation(); playerActions.onPlayModeChange(nextMode(playlistState.playMode)); }} title={modeTitle(playlistState.playMode)}>
              <ModeIcon mode={playlistState.playMode} />
            </button>
          </div>
          <div className={`player-thumb${playerState.isPlaying ? ' playing' : ''}`} onClick={handleThumbClick}>
            {playerState.currentAudio?.cover ? (
              <div className="thumb-inner" style={{ backgroundImage: `url(${playerState.currentAudio.cover})` }} />
            ) : (
              <span className="note-icon">♪</span>
            )}
          </div>
        </>
      )}

      {(collapsedState === 'expanded' || animating === 'collapse') && (
        <div className="expanded-panel">
          <ExpandedPanel
            currentAudio={playerState.currentAudio}
            currentTime={playerState.currentTime}
            duration={playerState.duration}
            isPlaying={playerState.isPlaying}
            volume={playerState.volume}
            tracks={playlistState.tracks}
            currentIndex={playlistState.currentIndex}
            playMode={playlistState.playMode}
            favorites={storage.favorites}
            recentTracks={storage.recentTracks}
            playerActions={playerActions}
            playlistActions={playlistActions}
            favoriteActions={favoriteActions}
            onClose={handleClose}
            onInputSubmit={_onInputSubmit}
            loading={loading}
            notification={notification}
          />
          {collapsedState === 'expanded' && (
            <>
              <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
              <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
              <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
