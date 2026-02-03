// Consent-gated TikTok embed component
import { useState } from 'react';
import { useConsent } from '../../hooks/useConsent';
import ConsentPlaceholder from './ConsentPlaceholder';

interface TikTokEmbedProps {
  videoId?: string;
  contentUrl?: string;
  title: string;
  className?: string;
  placeholderClassName?: string;
}

/**
 * Extract TikTok video ID from various URL formats
 * Supports:
 * - https://www.tiktok.com/@username/video/1234567890
 * - https://www.tiktok.com/@username/video/1234567890?...
 * - https://vm.tiktok.com/ABC123/
 */
function extractTikTokId(url?: string): string | null {
  if (!url) return null;

  // Standard video URL format: tiktok.com/@username/video/1234567890
  const videoMatch = url.match(/\/video\/(\d+)/);
  if (videoMatch) return videoMatch[1];

  // Short URL format (vm.tiktok.com) - can't resolve without API
  // Return null and handle separately
  if (url.includes('vm.tiktok.com')) {
    return null;
  }

  return null;
}

/**
 * Get TikTok thumbnail URL from video ID
 * Note: TikTok doesn't have a public thumbnail API like YouTube,
 * so we'll use a placeholder or the thumbnail from the database
 */
function getTikTokThumbnail(_videoId: string): string | undefined {
  // TikTok doesn't provide a public thumbnail API
  // The thumbnail should come from the database (crawled via SerpAPI)
  return undefined;
}

export default function TikTokEmbed({
  videoId,
  contentUrl,
  title,
  className = '',
  placeholderClassName = '',
}: TikTokEmbedProps) {
  const { hasMarketingConsent, showSettings } = useConsent();
  const [loadedManually, setLoadedManually] = useState(false);

  // Resolve video ID from either prop
  const resolvedVideoId = videoId || extractTikTokId(contentUrl);

  // If no video ID (e.g., short URL), we can't embed directly
  // Show a link to the original instead
  if (!resolvedVideoId) {
    if (!hasMarketingConsent && !loadedManually) {
      return (
        <ConsentPlaceholder
          platform="tiktok"
          title={title}
          onLoadContent={() => setLoadedManually(true)}
          onManageSettings={showSettings}
          className={placeholderClassName || className}
        />
      );
    }

    // Can't embed, show link to original
    return (
      <div className={`flex items-center justify-center bg-black ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center p-6">
          <div className="mb-4">
            <svg viewBox="0 0 24 24" className="w-12 h-12 mx-auto" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </div>
          <p className="text-white font-medium mb-2 line-clamp-2">{title}</p>
          <p className="text-white/60 text-sm mb-4">This video requires viewing on TikTok</p>
          {contentUrl && (
            <a
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-[#fe2c55] text-white rounded-lg font-medium hover:bg-[#e91e4d] transition-colors"
            >
              Watch on TikTok
            </a>
          )}
        </div>
      </div>
    );
  }

  // Show placeholder if no marketing consent and not manually loaded
  if (!hasMarketingConsent && !loadedManually) {
    return (
      <ConsentPlaceholder
        platform="tiktok"
        title={title}
        thumbnailUrl={getTikTokThumbnail(resolvedVideoId)}
        onLoadContent={() => setLoadedManually(true)}
        onManageSettings={showSettings}
        className={placeholderClassName || className}
      />
    );
  }

  // TikTok embed iframe
  // Using TikTok's official embed URL format
  const embedUrl = `https://www.tiktok.com/embed/v2/${resolvedVideoId}`;

  return (
    <div className={className} style={{ minHeight: '400px' }}>
      <iframe
        src={embedUrl}
        title={title}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          border: 'none',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}
