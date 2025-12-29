import { useState, useEffect } from 'react';

export const useChatSettings = (storageKeyPrefix = 'chat_settings') => {
    const [settings, setSettings] = useState({
        fontSize: 'medium', // small, medium, large
        messageDensity: 'comfortable', // compact, comfortable, spacious
        autoScroll: true,
        showTimestamps: true,
        soundEnabled: true,
        enterToSend: true,
        theme: localStorage.getItem('theme') || 'light', // Link to global theme
        themeColor: 'blue',
        enableAnalytics: true,
        enableErrorReporting: true,
        highContrast: false,
        reducedMotion: false,
        screenReaderSupport: false,
        largeText: false
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem(storageKeyPrefix);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                // Ensure theme stays synced with global if not explicitly set in chat settings recently? 
                // Or just prioritize global theme on mount if we want to enforce link?
                // For now, let's just respect what's in chat settings, but default to global if missing.
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error('Failed to parse chat settings', e);
            }
        }

        // Listen for global theme changes
        const handleThemeChange = (e) => {
            setSettings(prev => {
                if (prev.theme !== e.detail.theme) {
                    return { ...prev, theme: e.detail.theme };
                }
                return prev;
            });
        };
        window.addEventListener('theme-change', handleThemeChange);
        return () => window.removeEventListener('theme-change', handleThemeChange);
    }, [storageKeyPrefix]);

    const updateSetting = (key, value) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            localStorage.setItem(storageKeyPrefix, JSON.stringify(newSettings));

            // Sync global theme if theme setting is changed
            if (key === 'theme') {
                localStorage.setItem('theme', value);
                window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: value } }));
                window.dispatchEvent(new Event('storage'));

                // Immediate application logic (copied from ThemeToggle)
                if (value === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (value === 'light') {
                    document.documentElement.classList.remove('dark');
                }
            }

            return newSettings;
        });
    };

    return {
        settings,
        updateSetting
    };
};
