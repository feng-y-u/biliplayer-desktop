import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';
import ExpandedPanel from './ExpandedPanel';
import { ModeIcon, modeTitle, nextMode } from './ModeIcon';
import { PlayPauseIcon, NextIcon } from './Icons';
import './FloatingPlayer.css';
import type { CollapsedState, PlayerState, PlaylistState, PlayMode, WindowPosition, WindowSize, Track, FavoriteFolder } from '@/types';

// Window size constants
const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 64;
const PANEL_MIN_WIDTH = 320;
const PANEL_MIN_HEIGHT = 480;
const DRAG_THRESHOLD = 5;
const MIN_WINDOW_SIZE = { width: 1, height: 1 };

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
  const [showThumb, setShowThumb] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);
  const dragSession = useRef<{
    startScreenX: number;
    startScreenY: number;
    startWinX: number;
    startWinY: number;
    dragging: boolean;
  } | null>(null);
  const resizeSession = useRef<{
    startScreenX: number;
    startScreenY: number;
    startW: number;
    startH: number;
    edge: 'e' | 'se' | 's';
  } | null>(null);
  const collapsedPosRef = useRef<{ x: number; y: number } | null>(null);
  const expandedSizeRef = useRef<{ width: number; height: number }>({
    width: 400,
    height: 600,
  });
  const progress = useMotionValue(0);
  const animStartRef = useRef({ w: THUMB_WIDTH, h: THUMB_HEIGHT });
  const animTargetRef = useRef({ w: THUMB_WIDTH, h: THUMB_HEIGHT });

  // Sync window size when user drags resize handles (only when expanded)
  useEffect(() => {
    if (collapsedState !== 'expanded') return;
    window.electronAPI.windowResize(storage.windowSize.width, storage.windowSize.height);
    window.electronAPI.windowSetMinimumSize(PANEL_MIN_WIDTH, PANEL_MIN_HEIGHT);
  }, [storage.windowSize, collapsedState]);

  // Set initial window size (collapsed) and restore saved position on mount
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

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = dragSession.current;
      if (!drag) return;

      const dx = e.screenX - drag.startScreenX;
      const dy = e.screenY - drag.startScreenY;

      if (!drag.dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        drag.dragging = true;
        didDrag.current = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      window.electronAPI.windowMove(drag.startWinX + dx, drag.startWinY + dy);
    }

    function onMouseUp() {
      const drag = dragSession.current;
      if (!drag) return;
      dragSession.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      if (drag.dragging) {
        (async () => {
          const pos = await window.electronAPI.windowGetPosition();
          storage.setWindowPosition({ left: pos.x, top: pos.y });
        })();
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Resize handling
  useEffect(() => {
    function onResizeMove(e: MouseEvent) {
      const resize = resizeSession.current;
      if (!resize) return;

      const dx = e.screenX - resize.startScreenX;
      const dy = e.screenY - resize.startScreenY;

      let newW = resize.startW;
      let newH = resize.startH;
      if (resize.edge === 'e' || resize.edge === 'se') {
        newW = Math.max(PANEL_MIN_WIDTH, resize.startW + dx);
      }
      if (resize.edge === 's' || resize.edge === 'se') {
        newH = Math.max(PANEL_MIN_HEIGHT, resize.startH + dy);
      }

      const newSize = { width: newW, height: newH };
      expandedSizeRef.current = newSize;
      window.electronAPI.windowResize(newW, newH);
      storage.setWindowSize(newSize);
    }

    function onResizeUp() {
      if (!resizeSession.current) return;
      resizeSession.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeUp);
    return () => {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeUp);
    };
  }, [storage.setWindowSize]);

  // 窗口大小与动画进度同步（展开时）
  useEffect(() => {
    let rafId: number;

    const tick = () => {
      const p = progress.get();
      const start = animStartRef.current;
      const target = animTargetRef.current;
      const w = Math.round(lerp(start.w, target.w, p));
      const h = Math.round(lerp(start.h, target.h, p));
      window.electronAPI.windowResize(w, h);
      if (p > 0 && p < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const unsubscribe = progress.on('change', () => {
      const p = progress.get();
      if (p === 0 || p === 1) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    });

    return () => {
      unsubscribe();
      cancelAnimationFrame(rafId);
    };
  }, [progress]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // In expanded state, only start drag from the top bar
    if (collapsedState === 'expanded') {
      const target = e.target as HTMLElement;
      if (!target.closest('.ep-top-bar')) return;
    }
    dragSession.current = {
      startScreenX: e.screenX,
      startScreenY: e.screenY,
      startWinX: window.screenX,
      startWinY: window.screenY,
      dragging: false,
    };
    didDrag.current = false;
  }, [collapsedState]);

  const handleResizeStart = useCallback((e: React.MouseEvent, edge: 'e' | 'se' | 's') => {
    e.stopPropagation();
    e.preventDefault();
    resizeSession.current = {
      startScreenX: e.screenX,
      startScreenY: e.screenY,
      startW: storage.windowSize.width,
      startH: storage.windowSize.height,
      edge,
    };
    document.body.style.userSelect = 'none';
  }, [storage.windowSize]);

  const collapseWindow = useCallback(() => {
    const api = window.electronAPI;
    const currentW = storage.windowSize.width;
    const currentH = storage.windowSize.height;

    // 隐藏缩略图，等 exit 动画完成后再显示
    setShowThumb(false);

    const duration = 250;
    let start_time: number | null = null;

    const animateCollapse = (timestamp: number) => {
      if (!start_time) start_time = timestamp;
      const elapsed = timestamp - start_time;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const w = Math.round(lerp(currentW, THUMB_WIDTH, eased));
      const h = Math.round(lerp(currentH, THUMB_HEIGHT, eased));
      api.windowResize(w, h);
      if (t < 1) {
        requestAnimationFrame(animateCollapse);
      } else {
        if (collapsedPosRef.current) {
          api.windowMove(collapsedPosRef.current.x, collapsedPosRef.current.y);
        }
        api.windowSetMinimumSize(MIN_WINDOW_SIZE.width, MIN_WINDOW_SIZE.height);
        api.windowResize(THUMB_WIDTH, THUMB_HEIGHT);
      }
    };
    requestAnimationFrame(animateCollapse);

    setCollapsedState('collapsed');
  }, [storage.windowSize]);

  const handleThumbClick = useCallback(async () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    const api = window.electronAPI;

    if (collapsedState === 'collapsed') {
      // 展开
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

      // 先移动窗口到展开位置
      api.windowMove(expandedX, expandedY);
      api.windowSetMinimumSize(PANEL_MIN_WIDTH, PANEL_MIN_HEIGHT);

      // 设置动画起始/目标尺寸
      animStartRef.current = { w: THUMB_WIDTH, h: THUMB_HEIGHT };
      animTargetRef.current = { w: targetW, h: targetH };

      // 触发 framer-motion 动画
      progress.set(0);
      setCollapsedState('expanded');
    } else {
      collapseWindow();
    }
  }, [collapsedState, collapseWindow, progress]);

  const handleClose = useCallback(() => {
    collapseWindow();
  }, [collapseWindow]);

  return (
    <div
      ref={containerRef}
      className={[
        'float-player',
        collapsedState === 'expanded' && 'expanded',
        playerState.isPlaying && 'playing',
      ].filter(Boolean).join(' ')}
      onMouseDown={handleMouseDown}
    >
      <AnimatePresence onExitComplete={() => setShowThumb(true)}>
        {collapsedState === 'expanded' && (
          <motion.div
            key="panel"
            className="motion-panel"
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
            onAnimationComplete={(def) => {
              if (def === 'animate') {
                const api = window.electronAPI;
                const size = expandedSizeRef.current;
                api.windowResize(size.width, size.height);
                api.windowSetMinimumSize(PANEL_MIN_WIDTH, PANEL_MIN_HEIGHT);
              }
            }}
          >
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
            <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
            <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
            <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          </motion.div>
        )}
      </AnimatePresence>

      {collapsedState !== 'expanded' && showThumb && (
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
    </div>
  );
}
