import { useCallback, useMemo } from 'react';
import type { Track, FavoriteFolder } from '@/types';
import { getVideoInfo, getPlaylist, getFavList, getSeriesList, getColleList } from '@/services/api';
import { isSameTrack } from '@/utils/track';
import { parseInput } from '@/utils/bilibili';

interface FavoritesStore {
  favorites: FavoriteFolder[];
  setFavorites: (favorites: FavoriteFolder[]) => void;
  addTrackToFavorite: (favId: string, track: Track) => void;
  addTracksToFavorite: (favId: string, tracks: Track[]) => number;
  removeTrackFromFavorite: (favId: string, trackIndex: number) => void;
  deleteFavorite: (favId: string) => void;
  reorderFavoriteTracks: (favId: string, fromIndex: number, toIndex: number) => void;
}

interface UseFavoriteActionsOpts {
  favorites: FavoritesStore;
  playlistTracks: Track[];
  setPlaylistTracks: (tracks: Track[]) => void;
  handlePlayTrack: (index: number) => Promise<void>;
  addTrackToPlaylistAndPlay: (track: Track) => Promise<void>;
  showNotification: (msg: string) => void;
}

export function useFavoriteActions({
  favorites,
  playlistTracks,
  setPlaylistTracks,
  handlePlayTrack,
  addTrackToPlaylistAndPlay,
  showNotification,
}: UseFavoriteActionsOpts) {
  const handleCreateFavorite = useCallback((name: string) => {
    favorites.setFavorites([...favorites.favorites, { id: Date.now().toString(), name, icon: '🎵', tracks: [], updatedAt: Date.now() }]);
  }, [favorites]);

  const handleRemoveFromFavorite = useCallback((favId: string, trackIndex: number) => {
    favorites.removeTrackFromFavorite(favId, trackIndex);
  }, [favorites]);

  const handleDeleteFavorite = useCallback((favId: string) => {
    favorites.deleteFavorite(favId);
  }, [favorites]);

  const handleReorderFavTracks = useCallback((favId: string, fromIndex: number, toIndex: number) => {
    favorites.reorderFavoriteTracks(favId, fromIndex, toIndex);
  }, [favorites]);

  const handleAddToFavorite = useCallback((favId: string, track: Track) => {
    favorites.addTrackToFavorite(favId, track);
  }, [favorites]);

  const handleAddToFavoriteFromInput = useCallback(async (favId: string, input: string) => {
    try {
      const parsed = parseInput(input);
      if (!parsed) throw new Error('无效的BV号、收藏夹ID或链接');
      let tracks: Track[];

      if (parsed.type === 'bvid') {
        const res = await getVideoInfo(parsed.bvid);
        if (!res.success) throw new Error(res.error);
        tracks = [res.data];
      } else if (parsed.type === 'favId') {
        const res = await getFavList(parsed.id);
        if (!res.success) throw new Error(res.error);
        tracks = res.data;
      } else if (parsed.type === 'series') {
        const res = await getSeriesList(parsed.mid, parsed.sid);
        if (!res.success) throw new Error(res.error);
        tracks = res.data;
      } else if (parsed.type === 'collection') {
        const res = await getColleList(parsed.mid, parsed.sid);
        if (!res.success) throw new Error(res.error);
        tracks = res.data;
      } else {
        const res = await getPlaylist(parsed.url);
        if (!res.success) throw new Error(res.error);
        tracks = res.data;
      }

      const added = favorites.addTracksToFavorite(favId, tracks);
      showNotification(added > 0 ? `已添加 ${added} 首歌曲到收藏夹` : '歌曲已在收藏夹中');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '添加失败';
      showNotification(`添加失败：${msg}`);
    }
  }, [favorites, showNotification]);

  const handleAddAllToPlaylist = useCallback((tracks: Track[]) => {
    const existing = new Set(playlistTracks.map(t => t.bvid));
    const newTracks = tracks.filter(t => !existing.has(t.bvid));
    if (newTracks.length === 0) {
      showNotification('所有歌曲已在播放列表中');
      return;
    }
    setPlaylistTracks([...playlistTracks, ...newTracks]);
    showNotification(`已添加 ${newTracks.length} 首歌曲到播放列表`);
  }, [playlistTracks, setPlaylistTracks, showNotification]);

  const handlePlayFromFavorite = useCallback(async (track: Track) => {
    const plIndex = playlistTracks.findIndex(t => isSameTrack(t, track));
    if (plIndex >= 0) {
      await handlePlayTrack(plIndex);
    } else {
      await addTrackToPlaylistAndPlay(track);
    }
  }, [playlistTracks, handlePlayTrack, addTrackToPlaylistAndPlay]);

  return useMemo(() => ({
    handleCreateFavorite,
    handlePlayFromFavorite,
    handleRemoveFromFavorite,
    handleDeleteFavorite,
    handleReorderFavTracks,
    handleAddToFavorite,
    handleAddToFavoriteFromInput,
    handleAddAllToPlaylist,
  }), [
    handleCreateFavorite,
    handlePlayFromFavorite,
    handleRemoveFromFavorite,
    handleDeleteFavorite,
    handleReorderFavTracks,
    handleAddToFavorite,
    handleAddToFavoriteFromInput,
    handleAddAllToPlaylist,
  ]);
}
