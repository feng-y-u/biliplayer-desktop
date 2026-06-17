import type { Track } from '@/types';

interface RecentTabProps {
  recentTracks: Track[];
  currentAudio?: Track | null;
  onPlayTrack: (track: Track) => void;
}

export default function RecentTab({ recentTracks, currentAudio, onPlayTrack }: RecentTabProps) {
  return (
    <div className="ep-recent-list">
      {recentTracks.length > 0 ? recentTracks.map((track, i) => (
        <div
          className={`ep-recent-item ${track.bvid === currentAudio?.bvid && track.cid === currentAudio?.cid ? 'active' : ''}`}
          key={`${track.bvid}-${track.cid}-${i}`}
          onClick={() => onPlayTrack(track)}>
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
  );
}
