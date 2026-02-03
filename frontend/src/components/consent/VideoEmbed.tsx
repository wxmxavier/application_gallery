// Unified video embed component - auto-detects platform
import { Play, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useConsent } from '../../hooks/useConsent';
import YouTubeEmbed from './YouTubeEmbed';
import ConsentPlaceholder from './ConsentPlaceholder';

interface VideoEmbedProps {
  contentUrl: string;
  title: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  allowFullscreen?: boolean;
  className?: string;
  placeholderClassName?: string;
}

type VideoPlatform = 'youtube' | 'tiktok' | 'unknown';

/**
 * Detect video platform from URL
 */
function detectPlatform(url: string): VideoPlatform {
  if (!url) return 'unknown';

  const lowerUrl = url.toLowerCase();

  // YouTube patterns
  if (
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('youtube-nocookie.com')
  ) {
    return 'youtube';
  }

  // TikTok patterns
  if (
    lowerUrl.includes('tiktok.com') ||
    lowerUrl.includes('vm.tiktok.com')
  ) {
    return 'tiktok';
  }

  return 'unknown';
}

/**
 * Unified video embed that auto-detects platform and renders appropriate embed
 */
export default function VideoEmbed({
  contentUrl,
  title,
  thumbnailUrl,
  autoplay = false,
  muted = true,
  loop = false,
  controls = true,
  allowFullscreen = true,
  className = '',
  placeholderClassName = '',
}: VideoEmbedProps) {
  const platform = detectPlatform(contentUrl);
  const { hasMarketingConsent, showSettings } = useConsent();
  const [loadedManually, setLoadedManually] = useState(false);

  // For YouTube, use the dedicated embed component
  if (platform === 'youtube') {
    return (
      <YouTubeEmbed
        contentUrl={contentUrl}
        title={title}
        autoplay={autoplay}
        muted={muted}
        loop={loop}
        controls={controls}
        allowFullscreen={allowFullscreen}
        className={className}
        placeholderClassName={placeholderClassName}
      />
    );
  }

  // For TikTok and unknown platforms, show a clickable thumbnail
  // that opens the video on the original site
  const isTikTok = platform === 'tiktok';

  // Show consent placeholder if no marketing consent
  if (!hasMarketingConsent && !loadedManually) {
    return (
      <ConsentPlaceholder
        platform={isTikTok ? 'tiktok' : 'youtube'}
        title={title}
        thumbnailUrl={thumbnailUrl}
        onLoadContent={() => setLoadedManually(true)}
        onManageSettings={showSettings}
        className={placeholderClassName || className}
      />
    );
  }

  // TikTok logo SVG
  const TikTokLogo = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  return (
    <div className={`relative bg-black ${className}`}>
      {/* Thumbnail image - fills the container */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {isTikTok && <TikTokLogo />}
        </div>
      )}

      {/* Overlay with play button */}
      <a
        href={contentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group"
      >
        {/* Play button */}
        <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
          <Play className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" />
        </div>

        {/* Platform label */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium ${
          isTikTok ? 'bg-[#fe2c55]' : 'bg-blue-600'
        }`}>
          {isTikTok ? (
            <>
              <TikTokLogo />
              <span>Watch on TikTok</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-4 h-4" />
              <span>Watch Video</span>
            </>
          )}
        </div>

        {/* Title */}
        <p className="absolute bottom-4 left-4 right-4 text-white text-sm line-clamp-2 text-center">
          {title}
        </p>
      </a>
    </div>
  );
}
