// Consent management types for GDPR compliance

export type ConsentCategory = 'essential' | 'analytics' | 'marketing';

export interface ConsentState {
  essential: boolean;      // Always true, required for site functionality
  analytics: boolean;      // Analytics cookies (future use)
  marketing: boolean;      // Third-party embeds: YouTube, TikTok, LinkedIn
  timestamp: string;       // ISO date when consent was given/updated
  version: string;         // Consent policy version for re-consent triggers
}

export interface ConsentContextValue {
  consent: ConsentState | null;
  hasConsented: boolean;
  hasMarketingConsent: boolean;
  isSettingsOpen: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  updateConsent: (categories: Partial<Omit<ConsentState, 'timestamp' | 'version'>>) => void;
  showSettings: () => void;
  hideSettings: () => void;
}

// Consent category descriptions for UI
export const CONSENT_CATEGORIES: Record<ConsentCategory, {
  label: string;
  description: string;
  required: boolean;
}> = {
  essential: {
    label: 'Essential',
    description: 'Required for basic site functionality. Cannot be disabled.',
    required: true,
  },
  analytics: {
    label: 'Analytics',
    description: 'Help us understand how visitors use our site to improve the experience.',
    required: false,
  },
  marketing: {
    label: 'Third-Party Content',
    description: 'Enable embedded content from YouTube, TikTok, and LinkedIn. These platforms may collect data when content loads.',
    required: false,
  },
};
