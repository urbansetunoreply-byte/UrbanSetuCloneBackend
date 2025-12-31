import React, { useState, useEffect } from 'react';
import { FaQuoteLeft, FaQuoteRight, FaTimes } from 'react-icons/fa';

const quotes = [
    // General Motivation
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },

    // Real Estate Wisdom
    { text: "Real estate cannot be lost or stolen, nor can it be carried away.", author: "Franklin D. Roosevelt" },
    { text: "Buy land, they're not making it anymore.", author: "Mark Twain" },
    { text: "The best investment on Earth is earth.", author: "Louis Glickman" },
    { text: "Real estate is an imperishable asset, ever increasing in value.", author: "Russell Sage" },

    // Scientific Inspiration
    { text: "Imagination is more important than knowledge.", author: "Albert Einstein" },
    { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan" },
    { text: "Science remains the most reliable path to truth.", author: "Neil deGrasse Tyson" },

    // Life & Architecture
    { text: "We shape our buildings; thereafter they shape us.", author: "Winston Churchill" },
    { text: "Architecture is a visual art, and the buildings speak for themselves.", author: "Julia Morgan" },

    // Indian Wisdom
    { text: "You have to dream before your dreams can come true.", author: "A. P. J. Abdul Kalam" },
    { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" }
];

const DailyQuote = ({ className = "" }) => {
    const [quote, setQuote] = useState(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Generate a determinstic index based on the day of the year
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        // Use modulo to cycle through quotes
        const index = dayOfYear % quotes.length;
        setQuote(quotes[index]);
    }, []);

    if (!isVisible || !quote) return null;

    return (
        <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-b border-blue-100 dark:border-gray-700 py-3 px-4 relative transition-all duration-300 ${className}`}>
            <div className="max-w-7xl mx-auto flex items-center justify-center text-center relative pr-8">
                <FaQuoteLeft className="text-blue-200 dark:text-blue-900 absolute left-0 lg:left-4 top-1/2 -translate-y-1/2 text-2xl lg:text-3xl opacity-50" />
                <div className="mx-8">
                    <p className="text-gray-700 dark:text-gray-300 font-medium italic text-sm sm:text-base">
                        "{quote.text}"
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                        — {quote.author}
                    </p>
                </div>
                <FaQuoteRight className="text-blue-200 dark:text-blue-900 absolute right-0 lg:right-4 top-1/2 -translate-y-1/2 text-2xl lg:text-3xl opacity-50" />

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Dismiss"
                >
                    <FaTimes size={12} />
                </button>
            </div>
        </div>
    );
};

export default DailyQuote;
