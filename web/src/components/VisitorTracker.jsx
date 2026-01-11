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
    const interactionsRef = useRef([]);
    const errorsRef = useRef([]);
    const resizeCountRef = useRef(0);

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

            // Consume interactions, errors, and resize buffer
            const interactionsToSend = [...interactionsRef.current];
            const errorsToSend = [...errorsRef.current];
            const resizeCountToSend = resizeCountRef.current;

            // Clear buffers immediately
            interactionsRef.current = [];
            errorsRef.current = [];
            resizeCountRef.current = 0;

            // Construct body
            const body = {
                type,
                page: window.location.pathname,
                source: window.location.hostname,
                referrer: document.referrer || 'Direct',
                cookiePreferences: preferences || undefined,
                metrics: {
                    scrollPercentage: quantizedScroll,
                    loadTime: loadTimeRef.current,
                    interactions: interactionsToSend.length > 0 ? interactionsToSend : undefined,
                    errors: errorsToSend.length > 0 ? errorsToSend : undefined,
                    resizeCount: resizeCountToSend > 0 ? resizeCountToSend : undefined
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

    // Global Listeners for Interactions and Errors
    useEffect(() => {
        // Error Listener
        const handleError = (event) => {
            if (errorsRef.current.length < 10) {
                errorsRef.current.push({
                    message: event.message || 'Unknown Error',
                    timestamp: new Date()
                });
            }
        };

        // Click Listener
        const handleClick = (e) => {
            const target = e.target.closest('button, a, input, select, textarea, [role="button"]');
            if (target) {
                const elementLabel = target.innerText?.slice(0, 30) || target.id || target.name || target.className || target.tagName;
                if (interactionsRef.current.length < 20) {
                    interactionsRef.current.push({
                        element: `${target.tagName.toLowerCase()}:${elementLabel}`,
                        action: 'click',
                        timestamp: new Date()
                    });
                }
            }
        };

        // Resize Listener
        let resizeTimeout;
        const handleResize = () => {
            if (!resizeTimeout) {
                resizeTimeout = setTimeout(() => {
                    resizeCountRef.current += 1;
                    resizeTimeout = null;
                }, 1000);
            }
        };

        window.addEventListener('error', handleError);
        document.addEventListener('click', handleClick, true);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('error', handleError);
            document.removeEventListener('click', handleClick, true);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return null;
};

export default VisitorTracker;
