import { useState, useRef, useCallback, useEffect } from 'react';
import ExpandedPanel from './ExpandedPanel';
import { ModeIcon, modeTitle, nextMode } from './ModeIcon';
import './FloatingPlayer.css';
import type { CollapsedState, PlayerState, PlaylistState, PlayMode, WindowPosition, Track, FavoriteFolder } from '@/types';

const DRAG_THRESHOLD = 5;

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
  const dragState = useRef({
    active: false,
    dragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const wp = storage.windowPosition;
  const wpRef = useRef(wp);
  wpRef.current = wp;

  useEffect(() => {
    if (!containerRef.current) return;
    if (wp.left === 0 && wp.top === 0) {
      const defaultLeft = window.innerWidth - 80;
      const defaultTop = (window.innerHeight - 56) / 2;
      containerRef.current.style.left = `${defaultLeft}px`;
      containerRef.current.style.top = `${defaultTop}px`;
      storage.setWindowPosition({ ...wp, left: defaultLeft, top: defaultTop });
    } else {
      containerRef.current.style.left = `${wp.left}px`;
      containerRef.current.style.top = `${wp.top}px`;
    }
  }, []);

  const didDrag = useRef(false);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const ds = dragState.current;
      if (!ds.active) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      if (!ds.dragging) {
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          ds.dragging = true;
          didDrag.current = true;
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        }
        return;
      }
      if (!containerRef.current) return;
      containerRef.current.style.left = `${e.clientX - ds.offsetX}px`;
      containerRef.current.style.top = `${e.clientY - ds.offsetY}px`;
    }

    function onMouseUp() {
      const ds = dragState.current;
      if (!ds.active) return;
      if (ds.dragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const finalX = window.innerWidth - rect.width;
        const curTop = parseFloat(containerRef.current.style.top);
        const finalY = Math.max(0, Math.min(curTop, window.innerHeight - rect.height));
        containerRef.current.style.left = `${finalX}px`;
        containerRef.current.style.top = `${finalY}px`;
        storage.setWindowPosition({ ...wpRef.current, left: finalX, top: finalY });
      }
      ds.active = false;
      ds.dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragState.current.active = true;
      dragState.current.dragging = false;
      dragState.current.startX = e.clientX;
      dragState.current.startY = e.clientY;
      dragState.current.offsetX = e.clientX - rect.left;
      dragState.current.offsetY = e.clientY - rect.top;
    },
    [],
  );

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
              <button data-no-drag onClick={() => onPlayModeChange(nextMode(playlistState.playMode))} title={modeTitle(playlistState.playMode)}>
                <ModeIcon mode={playlistState.playMode} />
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
