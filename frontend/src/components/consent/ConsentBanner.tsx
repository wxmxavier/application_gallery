// Cookie consent banner - shows at bottom on first visit
import { Cookie, Settings } from 'lucide-react';
import { useConsent } from '../../hooks/useConsent';
import ConsentSettingsModal from './ConsentSettingsModal';

export default function ConsentBanner() {
  const {
    hasConsented,
    isSettingsOpen,
    acceptAll,
    rejectNonEssential,
    showSettings,
    hideSettings,
  } = useConsent();

  // Don't show banner if user has already consented
  if (hasConsented && !isSettingsOpen) {
    return null;
  }

  return (
    <>
      {/* Banner - only show if not consented */}
      {!hasConsented && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              {/* Icon and text */}
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Cookie & Privacy Preferences
                  </h3>
                  <p className="text-sm text-gray-600">
                    We embed content from third parties (YouTube, TikTok, LinkedIn) to show you robotics videos.
                    These platforms may collect data when content loads.{' '}
                    <a href="?page=privacy" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <button
                  onClick={showSettings}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Manage
                </button>
                <button
                  onClick={rejectNonEssential}
                  className="px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Reject Non-Essential
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <ConsentSettingsModal isOpen={isSettingsOpen} onClose={hideSettings} />
    </>
  );
}
