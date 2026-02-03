// Shared layout for legal pages (Privacy, Terms, DMCA)
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  const handleBack = () => {
    // Remove page parameter and go back to gallery
    const params = new URLSearchParams(window.location.search);
    params.delete('page');
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.pushState({}, '', newUrl);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="legal-content prose prose-gray max-w-none">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <a href="?page=privacy" className="hover:text-gray-700">Privacy Policy</a>
            <span>|</span>
            <a href="?page=terms" className="hover:text-gray-700">Terms of Service</a>
            <span>|</span>
            <a href="?page=dmca" className="hover:text-gray-700">DMCA / Takedown</a>
            <span>|</span>
            <button onClick={handleBack} className="hover:text-gray-700">
              Back to Gallery
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
