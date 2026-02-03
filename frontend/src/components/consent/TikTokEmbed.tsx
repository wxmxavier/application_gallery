// Consent-gated TikTok embed component
import { useState, useEffect, useRef } from 'react';
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
 * - https://vm.tiktok.com/ABC123/
 */
function extractTikTokId(url?: string): string | null {
  if (!url) return null;

  // Standard video URL format
  const videoMatch = url.match(/\/video\/(\d+)/);
  if (videoMatch) return videoMatch[1];

  // Short URL format (vm.tiktok.com) - we can't resolve this without an API call
  // For now, return the full URL as identifier
  if (url.includes('vm.tiktok.com')) {
    return url;
  }

  return null;
}

/**
 * Check if the ID is a full URL (short link) or just the video ID
 */
function isFullUrl(id: string): boolean {
  return id.startsWith('http');
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
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve video ID from either prop
  const resolvedId = videoId || extractTikTokId(contentUrl);

  // Load TikTok embed script when consent is given
  useEffect(() => {
    if ((hasMarketingConsent || loadedManually) && resolvedId && !isLoaded) {
      // Load TikTok embed script
      const existingScript = document.querySelector(
        'script[src="https://www.tiktok.com/embed.js"]'
      );

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        script.onload = () => {
          setIsLoaded(true);
          // Re-process embeds after script loads
          if (window.tiktokEmbed) {
            window.tiktokEmbed.reloadEmbeds();
          }
        };
        document.body.appendChild(script);
      } else {
        setIsLoaded(true);
        // Re-process embeds if script already loaded
        if (window.tiktokEmbed) {
          window.tiktokEmbed.reloadEmbeds();
        }
      }
    }
  }, [hasMarketingConsent, loadedManually, resolvedId, isLoaded]);

  // If no video ID, show nothing
  if (!resolvedId) {
    return null;
  }

  // Show placeholder if no marketing consent and not manually loaded
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

  // Determine embed URL
  const embedUrl = isFullUrl(resolvedId)
    ? resolvedId
    : `https://www.tiktok.com/embed/v2/${resolvedId}`;

  return (
    <div ref={containerRef} className={className}>
      <blockquote
        className="tiktok-embed"
        cite={embedUrl}
        data-video-id={isFullUrl(resolvedId) ? undefined : resolvedId}
        style={{ maxWidth: '605px', minWidth: '325px' }}
      >
        <section>
          <a
            target="_blank"
            rel="noopener noreferrer"
            title={title}
            href={embedUrl}
          >
            {title}
          </a>
        </section>
      </blockquote>
    </div>
  );
}

// Extend Window interface for TikTok embed
declare global {
  interface Window {
    tiktokEmbed?: {
      reloadEmbeds: () => void;
    };
  }
}
