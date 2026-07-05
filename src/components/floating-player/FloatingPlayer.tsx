import { useDrag } from '@/hooks/useDrag';
import { useResize } from '@/hooks/useResize';
import { useLerpAnimation } from '@/hooks/useLerpAnimation';
import { useState, useCallback, useEffect, useRef } from 'react';
import ExpandedPanel from './ExpandedPanel';
import { ModeIcon, modeTitle, nextMode } from './ModeIcon';
import { PlayPauseIcon, NextIcon } from './Icons';
import { usePlayerContext } from '@/contexts/PlayerContext';
import './FloatingPlayer.css';
import type { CollapsedState, PlayerState, PlaylistState, WindowPosition, WindowSize, Track, FavoriteFolder } from '@/types';

const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 64;

interface FloatingPlayerProps {
  storage: {
    windowPosition: WindowPosition;
    windowSize: WindowSize;
    expandedPanelSize: WindowSize;
    favorites: FavoriteFolder[];
    recentTracks: Track[];
    setWindowPosition: (p: WindowPosition) => void;
    setWindowSize: (s: WindowSize) => void;
    setExpandedPanelSize: (s: WindowSize) => void;
  };
  playerState: PlayerState;
  playlistState: PlaylistState;
}

export default function FloatingPlayer({
  storage,
  playerState,
  playlistState,
}: FloatingPlayerProps) {
  const ctx = usePlayerContext();
  const [collapsedState, setCollapsedState] = useState<CollapsedState>('collapsed');
  const containerRef = useRef<HTMLDivElement>(null);
  const collapsedPosRef = useRef<{ x: number; y: number } | null>(null);
  const expandedSizeRef = useRef(storage.expandedPanelSize);

  // 当存储中的 expandedPanelSize 更新时，同步更新 ref
  useEffect(() => {
    const { width, height } = storage.expandedPanelSize;
    expandedSizeRef.current = { width, height };
  }, [storage.expandedPanelSize.width, storage.expandedPanelSize.height]);

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

  const { animating, startAnimation } = useLerpAnimation({
    onFrame: (w, h) => window.electronAPI.windowResize(w, h),
    onCollapseEnd: () => {
      setCollapsedState('collapsed');
      if (collapsedPosRef.current) {
        window.electronAPI.windowMove(collapsedPosRef.current.x, collapsedPosRef.current.y);
      }
      window.electronAPI.windowResize(THUMB_WIDTH, THUMB_HEIGHT);
      storage.setWindowSize({ width: THUMB_WIDTH, height: THUMB_HEIGHT });
    },
  });

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

  const { handleResizeStart } = useResize(
    storage.windowSize,
    (size) => storage.setWindowSize(size),
    (size) => {
      expandedSizeRef.current = size;
      storage.setExpandedPanelSize(size);
    },
  );

  const handleThumbClick = useCallback(async () => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }

    if (collapsedState === 'collapsed') {
      const pos = await window.electronAPI.windowGetPosition();
      collapsedPosRef.current = { x: pos.x, y: pos.y };

      // 使用保存的展开位置和大小
      const savedPos = storage.windowPosition;
      const remembered = expandedSizeRef.current;

      // 检查是否有有效的保存位置（非默认值且不为0）
      const hasSavedPosition = savedPos.left !== 0 && savedPos.top !== 0;

      let targetW = Math.min(remembered.width, window.screen.width - 40);
      let targetH = Math.min(remembered.height, window.screen.height - 40);

      let expandedX: number;
      let expandedY: number;

      if (hasSavedPosition) {
        // 使用保存的位置，但要确保在屏幕范围内
        expandedX = Math.max(20, Math.min(savedPos.left, window.screen.width - targetW - 20));
        expandedY = Math.max(20, Math.min(savedPos.top, window.screen.height - targetH - 20));
      } else {
        // 首次使用，基于缩略图位置计算
        const thumbCenterX = pos.x + THUMB_WIDTH / 2;
        expandedX = thumbCenterX - targetW / 2;
        expandedY = pos.y;
        expandedX = Math.max(20, Math.min(expandedX, window.screen.width - targetW - 20));
        expandedY = Math.max(20, Math.min(expandedY, window.screen.height - targetH - 20));
      }

      // 先移动窗口位置
      window.electronAPI.windowMove(expandedX, expandedY);
      // 再开始展开动画
      setCollapsedState('expanded');
      startAnimation('expand', { width: THUMB_WIDTH, height: THUMB_HEIGHT }, { width: targetW, height: targetH });
    } else {
      // 收起时保存当前展开位置
      const pos = await window.electronAPI.windowGetPosition();
      storage.setWindowPosition({ left: pos.x, top: pos.y });
      startAnimation('collapse', { width: storage.windowSize.width, height: storage.windowSize.height }, { width: THUMB_WIDTH, height: THUMB_HEIGHT });
    }
  }, [collapsedState, storage, didDrag, startAnimation]);

  const handleClose = useCallback(() => {
    startAnimation('collapse', { width: storage.windowSize.width, height: storage.windowSize.height }, { width: THUMB_WIDTH, height: THUMB_HEIGHT });
  }, [storage, startAnimation]);

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
            <button data-no-drag onClick={(e) => { e.stopPropagation(); ctx.onPlayPause(); }} title="播放/暂停">
              <PlayPauseIcon isPlaying={playerState.isPlaying} />
            </button>
            <button data-no-drag onClick={(e) => { e.stopPropagation(); ctx.onNext(); }} title="下一首">
              <NextIcon />
            </button>
            <button data-no-drag onClick={(e) => { e.stopPropagation(); ctx.onPlayModeChange(nextMode(playlistState.playMode)); }} title={modeTitle(playlistState.playMode)}>
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
            onClose={handleClose}
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
