// Report modal for submitting content reports
import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { submitContentReport } from '../../services/gallery-service';
import type { ReportReason } from '../../types/moderation';
import { REPORT_REASON_LABELS } from '../../types/moderation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemTitle: string;
  contentUrl?: string;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function ReportModal({
  isOpen,
  onClose,
  itemId,
  itemTitle,
  contentUrl,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('other');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState('loading');
    setErrorMessage('');

    const result = await submitContentReport({
      gallery_item_id: itemId,
      content_url: contentUrl,
      content_title: itemTitle,
      reason,
      description: description || undefined,
      reporter_email: email || undefined,
    });

    if (result.success) {
      setSubmitState('success');
      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      setSubmitState('error');
      setErrorMessage(result.error || 'Failed to submit report');
    }
  };

  const handleClose = () => {
    // Reset form state
    setReason('other');
    setDescription('');
    setEmail('');
    setSubmitState('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Report Content</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submitState === 'success' ? (
          <div className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Report Submitted</h3>
            <p className="text-gray-600">
              Thank you for your report. Our team will review it shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Content being reported */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Reporting:</p>
              <p className="font-medium line-clamp-2">{itemTitle}</p>
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Reason for Report <span className="text-red-500">*</span>
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Please provide additional details about your report..."
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="For follow-up if needed"
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll only contact you if we need more information
              </p>
            </div>

            {/* Error message */}
            {submitState === 'error' && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitState === 'loading'}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitState === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
