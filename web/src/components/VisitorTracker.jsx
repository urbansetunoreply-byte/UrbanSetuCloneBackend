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

    const maxScrollRef = useRef(0);
    const loadTimeRef = useRef(0);

    // Calculate Scroll Percentage
    const getScrollPercentage = () => {
        try {
            const h = document.documentElement,
                b = document.body,
                st = 'scrollTop',
                sh = 'scrollHeight';
            const percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;
            return Math.min(100, Math.max(0, Math.round(percent)));
        } catch { return 0; }
    };

    const track = async (type = 'pageview') => {
        try {
            const preferences = getPreferences();

            // Get current max scroll
            const currentScroll = getScrollPercentage();
            if (currentScroll > maxScrollRef.current) maxScrollRef.current = currentScroll;

            // Quantize scroll to 25% buckets for cleaner data
            const quantizedScroll = Math.floor(maxScrollRef.current / 25) * 25;

            // Construct body
            const body = {
                type,
                page: window.location.pathname,
                source: window.location.hostname,
                referrer: document.referrer || 'Direct',
                cookiePreferences: preferences || undefined,
                metrics: {
                    scrollPercentage: quantizedScroll,
                    loadTime: loadTimeRef.current
                }
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
            if (utm.source || utm.medium || utm.campaign) body.utm = utm;

            await fetch(`${API_BASE_URL}/api/visitors/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (err) { }
    };

    // Performance Tracking (Once on mount)
    useEffect(() => {
        try {
            // Wait for load
            setTimeout(() => {
                const navEntry = performance.getEntriesByType("navigation")[0];
                if (navEntry) {
                    loadTimeRef.current = Math.round(navEntry.domContentLoadedEventEnd || 0);
                }
            }, 1000);
        } catch (e) { }
    }, []);

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            const current = getScrollPercentage();
            if (current > maxScrollRef.current) {
                maxScrollRef.current = current;
            }
        };
        // Throttle scroll listener slightly
        let timeout;
        const throttledScroll = () => {
            if (!timeout) {
                timeout = setTimeout(() => {
                    handleScroll();
                    timeout = null;
                }, 500);
            }
        };
        window.addEventListener('scroll', throttledScroll);
        return () => window.removeEventListener('scroll', throttledScroll);
    }, [location.pathname]);

    // Track on route change (Page View)
    useEffect(() => {
        // Reset scroll on page change
        maxScrollRef.current = 0;

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
