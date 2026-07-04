import type { Track } from '@/types';
import { isSameTrack } from '@/utils/track';
import { usePlayerContext } from '@/contexts/PlayerContext';
import './Playlist.css';

interface RecentTabProps {
  recentTracks: Track[];
  currentAudio?: Track | null;
}

export default function RecentTab({ recentTracks, currentAudio }: RecentTabProps) {
  const ctx = usePlayerContext();
  return (
    <div className="ep-recent-list">
      {recentTracks.length > 0 ? recentTracks.map((track, i) => (
        <div
          className={`ep-recent-item ${currentAudio && isSameTrack(track, currentAudio) ? 'active' : ''}`}
          key={`${track.bvid}-${track.cid}-${i}`}
          onClick={() => ctx.onPlayFromFavorite(track)}>
          <div className="ep-recent-dot" />
          <div className="ep-recent-info">
            <div className="ep-recent-title" title={track.title}>{track.title}</div>
            <div className="ep-recent-meta">{track.author}</div>
          </div>
        </div>
      )) : (
        <div className="ep-empty">暂无播放记录</div>
      )}
    </div>
  );
}
