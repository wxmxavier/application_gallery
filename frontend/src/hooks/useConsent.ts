// Custom hook for accessing consent state
import { useContext } from 'react';
import { ConsentContext } from '../contexts/ConsentContext';
import type { ConsentContextValue } from '../types/consent';

/**
 * Hook to access consent state and actions
 * Must be used within ConsentProvider
 */
export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);

  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }

  return context;
}
