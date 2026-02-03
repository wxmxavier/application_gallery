import { useState, useEffect, useCallback } from 'react';
import { Play, ChevronLeft, ChevronRight, Pause, Volume2, VolumeX } from 'lucide-react';
import type { GalleryItem } from '../../types/gallery';
import { CATEGORY_INFO } from '../../types/gallery';
import { YouTubeEmbed } from '../consent';

interface HeroCarouselProps {
  items: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  autoPlayInterval?: number;
}

export default function HeroCarousel({
  items,
  onItemClick,
  autoPlayInterval = 6000
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || items.length <= 1) return;

    const timer = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPlaying, goToNext, autoPlayInterval, items.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  const categoryInfo = CATEGORY_INFO[currentItem.application_category];

  // Extract YouTube video ID for background
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(?:embed\/|v=|\/v\/|youtu\.be\/)([^&?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(currentItem.content_url);

  return (
    <div className="hero-carousel relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900 rounded-2xl">
      {/* Background Video/Image */}
      <div className="absolute inset-0">
        {currentItem.media_type === 'video' && videoId ? (
          <YouTubeEmbed
            videoId={videoId}
            title={currentItem.title}
            autoplay={true}
            muted={isMuted}
            loop={true}
            controls={false}
            className="w-full h-full scale-150 pointer-events-none"
            placeholderClassName="w-full h-full"
          />
        ) : currentItem.thumbnail_url ? (
          <img
            src={currentItem.thumbnail_url}
            alt={currentItem.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900" />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
        <div className="max-w-3xl">
          {/* Category Badge */}
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${categoryInfo.color} mb-4`}>
            {categoryInfo.icon} {categoryInfo.label}
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 line-clamp-2">
            {currentItem.title}
          </h1>

          {/* Description */}
          {currentItem.ai_summary && (
            <p className="text-lg text-gray-300 mb-6 line-clamp-2 max-w-2xl">
              {currentItem.ai_summary}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onItemClick(currentItem)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              <Play className="w-5 h-5" />
              {currentItem.media_type === 'video' ? 'Watch Now' : 'View Details'}
            </button>
            <a
              href={`https://rsip-platform.com?prefill_category=${currentItem.application_category}&prefill_scene=${currentItem.scene_type || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-full font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              Use in RSIP
            </a>
          </div>
        </div>

        {/* Task Tags */}
        {currentItem.task_types.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {currentItem.task_types.slice(0, 4).map((task) => (
              <span
                key={task}
                className="px-3 py-1 bg-white/10 text-white/80 text-sm rounded-full backdrop-blur-sm"
              >
                {task.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-sm"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-sm"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Controls Bar */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {/* Mute Toggle (for videos) */}
        {currentItem.media_type === 'video' && videoId && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-sm"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}

        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors backdrop-blur-sm"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
      </div>

      {/* Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
