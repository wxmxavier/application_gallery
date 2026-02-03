// Consent-gated YouTube embed component
import { useState } from 'react';
import { useConsent } from '../../hooks/useConsent';
import ConsentPlaceholder from './ConsentPlaceholder';

interface YouTubeEmbedProps {
  videoId?: string;
  contentUrl?: string;
  title: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  allowFullscreen?: boolean;
  className?: string;
  placeholderClassName?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:embed\/|v=|\/v\/|youtu\.be\/)([^&?#]+)/);
  return match ? match[1] : null;
}

/**
 * Build YouTube embed URL with parameters
 */
function buildYouTubeUrl(
  videoId: string,
  options: {
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
  }
): string {
  const params = new URLSearchParams();

  // Use privacy-enhanced mode
  const baseUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  if (options.autoplay) params.set('autoplay', '1');
  if (options.muted) params.set('mute', '1');
  if (options.loop) {
    params.set('loop', '1');
    params.set('playlist', videoId); // Required for loop to work
  }
  if (options.controls === false) {
    params.set('controls', '0');
    params.set('showinfo', '0');
  }
  params.set('rel', '0'); // Don't show related videos from other channels

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export default function YouTubeEmbed({
  videoId,
  contentUrl,
  title,
  autoplay = false,
  muted = true,
  loop = false,
  controls = true,
  allowFullscreen = true,
  className = '',
  placeholderClassName = '',
}: YouTubeEmbedProps) {
  const { hasMarketingConsent, showSettings } = useConsent();
  const [loadedManually, setLoadedManually] = useState(false);

  // Resolve video ID from either prop
  const resolvedVideoId = videoId || extractYouTubeId(contentUrl);

  // If no video ID, show nothing
  if (!resolvedVideoId) {
    return null;
  }

  // Get thumbnail URL for placeholder
  const thumbnailUrl = `https://img.youtube.com/vi/${resolvedVideoId}/maxresdefault.jpg`;

  // Show placeholder if no marketing consent and not manually loaded
  if (!hasMarketingConsent && !loadedManually) {
    return (
      <ConsentPlaceholder
        platform="youtube"
        title={title}
        thumbnailUrl={thumbnailUrl}
        onLoadContent={() => setLoadedManually(true)}
        onManageSettings={showSettings}
        className={placeholderClassName || className}
      />
    );
  }

  // Build embed URL
  const embedUrl = buildYouTubeUrl(resolvedVideoId, {
    autoplay: autoplay || loadedManually, // Autoplay if user clicked to load
    muted,
    loop,
    controls,
  });

  return (
    <iframe
      src={embedUrl}
      title={title}
      className={className}
      allowFullScreen={allowFullscreen}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    />
  );
}
