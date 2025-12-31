import { useMemo } from 'react';

export const useSeasonalTheme = () => {
    const theme = useMemo(() => {
        const today = new Date();
        const month = today.getMonth(); // 0-11
        const day = today.getDate();

        // Helper to check date ranges
        const isDateBetween = (startMonth, startDay, endMonth, endDay) => {
            if (startMonth === endMonth) {
                return month === startMonth && day >= startDay && day <= endDay;
            }
            // Handle ranges spanning months (e.g., Dec to Jan)
            if (month === startMonth) return day >= startDay;
            if (month === endMonth) return day <= endDay;
            return false;
        };

        // --- Events Logic ---

        // 1. Christmas (Dec 20 - Dec 29)
        if (month === 11 && day >= 20 && day <= 29) {
            return {
                id: 'christmas',
                name: 'Christmas',
                icon: '🎅',
                secondaryIcon: '🎄',
                greeting: 'Merry Christmas!',
                effect: 'snow',
                // Red and Green gradient
                textGradient: 'bg-gradient-to-r from-red-500 via-green-600 to-red-600',
                logoDecoration: 'santa-hat'
            };
        }

        // 2. New Year (Dec 30 - Jan 5)
        if ((month === 11 && day >= 30) || (month === 0 && day <= 5)) {
            return {
                id: 'newyear',
                name: 'New Year',
                icon: '🎉',
                secondaryIcon: '🎆',
                greeting: 'Happy New Year!',
                effect: 'confetti',
                // Gold/Silver/Purple festive gradient
                textGradient: 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600',
                logoDecoration: 'party-hat'
            };
        }

        // 3. Makar Sankranti / Pongal (Jan 13 - Jan 17)
        if (month === 0 && day >= 13 && day <= 17) {
            return {
                id: 'sankranti',
                name: 'Sankranti',
                icon: '🪁',
                secondaryIcon: '🌾',
                greeting: 'Happy Makar Sankranti!',
                effect: 'none', // Subtle CSS animation if needed
                // Harvest colors (Yellow, Orange, Green)
                textGradient: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-green-600',
                logoDecoration: 'kite'
            };
        }

        // 4. Republic Day India (Jan 26)
        if (month === 0 && day === 26) {
            return {
                id: 'republic',
                name: 'Republic Day',
                icon: '🇮🇳',
                secondaryIcon: '🫡',
                greeting: 'Happy Republic Day!',
                effect: 'none',
                // Tricolor gradient
                textGradient: 'bg-gradient-to-r from-orange-500 via-white to-green-600',
                logoDecoration: 'flag'
            };
        }

        // 5. Valentine's Day (Feb 14)
        if (month === 1 && day === 14) {
            return {
                id: 'valentine',
                name: 'Valentine\'s Day',
                icon: '❤️',
                secondaryIcon: '💘',
                greeting: 'Happy Valentine\'s Day!',
                effect: 'hearts',
                textGradient: 'bg-gradient-to-r from-red-500 via-pink-500 to-rose-500',
                logoDecoration: 'heart'
            };
        }

        // 6. Independence Day India (Aug 15)
        if (month === 7 && day === 15) {
            return {
                id: 'independence',
                name: 'Independence Day',
                icon: '🇮🇳',
                secondaryIcon: '🎆',
                greeting: 'Happy Independence Day!',
                effect: 'none',
                textGradient: 'bg-gradient-to-r from-orange-500 via-white to-green-600',
                logoDecoration: 'flag'
            };
        }

        // --- Seasons Logic (Fallback) ---
        // Winter (Dec, Jan, Feb)
        if (month === 11 || month === 0 || month === 1) {
            return {
                id: 'winter',
                name: 'Winter',
                icon: '❄️',
                secondaryIcon: '☃️',
                greeting: 'Stay Warm!',
                effect: 'snow',
                textGradient: 'bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400',
                logoDecoration: 'snow-cap'
            };
        }

        return null; // No active theme
    }, []);

    return theme;
};
