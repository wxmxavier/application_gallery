import { useEffect, useState, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight, Play, Pause, Heart, Share2,
  ExternalLink, ArrowRight, Eye, Clock, Calendar, Maximize2, Minimize2
} from 'lucide-react';
import type { GalleryItem } from '../../types/gallery';
import { CATEGORY_INFO, SCENE_INFO } from '../../types/gallery';
import { incrementViewCount, getRelatedItems } from '../../services/gallery-service';
import { YouTubeEmbed } from '../consent';
import { ReportButton } from '../moderation';

interface LightboxViewerProps {
  item: GalleryItem;
  items?: GalleryItem[];
  onClose: () => void;
  onNavigate?: (item: GalleryItem) => void;
}

export default function LightboxViewer({
  item,
  items = [],
  onClose,
  onNavigate,
}: LightboxViewerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [relatedItems, setRelatedItems] = useState<GalleryItem[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);

  const currentIndex = items.findIndex((i) => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const categoryInfo = CATEGORY_INFO[item.application_category];
  const sceneInfo = item.scene_type ? SCENE_INFO[item.scene_type] : null;

  // Increment view count and fetch related items
  useEffect(() => {
    incrementViewCount(item.id);
    getRelatedItems(item, 4).then(setRelatedItems);
  }, [item]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev && onNavigate) {
        onNavigate(items[currentIndex - 1]);
      }
      if (e.key === 'ArrowRight' && hasNext && onNavigate) {
        onNavigate(items[currentIndex + 1]);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      if (e.key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hasPrev, hasNext, currentIndex, items, onNavigate]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Extract YouTube video ID
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:embed\/|v=|\/v\/|youtu\.be\/)([^&?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(item.content_url);

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.ai_summary || item.description,
        url: item.source_url,
      });
    } else {
      navigator.clipboard.writeText(item.source_url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div
      className="lightbox fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          {/* Navigation counter */}
          {items.length > 1 && (
            <span className="text-white/60 text-sm">
              {currentIndex + 1} / {items.length}
            </span>
          )}

          {/* Title */}
          <h2 className="text-white font-medium line-clamp-1 max-w-lg">
            {item.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Favorite */}
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className={`p-2 rounded-full transition-colors ${
              isFavorited
                ? 'bg-red-500 text-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Report */}
          <div className="[&_button]:p-2 [&_button]:bg-white/10 [&_button]:hover:bg-white/20 [&_button]:rounded-full [&_button]:text-white [&_button]:transition-colors [&_svg]:text-white">
            <ReportButton
              itemId={item.id}
              itemTitle={item.title}
              contentUrl={item.content_url}
            />
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Navigation Arrows */}
        {items.length > 1 && (
          <>
            {hasPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.(items[currentIndex - 1]);
                }}
                className="absolute left-4 z-10 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.(items[currentIndex + 1]);
                }}
                className="absolute right-4 z-10 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </>
        )}

        {/* Media Content */}
        <div
          className="w-full max-w-5xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {item.media_type === 'video' && videoId ? (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <YouTubeEmbed
                videoId={videoId}
                title={item.title}
                autoplay={isPlaying}
                className="w-full h-full"
                allowFullscreen={true}
              />
            </div>
          ) : item.thumbnail_url || item.content_url ? (
            <img
              src={item.content_url || item.thumbnail_url}
              alt={item.title}
              className="max-h-[70vh] mx-auto rounded-lg object-contain"
            />
          ) : (
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white/60">No preview available</span>
            </div>
          )}

          {/* Video Controls (for video) */}
          {item.media_type === 'video' && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" /> Play
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div
        className="bg-gray-900 p-6 overflow-y-auto max-h-[40vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Description & Summary */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${categoryInfo.color}`}>
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
                {sceneInfo && (
                  <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                    📍 {sceneInfo.label}
                  </span>
                )}
              </div>

              {/* AI Summary */}
              {item.ai_summary && (
                <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">AI Summary</h4>
                  <p className="text-white/80">{item.ai_summary}</p>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <p className="text-white/70">{item.description}</p>
              )}

              {/* Task Types */}
              {item.task_types.length > 0 && (
                <div>
                  <h4 className="text-white/60 text-sm mb-2">Tasks Demonstrated</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.task_types.map((task) => (
                      <span
                        key={task}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full"
                      >
                        {task.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Link */}
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View original on {item.source_name}
              </a>
            </div>

            {/* Right: RSIP Integration & Meta */}
            <div className="space-y-4">
              {/* Use in RSIP */}
              <div className="bg-green-900/30 border border-green-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-3">Build Similar in RSIP</h4>
                <ul className="text-white/70 text-sm space-y-2 mb-4">
                  <li>1. Select "{categoryInfo.label}"</li>
                  {item.task_types[0] && (
                    <li>2. Choose "{item.task_types[0].replace(/_/g, ' ')}" task</li>
                  )}
                  {sceneInfo && <li>3. Set scene to "{sceneInfo.label}"</li>}
                </ul>
                <a
                  href={`https://rsip-platform.com?prefill_category=${item.application_category}&prefill_scene=${item.scene_type || ''}&prefill_task=${item.task_types[0] || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                >
                  Use in RSIP <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Metadata */}
              <div className="text-white/50 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {item.view_count.toLocaleString()} views
                </div>
                {item.duration_seconds && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatDuration(item.duration_seconds)}
                  </div>
                )}
                {item.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.published_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Items */}
          {relatedItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-white font-medium mb-4">Similar Applications</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedItems.map((related) => (
                  <div
                    key={related.id}
                    onClick={() => onNavigate?.(related)}
                    className="bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {related.thumbnail_url ? (
                      <img
                        src={related.thumbnail_url}
                        alt={related.title}
                        className="w-full aspect-video object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
                        <span className="text-2xl">{CATEGORY_INFO[related.application_category].icon}</span>
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-white/80 text-sm line-clamp-2">{related.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
