// Consent-gated LinkedIn embed component
import { useState } from 'react';
import { useConsent } from '../../hooks/useConsent';
import ConsentPlaceholder from './ConsentPlaceholder';

interface LinkedInEmbedProps {
  postUrl: string;
  title: string;
  className?: string;
  placeholderClassName?: string;
}

/**
 * Extract LinkedIn post ID from URL
 * Supports:
 * - https://www.linkedin.com/posts/username_activity-1234567890-abcd
 * - https://www.linkedin.com/feed/update/urn:li:activity:1234567890/
 * - https://www.linkedin.com/embed/feed/update/urn:li:share:1234567890
 */
function extractLinkedInPostInfo(url: string): { embedUrl: string } | null {
  if (!url) return null;

  // Already an embed URL
  if (url.includes('/embed/feed/update/')) {
    return { embedUrl: url };
  }

  // Standard post URL with activity ID
  const activityMatch = url.match(/activity[:-](\d+)/);
  if (activityMatch) {
    return {
      embedUrl: `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`,
    };
  }

  // URN format
  const urnMatch = url.match(/urn:li:(activity|share):(\d+)/);
  if (urnMatch) {
    return {
      embedUrl: `https://www.linkedin.com/embed/feed/update/urn:li:${urnMatch[1]}:${urnMatch[2]}`,
    };
  }

  // If we can't parse it, try using the URL directly as embed
  // This may not work for all URLs
  return null;
}

export default function LinkedInEmbed({
  postUrl,
  title,
  className = '',
  placeholderClassName = '',
}: LinkedInEmbedProps) {
  const { hasMarketingConsent, showSettings } = useConsent();
  const [loadedManually, setLoadedManually] = useState(false);

  // Extract embed URL
  const postInfo = extractLinkedInPostInfo(postUrl);

  // If we can't parse the URL, show nothing
  if (!postInfo) {
    return null;
  }

  // Show placeholder if no marketing consent and not manually loaded
  if (!hasMarketingConsent && !loadedManually) {
    return (
      <ConsentPlaceholder
        platform="linkedin"
        title={title}
        onLoadContent={() => setLoadedManually(true)}
        onManageSettings={showSettings}
        className={placeholderClassName || className}
      />
    );
  }

  return (
    <div className={className}>
      <iframe
        src={postInfo.embedUrl}
        title={title}
        width="100%"
        height="400"
        frameBorder="0"
        allowFullScreen
        style={{
          border: 'none',
          overflow: 'hidden',
          minHeight: '300px',
          maxWidth: '504px',
        }}
      />
    </div>
  );
}
