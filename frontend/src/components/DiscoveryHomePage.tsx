import { useState, useEffect, useCallback } from 'react';
import { Search, X, Factory, Bot, Shield, ChevronRight, Play, Image, FileText, ArrowUpDown, Clock, TrendingUp, Calendar } from 'lucide-react';
import type { GalleryItem, GalleryFilters, ApplicationCategory, MediaType } from '../types/gallery';
import { CATEGORY_INFO } from '../types/gallery';
import { getGalleryItems, getFeaturedItems, SortOption } from '../services/gallery-service';
import HeroCarousel from './discovery/HeroCarousel';
import MasonryGrid from './discovery/MasonryGrid';
import LightboxViewer from './discovery/LightboxViewer';
import './discovery/discovery-styles.css';

interface DiscoveryHomePageProps {
  initialFilters?: GalleryFilters;
  onFiltersChange?: (filters: GalleryFilters) => void;
}

const CATEGORIES: { id: ApplicationCategory; icon: typeof Factory; color: string }[] = [
  { id: 'industrial_automation', icon: Factory, color: 'bg-blue-500' },
  { id: 'service_robotics', icon: Bot, color: 'bg-green-500' },
  { id: 'surveillance_security', icon: Shield, color: 'bg-red-500' },
];

const MEDIA_TYPES: { id: MediaType | 'all'; label: string; icon: typeof Play }[] = [
  { id: 'all', label: 'All', icon: Factory },
  { id: 'video', label: 'Videos', icon: Play },
  { id: 'image', label: 'Images', icon: Image },
  { id: 'article', label: 'Articles', icon: FileText },
];

const SORT_OPTIONS: { id: SortOption; label: string; icon: typeof Clock }[] = [
  { id: 'recent', label: 'Most Recent', icon: Clock },
  { id: 'popular', label: 'Most Popular', icon: TrendingUp },
  { id: 'oldest', label: 'Oldest First', icon: Calendar },
];

export default function DiscoveryHomePage({
  initialFilters = {},
  onFiltersChange,
}: DiscoveryHomePageProps) {
  // State
  const [featuredItems, setFeaturedItems] = useState<GalleryItem[]>([]);
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [activeCategory, setActiveCategory] = useState<ApplicationCategory | null>(
    initialFilters.category || null
  );
  const [activeMediaType, setActiveMediaType] = useState<MediaType | 'all'>(
    initialFilters.media_type || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Build filters from state
  const buildFilters = useCallback((): GalleryFilters => {
    const filters: GalleryFilters = {};
    if (activeCategory) filters.category = activeCategory;
    if (activeMediaType !== 'all') filters.media_type = activeMediaType;
    if (searchQuery) filters.search = searchQuery;
    return filters;
  }, [activeCategory, activeMediaType, searchQuery]);

  // Fetch featured items for hero carousel
  useEffect(() => {
    getFeaturedItems(5).then(setFeaturedItems);
  }, []);

  // Fetch main gallery items
  const fetchItems = useCallback(async (append = false) => {
    const filters = buildFilters();
    const offset = append ? allItems.length : 0;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const response = await getGalleryItems(filters, 24, offset, sortBy);

    if (append) {
      setAllItems((prev) => [...prev, ...response.data]);
    } else {
      setAllItems(response.data);
    }

    setTotalCount(response.count);
    setLoading(false);
    setLoadingMore(false);

    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [buildFilters, allItems.length, onFiltersChange, sortBy]);

  // Refetch when filters change
  useEffect(() => {
    fetchItems(false);
  }, [activeCategory, activeMediaType, searchQuery, sortBy]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  // Clear filters
  const clearFilters = () => {
    setActiveCategory(null);
    setActiveMediaType('all');
    setSearchQuery('');
  };

  const hasFilters = activeCategory !== null || activeMediaType !== 'all' || searchQuery.length > 0;

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
        {/* Hero Carousel - only show when no filters */}
        {!hasFilters && featuredItems.length > 0 && (
          <section className="mb-8">
            <HeroCarousel
              items={featuredItems}
              onItemClick={setSelectedItem}
            />
          </section>
        )}

        {/* Filter Tabs */}
        <section className="mb-6 space-y-4">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            {MEDIA_TYPES.map(({ id, label, icon: Icon }) => {
              const isActive = activeMediaType === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveMediaType(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {id !== 'all' && <Icon className="w-4 h-4" />}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Category Tabs */}
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
            {hasFilters ? 'Search Results' : 'Browse Applications'}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {loading ? '' : `(${totalCount})`}
            </span>
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

        {/* Gallery Grid */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                  <div className="aspect-video bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <MasonryGrid
              items={allItems}
              onItemClick={setSelectedItem}
              onLoadMore={() => fetchItems(true)}
              hasMore={allItems.length < totalCount}
              loading={loadingMore}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <span>{totalCount} robotics applications • Updated daily</span>
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
          items={allItems}
          onClose={() => setSelectedItem(null)}
          onNavigate={setSelectedItem}
        />
      )}
    </div>
  );
}
