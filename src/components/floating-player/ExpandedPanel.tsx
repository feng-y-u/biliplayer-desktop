import { useCallback, useEffect, useRef, useState } from 'react';
import './panel.css';
import './controls.css';
import panelStyles from './ExpandedPanel.module.css';
import Playlist from './Playlist';
import FavoritesTab from './FavoritesTab';
import RecentTab from './RecentTab';
import { ModeIcon, modeTitle, nextMode } from './ModeIcon';
import { PlayPauseIcon, PrevTrackIcon, NextIcon, VolumeIcon } from './Icons';
import type { Track, PlayMode, FavoriteFolder, CurrentAudio } from '@/types';
import { formatDuration, calcProgress } from '@/utils/format';
import { usePlayerContext } from '@/contexts/PlayerContext';

interface ExpandedPanelProps {
  currentAudio?: CurrentAudio | null;
  currentTime: number;
  duration: number;
  buffered: number;
  isPlaying: boolean;
  volume: number;
  tracks: Track[];
  currentIndex: number;
  playMode: PlayMode;
  favorites: FavoriteFolder[];
  recentTracks: Track[];
  onClose: () => void;
}

export default function ExpandedPanel({
  currentAudio,
  currentTime,
  duration,
  buffered,
  isPlaying,
  tracks,
  currentIndex,
  playMode,
  favorites,
  recentTracks,
  onClose,
  volume,
}: ExpandedPanelProps) {
  const ctx = usePlayerContext();
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'playlist' | 'favs' | 'recent'>('playlist');
  const [seekingValue, setSeekingValue] = useState<number | null>(null);
  const prevVolume = useRef(volume);

  // Keep prevVolume in sync with actual volume (except when muted)
  useEffect(() => {
    if (volume > 0) prevVolume.current = volume;
  }, [volume]);

  const rawProg = calcProgress(currentTime, duration);
  const progValue = seekingValue ?? rawProg;
  const bufPct = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      ctx.onInputSubmit(trimmed);
      setInputValue('');
    }
  }, [inputValue, ctx.onInputSubmit]);

  return (
    <div className="expanded-panel open">
      {ctx.notification && <div className="ep-notification">{ctx.notification}</div>}
      <div className="ep-top-bar">
        <h3>Piliplayer</h3>
        <div className="ep-top-btns" data-no-drag>
          <button className="ep-top-btn" onClick={onClose} title="收起">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {currentAudio && (
        <div className="ep-now-playing">
          <div className="ep-np-bg" style={{ backgroundImage: `url(${currentAudio.cover})` }} />
          <div className="ep-np-content">
            <div className="ep-np-cover">
              {currentAudio.cover ? (
                <img src={currentAudio.cover} alt="" />
              ) : (
                <span>♪</span>
              )}
            </div>
            <div className="ep-np-title" title={currentAudio.title}>{currentAudio.title}</div>
            <div className="ep-np-artist">{currentAudio.author}</div>
          </div>
        </div>
      )}
      {!currentAudio && (
        <div className="ep-now-playing">
          <div className="ep-np-bg" style={{ backgroundImage: 'url(player_256x256.ico)' }} />
          <div className="ep-np-content">
            <div className="ep-np-cover">
              <img src="player_256x256.ico" alt="Piliplayer" />
            </div>
          </div>
        </div>
      )}

      <div className="ep-controls" data-no-drag>
        <button className="ep-mode-btn" onClick={() => ctx.onPlayModeChange(nextMode(playMode))} title={modeTitle(playMode)}>
          <ModeIcon mode={playMode} />
        </button>

        <div className="ep-ctrl-center">
          <button className="ep-ctrl-btn" onClick={ctx.onPrev} title="上一首">
            <PrevTrackIcon />
          </button>
          <button className="ep-play-btn" onClick={ctx.onPlayPause} title="播放/暂停">
            <PlayPauseIcon isPlaying={isPlaying} />
          </button>
          <button className="ep-ctrl-btn" onClick={ctx.onNext} title="下一首">
            <NextIcon />
          </button>
        </div>

        <button className="ep-vol-btn" onClick={() => {
          if (volume > 0) { prevVolume.current = volume; ctx.onVolumeChange(0); }
          else ctx.onVolumeChange(prevVolume.current);
        }} title={volume > 0 ? '静音' : '恢复音量'}>
          <VolumeIcon muted={volume === 0} />
        </button>
        <input className="ep-vol-slider" type="range" min={0} max={1} step={0.01} value={volume}
          style={{ '--vol-pct': `${volume * 100}%` } as React.CSSProperties}
          onChange={(e) => ctx.onVolumeChange(parseFloat(e.target.value))}
        />
      </div>

      <div className="ep-progress" data-no-drag>
        <div className="ep-prog-bar">
          <div className="ep-prog-buf" style={{ width: `${bufPct}%` }} />
          <div className="ep-prog-fill" style={{ width: `${progValue}%` }} />
          <input type="range" min={0} max={100} step={0.1} value={progValue}
            onChange={(e) => { const v = parseFloat(e.target.value); setSeekingValue(v); if (duration) ctx.onSeek((v / 100) * duration); }}
            onMouseUp={() => setSeekingValue(null)}
            onMouseLeave={() => setSeekingValue(null)}
          />
        </div>
        <div className="ep-times">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>

      <div className={panelStyles['ep-input-row']} data-no-drag>
        <input type="text" placeholder="BV号 / 收藏夹ID / 合集链接" value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <button onClick={handleSubmit} disabled={ctx.loading}>
          {ctx.loading ? <><span className="ep-spinner" />加载中</> : '添加'}
        </button>
      </div>

      <div className={panelStyles['ep-tabs']} data-no-drag>
        <button className={`${panelStyles['ep-tab']}${activeTab === 'playlist' ? ` ${panelStyles.active}` : ''}`} onClick={() => setActiveTab('playlist')}>
          播放列表 ({tracks.length})
        </button>
        <button className={`${panelStyles['ep-tab']}${activeTab === 'favs' ? ` ${panelStyles.active}` : ''}`} onClick={() => setActiveTab('favs')}>
          收藏夹
        </button>
        <button className={`${panelStyles['ep-tab']}${activeTab === 'recent' ? ` ${panelStyles.active}` : ''}`} onClick={() => setActiveTab('recent')}>
          最近
        </button>
        {activeTab === 'playlist' && tracks.length > 0 && (
          <button className={panelStyles['ep-tab-clear']} onClick={ctx.onClearPlaylist} title="清空播放列表">清空</button>
        )}
      </div>

      <div className={panelStyles['ep-content']} data-no-drag>
        {activeTab === 'playlist' && (
          <Playlist
            tracks={tracks}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            favorites={favorites}
            onPlayTrack={ctx.onPlayTrack}
            onDeleteTrack={ctx.onDeleteTrack}
          />
        )}

        {activeTab === 'favs' && (
          <FavoritesTab favorites={favorites} />
        )}

        {activeTab === 'recent' && (
          <RecentTab recentTracks={recentTracks} currentAudio={currentAudio} />
        )}
      </div>
    </div>
  );
}
