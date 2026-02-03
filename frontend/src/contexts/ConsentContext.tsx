// Consent context provider for GDPR compliance
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { ConsentState, ConsentContextValue } from '../types/consent';
import {
  getStoredConsent,
  saveConsent,
  acceptAllConsent,
  rejectNonEssentialConsent,
} from '../services/consent-service';

export const ConsentContext = createContext<ConsentContextValue | null>(null);

interface ConsentProviderProps {
  children: ReactNode;
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    setIsLoaded(true);
  }, []);

  // Accept all consent categories
  const acceptAll = useCallback(() => {
    const newConsent = acceptAllConsent();
    setConsent(newConsent);
  }, []);

  // Reject non-essential categories
  const rejectNonEssential = useCallback(() => {
    const newConsent = rejectNonEssentialConsent();
    setConsent(newConsent);
  }, []);

  // Update specific consent categories
  const updateConsent = useCallback(
    (categories: Partial<Omit<ConsentState, 'timestamp' | 'version'>>) => {
      const current = consent || { essential: true, analytics: false, marketing: false };
      const newConsent = saveConsent({
        analytics: categories.analytics ?? current.analytics,
        marketing: categories.marketing ?? current.marketing,
      });
      setConsent(newConsent);
    },
    [consent]
  );

  // Show/hide settings modal
  const showSettings = useCallback(() => setIsSettingsOpen(true), []);
  const hideSettings = useCallback(() => setIsSettingsOpen(false), []);

  // Derived values
  const hasConsented = consent !== null;
  const hasMarketingConsent = consent?.marketing ?? false;

  // Don't render children until we've checked localStorage
  // This prevents flash of consent banner
  if (!isLoaded) {
    return null;
  }

  const value: ConsentContextValue = {
    consent,
    hasConsented,
    hasMarketingConsent,
    isSettingsOpen,
    acceptAll,
    rejectNonEssential,
    updateConsent,
    showSettings,
    hideSettings,
  };

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
}

export default ConsentProvider;
