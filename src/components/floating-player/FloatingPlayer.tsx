import { useState, useCallback, useEffect, useRef } from 'react';
import ExpandedPanel from './ExpandedPanel';
import './FloatingPlayer.css';
import type { CollapsedState, PlayerState, PlaylistState, PlayMode, WindowPosition, Track, FavoriteFolder } from '@/types';

const WIN_W = 320;
const WIN_H = 480;

interface FloatingPlayerProps {
  storage: {
    volume: number;
    playMode: PlayMode;
    tracks: Track[];
    currentIndex: number;
    windowPosition: WindowPosition;
    favorites: FavoriteFolder[];
    recentTracks: Track[];
    setVolume: (v: number) => void;
    setPlayMode: (p: PlayMode) => void;
    setTracks: (t: Track[]) => void;
    setCurrentIndex: (i: number) => void;
    setWindowPosition: (p: WindowPosition) => void;
  };
  playerState: PlayerState;
  playlistState: PlaylistState;
  onPlayPause: () => void;
  onPlayTrack: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  onDeleteTrack: (index: number) => void;
  onMoveTrackUp: (index: number) => void;
  onPlayModeChange: (mode: PlayMode) => void;
  onInputSubmit: (input: string) => void;
  onCreateFavorite: (name: string) => void;
  onAddTrackToFavorite: (favId: string, track: Track) => void;
}

export default function FloatingPlayer({
  storage,
  playerState,
  playlistState,
  onPlayPause,
  onPlayTrack,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onDeleteTrack,
  onMoveTrackUp,
  onPlayModeChange,
  onInputSubmit: _onInputSubmit,
  onCreateFavorite,
  onAddTrackToFavorite,
}: FloatingPlayerProps) {
  const [collapsedState, setCollapsedState] = useState<CollapsedState>('collapsed');
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);
  const dragSession = useRef<{
    startScreenX: number;
    startScreenY: number;
    startWinX: number;
    startWinY: number;
    dragging: boolean;
  } | null>(null);

  // Set window size and restore position on mount
  useEffect(() => {
    (async () => {
      const api = window.electronAPI;
      await api.windowResize(WIN_W, WIN_H);
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
      const s = dragSession.current;
      if (!s) return;

      const dx = e.screenX - s.startScreenX;
      const dy = e.screenY - s.startScreenY;

      if (!s.dragging) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        s.dragging = true;
        didDrag.current = true;
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }

      window.electronAPI.windowMove(s.startWinX + dx, s.startWinY + dy);
    }

    function onMouseUp() {
      const s = dragSession.current;
      if (!s) return;
      dragSession.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      if (s.dragging) {
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (collapsedState === 'expanded') return;
    dragSession.current = {
      startScreenX: e.screenX,
      startScreenY: e.screenY,
      startWinX: window.screenX,
      startWinY: window.screenY,
      dragging: false,
    };
    didDrag.current = false;
  }, [collapsedState]);

  const handleThumbClick = useCallback(() => {
    if (didDrag.current) {
      didDrag.current = false;
      return;
    }
    setCollapsedState((prev) => (prev === 'expanded' ? 'collapsed' : 'expanded'));
  }, []);

  const handleClose = useCallback(() => {
    setCollapsedState('collapsed');
    setHovered(false);
  }, []);

  // Click outside to collapse
  useEffect(() => {
    if (collapsedState !== 'expanded') return;
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current?.contains(target)) return;
      if (target.closest('.expanded-panel')) return;
      setCollapsedState('collapsed');
      setHovered(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [collapsedState]);

  return (
    <div
      ref={containerRef}
      className="float-player"
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (collapsedState !== 'expanded') setHovered(false); }}
    >
      {collapsedState !== 'expanded' && (
        <>
          <div className={`player-thumb${playerState.isPlaying ? ' playing' : ''}`} onClick={handleThumbClick}>
            {playerState.currentAudio?.cover ? (
              <img className="cover-img" src={playerState.currentAudio.cover} alt="" />
            ) : (
              <span className="note-icon">♪</span>
            )}
          </div>

          {hovered && (
            <div className="hover-bar visible">
              <button data-no-drag onClick={onPlayPause} title="播放/暂停">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  {playerState.isPlaying
                    ? <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>
                    : <path d="M8 5v14l11-7z" />
                  }
                </svg>
              </button>
              <button data-no-drag onClick={onNext} title="下一首">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
              </button>
              <button data-no-drag onClick={() => onPlayModeChange(playlistState.playMode === 'loop' ? 'shuffle' : playlistState.playMode === 'shuffle' ? 'single' : 'loop')} title="播放模式">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 17H7v-2h10v2zm-5-8H7v2h5V9zm12 3c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2s10 4.5 10 10z"/></svg>
              </button>
            </div>
          )}
        </>
      )}

      {collapsedState === 'expanded' && (
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
          onPlayPause={onPlayPause}
          onPrev={onPrev}
          onNext={onNext}
          onSeek={onSeek}
          onVolumeChange={onVolumeChange}
          onPlayTrack={onPlayTrack}
          onDeleteTrack={onDeleteTrack}
          onMoveTrackUp={onMoveTrackUp}
          onPlayModeChange={onPlayModeChange}
          onClose={handleClose}
          onInputSubmit={_onInputSubmit}
          onCreateFavorite={onCreateFavorite}
          onAddTrackToFavorite={onAddTrackToFavorite}
        />
      )}
    </div>
  );
}
