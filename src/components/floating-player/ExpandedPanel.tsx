import { useCallback, useRef, useState } from 'react';
import './ExpandedPanel.css';
import Playlist from './Playlist';
import { ModeIcon, modeTitle, nextMode } from './ModeIcon';
import type { Track, PlayMode, FavoriteFolder } from '@/types';

interface ExpandedPanelProps {
  currentAudio?: { bvid: string; cid: number; title: string; author: string; cover: string } | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  tracks: Track[];
  currentIndex: number;
  playMode: PlayMode;
  favorites: FavoriteFolder[];
  recentTracks: Track[];
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  onPlayTrack: (index: number) => void;
  onDeleteTrack: (index: number) => void;
  onMoveTrackUp: (index: number) => void;
  onPlayModeChange: (mode: PlayMode) => void;
  onClose: () => void;
  onInputSubmit: (input: string) => void;
  onCreateFavorite: (name: string) => void;
  onAddTrackToFavorite: (favId: string, track: Track) => void;
}

export default function ExpandedPanel({
  currentAudio,
  currentTime,
  duration,
  isPlaying,
  tracks,
  currentIndex,
  playMode,
  favorites,
  recentTracks,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onPlayTrack,
  onDeleteTrack,
  onMoveTrackUp,
  onPlayModeChange,
  onClose,
  onInputSubmit,
  onCreateFavorite,
  onAddTrackToFavorite,
  volume,
  onVolumeChange,
}: ExpandedPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState<'playlist' | 'favs' | 'recent'>('playlist');
  const prevVolume = useRef(0.7);

  const formatTime = (s: number) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progValue = duration ? (currentTime / duration) * 100 : 0;

  const handleCreateFav = useCallback(() => {
    const name = prompt('收藏夹名称：');
    if (name?.trim()) onCreateFavorite(name.trim());
  }, [onCreateFavorite]);

  const handleAddToFav = useCallback(() => {
    if (!currentAudio) return;
    if (favorites.length === 0) {
      handleCreateFav();
      return;
    }
    const names = favorites.map((f, i) => `${i + 1}. ${f.name}`).join('\n');
    const choice = prompt(`选择收藏夹添加当前歌曲：\n${names}\n\n输入编号：`);
    if (choice) {
      const idx = parseInt(choice) - 1;
      if (idx >= 0 && idx < favorites.length) {
        onAddTrackToFavorite(favorites[idx]!.id, {
          bvid: currentAudio.bvid, cid: currentAudio.cid,
          title: currentAudio.title, author: currentAudio.author, cover: currentAudio.cover,
        });
      }
    }
  }, [currentAudio, favorites, onAddTrackToFavorite, handleCreateFav]);

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onInputSubmit(trimmed);
      setInputValue('');
    }
  }, [inputValue, onInputSubmit]);

  return (
    <div className="expanded-panel open">
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
          <div className="ep-np-cover">
            {currentAudio.cover ? (
              <img src={currentAudio.cover} alt="" />
            ) : (
              <span>♪</span>
            )}
          </div>
          <div className="ep-np-info">
            <div className="ep-np-title">{currentAudio.title}</div>
            <div className="ep-np-artist">{currentAudio.author}</div>
          </div>
        </div>
      )}
      {!currentAudio && (
        <div className="ep-now-playing">
          <div className="ep-np-empty">暂无播放</div>
        </div>
      )}

      <div className="ep-controls" data-no-drag>
        <button className="ep-mode-btn" onClick={() => onPlayModeChange(nextMode(playMode))} title={modeTitle(playMode)}>
          <ModeIcon mode={playMode} />
        </button>

        <div className="ep-ctrl-center">
          <button className="ep-ctrl-btn" onClick={onPrev} title="上一首">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
          </button>
          <button className="ep-play-btn" onClick={onPlayPause} title="播放/暂停">
            <svg viewBox="0 0 24 24" fill="currentColor">
              {isPlaying
                ? <><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></>
                : <path d="M8 5v14l11-7z" />
              }
            </svg>
          </button>
          <button className="ep-ctrl-btn" onClick={onNext} title="下一首">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
          </button>
        </div>

        <button className="ep-vol-btn" onClick={() => {
          if (volume > 0) { prevVolume.current = volume; onVolumeChange(0); }
          else onVolumeChange(prevVolume.current);
        }} title={volume > 0 ? '静音' : '恢复音量'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {volume > 0 ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </>
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            )}
          </svg>
        </button>
        <input className="ep-vol-slider" type="range" min={0} max={1} step={0.01} value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        />
      </div>

      <div className="ep-progress" data-no-drag>
        <div className="ep-prog-bar">
          <div className="ep-prog-fill" style={{ width: `${progValue}%` }} />
          <input type="range" min={0} max={100} step={0.1} value={progValue}
            onChange={(e) => { if (duration) onSeek((parseFloat(e.target.value) / 100) * duration); }}
          />
        </div>
        <div className="ep-times">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="ep-input-row" data-no-drag>
        <input type="text" placeholder="BV 号或收藏夹链接" value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <button onClick={handleSubmit}>添加</button>
      </div>

      <div className="ep-tabs" data-no-drag>
        <button className={`ep-tab ${activeTab === 'playlist' ? 'active' : ''}`} onClick={() => setActiveTab('playlist')}>
          播放列表 ({tracks.length})
        </button>
        <button className={`ep-tab ${activeTab === 'favs' ? 'active' : ''}`} onClick={() => setActiveTab('favs')}>
          收藏夹
        </button>
        <button className={`ep-tab ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
          最近
        </button>
      </div>

      <div className="ep-content" data-no-drag>
        {activeTab === 'playlist' && (
          <>
            {currentAudio && (
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                <button className="ep-ctrl-btn" onClick={handleAddToFav} title="添加当前歌曲到收藏夹"
                  style={{ width: 'auto', padding: '0 12px', gap: '6px', fontSize: '11px', borderRadius: '8px', background: 'var(--surface-hover)' }}>
                  <span>+</span> 收藏
                </button>
              </div>
            )}
            <Playlist
              tracks={tracks}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              onPlayTrack={onPlayTrack}
              onDeleteTrack={onDeleteTrack}
              onMoveTrackUp={onMoveTrackUp}
            />
          </>
        )}

        {activeTab === 'favs' && (
          <div className="ep-fav-grid">
            {favorites.map(fav => (
              <div className="ep-fav-card" key={fav.id} onClick={() => {}}>
                <div className="ep-fav-icon" style={{ background: fav.icon.length <= 2 ? 'var(--accent)' : fav.icon }}>
                  {fav.icon.length <= 2 ? fav.icon : '♪'}
                </div>
                <div className="ep-fav-name">{fav.name}</div>
                <div className="ep-fav-meta">{fav.tracks.length} 首</div>
              </div>
            ))}
            <div className="ep-fav-card" onClick={() => {
              const name = prompt('收藏夹名称：');
              if (name?.trim()) onCreateFavorite(name.trim());
            }}>
              <div className="ep-fav-icon" style={{ background: 'var(--border)' }}>+</div>
              <div className="ep-fav-name">新建收藏夹</div>
            </div>
          </div>
        )}

        {activeTab === 'recent' && (
          <div className="ep-recent-list">
            {recentTracks.length > 0 ? recentTracks.map((track, i) => (
              <div
                className={`ep-recent-item ${track.bvid === currentAudio?.bvid && track.cid === currentAudio?.cid ? 'active' : ''}`}
                key={`${track.bvid}-${track.cid}-${i}`}
                onClick={() => {
                  const plIndex = tracks.findIndex(t => t.bvid === track.bvid && t.cid === track.cid);
                  if (plIndex >= 0) onPlayTrack(plIndex);
                }}
              >
                <div className="ep-recent-dot" />
                <div className="ep-recent-info">
                  <div className="ep-recent-title">{track.title}</div>
                  <div className="ep-recent-meta">{track.author}</div>
                </div>
              </div>
            )) : (
              <div className="ep-empty">暂无播放记录</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
