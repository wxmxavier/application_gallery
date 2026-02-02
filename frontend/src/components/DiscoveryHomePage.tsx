import { useState, useEffect, useCallback } from 'react';
import { Search, X, Factory, Bot, Shield, ChevronRight, Play, FileText, ArrowUpDown, Clock, TrendingUp, Calendar, Eye, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import type { GalleryItem, GalleryFilters, ApplicationCategory } from '../types/gallery';
import { CATEGORY_INFO, CONTENT_TYPE_INFO, EDUCATIONAL_VALUE_INFO } from '../types/gallery';
import { getGalleryItems, getFeaturedItems, SortOption } from '../services/gallery-service';
import HeroCarousel from './discovery/HeroCarousel';
import MasonryGrid from './discovery/MasonryGrid';
import LightboxViewer from './discovery/LightboxViewer';
import './discovery/discovery-styles.css';

interface DiscoveryHomePageProps {
  initialFilters?: GalleryFilters;
  onFiltersChange?: (filters: GalleryFilters) => void;
}

type ViewMode = 'visual' | 'articles';

const CATEGORIES: { id: ApplicationCategory; icon: typeof Factory; color: string }[] = [
  { id: 'industrial_automation', icon: Factory, color: 'bg-blue-500' },
  { id: 'service_robotics', icon: Bot, color: 'bg-green-500' },
  { id: 'surveillance_security', icon: Shield, color: 'bg-red-500' },
];

const SORT_OPTIONS: { id: SortOption; label: string; icon: typeof Clock }[] = [
  { id: 'quality', label: 'Best Quality', icon: TrendingUp },
  { id: 'recent', label: 'Most Recent', icon: Clock },
  { id: 'popular', label: 'Most Popular', icon: TrendingUp },
  { id: 'oldest', label: 'Oldest First', icon: Calendar },
];

export default function DiscoveryHomePage({
  initialFilters = {},
  onFiltersChange: _onFiltersChange,
}: DiscoveryHomePageProps) {
  // State
  const [featuredItems, setFeaturedItems] = useState<GalleryItem[]>([]);
  const [visualItems, setVisualItems] = useState<GalleryItem[]>([]);
  const [articleItems, setArticleItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalVisualCount, setTotalVisualCount] = useState(0);
  const [totalArticleCount, setTotalArticleCount] = useState(0);

  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [activeCategory, setActiveCategory] = useState<ApplicationCategory | null>(
    initialFilters.category || null
  );
  const [includeDemos, setIncludeDemos] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('quality');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Build filters from state
  const buildFilters = useCallback((forArticles: boolean): GalleryFilters => {
    const filters: GalleryFilters = {};
    if (activeCategory) filters.category = activeCategory;
    if (searchQuery) filters.search = searchQuery;

    // Media type filter
    if (forArticles) {
      filters.media_type = 'article';
    } else {
      // For visual content, we'll filter client-side or use a custom approach
    }

    // Include demos toggle
    if (includeDemos) {
      filters.include_demos = true;
    }

    return filters;
  }, [activeCategory, searchQuery, includeDemos]);

  // Fetch featured items for hero carousel
  useEffect(() => {
    getFeaturedItems(5).then(setFeaturedItems);
  }, []);

  // Fetch visual items (videos + images) - with proper pagination
  const fetchVisualItems = useCallback(async (append = false) => {
    const filters = buildFilters(false);
    const currentCount = append ? visualItems.length : 0;
    const batchSize = 24;

    if (!append) setLoading(true);
    else setLoadingMore(true);

    // Calculate how many of each to fetch based on current position
    // Fetch more than needed to allow for proper sorting/mixing
    const fetchLimit = batchSize + 12; // Fetch extra for sorting

    // Fetch videos with offset
    const videoOffset = Math.floor(currentCount / 2);
    const videoFilters = { ...filters, media_type: 'video' as const };
    const videoResponse = await getGalleryItems(videoFilters, fetchLimit, videoOffset, sortBy);

    // Fetch images with offset
    const imageOffset = Math.floor(currentCount / 2);
    const imageFilters = { ...filters, media_type: 'image' as const };
    const imageResponse = await getGalleryItems(imageFilters, fetchLimit, imageOffset, sortBy);

    // Combine and sort
    const combined = [...videoResponse.data, ...imageResponse.data];
    combined.sort((a, b) => {
      if (sortBy === 'quality') {
        return (b.educational_value || 0) - (a.educational_value || 0);
      } else if (sortBy === 'recent') {
        return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
      } else if (sortBy === 'popular') {
        return (b.view_count || 0) - (a.view_count || 0);
      }
      return new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime();
    });

    // Take only what we need for this batch
    const newItems = combined.slice(0, batchSize);

    if (append) {
      setVisualItems(prev => [...prev, ...newItems]);
    } else {
      setVisualItems(newItems);
    }

    setTotalVisualCount(videoResponse.count + imageResponse.count);
    setLoading(false);
    setLoadingMore(false);
  }, [buildFilters, visualItems.length, sortBy]);

  // Fetch article items
  const fetchArticleItems = useCallback(async (append = false) => {
    const filters = buildFilters(true);
    const offset = append ? articleItems.length : 0;

    if (!append) setLoading(true);
    else setLoadingMore(true);

    const response = await getGalleryItems(filters, 20, offset, sortBy);

    if (append) {
      setArticleItems(prev => [...prev, ...response.data]);
    } else {
      setArticleItems(response.data);
    }

    setTotalArticleCount(response.count);
    setLoading(false);
    setLoadingMore(false);
  }, [buildFilters, articleItems.length, sortBy]);

  // Refetch when filters change
  useEffect(() => {
    if (viewMode === 'visual') {
      fetchVisualItems(false);
    } else {
      fetchArticleItems(false);
    }
  }, [activeCategory, searchQuery, sortBy, includeDemos, viewMode]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Clear filters
  const clearFilters = () => {
    setActiveCategory(null);
    setSearchQuery('');
    setIncludeDemos(false);
  };

  const hasFilters = activeCategory !== null || searchQuery.length > 0 || includeDemos;

  // Article Card Component
  const ArticleCard = ({ item }: { item: GalleryItem }) => {
    const contentTypeInfo = item.content_type ? CONTENT_TYPE_INFO[item.content_type] : null;
    const educationalInfo = item.educational_value ? EDUCATIONAL_VALUE_INFO[item.educational_value] : null;
    const categoryInfo = CATEGORY_INFO[item.application_category];

    return (
      <div
        onClick={() => setSelectedItem(item)}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex gap-4">
          {/* Thumbnail */}
          {item.thumbnail_url && (
            <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {contentTypeInfo && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${contentTypeInfo.color}`}>
                  {contentTypeInfo.icon} {contentTypeInfo.label}
                </span>
              )}
              {educationalInfo && item.educational_value >= 3 && (
                <span className="text-xs text-yellow-600">{educationalInfo.stars}</span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs ${categoryInfo.color}`}>
                {categoryInfo.icon} {categoryInfo.label}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600">
              {item.title}
            </h3>

            {/* Task Labels */}
            {(item.specific_tasks?.length > 0 || item.task_types?.length > 0) && (
              <div className="flex flex-wrap gap-1 mb-2">
                {(item.specific_tasks?.length > 0 ? item.specific_tasks : item.task_types).slice(0, 3).map((task) => (
                  <span
                    key={task}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                  >
                    {task.replace(/_/g, ' ')}
                  </span>
                ))}
                {(item.specific_tasks?.length > 0 ? item.specific_tasks : item.task_types).length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                    +{(item.specific_tasks?.length > 0 ? item.specific_tasks : item.task_types).length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Summary */}
            {item.ai_summary && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.ai_summary}</p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {item.source_name}
              </a>
              {item.published_at && (
                <span>{new Date(item.published_at).toLocaleDateString()}</span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.view_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                R
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">RSIP Gallery</h1>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-gray-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* RSIP Link */}
            <a
              href="https://rsip-platform.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Open RSIP
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Carousel - only show when no filters and on visual mode */}
        {!hasFilters && viewMode === 'visual' && featuredItems.length > 0 && (
          <section className="mb-8">
            <HeroCarousel
              items={featuredItems}
              onItemClick={setSelectedItem}
            />
          </section>
        )}

        {/* View Mode Tabs */}
        <section className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Visual / Articles Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('visual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'visual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Play className="w-4 h-4" />
                Visual Content
                <span className="text-xs text-gray-400 ml-1">({totalVisualCount})</span>
              </button>
              <button
                onClick={() => setViewMode('articles')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'articles'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Articles
                <span className="text-xs text-gray-400 ml-1">({totalArticleCount})</span>
              </button>
            </div>

            {/* Include Demos Toggle */}
            <button
              onClick={() => setIncludeDemos(!includeDemos)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                includeDemos
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {includeDemos ? (
                <ToggleRight className="w-5 h-5 text-orange-500" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              Include Tech Demos
            </button>
          </div>
        </section>

        {/* Category Filters */}
        <section className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Category:</span>
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(({ id, icon: Icon, color }) => {
              const info = CATEGORY_INFO[id];
              const isActive = activeCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveCategory(isActive ? null : id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? `${color} text-white`
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {info.label}
                </button>
              );
            })}

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </section>

        {/* Results Header */}
        <section className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {viewMode === 'visual' ? 'Videos & Images' : 'Articles & Case Studies'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {loading ? '' : `(${viewMode === 'visual' ? totalVisualCount : totalArticleCount})`}
            </span>
            {includeDemos && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                Including demos
              </span>
            )}
          </h2>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {SORT_OPTIONS.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Content Grid */}
        <section>
          {loading ? (
            <div className={viewMode === 'visual'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              : "space-y-4"
            }>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                  <div className={viewMode === 'visual' ? "aspect-video bg-gray-100 animate-pulse" : "h-24 bg-gray-100 animate-pulse"} />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'visual' ? (
            <MasonryGrid
              items={visualItems}
              onItemClick={setSelectedItem}
              onLoadMore={() => fetchVisualItems(true)}
              hasMore={visualItems.length < totalVisualCount}
              loading={loadingMore}
            />
          ) : (
            <div className="space-y-4">
              {articleItems.map((item) => (
                <ArticleCard key={item.id} item={item} />
              ))}

              {/* Load More */}
              {articleItems.length < totalArticleCount && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => fetchArticleItems(true)}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Articles'}
                  </button>
                </div>
              )}

              {/* Empty State */}
              {articleItems.length === 0 && !loading && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No articles found</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <span>{totalVisualCount + totalArticleCount} robotics applications • Updated daily</span>
            <div className="flex items-center gap-4">
              <a href="https://rsip-platform.com" className="hover:text-gray-700">RSIP Platform</a>
              <span>•</span>
              <span>Powered by RSIP</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      {selectedItem && (
        <LightboxViewer
          item={selectedItem}
          items={viewMode === 'visual' ? visualItems : articleItems}
          onClose={() => setSelectedItem(null)}
          onNavigate={setSelectedItem}
        />
      )}
    </div>
  );
}
