// Detailed consent preferences modal
import { useState, useEffect } from 'react';
import { X, Shield, BarChart3, Video } from 'lucide-react';
import { useConsent } from '../../hooks/useConsent';
import { CONSENT_CATEGORIES } from '../../types/consent';

interface ConsentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConsentSettingsModal({ isOpen, onClose }: ConsentSettingsModalProps) {
  const { consent, updateConsent } = useConsent();

  // Local state for toggles
  const [analytics, setAnalytics] = useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = useState(consent?.marketing ?? false);

  // Sync with consent state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
    }
  }, [isOpen, consent]);

  // Handle save
  const handleSave = () => {
    updateConsent({ analytics, marketing });
    onClose();
  };

  // Handle accept all from modal
  const handleAcceptAll = () => {
    updateConsent({ analytics: true, marketing: true });
    onClose();
  };

  if (!isOpen) return null;

  const categoryIcons = {
    essential: <Shield className="w-5 h-5" />,
    analytics: <BarChart3 className="w-5 h-5" />,
    marketing: <Video className="w-5 h-5" />,
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Cookie Preferences</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            We use cookies and similar technologies to enhance your experience.
            Some are essential for the site to function, while others help us
            understand usage or enable third-party content.
          </p>

          {/* Category toggles */}
          <div className="space-y-4">
            {/* Essential - Always on */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                {categoryIcons.essential}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {CONSENT_CATEGORIES.essential.label}
                  </h3>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                    Always On
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {CONSENT_CATEGORIES.essential.description}
                </p>
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                {categoryIcons.analytics}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {CONSENT_CATEGORIES.analytics.label}
                  </h3>
                  <button
                    onClick={() => setAnalytics(!analytics)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      analytics ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={analytics}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        analytics ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {CONSENT_CATEGORIES.analytics.description}
                </p>
              </div>
            </div>

            {/* Marketing / Third-Party */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                {categoryIcons.marketing}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {CONSENT_CATEGORIES.marketing.label}
                  </h3>
                  <button
                    onClick={() => setMarketing(!marketing)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      marketing ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={marketing}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        marketing ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {CONSENT_CATEGORIES.marketing.description}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy policy link */}
          <p className="text-sm text-gray-500 mt-6">
            For more information, see our{' '}
            <a
              href="?page=privacy"
              className="text-blue-600 hover:underline"
            >
              Privacy Policy
            </a>.
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Save Preferences
          </button>
          <button
            onClick={handleAcceptAll}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
