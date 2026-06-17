import './Playlist.css';
import type { Track, FavoriteFolder } from '@/types';

interface PlaylistProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  favorites: FavoriteFolder[];
  onPlayTrack: (index: number) => void;
  onDeleteTrack: (index: number) => void;
  onMoveTrackUp: (index: number) => void;
  onToggleFavorite: (track: Track) => void;
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
  onMoveTrackUp,
  onToggleFavorite,
}: PlaylistProps) {
  if (tracks.length === 0) {
    return <div className="playlist"></div>;
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
              <div className="pl-title">{track.title}</div>
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
              <button onClick={() => onMoveTrackUp(index)} title="置顶">↑</button>
              <button onClick={() => onDeleteTrack(index)} title="删除">✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
