import { useState, useEffect } from 'react';
import DiscoveryHomePage from './components/DiscoveryHomePage';
import GalleryPage from './components/GalleryPage';
import type { GalleryFilters, ApplicationCategory } from './types/gallery';

function App() {
  const [filters, setFilters] = useState<GalleryFilters>({});
  const [viewMode, setViewMode] = useState<'discovery' | 'legacy'>('discovery');

  // Parse URL parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newFilters: GalleryFilters = {};

    const category = params.get('category') as ApplicationCategory | null;
    if (category) {
      newFilters.category = category;
    }

    const tasks = params.get('tasks');
    if (tasks) {
      newFilters.task_types = tasks.split(',');
    }

    const requirements = params.get('requirements');
    if (requirements) {
      newFilters.requirements = requirements.split(',');
    }

    const scene = params.get('scene');
    if (scene) {
      newFilters.scene_type = scene;
    }

    const search = params.get('search');
    if (search) {
      newFilters.search = search;
    }

    // Check for legacy view mode
    const mode = params.get('mode');
    if (mode === 'legacy') {
      setViewMode('legacy');
    }

    if (Object.keys(newFilters).length > 0) {
      setFilters(newFilters);
    }
  }, []);

  // Update URL when filters change
  const handleFiltersChange = (newFilters: GalleryFilters) => {
    setFilters(newFilters);

    const params = new URLSearchParams();
    if (newFilters.category) {
      params.set('category', newFilters.category);
    }
    if (newFilters.task_types && newFilters.task_types.length > 0) {
      params.set('tasks', newFilters.task_types.join(','));
    }
    if (newFilters.requirements && newFilters.requirements.length > 0) {
      params.set('requirements', newFilters.requirements.join(','));
    }
    if (newFilters.scene_type) {
      params.set('scene', newFilters.scene_type);
    }
    if (newFilters.search) {
      params.set('search', newFilters.search);
    }
    if (viewMode === 'legacy') {
      params.set('mode', 'legacy');
    }

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {viewMode === 'discovery' ? (
        <DiscoveryHomePage
          initialFilters={filters}
          onFiltersChange={handleFiltersChange}
        />
      ) : (
        <GalleryPage
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      )}
    </div>
  );
}

export default App;
