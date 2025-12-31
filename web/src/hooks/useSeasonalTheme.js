import { useMemo } from 'react';

export const useSeasonalTheme = () => {
    const theme = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11
        const day = today.getDate();

        // Helper: Check date range within current month
        const isRange = (startDay, endDay, targetMonth) => {
            return month === targetMonth && day >= startDay && day <= endDay;
        };

        // Helper: Check date range across months
        const isDateBetween = (startMonth, startDay, endMonth, endDay) => {
            if (startMonth === endMonth) {
                return month === startMonth && day >= startDay && day <= endDay;
            }
            if (month === startMonth) return day >= startDay;
            if (month === endMonth) return day <= endDay;
            if (month > startMonth && month < endMonth) return true;
            return false;
        };

        // --- 1. Fixed Date Festivals (World & National) ---

        // New Year (Dec 30 - Jan 5)
        if (isDateBetween(11, 30, 0, 5)) {
            return {
                id: 'newyear',
                name: 'New Year',
                icon: '🎉',
                secondaryIcon: '🎆',
                greeting: 'Happy New Year!',
                effect: 'confetti',
                textGradient: 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600',
                logoDecoration: 'party-hat'
            };
        }

        // Republic Day India (Jan 24-26)
        if (month === 0 && day >= 24 && day <= 26) {
            return {
                id: 'republic',
                name: 'Republic Day',
                icon: '🇮🇳',
                secondaryIcon: '🫡',
                greeting: 'Happy Republic Day!',
                effect: 'none',
                textGradient: 'bg-gradient-to-r from-orange-500 via-white to-green-600',
                logoDecoration: 'flag'
            };
        }

        // Valentine's Week (Feb 10 - 14)
        if (month === 1 && day >= 10 && day <= 14) {
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

        // St. Patrick's Day (Mar 17)
        if (month === 2 && day === 17) {
            return {
                id: 'stpatrick',
                name: 'St. Patrick\'s Day',
                icon: '☘️',
                secondaryIcon: '🍺',
                greeting: 'Happy St. Patrick\'s Day!',
                effect: 'none', // Could add clover rain later
                textGradient: 'bg-gradient-to-r from-green-400 via-green-600 to-emerald-700',
                logoDecoration: 'clover'
            };
        }

        // Earth Day (Apr 22)
        if (month === 3 && day === 22) {
            return {
                id: 'earthday',
                name: 'Earth Day',
                icon: '🌍',
                secondaryIcon: '🌱',
                greeting: 'Happy Earth Day!',
                effect: 'none',
                textGradient: 'bg-gradient-to-r from-blue-400 via-green-500 to-teal-600',
                logoDecoration: 'leaf'
            };
        }

        // Independence Day India (Aug 15)
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

        // Gandhi Jayanti (Oct 2)
        if (month === 9 && day === 2) {
            return {
                id: 'gandhijayanti',
                name: 'Gandhi Jayanti',
                icon: '👓',
                secondaryIcon: '🕊️',
                greeting: 'Remembering Bapu',
                effect: 'none',
                textGradient: 'bg-gradient-to-r from-orange-300 via-white to-green-300',
                logoDecoration: 'glasses'
            };
        }

        // Halloween (Oct 31)
        if (month === 9 && day === 31) {
            return {
                id: 'halloween',
                name: 'Halloween',
                icon: '🎃',
                secondaryIcon: '👻',
                greeting: 'Happy Halloween!',
                effect: 'none',
                textGradient: 'bg-gradient-to-r from-orange-500 via-purple-600 to-black',
                logoDecoration: 'pumpkin'
            };
        }

        // Thanksgiving USA (4th Thursday Nov - approximations)
        // 2025: Nov 27, 2026: Nov 26
        if ((year === 2025 && month === 10 && day === 27) || (year === 2026 && month === 10 && day === 26)) {
            return {
                id: 'thanksgiving',
                name: 'Thanksgiving',
                icon: '🦃',
                secondaryIcon: '🍂',
                greeting: 'Happy Thanksgiving!',
                effect: 'none',
                textGradient: 'bg-gradient-to-r from-orange-700 via-yellow-600 to-red-700',
                logoDecoration: 'turkey'
            };
        }

        // Christmas (Dec 20-29)
        if (month === 11 && day >= 20 && day <= 29) {
            return {
                id: 'christmas',
                name: 'Christmas',
                icon: '🎅',
                secondaryIcon: '🎄',
                greeting: 'Merry Christmas!',
                effect: 'snow',
                textGradient: 'bg-gradient-to-r from-red-500 via-green-600 to-red-600',
                logoDecoration: 'santa-hat'
            };
        }

        // Pongal / Sankranti (Jan 13-17)
        if (month === 0 && day >= 13 && day <= 17) {
            return {
                id: 'sankranti',
                name: 'Sankranti',
                icon: '🪁',
                secondaryIcon: '🌾',
                greeting: 'Happy Makar Sankranti / Pongal!',
                effect: 'none',
                textGradient: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-green-600',
                logoDecoration: 'kite'
            };
        }


        // --- 2. Variable Date Festivals (Hardcoded for 2025 & 2026) ---
        // Note: Month is 0-indexed (Jan=0, Feb=1, etc.)

        const festivals = [
            // 2025
            { id: 'cny', year: 2025, month: 0, day: 29, window: 3, name: 'Chinese New Year', icon: '🐉', sec: '🧧', greet: 'Gong Xi Fa Cai!', effect: 'confetti', grad: 'bg-gradient-to-r from-red-600 via-yellow-500 to-red-600', deco: 'dragon' },
            { id: 'shivaratri', year: 2025, month: 1, day: 26, window: 1, name: 'Maha Shivaratri', icon: '🕉️', sec: '🔱', greet: 'Har Har Mahadev!', effect: 'none', grad: 'bg-gradient-to-r from-blue-700 via-purple-600 to-gray-800', deco: 'trident' },
            { id: 'holi', year: 2025, month: 2, day: 14, window: 1, name: 'Holi', icon: '🎨', sec: '💦', greet: 'Happy Holi!', effect: 'confetti', grad: 'bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500', deco: 'colors' },
            { id: 'ugadi', year: 2025, month: 2, day: 30, window: 1, name: 'Ugadi', icon: '🥭', sec: '🌿', greet: 'Happy Ugadi!', effect: 'none', grad: 'bg-gradient-to-r from-green-500 via-yellow-400 to-green-600', deco: 'mango' },
            { id: 'eidfitr', year: 2025, month: 2, day: 31, window: 2, name: 'Eid al-Fitr', icon: '🌙', sec: '🤲', greet: 'Eid Mubarak!', effect: 'none', grad: 'bg-gradient-to-r from-green-600 via-emerald-400 to-teal-600', deco: 'moon' },
            { id: 'ramnavami', year: 2025, month: 3, day: 6, window: 1, name: 'Sri Rama Navami', icon: '🏹', sec: '🚩', greet: 'Jai Shri Ram!', effect: 'none', grad: 'bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500', deco: 'bow' },
            { id: 'hanuman', year: 2025, month: 3, day: 12, window: 1, name: 'Hanuman Jayanti', icon: '🙏', sec: '💪', greet: 'Jai Bajrangbali!', effect: 'none', grad: 'bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500', deco: 'mace' },
            { id: 'goodfriday', year: 2025, month: 3, day: 18, window: 0, name: 'Good Friday', icon: '✝️', sec: '🕯️', greet: 'Blessed Good Friday', effect: 'none', grad: 'bg-gradient-to-r from-gray-500 via-gray-400 to-gray-600', deco: 'cross' },
            { id: 'easter', year: 2025, month: 3, day: 20, window: 1, name: 'Easter', icon: '🥚', sec: '🐰', greet: 'Happy Easter!', effect: 'none', grad: 'bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300', deco: 'egg' },
            { id: 'eidadha', year: 2025, month: 5, day: 7, window: 2, name: 'Eid al-Adha', icon: '🕌', sec: '🐑', greet: 'Eid Mubarak!', effect: 'none', grad: 'bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700', deco: 'lantern' },
            { id: 'rathyatra', year: 2025, month: 5, day: 27, window: 1, name: 'Rath Yatra', icon: '🎡', sec: '🚩', greet: 'Jai Jagannath!', effect: 'none', grad: 'bg-gradient-to-r from-yellow-500 via-red-500 to-black', deco: 'chariot' },
            { id: 'muharram', year: 2025, month: 6, day: 26, window: 1, name: 'Islamic New Year', icon: '☪️', sec: '📅', greet: 'Blessed Muharram', effect: 'none', grad: 'bg-gradient-to-r from-green-800 via-gray-700 to-black', deco: 'moon' },
            { id: 'rakhi', year: 2025, month: 7, day: 9, window: 1, name: 'Raksha Bandhan', icon: '🧵', sec: '✨', greet: 'Happy Raksha Bandhan!', effect: 'none', grad: 'bg-gradient-to-r from-orange-400 via-pink-400 to-red-500', deco: 'rakhi' },
            { id: 'janmashtami', year: 2025, month: 7, day: 16, window: 1, name: 'Janmashtami', icon: '🪈', sec: '🦚', greet: 'Happy Janmashtami!', effect: 'none', grad: 'bg-gradient-to-r from-blue-500 via-yellow-400 to-green-500', deco: 'flute' },
            { id: 'ganesh', year: 2025, month: 7, day: 27, window: 5, name: 'Ganesh Chaturthi', icon: '🐘', sec: '🕉️', greet: 'Happy Ganesh Chaturthi!', effect: 'none', grad: 'bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500', deco: 'modak' },
            { id: 'milad', year: 2025, month: 8, day: 5, window: 1, name: 'Milad un-Nabi', icon: '🕌', sec: '💚', greet: 'Eid Milad un-Nabi Mubarak!', effect: 'none', grad: 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-700', deco: 'lantern' },
            { id: 'onam', year: 2025, month: 8, day: 5, window: 2, name: 'Onam', icon: '⛵', sec: '🌺', greet: 'Happy Onam!', effect: 'none', grad: 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400', deco: 'flower' },
            { id: 'navaratri', year: 2025, month: 8, day: 22, window: 9, name: 'Navaratri', icon: '🔱', sec: '💃', greet: 'Happy Navaratri!', effect: 'none', grad: 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500', deco: 'trident' },
            { id: 'dussehra', year: 2025, month: 9, day: 2, window: 1, name: 'Dussehra', icon: '🏹', sec: '🌼', greet: 'Happy Dussehra!', effect: 'none', grad: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600', deco: 'bow' },
            { id: 'diwali', year: 2025, month: 9, day: 20, window: 3, name: 'Diwali', icon: '🪔', sec: '✨', greet: 'Happy Diwali!', effect: 'confetti', grad: 'bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600', deco: 'diya' },

            // 2026
            { id: 'cny', year: 2026, month: 1, day: 17, window: 3, name: 'Chinese New Year', icon: '🐎', sec: '🧧', greet: 'Gong Xi Fa Cai!', effect: 'confetti', grad: 'bg-gradient-to-r from-red-600 via-yellow-500 to-red-600', deco: 'dragon' },
            { id: 'shivaratri', year: 2026, month: 1, day: 15, window: 1, name: 'Maha Shivaratri', icon: '🕉️', sec: '🔱', greet: 'Har Har Mahadev!', effect: 'none', grad: 'bg-gradient-to-r from-blue-700 via-purple-600 to-gray-800', deco: 'trident' },
            { id: 'holi', year: 2026, month: 2, day: 4, window: 1, name: 'Holi', icon: '🎨', sec: '💦', greet: 'Happy Holi!', effect: 'confetti', grad: 'bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500', deco: 'colors' },
            { id: 'ugadi', year: 2026, month: 2, day: 19, window: 1, name: 'Ugadi', icon: '🥭', sec: '🌿', greet: 'Happy Ugadi!', effect: 'none', grad: 'bg-gradient-to-r from-green-500 via-yellow-400 to-green-600', deco: 'mango' },
            { id: 'eidfitr', year: 2026, month: 2, day: 20, window: 2, name: 'Eid al-Fitr', icon: '🌙', sec: '🤲', greet: 'Eid Mubarak!', effect: 'none', grad: 'bg-gradient-to-r from-green-600 via-emerald-400 to-teal-600', deco: 'moon' },
            { id: 'ramnavami', year: 2026, month: 2, day: 27, window: 1, name: 'Sri Rama Navami', icon: '🏹', sec: '🚩', greet: 'Jai Shri Ram!', effect: 'none', grad: 'bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500', deco: 'bow' },
            { id: 'hanuman', year: 2026, month: 3, day: 1, window: 1, name: 'Hanuman Jayanti', icon: '🙏', sec: '💪', greet: 'Jai Bajrangbali!', effect: 'none', grad: 'bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500', deco: 'mace' },
            { id: 'goodfriday', year: 2026, month: 3, day: 3, window: 0, name: 'Good Friday', icon: '✝️', sec: '🕯️', greet: 'Blessed Good Friday', effect: 'none', grad: 'bg-gradient-to-r from-gray-500 via-gray-400 to-gray-600', deco: 'cross' },
            { id: 'easter', year: 2026, month: 3, day: 5, window: 1, name: 'Easter', icon: '🥚', sec: '🐰', greet: 'Happy Easter!', effect: 'none', grad: 'bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300', deco: 'egg' },
            { id: 'eidadha', year: 2026, month: 4, day: 27, window: 2, name: 'Eid al-Adha', icon: '🕌', sec: '🐑', greet: 'Eid Mubarak!', effect: 'none', grad: 'bg-gradient-to-r from-green-700 via-emerald-600 to-teal-700', deco: 'lantern' },
            { id: 'rathyatra', year: 2026, month: 6, day: 16, window: 1, name: 'Rath Yatra', icon: '🎡', sec: '🚩', greet: 'Jai Jagannath!', effect: 'none', grad: 'bg-gradient-to-r from-yellow-500 via-red-500 to-black', deco: 'chariot' },
            { id: 'muharram', year: 2026, month: 6, day: 16, window: 1, name: 'Islamic New Year', icon: '☪️', sec: '📅', greet: 'Blessed Muharram', effect: 'none', grad: 'bg-gradient-to-r from-green-800 via-gray-700 to-black', deco: 'moon' },
            { id: 'rakhi', year: 2026, month: 6, day: 28, window: 1, name: 'Raksha Bandhan', icon: '🧵', sec: '✨', greet: 'Happy Raksha Bandhan!', effect: 'none', grad: 'bg-gradient-to-r from-orange-400 via-pink-400 to-red-500', deco: 'rakhi' },
            { id: 'janmashtami', year: 2026, month: 8, day: 4, window: 1, name: 'Janmashtami', icon: '🪈', sec: '🦚', greet: 'Happy Janmashtami!', effect: 'none', grad: 'bg-gradient-to-r from-blue-500 via-yellow-400 to-green-500', deco: 'flute' },
            { id: 'ganesh', year: 2026, month: 8, day: 14, window: 5, name: 'Ganesh Chaturthi', icon: '🐘', sec: '🕉️', greet: 'Happy Ganesh Chaturthi!', effect: 'none', grad: 'bg-gradient-to-r from-orange-400 via-red-500 to-yellow-500', deco: 'modak' },
            { id: 'onam', year: 2026, month: 7, day: 26, window: 2, name: 'Onam', icon: '⛵', sec: '🌺', greet: 'Happy Onam!', effect: 'none', grad: 'bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400', deco: 'flower' },
            { id: 'navaratri', year: 2026, month: 9, day: 11, window: 9, name: 'Navaratri', icon: '🔱', sec: '💃', greet: 'Happy Navaratri!', effect: 'none', grad: 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500', deco: 'trident' },
            { id: 'dussehra', year: 2026, month: 9, day: 20, window: 1, name: 'Dussehra', icon: '🏹', sec: '🌼', greet: 'Happy Dussehra!', effect: 'none', grad: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600', deco: 'bow' },
            { id: 'diwali', year: 2026, month: 10, day: 8, window: 3, name: 'Diwali', icon: '🪔', sec: '✨', greet: 'Happy Diwali!', effect: 'confetti', grad: 'bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600', deco: 'diya' },
        ];

        for (const f of festivals) {
            if (f.year === year) {
                if (month === f.month && day >= f.day && day <= f.day + f.window) {
                    return {
                        id: f.id,
                        name: f.name,
                        icon: f.icon,
                        secondaryIcon: f.sec,
                        greeting: f.greet,
                        effect: f.effect,
                        textGradient: f.grad,
                        logoDecoration: f.deco
                    };
                }
            }
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
