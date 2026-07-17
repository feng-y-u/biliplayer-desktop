import { useState, useEffect } from 'react';
import type { FavoriteFolder } from '@/types';
import { useDragReorder } from '@/hooks/useDragReorder';
import { usePlayerContext } from '@/contexts/PlayerContext';
import favStyles from './FavoritesTab.module.css';

function getFavIconStyle(fav: FavoriteFolder): React.CSSProperties {
  const cover = fav.tracks[0]?.cover;
  if (cover) {
    return { backgroundImage: `url(${cover}@320w_180h.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { background: fav.icon.length <= 2 ? 'var(--accent)' : fav.icon };
}

interface FavoritesTabProps {
  favorites: FavoriteFolder[];
}

export default function FavoritesTab({ favorites }: FavoritesTabProps) {
  const ctx = usePlayerContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [addingToFavId, setAddingToFavId] = useState<string | null>(null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [createName, setCreateName] = useState('');
  const [loadingFavId, setLoadingFavId] = useState<string | null>(null);

  // Clean up expandedId if the expanded folder no longer exists
  useEffect(() => {
    if (expandedId && !favorites.some(f => f.id === expandedId)) {
      setExpandedId(null);
    }
  }, [favorites, expandedId]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const { handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } =
    useDragReorder<string>({
      onReorder: (_from, _to, favId) => {
        if (favId) {
          ctx.onReorderFavTracks(favId, _from, _to);
        }
      },
    });

  return (
    <div className={favStyles['ep-fav-view']}>
      {favorites.length === 0 ? (
        <div className={favStyles['ep-fav-empty']}>
          <div className={favStyles['ep-fav-empty-icon']}>📁</div>
          <div className={favStyles['ep-fav-empty-title']}>还没有收藏夹</div>
          <div className={favStyles['ep-fav-empty-desc']}>
            在播放列表中点击 ♡ 收藏歌曲
          </div>
          {showCreateInput ? (
            <div className={favStyles['ep-fav-create-inline']} style={{ maxWidth: '220px', margin: '0 auto' }}>
              <input type="text" placeholder="收藏夹名称" value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && createName.trim()) {
                    ctx.onCreateFavorite(createName.trim()); setCreateName(''); setShowCreateInput(false);
                  }
                  if (e.key === 'Escape') { setShowCreateInput(false); setCreateName(''); }
                }}
                autoFocus
              />
              <div className={favStyles['ep-fav-create-actions']}>
                <button className={favStyles['ep-fav-create-btn']} onClick={() => { if (createName.trim()) { ctx.onCreateFavorite(createName.trim()); setCreateName(''); setShowCreateInput(false); } }}>确定</button>
                <button className={`${favStyles['ep-fav-create-btn']} ${favStyles['ep-fav-create-btn-cancel']}`} onClick={() => { setShowCreateInput(false); setCreateName(''); }}>取消</button>
              </div>
            </div>
          ) : (
            <button className={favStyles['ep-fav-empty-btn']} onClick={() => setShowCreateInput(true)}>+ 新建收藏夹</button>
          )}
        </div>
      ) : (
        <div className={favStyles['ep-fav-grid']}>
          {favorites.map(fav => (
            <div className={`${favStyles['ep-fav-card']} ${favStyles['ep-fav-card-expand']}${expandedId === fav.id ? ` ${favStyles.expanded}` : ''}`} key={fav.id}>
              <div className={favStyles['ep-fav-header']} onClick={() => toggleExpand(fav.id)}>
                <div className={favStyles['ep-fav-icon']} style={getFavIconStyle(fav)}>
                  {fav.tracks[0]?.cover ? null : <span className={favStyles['ep-fav-emoji']}>{fav.icon.length <= 2 ? fav.icon : '♪'}</span>}
                </div>
                <div className={favStyles['ep-fav-header-info']}>
                  <div className={favStyles['ep-fav-info']}>
                    <div className={favStyles['ep-fav-name']}>{fav.name}</div>
                    <div className={favStyles['ep-fav-count']}>{fav.tracks.length} 首</div>
                  </div>
                  <span className={`${favStyles['ep-fav-arrow']}${expandedId === fav.id ? ` ${favStyles.open}` : ''}`}>▸</span>
                </div>
              </div>
              <button
                className={favStyles['ep-fav-card-del']}
                onClick={(e) => { e.stopPropagation(); if (confirm(`删除收藏夹「${fav.name}」？`)) ctx.onDeleteFavorite(fav.id); }}
                title="删除收藏夹"
              >✕</button>
              {fav.tracks.length > 0 && (
                <button
                  className={favStyles['ep-fav-card-add']}
                  onClick={(e) => { e.stopPropagation(); ctx.onAddAllToPlaylist(fav.tracks); }}
                  title="添加到播放列表"
                >+</button>
              )}
              {expandedId === fav.id && (
                <div className={favStyles['ep-fav-tracks']}>
                  <div className={favStyles['ep-fav-input-row']} onClick={(e) => e.stopPropagation()}>
                      <input type="text" placeholder="BV号 / 收藏夹ID / 合集链接" value={addingToFavId === fav.id ? inputValue : ''}
                        onChange={(e) => { setAddingToFavId(fav.id); setInputValue(e.target.value); }}
                        onKeyDown={async (e) => {
                          const val = inputValue.trim();
                          if (e.key === 'Enter' && val) {
                            setInputValue('');
                            setLoadingFavId(fav.id);
                            try { await ctx.onAddToFavoriteFromInput(fav.id, val); } finally { setLoadingFavId(null); }
                          }
                        }}
                      />
                      <button disabled={loadingFavId === fav.id} onClick={async () => {
                        const val = inputValue.trim();
                        if (val) {
                          setInputValue('');
                          setLoadingFavId(fav.id);
                          try { await ctx.onAddToFavoriteFromInput(fav.id, val); } finally { setLoadingFavId(null); }
                        }
                      }}>
                        {loadingFavId === fav.id ? <><span className="ep-spinner" />加载中</> : '添加'}
                      </button>
                    </div>
                  {fav.tracks.length > 0 ? fav.tracks.map((track, ti) => (
                    <div className={favStyles['ep-fav-track']} key={`${track.bvid}-${track.cid}`}
                      draggable
                      onDragStart={() => handleDragStart(ti, fav.id)}
                      onDragOver={(e) => handleDragOver(e, ti)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, ti)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className={favStyles['ep-fav-track-info']} onClick={() => ctx.onPlayFromFavorite(track)}>
                        <div className={favStyles['ep-fav-track-title']} title={track.title}>{track.title}</div>
                        <div className={favStyles['ep-fav-track-artist']}>{track.author}</div>
                      </div>
                      <button className={favStyles['ep-fav-track-del']} onClick={(e) => {
                          e.stopPropagation();
                          ctx.onRemoveFromFavorite(fav.id, ti);
                        }} title="移出收藏夹">✕</button>
                    </div>
                  )) : (
                    <div className={favStyles['ep-empty']} style={{ padding: '16px 12px' }}>
                      暂无歌曲，在播放列表中点击 ♡ 收藏
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {showCreateInput ? (
            <div className={favStyles['ep-fav-create-inline']}>
              <input type="text" placeholder="收藏夹名称" value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && createName.trim()) {
                    ctx.onCreateFavorite(createName.trim()); setCreateName(''); setShowCreateInput(false);
                  }
                  if (e.key === 'Escape') { setShowCreateInput(false); setCreateName(''); }
                }}
                autoFocus
              />
              <div className={favStyles['ep-fav-create-actions']}>
                <button className={favStyles['ep-fav-create-btn']} onClick={() => { if (createName.trim()) { ctx.onCreateFavorite(createName.trim()); setCreateName(''); setShowCreateInput(false); } }}>确定</button>
                <button className={`${favStyles['ep-fav-create-btn']} ${favStyles['ep-fav-create-btn-cancel']}`} onClick={() => { setShowCreateInput(false); setCreateName(''); }}>取消</button>
              </div>
            </div>
          ) : (
            <div className={`${favStyles['ep-fav-card']} ${favStyles['ep-fav-new']}`} onClick={() => setShowCreateInput(true)}>
              <div className={favStyles['ep-fav-new-icon']}>+</div>
              <div className={favStyles['ep-fav-new-label']}>新建收藏夹</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
