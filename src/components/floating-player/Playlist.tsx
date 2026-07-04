import { useRef, useState, useEffect } from 'react';
import './Playlist.css';
import type { Track, FavoriteFolder } from '@/types';
import { formatDuration } from '@/utils/format';
import { useDragReorder } from '@/hooks/useDragReorder';
import { usePlayerContext } from '@/contexts/PlayerContext';

const THUMBNAIL_SIZE = 40;

interface PlaylistProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  favorites: FavoriteFolder[];
  onPlayTrack: (index: number) => void;
  onDeleteTrack: (index: number) => void;
}

export default function Playlist({
  tracks,
  currentIndex,
  isPlaying,
  favorites,
  onPlayTrack,
  onDeleteTrack,
}: PlaylistProps) {
  const ctx = usePlayerContext();
  const [dropdownTrackIdx, setDropdownTrackIdx] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragReorder({
    onReorder: (from, to) => ctx.onReorderTracks(from, to),
  });

  // Close dropdown on click outside
  useEffect(() => {
    if (dropdownTrackIdx === null) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownTrackIdx(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownTrackIdx]);

  if (tracks.length === 0) {
    return (
      <div className="playlist" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="ep-empty" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px', color: 'var(--fg-2)' }}>♪</div>
          <div style={{ color: 'var(--fg-2)' }}>播放列表为空</div>
          <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--fg-3)' }}>在上方输入 BV 号或收藏夹链接添加歌曲</div>
        </div>
      </div>
    );
  }

  return (
    <div className="playlist">
      {tracks.map((track, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={`${track.bvid}-${track.cid}`}
            className={`playlist-item${isActive ? ' active' : ''}`}
            data-no-drag
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onPlayTrack(index)}
          >
            <span className="pl-idx">
              {isActive ? (
                <span className={`pl-status-icon${isPlaying ? ' playing' : ''}`}>
                  {isPlaying ? '▶' : '▎▎'}
                </span>
              ) : (
                String(index + 1).padStart(2, '0')
              )}
            </span>
            <div
              className="pl-thumb"
              style={{ background: track.cover ? undefined : 'linear-gradient(135deg,#6366f1,var(--accent))' }}
            >
              {track.cover ? (
                <img src={`${track.cover}@${THUMBNAIL_SIZE}w_${THUMBNAIL_SIZE}h.jpg`} alt="" />
              ) : (
                <span>🎵</span>
              )}
            </div>
            <div className="pl-info">
              <div className="pl-title" title={track.title}>{track.title}</div>
              <div className="pl-artist">{track.author}</div>
            </div>
            <span className="pl-dur">{formatDuration(track.duration)}</span>
            {favorites.length > 0 && (
              <div className="pl-fav-dropdown-wrapper" style={{ position: 'relative', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button
                  className="pl-fav-dropdown-toggle"
                  onClick={(e) => { e.stopPropagation(); setDropdownTrackIdx(prev => prev === index ? null : index); }}
                  title="添加到收藏夹"
                >▼</button>
                {dropdownTrackIdx === index && (
                  <div className="pl-fav-dropdown" ref={dropdownRef}>
                    {favorites.map(f => (
                      <div key={f.id} className="pl-fav-dropdown-item" onClick={() => { ctx.onAddToFavorite(f.id, track); setDropdownTrackIdx(null); }}>
                        <span className="pl-fav-dropdown-item-name">{f.name}</span>
                        <span className="pl-fav-dropdown-item-count">{f.tracks.length} 首</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="pl-actions" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onDeleteTrack(index)} title="删除">✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
