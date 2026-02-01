import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Factory, Bot, Shield } from 'lucide-react';
import type { GalleryItem, GalleryFilters, ApplicationCategory } from '../types/gallery';
import { CATEGORY_INFO } from '../types/gallery';
import { getGalleryItems, getGalleryStats } from '../services/gallery-service';
import GalleryCard from './GalleryCard';
import GalleryDetailModal from './GalleryDetailModal';

interface GalleryPageProps {
  filters: GalleryFilters;
  onFiltersChange: (filters: GalleryFilters) => void;
}

export default function GalleryPage({ filters, onFiltersChange }: GalleryPageProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [stats, setStats] = useState<{ total: number; byCategory: Record<ApplicationCategory, number> } | null>(null);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const response = await getGalleryItems(filters, 24);
    setItems(response.data);
    setTotalCount(response.count);
    setLoading(false);
  }, [filters]);

  // Fetch stats
  useEffect(() => {
    getGalleryStats().then(setStats);
  }, []);

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchQuery || undefined });
  };

  // Handle category filter
  const handleCategoryClick = (category: ApplicationCategory | undefined) => {
    onFiltersChange({ ...filters, category });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    onFiltersChange({});
  };

  const hasActiveFilters = filters.category || filters.search || filters.task_types?.length || filters.scene_type;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            RSIP Application Gallery
          </h1>
          <p className="text-gray-600 mt-1">
            Real-world robotics applications to inspire your configuration
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => alert('Suggest content feature coming soon!')}
        >
          <Plus className="w-4 h-4" />
          Suggest Content
        </button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(Object.entries(CATEGORY_INFO) as [ApplicationCategory, typeof CATEGORY_INFO[ApplicationCategory]][]).map(
          ([key, info]) => {
            const Icon = key === 'industrial_automation' ? Factory : key === 'service_robotics' ? Bot : Shield;
            const isActive = filters.category === key;
            const count = stats?.byCategory[key] || 0;

            return (
              <button
                key={key}
                onClick={() => handleCategoryClick(isActive ? undefined : key)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${info.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{info.label}</div>
                    <div className="text-sm text-gray-500">{count} items</div>
                  </div>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </form>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-gray-500">Filters:</span>
          {filters.category && (
            <span className={`px-3 py-1 rounded-full text-sm ${CATEGORY_INFO[filters.category].color}`}>
              {CATEGORY_INFO[filters.category].label}
            </span>
          )}
          {filters.search && (
            <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
              Search: "{filters.search}"
            </span>
          )}
          {filters.scene_type && (
            <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
              Scene: {filters.scene_type}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500 mb-4">
        {loading ? 'Loading...' : `${totalCount} applications found`}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg aspect-video mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {items.length > 0 && items.length < totalCount && (
        <div className="text-center mt-8">
          <button
            onClick={() => {
              // Load more items
              getGalleryItems(filters, 24, items.length).then((response) => {
                setItems([...items, ...response.data]);
              });
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Load More
          </button>
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        📊 {stats?.total || 0} applications • Updated daily • Sources: YouTube, News, Company Websites
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <GalleryDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
