import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const VisitorTracker = () => {
    const location = useLocation();

    // Helper to get preferences
    const getPreferences = () => {
        try {
            const stored = localStorage.getItem('cookieConsent');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    };

    const track = async (type = 'pageview') => {
        try {
            const preferences = getPreferences();

            // Construct body
            const body = {
                type,
                page: window.location.pathname,
                source: window.location.hostname,
                referrer: document.referrer || 'Direct',
                cookiePreferences: preferences || undefined
            };

            // Capture UTM parameters from URL
            const params = new URLSearchParams(window.location.search);
            const utm = {
                source: params.get('utm_source'),
                medium: params.get('utm_medium'),
                campaign: params.get('utm_campaign'),
                term: params.get('utm_term'),
                content: params.get('utm_content')
            };
            // Only add utm to body if we found at least source or medium
            if (utm.source || utm.medium || utm.campaign) body.utm = utm;

            // Use sendBeacon for heartbeat if page is unloading (optional optim)
            // But fetch is fine for generic tracking

            await fetch(`${API_BASE_URL}/api/visitors/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (err) {
            // silent fail
        }
    };

    // Track on route change (Page View)
    useEffect(() => {
        // We track pathname changes.
        // The backend handles deduplication if the page matches the last one.
        track('pageview');
    }, [location.pathname]);

    // Heartbeat every 60 seconds (Duration Tracking)
    useEffect(() => {
        const interval = setInterval(() => {
            track('heartbeat');
        }, 60000); // 1 minute interval

        return () => clearInterval(interval);
    }, []);

    // Track on visibility change (Tab hidden/closed)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                track('heartbeat');
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    return null;
};

export default VisitorTracker;
