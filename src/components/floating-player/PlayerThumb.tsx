import { ModeIcon, modeTitle, nextMode } from './ModeIcon';
import { PlayPauseIcon, NextIcon } from './Icons';
import type { PlayMode, CurrentAudio } from '@/types';
import './PlayerThumb.css';

interface PlayerThumbProps {
  isPlaying: boolean;
  currentAudio: CurrentAudio | null;
  playMode: PlayMode;
  onPlayPause: () => void;
  onNext: () => void;
  onPlayModeChange: (mode: PlayMode) => void;
  onClick: () => void;
}

export default function PlayerThumb({
  isPlaying,
  currentAudio,
  playMode,
  onPlayPause,
  onNext,
  onPlayModeChange,
  onClick,
}: PlayerThumbProps) {
  return (
    <>
      <div className="hover-bar">
        <button data-no-drag onClick={(e) => { e.stopPropagation(); onPlayPause(); }} title="播放/暂停">
          <PlayPauseIcon isPlaying={isPlaying} />
        </button>
        <button data-no-drag onClick={(e) => { e.stopPropagation(); onNext(); }} title="下一首">
          <NextIcon />
        </button>
        <button data-no-drag onClick={(e) => { e.stopPropagation(); onPlayModeChange(nextMode(playMode)); }} title={modeTitle(playMode)}>
          <ModeIcon mode={playMode} />
        </button>
      </div>
      <div className={`player-thumb${isPlaying ? ' playing' : ''}`} onClick={onClick}>
        {currentAudio?.cover ? (
          <div className="thumb-inner" style={{ backgroundImage: `url(${currentAudio.cover})` }} />
        ) : (
          <span className="note-icon">♪</span>
        )}
      </div>
    </>
  );
}
