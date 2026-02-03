// Consent management service - localStorage operations
import type { ConsentState } from '../types/consent';

const CONSENT_KEY = 'rsip_gallery_consent';
const CONSENT_VERSION = '1.0';

/**
 * Get stored consent from localStorage
 * Returns null if no consent stored or version is outdated
 */
export function getStoredConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as ConsentState;

    // Check version - if outdated, user may need to re-consent
    if (consent.version !== CONSENT_VERSION) {
      return null;
    }

    return consent;
  } catch {
    return null;
  }
}

/**
 * Save consent preferences to localStorage
 */
export function saveConsent(
  preferences: Omit<ConsentState, 'essential' | 'timestamp' | 'version'>
): ConsentState {
  const consent: ConsentState = {
    essential: true, // Always true
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  return consent;
}

/**
 * Accept all consent categories
 */
export function acceptAllConsent(): ConsentState {
  return saveConsent({
    analytics: true,
    marketing: true,
  });
}

/**
 * Reject non-essential consent (only essential remains)
 */
export function rejectNonEssentialConsent(): ConsentState {
  return saveConsent({
    analytics: false,
    marketing: false,
  });
}

/**
 * Clear all consent (for testing or user request)
 */
export function clearConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
}

/**
 * Get current consent version
 */
export function getConsentVersion(): string {
  return CONSENT_VERSION;
}
