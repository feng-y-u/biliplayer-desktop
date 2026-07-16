import type { Track } from '@/types';
import { isSameTrack } from '@/utils/track';
import { usePlayerContext } from '@/contexts/PlayerContext';
import recentStyles from './RecentTab.module.css';

interface RecentTabProps {
  recentTracks: Track[];
  currentAudio?: Track | null;
}

export default function RecentTab({ recentTracks, currentAudio }: RecentTabProps) {
  const ctx = usePlayerContext();
  return (
    <div className={recentStyles['ep-recent-list']}>
      {recentTracks.length > 0 ? recentTracks.map((track, i) => (
        <div
          className={`${recentStyles['ep-recent-item']}${currentAudio && isSameTrack(track, currentAudio) ? ` ${recentStyles.active}` : ''}`}
          key={`${track.bvid}-${track.cid}-${i}`}
          onClick={() => ctx.onPlayFromFavorite(track)}>
          <div className={recentStyles['ep-recent-dot']} />
          <div className={recentStyles['ep-recent-info']}>
            <div className={recentStyles['ep-recent-title']} title={track.title}>{track.title}</div>
            <div className={recentStyles['ep-recent-meta']}>{track.author}</div>
          </div>
        </div>
      )) : (
        <div className={recentStyles['ep-empty']}>暂无播放记录</div>
      )}
    </div>
  );
}
