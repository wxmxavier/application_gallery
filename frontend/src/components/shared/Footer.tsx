// Site footer with legal links and cookie settings
import { Settings } from 'lucide-react';
import { useConsent } from '../../hooks/useConsent';

interface FooterProps {
  totalCount?: number;
}

export default function Footer({ totalCount }: FooterProps) {
  const { showSettings } = useConsent();

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left side - Stats */}
          <div className="text-sm text-gray-500">
            {totalCount !== undefined && (
              <span>{totalCount.toLocaleString()} robotics applications</span>
            )}
            {totalCount !== undefined && <span className="mx-2">•</span>}
            <span>Updated daily</span>
          </div>

          {/* Center - Legal Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="?page=privacy"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="?page=terms"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="?page=dmca"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              DMCA / Takedown
            </a>
            <button
              onClick={showSettings}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Cookie Settings
            </button>
          </div>

          {/* Right side - Platform link */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <a
              href="https://rsip-platform.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors"
            >
              RSIP Platform
            </a>
            <span>•</span>
            <span>Powered by RSIP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
