import { useState, useEffect } from 'react';

export const useChatSettings = (storageKeyPrefix = 'chat_settings') => {
    const [settings, setSettings] = useState({
        fontSize: 'medium', // small, medium, large
        messageDensity: 'comfortable', // compact, comfortable, spacious
        autoScroll: true,
        showTimestamps: true,
        soundEnabled: true,
        enterToSend: true,
        theme: 'light' // light, dark (local override)
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem(storageKeyPrefix);
        if (savedSettings) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
            } catch (e) {
                console.error('Failed to parse chat settings', e);
            }
        }
    }, [storageKeyPrefix]);

    const updateSetting = (key, value) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            localStorage.setItem(storageKeyPrefix, JSON.stringify(newSettings));
            return newSettings;
        });
    };

    return {
        settings,
        updateSetting
    };
};
