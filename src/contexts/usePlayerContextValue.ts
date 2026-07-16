// src/contexts/usePlayerContextValue.ts
import { useMemo } from 'react';
import type { PlayMode, Track } from '@/types';
import type { PlayerContextValue } from './PlayerContext';

interface PlayerCtrlActions {
  handlePlayPause: () => void;
  handlePrevButton: () => void;
  handleNextButton: () => void;
  handlePlayTrack: (index: number) => void;
  handleDeleteTrack: (index: number) => void;
  handleClearPlaylist: () => void;
  handleReorderTracks: (fromIndex: number, toIndex: number) => void;
  handleInputSubmit: (input: string) => void;
  loading: boolean;
}

interface FavActions {
  handleCreateFavorite: (name: string) => void;
  handleAddToFavorite: (favId: string, track: Track) => void;
  handleAddToFavoriteFromInput: (favId: string, input: string) => Promise<void>;
  handlePlayFromFavorite: (track: Track) => void;
  handleRemoveFromFavorite: (favId: string, trackIndex: number) => void;
  handleDeleteFavorite: (favId: string) => void;
  handleReorderFavTracks: (favId: string, fromIndex: number, toIndex: number) => void;
  handleAddAllToPlaylist: (tracks: Track[]) => void;
}

interface UsePlayerContextValueOpts {
  playerCtrl: PlayerCtrlActions;
  favActions: FavActions;
  seek: (time: number) => void;
  volumeChange: (v: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  notification: string | null;
}

export function usePlayerContextValue({
  playerCtrl,
  favActions,
  seek,
  volumeChange,
  setPlayMode,
  notification,
}: UsePlayerContextValueOpts): PlayerContextValue {
  return useMemo(() => ({
    onPlayPause: playerCtrl.handlePlayPause,
    onPrev: playerCtrl.handlePrevButton,
    onNext: playerCtrl.handleNextButton,
    onSeek: seek,
    onVolumeChange: volumeChange,
    onPlayModeChange: setPlayMode,
    onPlayTrack: playerCtrl.handlePlayTrack,
    onDeleteTrack: playerCtrl.handleDeleteTrack,
    onClearPlaylist: playerCtrl.handleClearPlaylist,
    onReorderTracks: playerCtrl.handleReorderTracks,
    onCreateFavorite: favActions.handleCreateFavorite,
    onAddToFavorite: favActions.handleAddToFavorite,
    onAddToFavoriteFromInput: favActions.handleAddToFavoriteFromInput,
    onPlayFromFavorite: favActions.handlePlayFromFavorite,
    onRemoveFromFavorite: favActions.handleRemoveFromFavorite,
    onDeleteFavorite: favActions.handleDeleteFavorite,
    onReorderFavTracks: favActions.handleReorderFavTracks,
    onAddAllToPlaylist: favActions.handleAddAllToPlaylist,
    onInputSubmit: playerCtrl.handleInputSubmit,
    loading: playerCtrl.loading,
    notification,
  }), [playerCtrl, favActions, seek, volumeChange, setPlayMode, notification]);
}
