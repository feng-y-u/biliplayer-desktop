import './Playlist.css';
import type { Track } from '@/types';

interface PlaylistProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onPlayTrack: (index: number) => void;
  onDeleteTrack: (index: number) => void;
  onMoveTrackUp: (index: number) => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds || !isFinite(seconds)) return '--:--';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function Playlist({
  tracks,
  currentIndex,
  onPlayTrack,
  onDeleteTrack,
  onMoveTrackUp,
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
            <span className="pl-idx">{String(index + 1).padStart(2, '0')}</span>
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
