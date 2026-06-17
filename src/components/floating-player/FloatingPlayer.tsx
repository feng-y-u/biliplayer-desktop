import { useState, useCallback, useEffect, useRef } from 'react';
import ExpandedPanel from './ExpandedPanel';
import { ModeIcon, modeTitle, nextMode } from './ModeIcon';
import './FloatingPlayer.css';
import type { CollapsedState, PlayerState, PlaylistState, PlayMode, WindowPosition, WindowSize, Track, FavoriteFolder } from '@/types';

// Window size constants
const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 72;
const PANEL_MIN_WIDTH = 320;
const PANEL_MIN_HEIGHT = 480;
const DRAG_THRESHOLD = 5;
const MIN_WINDOW_SIZE = { width: 1, height: 1 };

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

  const handleThumbClick = useCallback(async () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    const api = window.electronAPI;
    if (collapsedState === 'collapsed') {
      // Capture current position, then expand centered on thumb
      const pos = await api.windowGetPosition();
      collapsedPosRef.current = { x: pos.x, y: pos.y };
      const thumbCenterX = pos.x + THUMB_WIDTH / 2;
      const expandedX = thumbCenterX - storage.windowSize.width / 2;
      api.windowMove(expandedX, pos.y);
      api.windowResize(storage.windowSize.width, storage.windowSize.height);
      api.windowSetMinimumSize(PANEL_MIN_WIDTH, PANEL_MIN_HEIGHT);
      setCollapsedState('expanded');
    } else {
      // Collapse back to saved position
      const pos = collapsedPosRef.current;
      if (pos) api.windowMove(pos.x, pos.y);
      api.windowResize(THUMB_WIDTH, THUMB_HEIGHT);
      api.windowSetMinimumSize(MIN_WINDOW_SIZE.width, MIN_WINDOW_SIZE.height);
      setCollapsedState('collapsed');
    }
  }, [collapsedState, storage.windowSize]);

  const handleClose = useCallback(() => {
    const api = window.electronAPI;
    const pos = collapsedPosRef.current;
    if (pos) api.windowMove(pos.x, pos.y);
    api.windowResize(THUMB_WIDTH, THUMB_HEIGHT);
    api.windowSetMinimumSize(MIN_WINDOW_SIZE.width, MIN_WINDOW_SIZE.height);
    setCollapsedState('collapsed');
  }, []);

  return (
    <div
      ref={containerRef}
      className={`float-player${collapsedState === 'expanded' ? ' expanded' : ''}`}
      onMouseDown={handleMouseDown}
    >
      {collapsedState !== 'expanded' && (
        <>
          <div className="hover-bar">
            <button data-no-drag onClick={(e) => { e.stopPropagation(); playerActions.onPlayPause(); }} title="播放/暂停">
              <svg viewBox="0 0 24 24" fill="currentColor">
                {playerState.isPlaying
                  ? <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>
                  : <path d="M8 5v14l11-7z" />
                }
              </svg>
            </button>
            <button data-no-drag onClick={(e) => { e.stopPropagation(); playerActions.onNext(); }} title="下一首">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
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

      {collapsedState === 'expanded' && (
        <>
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
          {/* Resize handles */}
          <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
        </>
      )}
    </div>
  );
}
