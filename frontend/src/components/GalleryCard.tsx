import { Play, FileText, Image, ExternalLink } from 'lucide-react';
import type { GalleryItem } from '../types/gallery';
import { CATEGORY_INFO, SCENE_INFO } from '../types/gallery';

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
}

export default function GalleryCard({ item, onClick }: GalleryCardProps) {
  const categoryInfo = CATEGORY_INFO[item.application_category];
  const sceneInfo = item.scene_type ? SCENE_INFO[item.scene_type] : null;

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get media type icon
  const MediaIcon = item.media_type === 'video' ? Play : (item.media_type === 'photo' || item.media_type === 'image') ? Image : FileText;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <MediaIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Play overlay for videos */}
        {item.media_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        {item.duration_seconds && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/75 text-white text-xs rounded">
            {formatDuration(item.duration_seconds)}
          </div>
        )}

        {/* Media type badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-gray-700 text-xs rounded flex items-center gap-1">
          <MediaIcon className="w-3 h-3" />
          {item.media_type === 'video' ? 'Video' : (item.media_type === 'photo' || item.media_type === 'image') ? 'Image' : 'Article'}
        </div>

        {/* Featured badge */}
        {item.featured && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded">
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600">
          {item.title}
        </h3>

        {/* Source */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <ExternalLink className="w-3 h-3" />
          <span>{item.source_name}</span>
          {item.published_at && (
            <>
              <span>•</span>
              <span>{new Date(item.published_at).toLocaleDateString()}</span>
            </>
          )}
        </div>

        {/* Category & Scene */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-0.5 rounded text-xs ${categoryInfo.color}`}>
            {categoryInfo.icon} {categoryInfo.label}
          </span>
          {sceneInfo && (
            <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
              📍 {sceneInfo.label}
            </span>
          )}
        </div>

        {/* Task Types */}
        {item.task_types.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.task_types.slice(0, 3).map((task) => (
              <span
                key={task}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {task.replace(/_/g, ' ')}
              </span>
            ))}
            {item.task_types.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                +{item.task_types.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
