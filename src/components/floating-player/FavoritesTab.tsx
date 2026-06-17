import { useState, useRef, useCallback, useEffect } from 'react';
import type { Track, FavoriteFolder } from '@/types';

const FAV_ICON_SIZE = 80;

function getFavIconStyle(fav: FavoriteFolder): React.CSSProperties {
  const cover = fav.tracks[0]?.cover;
  if (cover) {
    return { backgroundImage: `url(${cover}@${FAV_ICON_SIZE}w_${FAV_ICON_SIZE}h.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { background: fav.icon.length <= 2 ? 'var(--accent)' : fav.icon };
}

interface FavoritesTabProps {
  favorites: FavoriteFolder[];
  onCreateFavorite: (name: string) => void;
  onPlayTrack: (track: Track) => void;
  onRemoveTrack?: (favId: string, trackIndex: number) => void;
  onDeleteFavorite?: (favId: string) => void;
  onReorderTracks?: (favId: string, fromIndex: number, toIndex: number) => void;
  onAddToFavoriteFromInput?: (favId: string, input: string) => Promise<void>;
}

export default function FavoritesTab({ favorites, onCreateFavorite, onPlayTrack, onRemoveTrack, onDeleteFavorite, onReorderTracks, onAddToFavoriteFromInput }: FavoritesTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [addingToFavId, setAddingToFavId] = useState<string | null>(null);
  const dragItem = useRef<{ favId: string; index: number } | null>(null);

  // Clean up expandedId if the expanded folder no longer exists
  useEffect(() => {
    if (expandedId && !favorites.some(f => f.id === expandedId)) {
      setExpandedId(null);
    }
  }, [favorites, expandedId]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleDragStart = useCallback((favId: string, index: number) => {
    dragItem.current = { favId, index };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = index > (dragItem.current?.index ?? -1) ? '2px solid var(--accent)' : '';
    el.style.borderBottom = index <= (dragItem.current?.index ?? -1) ? '2px solid var(--accent)' : '';
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = '';
    el.style.borderBottom = '';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.style.borderTop = '';
    el.style.borderBottom = '';
    if (dragItem.current && onReorderTracks) {
      onReorderTracks(dragItem.current.favId, dragItem.current.index, toIndex);
    }
    dragItem.current = null;
  }, [onReorderTracks]);

  const handleDragEnd = useCallback(() => {
    dragItem.current = null;
  }, []);

  return (
    <div className="ep-fav-view">
      {favorites.length === 0 ? (
        <div className="ep-empty" style={{ padding: '40px 16px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📁</div>
          <div style={{ fontWeight: 500, marginBottom: '4px', color: 'var(--fg-2)' }}>还没有收藏夹</div>
          <div style={{ fontSize: '11px', lineHeight: 1.6 }}>
            点击右下角的"+"按钮创建收藏夹<br />
            或在播放列表中点击 ♡ 收藏歌曲
          </div>
        </div>
      ) : (
        <div className="ep-fav-grid">
          {favorites.map(fav => (
            <div className={`ep-fav-card ep-fav-card-expand${expandedId === fav.id ? ' expanded' : ''}`} key={fav.id}>
              <div className="ep-fav-header" onClick={() => toggleExpand(fav.id)}>
                <div className="ep-fav-icon" style={getFavIconStyle(fav)}>
                  {fav.tracks[0]?.cover ? null : (fav.icon.length <= 2 ? fav.icon : '♪')}
                </div>
                <div className="ep-fav-info">
                  <div className="ep-fav-name">{fav.name}</div>
                  <div className="ep-fav-meta">{fav.tracks.length} 首</div>
                </div>
                <span className={`ep-fav-arrow${expandedId === fav.id ? ' open' : ''}`}>▸</span>
              </div>
              {onDeleteFavorite && (
                <button
                  className="ep-fav-card-del"
                  onClick={(e) => { e.stopPropagation(); if (confirm(`删除收藏夹「${fav.name}」？`)) onDeleteFavorite(fav.id); }}
                  title="删除收藏夹"
                >✕</button>
              )}
              {expandedId === fav.id && (
                <div className="ep-fav-tracks">
                  {onAddToFavoriteFromInput && (
                    <div className="ep-fav-input-row" onClick={(e) => e.stopPropagation()}>
                      <input type="text" placeholder="BV 号或收藏夹链接" value={addingToFavId === fav.id ? inputValue : ''}
                        onChange={(e) => { setAddingToFavId(fav.id); setInputValue(e.target.value); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) { onAddToFavoriteFromInput(fav.id, inputValue.trim()); setInputValue(''); } }}
                      />
                      <button onClick={() => { if (inputValue.trim()) { onAddToFavoriteFromInput(fav.id, inputValue.trim()); setInputValue(''); } }}>添加</button>
                    </div>
                  )}
                  {fav.tracks.length > 0 ? fav.tracks.map((track, ti) => (
                    <div className="ep-fav-track" key={`${track.bvid}-${track.cid}`}
                      draggable={!!onReorderTracks}
                      onDragStart={() => handleDragStart(fav.id, ti)}
                      onDragOver={(e) => handleDragOver(e, ti)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, ti)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="ep-fav-track-info" onClick={() => onPlayTrack(track)}>
                        <div className="ep-fav-track-title" title={track.title}>{track.title}</div>
                        <div className="ep-fav-track-artist">{track.author}</div>
                      </div>
                      {onRemoveTrack && (
                        <button className="ep-fav-track-del" onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(fav.id, ti);
                        }} title="移出收藏夹">✕</button>
                      )}
                    </div>
                  )) : (
                    <div className="ep-empty" style={{ padding: '16px 12px' }}>
                      暂无歌曲，在播放列表中点击 ♡ 收藏
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div className="ep-fav-card" onClick={() => {
            const name = prompt('收藏夹名称：');
            if (name?.trim()) onCreateFavorite(name.trim());
          }}>
            <div className="ep-fav-icon" style={{ background: 'var(--border)' }}>+</div>
            <div className="ep-fav-name">新建收藏夹</div>
          </div>
        </div>
      )}
    </div>
  );
}
