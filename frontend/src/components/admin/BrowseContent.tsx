/**
 * Browse Content - Admin view of all gallery items with search, filter, and inline editing
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
  X,
  Trash2,
  Archive,
} from 'lucide-react';
import ClassificationEditor, { type ClassificationUpdate } from './ClassificationEditor';
import { updateClassification, archiveContent, deleteContent, browseAllContent } from '../../services/moderation-service';
import type { GalleryItem, ContentType, ApplicationCategory } from '../../types/gallery';
import { CONTENT_TYPE_INFO, CATEGORY_INFO } from '../../types/gallery';

const PAGE_SIZE = 25;

export default function BrowseContent() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ApplicationCategory | ''>('');
  const [filterContentType, setFilterContentType] = useState<ContentType | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const result = await browseAllContent({
      search: search || undefined,
      category: filterCategory || undefined,
      contentType: filterContentType || undefined,
      offset: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
    setItems(result.data);
    setTotalCount(result.count);
    setLoading(false);
  }, [search, filterCategory, filterContentType, page]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, filterCategory, filterContentType]);

  const handleSaveClassification = async (itemId: string, updates: ClassificationUpdate): Promise<boolean> => {
    const result = await updateClassification(itemId, updates);
    if (result.success) {
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, ...updates } as GalleryItem : item
      ));
      setEditingId(null);
    }
    return result.success;
  };

  const handleArchive = async (itemId: string) => {
    if (!confirm('Archive this item? It will be hidden from the public gallery.')) return;
    const result = await archiveContent(itemId);
    if (result.success) {
      setItems(prev => prev.filter(i => i.id !== itemId));
      setTotalCount(prev => prev - 1);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Permanently delete this item? This cannot be undone.')) return;
    const result = await deleteContent(itemId);
    if (result.success) {
      setItems(prev => prev.filter(i => i.id !== itemId));
      setTotalCount(prev => prev - 1);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, ID, or source..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
            showFilters || filterCategory || filterContentType
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filterCategory || filterContentType) && (
            <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              {(filterCategory ? 1 : 0) + (filterContentType ? 1 : 0)}
            </span>
          )}
        </button>
        <button
          onClick={loadItems}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 border rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as ApplicationCategory | '')}
            className="px-3 py-1.5 text-sm border rounded bg-white"
          >
            <option value="">All Categories</option>
            {(Object.keys(CATEGORY_INFO) as ApplicationCategory[]).map(cat => (
              <option key={cat} value={cat}>{CATEGORY_INFO[cat].icon} {CATEGORY_INFO[cat].label}</option>
            ))}
          </select>
          <select
            value={filterContentType}
            onChange={e => setFilterContentType(e.target.value as ContentType | '')}
            className="px-3 py-1.5 text-sm border rounded bg-white"
          >
            <option value="">All Content Types</option>
            {(Object.keys(CONTENT_TYPE_INFO) as ContentType[]).map(ct => (
              <option key={ct} value={ct}>{CONTENT_TYPE_INFO[ct].icon} {CONTENT_TYPE_INFO[ct].label}</option>
            ))}
          </select>
          {(filterCategory || filterContentType) && (
            <button
              onClick={() => { setFilterCategory(''); setFilterContentType(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{totalCount} items</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No items found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-20">ID</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-32">Type</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-36">Category</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-40">Tasks</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-16">Edu</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <span className="font-mono text-[10px] text-gray-400 select-all" title={item.id}>
                      #{item.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {item.thumbnail_url && (
                        <img src={item.thumbnail_url} alt="" className="w-12 h-8 object-cover rounded flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{item.title}</p>
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-gray-400 hover:text-blue-600 flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {item.source_name}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {item.content_type && (
                      <span className="text-xs text-gray-600">
                        {CONTENT_TYPE_INFO[item.content_type]?.icon} {CONTENT_TYPE_INFO[item.content_type]?.label}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${CATEGORY_INFO[item.application_category]?.color || 'bg-gray-100'}`}>
                      {CATEGORY_INFO[item.application_category]?.label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-0.5">
                      {(item.specific_tasks || item.task_types || []).slice(0, 2).map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-yellow-600">
                      {'★'.repeat(item.educational_value || 0)}{'☆'.repeat(5 - (item.educational_value || 0))}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingId(editingId === item.id ? null : item.id)}
                        className={`p-1.5 rounded transition-colors ${
                          editingId === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                        title="Edit classification"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchive(item.id)}
                        className="p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 rounded transition-colors"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Inline Editor (shown below the row) */}
          {editingId && items.find(i => i.id === editingId) && (
            <div className="border-t bg-blue-50/50 p-4">
              <ClassificationEditor
                item={items.find(i => i.id === editingId)!}
                onSave={(updates) => handleSaveClassification(editingId, updates)}
              />
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 border rounded hover:bg-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 border rounded hover:bg-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
