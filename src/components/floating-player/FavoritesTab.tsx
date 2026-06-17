import type { FavoriteFolder } from '@/types';

interface FavoritesTabProps {
  favorites: FavoriteFolder[];
  onPlayTrack: (index: number) => void;
  onCreateFavorite: (name: string) => void;
}

export default function FavoritesTab({ favorites, onCreateFavorite }: FavoritesTabProps) {
  return (
    <div className="ep-fav-grid">
      {favorites.map(fav => (
        <div className="ep-fav-card" key={fav.id} onClick={() => {}}>
          <div className="ep-fav-icon" style={{ background: fav.icon.length <= 2 ? 'var(--accent)' : fav.icon }}>
            {fav.icon.length <= 2 ? fav.icon : '♪'}
          </div>
          <div className="ep-fav-name">{fav.name}</div>
          <div className="ep-fav-meta">{fav.tracks.length} 首</div>
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
  );
}
