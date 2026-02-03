// Content Queue Component for Admin Moderation
import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Flag,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import ItemReviewModal from './ItemReviewModal';
import {
  getPendingContent,
  getFlaggedContent,
  approveContent,
  rejectContent,
  flagContent,
} from '../../services/moderation-service';
import type { ModerationItem, ItemStatus } from '../../types/moderation';
import { ITEM_STATUS_LABELS } from '../../types/moderation';

interface ContentQueueProps {
  onUpdate: () => void;
}

export default function ContentQueue({ onUpdate }: ContentQueueProps) {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ItemStatus | 'flagged'>('pending');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, [filter]);

  const loadItems = async () => {
    setLoading(true);
    let data: ModerationItem[];

    if (filter === 'flagged') {
      data = await getFlaggedContent();
    } else {
      data = await getPendingContent(filter);
    }

    setItems(data);
    setLoading(false);
  };

  const handleApprove = async (item: ModerationItem) => {
    setActionLoading(item.id);
    const result = await approveContent(item.id);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onUpdate();
    }
    setActionLoading(null);
  };

  const handleReject = async (item: ModerationItem, reason?: string) => {
    setActionLoading(item.id);
    const result = await rejectContent(item.id, reason || 'Rejected by moderator');
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onUpdate();
    }
    setActionLoading(null);
  };

  const handleFlag = async (item: ModerationItem) => {
    setActionLoading(item.id);
    const result = await flagContent(item.id, 'Flagged for review');
    if (result.success) {
      loadItems();
      onUpdate();
    }
    setActionLoading(null);
  };

  const filters: { value: ItemStatus | 'flagged'; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={loadItems}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No items in this queue</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Content
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reports
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt=""
                          className="w-16 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-gray-200 rounded" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-xs">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded">
                      {item.application_category?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={item.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.source_name || 'View'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status as ItemStatus} />
                  </td>
                  <td className="px-4 py-3">
                    {item.reports_count && item.reports_count > 0 ? (
                      <span className="flex items-center gap-1 text-amber-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {item.reports_count}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {filter === 'pending' && (
                        <>
                          <ActionButton
                            icon={<CheckCircle className="w-4 h-4" />}
                            onClick={() => handleApprove(item)}
                            loading={actionLoading === item.id}
                            variant="success"
                            title="Approve"
                          />
                          <ActionButton
                            icon={<XCircle className="w-4 h-4" />}
                            onClick={() => handleReject(item)}
                            loading={actionLoading === item.id}
                            variant="danger"
                            title="Reject"
                          />
                          <ActionButton
                            icon={<Flag className="w-4 h-4" />}
                            onClick={() => handleFlag(item)}
                            loading={actionLoading === item.id}
                            variant="warning"
                            title="Flag for Review"
                          />
                        </>
                      )}
                      {filter === 'flagged' && (
                        <>
                          <ActionButton
                            icon={<CheckCircle className="w-4 h-4" />}
                            onClick={() => handleApprove(item)}
                            loading={actionLoading === item.id}
                            variant="success"
                            title="Approve"
                          />
                          <ActionButton
                            icon={<XCircle className="w-4 h-4" />}
                            onClick={() => handleReject(item)}
                            loading={actionLoading === item.id}
                            variant="danger"
                            title="Reject"
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedItem && (
        <ItemReviewModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onApprove={() => {
            handleApprove(selectedItem);
            setSelectedItem(null);
          }}
          onReject={(reason) => {
            handleReject(selectedItem, reason);
            setSelectedItem(null);
          }}
          onFlag={() => {
            handleFlag(selectedItem);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: ItemStatus }) {
  const colors: Record<ItemStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    flagged: 'bg-amber-100 text-amber-700',
    archived: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs rounded ${colors[status]}`}
    >
      {ITEM_STATUS_LABELS[status]}
    </span>
  );
}

// Action Button Component
function ActionButton({
  icon,
  onClick,
  loading,
  variant,
  title,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  variant: 'success' | 'danger' | 'warning';
  title: string;
}) {
  const colors = {
    success: 'text-green-600 hover:bg-green-50',
    danger: 'text-red-600 hover:bg-red-50',
    warning: 'text-amber-600 hover:bg-amber-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={title}
      className={`p-1.5 rounded transition-colors ${colors[variant]} disabled:opacity-50`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    </button>
  );
}
