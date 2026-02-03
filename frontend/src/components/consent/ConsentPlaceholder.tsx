// Placeholder shown when consent not granted for third-party content
import { Play, Settings } from 'lucide-react';

interface ConsentPlaceholderProps {
  platform: 'youtube' | 'tiktok' | 'linkedin';
  title?: string;
  thumbnailUrl?: string;
  onLoadContent: () => void;
  onManageSettings: () => void;
  className?: string;
}

const PLATFORM_INFO = {
  youtube: {
    name: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-red-500" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: 'bg-red-500',
  },
  tiktok: {
    name: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    color: 'bg-black',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-600" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: 'bg-blue-600',
  },
};

export default function ConsentPlaceholder({
  platform,
  title,
  thumbnailUrl,
  onLoadContent,
  onManageSettings,
  className = '',
}: ConsentPlaceholderProps) {
  const platformInfo = PLATFORM_INFO[platform];

  return (
    <div
      className={`relative flex items-center justify-center bg-gray-900 ${className}`}
      style={{ minHeight: '200px' }}
    >
      {/* Blurred thumbnail background */}
      {thumbnailUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-md">
        {/* Platform icon */}
        <div className="mb-4">
          {platformInfo.icon}
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold mb-2 line-clamp-2">
          {title || `${platformInfo.name} Content`}
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-6">
          Loading this content requires your consent. {platformInfo.name} may collect data when content loads.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onLoadContent}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 ${platformInfo.color} text-white rounded-lg font-medium hover:opacity-90 transition-opacity`}
          >
            <Play className="w-4 h-4" />
            Load {platformInfo.name} Content
          </button>
          <button
            onClick={onManageSettings}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Preferences
          </button>
        </div>

        {/* Privacy note */}
        <p className="text-gray-400 text-xs mt-4">
          By loading, you agree to {platformInfo.name}&apos;s terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
