import { useCallback } from 'react';
import type { Track, FavoriteFolder } from '@/types';
import { getVideoInfo, getPlaylist } from '@/services/api';
import { isSameTrack, isTrackFavorited } from '@/utils/track';

interface FavoritesStore {
  favorites: FavoriteFolder[];
  setFavorites: (favorites: FavoriteFolder[]) => void;
  addTrackToFavorite: (favId: string, track: Track) => void;
  removeTrackFromFavorite: (favId: string, trackIndex: number) => void;
  deleteFavorite: (favId: string) => void;
  reorderFavoriteTracks: (favId: string, fromIndex: number, toIndex: number) => void;
}

const BV_RE = /BV[a-zA-Z0-9]+/i;
const PLAYLIST_RE = /medialist\/play\/dlista\/\d+\/\d+|space\.bilibili\.com\/\d+\/favlist\?.*fid=\d+/;

function parseInput(input: string): { type: 'playlist'; url: string } | { type: 'bvid'; bvid: string } | null {
  if (PLAYLIST_RE.test(input)) return { type: 'playlist', url: input };
  const m = input.match(BV_RE);
  if (m) return { type: 'bvid', bvid: m[0] };
  return null;
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
      if (!parsed) throw new Error('无效的BV号或链接');
      if (parsed.type === 'playlist') {
        const res = await getPlaylist(parsed.url);
        if (!res.success) throw new Error(res.error);
        const tracks = res.data as unknown as Track[];
        let added = 0;
        for (const track of tracks) {
          const before = favorites.favorites.find(f => f.id === favId)?.tracks ?? [];
          if (!before.some(t => isSameTrack(t, track))) {
            favorites.addTrackToFavorite(favId, track);
            added++;
          }
        }
        showNotification(`已添加 ${added} 首歌曲到收藏夹`);
      } else {
        const res = await getVideoInfo(parsed.bvid);
        if (!res.success) throw new Error(res.error);
        const track = res.data as unknown as Track;
        favorites.addTrackToFavorite(favId, track);
      }
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

  const handleToggleFavorite = useCallback((track: Track) => {
    if (isTrackFavorited(track, favorites.favorites)) {
      favorites.setFavorites(favorites.favorites.map(f => ({
        ...f,
        tracks: f.tracks.filter(t => !isSameTrack(t, track)),
        updatedAt: Date.now(),
      })));
      return;
    }

    if (favorites.favorites.length === 0) {
      const newFav = { id: Date.now().toString(), name: '默认收藏夹', icon: '♥', tracks: [track], updatedAt: Date.now() };
      favorites.setFavorites([newFav]);
      return;
    }

    favorites.setFavorites(favorites.favorites.map((f, i) =>
      i === 0
        ? { ...f, tracks: [...f.tracks, track], updatedAt: Date.now() }
        : f
    ));
  }, [favorites.favorites, favorites.setFavorites]);

  const handlePlayFromFavorite = useCallback(async (track: Track) => {
    const plIndex = playlistTracks.findIndex(t => isSameTrack(t, track));
    if (plIndex >= 0) {
      await handlePlayTrack(plIndex);
    } else {
      await addTrackToPlaylistAndPlay(track);
    }
  }, [playlistTracks, handlePlayTrack, addTrackToPlaylistAndPlay]);

  return {
    handleCreateFavorite,
    handleToggleFavorite,
    handlePlayFromFavorite,
    handleRemoveFromFavorite,
    handleDeleteFavorite,
    handleReorderFavTracks,
    handleAddToFavorite,
    handleAddToFavoriteFromInput,
    handleAddAllToPlaylist,
  };
}
