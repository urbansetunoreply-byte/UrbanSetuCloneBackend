/**
 * SetuCoins Currency Configuration
 * Centralized mapping for SetuCoin values across the platform.
 */

export const COIN_CONFIG = {
    // How many coins equal 1 unit of currency
    RATES: {
        INR: 10,  // 10 Coins = ₹1
        USD: 800, // 800 Coins = $1 (Approx 1 USD = ₹80 in our economy)
    },

    // Display symbols
    SYMBOLS: {
        INR: '₹',
        USD: '$',
    }
};

/**
 * Convert coins to specified currency value
 * @param {number} balance 
 * @param {string} currencyCode 
 * @returns {string}
 */
export const formatCoinValue = (balance, currencyCode = 'INR') => {
    const rate = COIN_CONFIG.RATES[currencyCode] || COIN_CONFIG.RATES.INR;
    const value = balance / rate;

    // For USD, we might want higher precision if it's small
    const precision = currencyCode === 'USD' ? 2 : 0;

    return value.toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: 2
    });
};

/**
 * Calculate the discount value for a given coin amount
 * @param {number} coins 
 * @param {string} currencyCode 
 */
export const getCoinValue = (coins, currencyCode = 'INR') => {
    const rate = COIN_CONFIG.RATES[currencyCode] || COIN_CONFIG.RATES.INR;
    return coins / rate;
};
