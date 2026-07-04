import type { Track, FavoriteFolder } from '@/types';
import { isTrackFavorited, isSameTrack } from '@/utils/track';
import { usePlayerContext } from '@/contexts/PlayerContext';
import './Playlist.css';

interface RecentTabProps {
  recentTracks: Track[];
  currentAudio?: Track | null;
  favorites: FavoriteFolder[];
}

export default function RecentTab({ recentTracks, currentAudio, favorites }: RecentTabProps) {
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
          <button
            className={`pl-fav-btn${isTrackFavorited(track, favorites) ? ' favorited' : ''}`}
            onClick={(e) => { e.stopPropagation(); ctx.onToggleFavorite(track); }}
            title={isTrackFavorited(track, favorites) ? '取消收藏' : '收藏'}
          >
            {isTrackFavorited(track, favorites) ? '♥' : '♡'}
          </button>
        </div>
      )) : (
        <div className="ep-empty">暂无播放记录</div>
      )}
    </div>
  );
}
