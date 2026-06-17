import { useRef, useCallback } from 'react';
import './Playlist.css';
import type { Track, FavoriteFolder } from '@/types';

interface PlaylistProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  favorites: FavoriteFolder[];
  onPlayTrack: (index: number) => void;
  onDeleteTrack: (index: number) => void;
  onToggleFavorite: (track: Track) => void;
  onReorderTracks?: (fromIndex: number, toIndex: number) => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds || !isFinite(seconds)) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function isTrackFavorited(track: Track, favorites: FavoriteFolder[]): boolean {
  return favorites.some(f =>
    f.tracks.some(t => t.bvid === track.bvid && t.cid === track.cid)
  );
}

export default function Playlist({
  tracks,
  currentIndex,
  isPlaying,
  favorites,
  onPlayTrack,
  onDeleteTrack,
  onToggleFavorite,
  onReorderTracks,
}: PlaylistProps) {
  const dragIndex = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndex.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = index > (dragIndex.current ?? -1) ? '2px solid var(--accent)' : '';
    el.style.borderBottom = index <= (dragIndex.current ?? -1) ? '2px solid var(--accent)' : '';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = '';
    el.style.borderBottom = '';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = '';
    el.style.borderBottom = '';
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from !== null && from !== toIndex && onReorderTracks) {
      onReorderTracks(from, toIndex);
    }
  }, [onReorderTracks]);

  const handleDragEnd = useCallback(() => {
    dragIndex.current = null;
  }, []);

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
            key={`${track.bvid}-${index}`}
            className={`playlist-item${isActive ? ' active' : ''}`}
            data-no-drag
            draggable={!!onReorderTracks}
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
                <img src={`${track.cover}@40w_40h.jpg`} alt="" />
              ) : (
                <span>🎵</span>
              )}
            </div>
            <div className="pl-info">
              <div className="pl-title" title={track.title}>{track.title}</div>
              <div className="pl-artist">{track.author}</div>
            </div>
            <span className="pl-dur">{formatDuration(track.duration)}</span>
            {onToggleFavorite && (
              <button
                className={`pl-fav-btn${isTrackFavorited(track, favorites) ? ' favorited' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(track); }}
                title={isTrackFavorited(track, favorites) ? '取消收藏' : '收藏'}
              >
                {isTrackFavorited(track, favorites) ? '♥' : '♡'}
              </button>
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
