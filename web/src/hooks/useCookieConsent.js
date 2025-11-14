import { useState, useEffect } from 'react';

// Custom hook to manage cookie consent preferences
export const useCookieConsent = () => {
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false
  });
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      const savedPreferences = JSON.parse(savedConsent);
      setPreferences(savedPreferences);
      setHasConsent(true);
    }
  }, []);

  const updatePreferences = (newPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('cookieConsent', JSON.stringify(newPreferences));
    setHasConsent(true);
  };

  const canUseAnalytics = () => {
    return hasConsent && preferences.analytics;
  };

  const canUseMarketing = () => {
    return hasConsent && preferences.marketing;
  };

  const canUseFunctional = () => {
    return hasConsent && preferences.functional;
  };

  const canUseNecessary = () => {
    return true; // Always allowed
  };

  return {
    preferences,
    hasConsent,
    updatePreferences,
    canUseAnalytics,
    canUseMarketing,
    canUseFunctional,
    canUseNecessary
  };
};

export default useCookieConsent;