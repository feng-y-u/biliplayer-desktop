import { useResize } from '@/hooks/useResize';
import { useLerpAnimation } from '@/hooks/useLerpAnimation';
import { useFloatingPlayerDrag } from '@/hooks/useFloatingPlayerDrag';
import { useState, useCallback, useEffect, useRef } from 'react';
import ExpandedPanel from './ExpandedPanel';
import PlayerThumb from './PlayerThumb';
import { usePlayerContext } from '@/contexts/PlayerContext';
import './FloatingPlayer.css';
import type { PlayerState, PlaylistState, WindowSize, Track, FavoriteFolder } from '@/types';

const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 64;
const FALLBACK_SIZE: WindowSize = { width: 330, height: 700 };

interface FloatingPlayerProps {
  storage: {
    windowPosition: { left: number; top: number };
    windowSize: WindowSize;
    expandedPanelSize: WindowSize | null;
    favorites: FavoriteFolder[];
    recentTracks: Track[];
    setWindowPosition: (p: { left: number; top: number }) => void;
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
  const [expanded, setExpanded] = useState(false);
  const collapsedPosRef = useRef<{ x: number; y: number } | null>(null);
  // 用于收起时获取最后已知的展开大小（zustand 更新可能有延迟）
  const lastExpandSizeRef = useRef(storage.expandedPanelSize ?? FALLBACK_SIZE);

  useEffect(() => {
    if (storage.expandedPanelSize) {
      lastExpandSizeRef.current = storage.expandedPanelSize;
    }
  }, [storage.expandedPanelSize]);

  const { handleMouseDown, wasDragging } = useFloatingPlayerDrag(expanded, storage.setWindowPosition);

  const pickExpandSize = useCallback(() => {
    return storage.expandedPanelSize ?? lastExpandSizeRef.current;
  }, [storage.expandedPanelSize]);

  const { handleResizeStart } = useResize(
    storage.expandedPanelSize ?? FALLBACK_SIZE,
    (size) => {
      lastExpandSizeRef.current = size;
      storage.setWindowSize(size);
      storage.setExpandedPanelSize(size);
    },
  );

  const { animating, startAnimation } = useLerpAnimation({
    onFrame: (w, h) => window.electronAPI.windowResize(w, h),
    onCollapseEnd: () => {
      setExpanded(false);
      if (collapsedPosRef.current) {
        window.electronAPI.windowMove(collapsedPosRef.current.x, collapsedPosRef.current.y);
      }
      window.electronAPI.windowResize(THUMB_WIDTH, THUMB_HEIGHT);
      storage.setWindowSize({ width: THUMB_WIDTH, height: THUMB_HEIGHT });
    },
  });

  // 挂载时初始化窗口为缩略图大小，恢复保存的位置
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

  const handleExpand = useCallback(async () => {
    const pos = await window.electronAPI.windowGetPosition();
    collapsedPosRef.current = { x: pos.x, y: pos.y };

    const savedPos = storage.windowPosition;
    const expSize = pickExpandSize();
    lastExpandSizeRef.current = expSize;

    let targetW = Math.min(expSize.width, window.screen.width - 40);
    let targetH = Math.min(expSize.height, window.screen.height - 40);

    const hasSavedPosition = savedPos.left !== 0 && savedPos.top !== 0;
    let expandedX: number;
    let expandedY: number;

    if (hasSavedPosition) {
      expandedX = Math.max(20, Math.min(savedPos.left, window.screen.width - targetW - 20));
      expandedY = Math.max(20, Math.min(savedPos.top, window.screen.height - targetH - 20));
    } else {
      expandedX = Math.max(20, Math.min(pos.x + THUMB_WIDTH / 2 - targetW / 2, window.screen.width - targetW - 20));
      expandedY = Math.max(20, Math.min(pos.y, window.screen.height - targetH - 20));
    }

    window.electronAPI.windowMove(expandedX, expandedY);
    setExpanded(true);
    startAnimation('expand', { width: THUMB_WIDTH, height: THUMB_HEIGHT }, { width: targetW, height: targetH });
  }, [storage, pickExpandSize, startAnimation]);

  const handleCollapse = useCallback(async () => {
    const pos = await window.electronAPI.windowGetPosition();
    storage.setWindowPosition({ left: pos.x, top: pos.y });
    storage.setExpandedPanelSize({ width: pos.width, height: pos.height });
    startAnimation('collapse', { width: pos.width, height: pos.height }, { width: THUMB_WIDTH, height: THUMB_HEIGHT });
  }, [storage, startAnimation]);

  const handleThumbClick = useCallback(async () => {
    if (wasDragging.current) {
      wasDragging.current = false;
      return;
    }
    if (expanded) await handleCollapse();
    else await handleExpand();
  }, [expanded, wasDragging, handleExpand, handleCollapse]);

  const handleClose = useCallback(async () => {
    const pos = await window.electronAPI.windowGetPosition();
    storage.setExpandedPanelSize({ width: pos.width, height: pos.height });
    startAnimation('collapse', { width: pos.width, height: pos.height }, { width: THUMB_WIDTH, height: THUMB_HEIGHT });
  }, [storage, startAnimation]);

  return (
    <div
      className={[
        'float-player',
        expanded && !animating && 'expanded',
        animating === 'expand' && 'animating-expand',
        animating === 'collapse' && 'animating-collapse',
        playerState.isPlaying && 'playing',
      ].filter(Boolean).join(' ')}
      onMouseDown={handleMouseDown}
    >
      {!expanded && (
        <PlayerThumb
          isPlaying={playerState.isPlaying}
          currentAudio={playerState.currentAudio}
          playMode={playlistState.playMode}
          onPlayPause={ctx.onPlayPause}
          onNext={ctx.onNext}
          onPlayModeChange={ctx.onPlayModeChange}
          onClick={handleThumbClick}
        />
      )}

      {(expanded || animating === 'collapse') && (
        <div className="expanded-panel">
          <ExpandedPanel
            currentAudio={playerState.currentAudio}
            currentTime={playerState.currentTime}
            duration={playerState.duration}
            buffered={playerState.buffered}
            isPlaying={playerState.isPlaying}
            volume={playerState.volume}
            tracks={playlistState.tracks}
            currentIndex={playlistState.currentIndex}
            playMode={playlistState.playMode}
            favorites={storage.favorites}
            recentTracks={storage.recentTracks}
            onClose={handleClose}
          />
          {expanded && (
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