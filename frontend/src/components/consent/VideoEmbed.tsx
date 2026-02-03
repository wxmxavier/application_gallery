// Unified video embed component - auto-detects platform
import YouTubeEmbed from './YouTubeEmbed';
import TikTokEmbed from './TikTokEmbed';

interface VideoEmbedProps {
  contentUrl: string;
  title: string;
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
  autoplay = false,
  muted = true,
  loop = false,
  controls = true,
  allowFullscreen = true,
  className = '',
  placeholderClassName = '',
}: VideoEmbedProps) {
  const platform = detectPlatform(contentUrl);

  switch (platform) {
    case 'youtube':
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

    case 'tiktok':
      return (
        <TikTokEmbed
          contentUrl={contentUrl}
          title={title}
          className={className}
          placeholderClassName={placeholderClassName}
        />
      );

    default:
      // For unknown platforms, try to display as a direct video link
      // or show a placeholder with link to original
      return (
        <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
          <div className="text-center p-6">
            <p className="text-white/70 mb-4">Video preview not available</p>
            <a
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Watch on Original Site
            </a>
          </div>
        </div>
      );
  }
}
