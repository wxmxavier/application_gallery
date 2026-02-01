import { Sparkles, Factory, Bot, Shield, Warehouse, Building, Cross, ShoppingBag, Truck, Package, Eye, Wrench } from 'lucide-react';

export interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'category' | 'scene' | 'task';
  value: string;
}

interface QuickDiscoverChipsProps {
  activeFilters: string[];
  onFilterToggle: (filter: QuickFilter) => void;
}

const QUICK_FILTERS: QuickFilter[] = [
  // Categories
  { id: 'cat-industrial', label: 'Industrial', icon: <Factory className="w-4 h-4" />, type: 'category', value: 'industrial_automation' },
  { id: 'cat-service', label: 'Service', icon: <Bot className="w-4 h-4" />, type: 'category', value: 'service_robotics' },
  { id: 'cat-security', label: 'Security', icon: <Shield className="w-4 h-4" />, type: 'category', value: 'surveillance_security' },
  // Scenes
  { id: 'scene-warehouse', label: 'Warehouse', icon: <Warehouse className="w-4 h-4" />, type: 'scene', value: 'warehouse' },
  { id: 'scene-manufacturing', label: 'Manufacturing', icon: <Building className="w-4 h-4" />, type: 'scene', value: 'manufacturing' },
  { id: 'scene-hospital', label: 'Hospital', icon: <Cross className="w-4 h-4" />, type: 'scene', value: 'hospital' },
  { id: 'scene-retail', label: 'Retail', icon: <ShoppingBag className="w-4 h-4" />, type: 'scene', value: 'retail' },
  // Tasks
  { id: 'task-transport', label: 'Transport', icon: <Truck className="w-4 h-4" />, type: 'task', value: 'transportation' },
  { id: 'task-palletizing', label: 'Palletizing', icon: <Package className="w-4 h-4" />, type: 'task', value: 'palletizing' },
  { id: 'task-inspection', label: 'Inspection', icon: <Eye className="w-4 h-4" />, type: 'task', value: 'inspection' },
  { id: 'task-assembly', label: 'Assembly', icon: <Wrench className="w-4 h-4" />, type: 'task', value: 'assembly' },
];

export default function QuickDiscoverChips({ activeFilters, onFilterToggle }: QuickDiscoverChipsProps) {
  return (
    <div className="quick-discover-chips">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-900">Quick Discover</h2>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => {
          const isActive = activeFilters.includes(filter.id);

          return (
            <button
              key={filter.id}
              onClick={() => onFilterToggle(filter)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Active Filters Summary */}
      {activeFilters.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} active
          </span>
          <button
            onClick={() => activeFilters.forEach((id) => {
              const filter = QUICK_FILTERS.find(f => f.id === id);
              if (filter) onFilterToggle(filter);
            })}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export { QUICK_FILTERS };
