import { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { GalleryItem } from '../../types/gallery';
import { CATEGORY_INFO, SCENE_INFO } from '../../types/gallery';

interface ScenarioSliderProps {
  title: string;
  subtitle?: string;
  items: GalleryItem[];
  onItemClick: (item: GalleryItem) => void;
  onViewAll?: () => void;
}

export default function ScenarioSlider({
  title,
  subtitle,
  items,
  onItemClick,
  onViewAll,
}: ScenarioSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320; // Card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (items.length === 0) return null;

  return (
    <div className="scenario-slider py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="ml-2 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const categoryInfo = CATEGORY_INFO[item.application_category];
          const sceneInfo = item.scene_type ? SCENE_INFO[item.scene_type] : null;

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className="flex-shrink-0 w-[300px] bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all snap-start group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <span className="text-4xl">{categoryInfo.icon}</span>
                  </div>
                )}

                {/* Duration Badge */}
                {item.duration_seconds && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 text-white text-xs rounded">
                    {Math.floor(item.duration_seconds / 60)}:{(item.duration_seconds % 60).toString().padStart(2, '0')}
                  </div>
                )}

                {/* Media Type Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 text-xs rounded font-medium">
                  {item.media_type === 'video' ? '▶ Video' : item.media_type === 'image' ? '🖼 Image' : '📄 Article'}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${categoryInfo.color}`}>
                    {categoryInfo.label}
                  </span>
                  {sceneInfo && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                      {sceneInfo.label}
                    </span>
                  )}
                </div>

                {/* Task Tags */}
                {item.task_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.task_types.slice(0, 2).map((task) => (
                      <span
                        key={task}
                        className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                      >
                        {task.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {item.task_types.length > 2 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                        +{item.task_types.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
