// Unified video embed component - auto-detects platform
import { Play, ExternalLink } from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';

interface VideoEmbedProps {
  contentUrl: string;
  sourceUrl?: string;  // Original source URL (for TikTok, this is where the video actually is)
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
  sourceUrl,
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
  // Check both contentUrl and sourceUrl for platform detection
  // TikTok items typically have static image in contentUrl but TikTok link in sourceUrl
  const contentPlatform = detectPlatform(contentUrl);
  const sourcePlatform = sourceUrl ? detectPlatform(sourceUrl) : 'unknown';
  const platform = sourcePlatform === 'tiktok' ? 'tiktok' : contentPlatform;

  // For YouTube, use the dedicated embed component (handles its own consent)
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

  // For TikTok, link to sourceUrl (the actual TikTok page)
  // For others, link to contentUrl
  const linkUrl = isTikTok && sourceUrl ? sourceUrl : contentUrl;

  // For TikTok, we just link to the external site - no consent needed
  // (we're not embedding any third-party scripts/iframes)
  // For unknown platforms, also just link externally

  // TikTok logo SVG
  const TikTokLogo = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  return (
    <div className={`relative bg-black ${className}`} style={{ minHeight: '300px' }}>
      {/* Thumbnail image - fills the container */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {isTikTok && <TikTokLogo />}
        </div>
      )}

      {/* Overlay with play button - clickable link to original video */}
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 hover:bg-black/30 transition-colors group cursor-pointer z-10"
      >
        {/* Play button */}
        <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-2xl">
          <Play className="w-12 h-12 text-gray-900 ml-1" fill="currentColor" />
        </div>

        {/* Platform label */}
        <div className={`flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium text-lg shadow-lg ${
          isTikTok ? 'bg-[#fe2c55] hover:bg-[#e91e4d]' : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors`}>
          {isTikTok ? (
            <>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span>Watch on TikTok</span>
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              <span>Watch Video</span>
            </>
          )}
        </div>
      </a>
    </div>
  );
}
