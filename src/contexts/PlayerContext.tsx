// src/contexts/PlayerContext.tsx
import { createContext, useContext } from 'react';
import type { Track, PlayMode } from '@/types';

export interface PlayerContextValue {
  // 播放控制
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (v: number) => void;
  onPlayModeChange: (mode: PlayMode) => void;

  // 播放列表
  onPlayTrack: (index: number) => void;
  onDeleteTrack: (index: number) => void;
  onClearPlaylist: () => void;
  onReorderTracks: (fromIndex: number, toIndex: number) => void;

  // 收藏
  onCreateFavorite: (name: string) => void;
  onAddToFavorite: (favId: string, track: Track) => void;
  onAddToFavoriteFromInput: (favId: string, input: string) => Promise<void>;
  onPlayFromFavorite: (track: Track) => void;
  onRemoveFromFavorite: (favId: string, trackIndex: number) => void;
  onDeleteFavorite: (favId: string) => void;
  onReorderFavTracks: (favId: string, fromIndex: number, toIndex: number) => void;
  onAddAllToPlaylist: (tracks: Track[]) => void;

  // 其他
  onInputSubmit: (input: string) => void;
  loading: boolean;
  notification: string | null;
}

export const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayerContext(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext must be used within PlayerContext.Provider');
  return ctx;
}