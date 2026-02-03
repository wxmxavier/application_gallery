// Reports Queue Component for Admin Moderation
import { useState, useEffect } from 'react';
import {
  XCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  getPendingReports,
  dismissReport,
  resolveReport,
  bulkDismissReports,
} from '../../services/moderation-service';
import type { ContentReport } from '../../types/moderation';
import { REPORT_REASON_LABELS } from '../../types/moderation';

interface ReportsQueueProps {
  onUpdate: () => void;
}

export default function ReportsQueue({ onUpdate }: ReportsQueueProps) {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const data = await getPendingReports();
    setReports(data);
    setSelectedReports(new Set());
    setLoading(false);
  };

  const handleDismiss = async (report: ContentReport) => {
    setActionLoading(report.id);
    const result = await dismissReport(report.id, 'Dismissed by moderator');
    if (result.success) {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      onUpdate();
    }
    setActionLoading(null);
  };

  const handleResolve = async (report: ContentReport) => {
    setActionLoading(report.id);
    const result = await resolveReport(report.id, 'Content removed', 'Action taken by moderator');
    if (result.success) {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      onUpdate();
    }
    setActionLoading(null);
  };

  const handleBulkDismiss = async () => {
    if (selectedReports.size === 0) return;

    setActionLoading('bulk');
    const result = await bulkDismissReports(Array.from(selectedReports), 'Bulk dismissed');
    if (result.success) {
      setReports((prev) => prev.filter((r) => !selectedReports.has(r.id)));
      setSelectedReports(new Set());
      onUpdate();
    }
    setActionLoading(null);
  };

  const toggleSelect = (reportId: string) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.map((r) => r.id)));
    }
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {selectedReports.size > 0 && (
            <button
              onClick={handleBulkDismiss}
              disabled={actionLoading === 'bulk'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading === 'bulk' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Dismiss Selected ({selectedReports.size})
            </button>
          )}
        </div>
        <button
          onClick={loadReports}
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
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">No pending reports</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReports.size === reports.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Content
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedReports.has(report.id)}
                      onChange={() => toggleSelect(report.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">
                        {report.content_title || 'Unknown Content'}
                      </p>
                      {report.content_url && (
                        <a
                          href={report.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          View Content
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ReasonBadge reason={report.reason} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600 truncate max-w-xs">
                      {report.description || '-'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDismiss(report)}
                        disabled={actionLoading === report.id}
                        title="Dismiss Report"
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                      >
                        {actionLoading === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleResolve(report)}
                        disabled={actionLoading === report.id}
                        title="Take Action"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      >
                        {actionLoading === report.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Reason Badge Component
function ReasonBadge({ reason }: { reason: string }) {
  const colors: Record<string, string> = {
    inappropriate: 'bg-red-100 text-red-700',
    copyright: 'bg-purple-100 text-purple-700',
    misleading: 'bg-amber-100 text-amber-700',
    broken_link: 'bg-gray-100 text-gray-700',
    spam: 'bg-orange-100 text-orange-700',
    other: 'bg-blue-100 text-blue-700',
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs rounded ${
        colors[reason] || colors.other
      }`}
    >
      {REPORT_REASON_LABELS[reason as keyof typeof REPORT_REASON_LABELS] || reason}
    </span>
  );
}
