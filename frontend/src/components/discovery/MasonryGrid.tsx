import { useState } from 'react';
import { Play, Image, FileText, Heart, Share2, ExternalLink } from 'lucide-react';
import type { GalleryItem } from '../../types/gallery';
import { CATEGORY_INFO, SCENE_INFO } from '../../types/gallery';

// Format date as relative time (e.g., "2 days ago", "3 months ago")
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

interface MasonryGridProps {
  items: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

interface GridCardProps {
  item: GalleryItem;
  onClick: () => void;
}

function GridCard({ item, onClick }: GridCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const categoryInfo = CATEGORY_INFO[item.application_category];
  const sceneInfo = item.scene_type ? SCENE_INFO[item.scene_type] : null;

  const MediaIcon = item.media_type === 'video' ? Play : (item.media_type === 'image' || item.media_type === 'photo') ? Image : FileText;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: item.title, url: item.source_url });
    } else {
      navigator.clipboard.writeText(item.source_url);
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-100"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {item.thumbnail_url && !imageError ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className={`w-full h-full object-cover transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center">
              <span className="text-4xl block mb-2">{categoryInfo.icon}</span>
              <span className="text-xs text-gray-400">{item.media_type}</span>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {item.media_type === 'video' && (
            <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" />
            </div>
          )}
        </div>

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <span className="flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm text-xs font-medium rounded-md shadow-sm">
            <MediaIcon className="w-3 h-3" />
            {item.media_type === 'video' ? 'Video' : (item.media_type === 'image' || item.media_type === 'photo') ? 'Image' : 'Article'}
          </span>

          {item.featured && (
            <span className="px-2 py-1 bg-amber-400 text-amber-900 text-xs font-semibold rounded-md shadow-sm">
              Featured
            </span>
          )}
        </div>

        {/* Duration badge */}
        {item.duration_seconds && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
            {Math.floor(item.duration_seconds / 60)}:{(item.duration_seconds % 60).toString().padStart(2, '0')}
          </div>
        )}

        {/* Quick actions on hover */}
        <div className={`absolute bottom-2 left-2 flex gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm transition-colors"
            title="Save"
          >
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-sm leading-snug">
          {item.title}
        </h3>

        {/* Category & Scene Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          {sceneInfo && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
              {sceneInfo.label}
            </span>
          )}
        </div>

        {/* Task Tags */}
        {item.task_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.task_types.slice(0, 2).map((task) => (
              <span
                key={task}
                className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded"
              >
                {task.replace(/_/g, ' ')}
              </span>
            ))}
            {item.task_types.length > 2 && (
              <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-500 rounded">
                +{item.task_types.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Source & Date */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{item.source_name}</span>
          {item.published_at && (
            <>
              <span>•</span>
              <span className="flex-shrink-0">{formatRelativeDate(item.published_at)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MasonryGrid({
  items,
  onItemClick,
  onLoadMore,
  hasMore = false,
  loading = false,
}: MasonryGridProps) {
  return (
    <div className="gallery-grid">
      {/* Clean responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((item) => (
          <GridCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>

      {/* Load More */}
      {(hasMore || loading) && (
        <div className="flex justify-center mt-10">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
