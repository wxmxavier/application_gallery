// Item Review Modal for detailed moderation
import { useState } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle,
  XCircle,
  Flag,
  AlertTriangle,
  Calendar,
  Tag,
} from 'lucide-react';
import type { ModerationItem } from '../../types/moderation';
import { REPORT_REASON_LABELS } from '../../types/moderation';

interface ItemReviewModalProps {
  item: ModerationItem;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onFlag: () => void;
}

export default function ItemReviewModal({
  item,
  onClose,
  onApprove,
  onReject,
  onFlag,
}: ItemReviewModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReject = () => {
    if (showRejectForm) {
      onReject(rejectReason || 'Rejected by moderator');
    } else {
      setShowRejectForm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Review Content</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Preview */}
            <div>
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="w-full aspect-video object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-400">No thumbnail</span>
                </div>
              )}

              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>

              {item.description && (
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              )}

              <a
                href={item.content_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
              >
                View Original Content
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Metadata */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Content Details</h4>

                <div className="flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">
                    {item.application_category?.replace(/_/g, ' ')}
                  </span>
                </div>

                {item.source_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Source:</span>
                    <span className="font-medium">{item.source_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                {item.task_types && item.task_types.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Tasks:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.task_types.map((task) => (
                        <span
                          key={task}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {task.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reports */}
              {item.pending_reports && item.pending_reports.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Reports ({item.pending_reports.length})
                  </h4>
                  <div className="space-y-2">
                    {item.pending_reports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-white rounded p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-amber-700">
                            {REPORT_REASON_LABELS[report.reason]}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {report.description && (
                          <p className="text-gray-600">{report.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reject Form */}
              {showRejectForm && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">
                    Rejection Reason
                  </h4>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                    rows={3}
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onFlag}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
          >
            <Flag className="w-4 h-4" />
            Flag for Review
          </button>
          <button
            onClick={handleReject}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4" />
            {showRejectForm ? 'Confirm Reject' : 'Reject'}
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
