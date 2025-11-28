/**
 * Chat Theme Utility
 * Provides theme color mappings and helper functions for chat interfaces
 */

/**
 * Get theme colors based on theme name
 * @param {string} theme - Theme name (blue, green, purple, orange, red, indigo, teal, pink, yellow, cyan)
 * @returns {object} Object containing color classes for different parts of the UI
 */
export const getThemeColors = (theme = 'blue') => {
    const themeMap = {
        blue: {
            primary: 'from-blue-500 to-blue-600',
            primaryHover: 'hover:from-blue-600 hover:to-blue-700',
            accent: 'text-blue-400',
            accentBg: 'bg-blue-500',
            accentBorder: 'border-blue-500',
            accentHover: 'hover:bg-blue-600',
            ring: 'ring-blue-500',
            messageBg: 'bg-blue-50',
            messageBgDark: 'bg-blue-900/20',
            messageText: 'text-blue-900',
            messageTextDark: 'text-blue-100'
        },
        green: {
            primary: 'from-green-500 to-green-600',
            primaryHover: 'hover:from-green-600 hover:to-green-700',
            accent: 'text-green-400',
            accentBg: 'bg-green-500',
            accentBorder: 'border-green-500',
            accentHover: 'hover:bg-green-600',
            ring: 'ring-green-500',
            messageBg: 'bg-green-50',
            messageBgDark: 'bg-green-900/20',
            messageText: 'text-green-900',
            messageTextDark: 'text-green-100'
        },
        purple: {
            primary: 'from-purple-500 to-purple-600',
            primaryHover: 'hover:from-purple-600 hover:to-purple-700',
            accent: 'text-purple-400',
            accentBg: 'bg-purple-500',
            accentBorder: 'border-purple-500',
            accentHover: 'hover:bg-purple-600',
            ring: 'ring-purple-500',
            messageBg: 'bg-purple-50',
            messageBgDark: 'bg-purple-900/20',
            messageText: 'text-purple-900',
            messageTextDark: 'text-purple-100'
        },
        orange: {
            primary: 'from-orange-500 to-orange-600',
            primaryHover: 'hover:from-orange-600 hover:to-orange-700',
            accent: 'text-orange-400',
            accentBg: 'bg-orange-500',
            accentBorder: 'border-orange-500',
            accentHover: 'hover:bg-orange-600',
            ring: 'ring-orange-500',
            messageBg: 'bg-orange-50',
            messageBgDark: 'bg-orange-900/20',
            messageText: 'text-orange-900',
            messageTextDark: 'text-orange-100'
        },
        red: {
            primary: 'from-red-500 to-red-600',
            primaryHover: 'hover:from-red-600 hover:to-red-700',
            accent: 'text-red-400',
            accentBg: 'bg-red-500',
            accentBorder: 'border-red-500',
            accentHover: 'hover:bg-red-600',
            ring: 'ring-red-500',
            messageBg: 'bg-red-50',
            messageBgDark: 'bg-red-900/20',
            messageText: 'text-red-900',
            messageTextDark: 'text-red-100'
        },
        indigo: {
            primary: 'from-indigo-500 to-indigo-600',
            primaryHover: 'hover:from-indigo-600 hover:to-indigo-700',
            accent: 'text-indigo-400',
            accentBg: 'bg-indigo-500',
            accentBorder: 'border-indigo-500',
            accentHover: 'hover:bg-indigo-600',
            ring: 'ring-indigo-500',
            messageBg: 'bg-indigo-50',
            messageBgDark: 'bg-indigo-900/20',
            messageText: 'text-indigo-900',
            messageTextDark: 'text-indigo-100'
        },
        teal: {
            primary: 'from-teal-500 to-teal-600',
            primaryHover: 'hover:from-teal-600 hover:to-teal-700',
            accent: 'text-teal-400',
            accentBg: 'bg-teal-500',
            accentBorder: 'border-teal-500',
            accentHover: 'hover:bg-teal-600',
            ring: 'ring-teal-500',
            messageBg: 'bg-teal-50',
            messageBgDark: 'bg-teal-900/20',
            messageText: 'text-teal-900',
            messageTextDark: 'text-teal-100'
        },
        pink: {
            primary: 'from-pink-500 to-pink-600',
            primaryHover: 'hover:from-pink-600 hover:to-pink-700',
            accent: 'text-pink-400',
            accentBg: 'bg-pink-500',
            accentBorder: 'border-pink-500',
            accentHover: 'hover:bg-pink-600',
            ring: 'ring-pink-500',
            messageBg: 'bg-pink-50',
            messageBgDark: 'bg-pink-900/20',
            messageText: 'text-pink-900',
            messageTextDark: 'text-pink-100'
        },
        yellow: {
            primary: 'from-yellow-500 to-yellow-600',
            primaryHover: 'hover:from-yellow-600 hover:to-yellow-700',
            accent: 'text-yellow-400',
            accentBg: 'bg-yellow-500',
            accentBorder: 'border-yellow-500',
            accentHover: 'hover:bg-yellow-600',
            ring: 'ring-yellow-500',
            messageBg: 'bg-yellow-50',
            messageBgDark: 'bg-yellow-900/20',
            messageText: 'text-yellow-900',
            messageTextDark: 'text-yellow-100'
        },
        cyan: {
            primary: 'from-cyan-500 to-cyan-600',
            primaryHover: 'hover:from-cyan-600 hover:to-cyan-700',
            accent: 'text-cyan-400',
            accentBg: 'bg-cyan-500',
            accentBorder: 'border-cyan-500',
            accentHover: 'hover:bg-cyan-600',
            ring: 'ring-cyan-500',
            messageBg: 'bg-cyan-50',
            messageBgDark: 'bg-cyan-900/20',
            messageText: 'text-cyan-900',
            messageTextDark: 'text-cyan-100'
        }
    };

    return themeMap[theme] || themeMap.blue;
};

/**
 * Get dark mode classes for containers
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {string} Class string for container backgrounds
 */
export const getDarkModeContainerClass = (isDark) => {
    return isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900';
};

/**
 * Get dark mode classes for inputs
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {string} Class string for input elements
 */
export const getDarkModeInputClass = (isDark) => {
    return isDark
        ? 'bg-gray-700 text-gray-100 border-gray-600 placeholder-gray-400'
        : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-500';
};

/**
 * Get dark mode classes for text
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {string} Class string for text elements
 */
export const getDarkModeTextClass = (isDark) => {
    return isDark ? 'text-gray-100' : 'text-gray-900';
};

/**
 * Get dark mode classes for secondary text
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {string} Class string for secondary text elements
 */
export const getDarkModeSecondaryTextClass = (isDark) => {
    return isDark ? 'text-gray-400' : 'text-gray-600';
};

/**
 * Get dark mode classes for borders
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {string} Class string for border elements
 */
export const getDarkModeBorderClass = (isDark) => {
    return isDark ? 'border-gray-700' : 'border-gray-200';
};

/**
 * Get dark mode classes for hover states
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {string} Class string for hover states
 */
export const getDarkModeHoverClass = (isDark) => {
    return isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
};

/**
 * Apply accessibility settings to get modified classes
 * @param {object} settings - Settings object containing accessibility options
 * @returns {object} Object containing modified class strings
 */
export const getAccessibilityClasses = (settings = {}) => {
    const { highContrast, reducedMotion, largeText } = settings;

    return {
        contrast: highContrast ? 'contrast-125' : '',
        motion: reducedMotion ? 'motion-reduce:transition-none motion-reduce:animate-none' : '',
        text: largeText ? 'text-lg' : ''
    };
};
