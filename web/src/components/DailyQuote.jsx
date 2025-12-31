import React, { useState, useEffect } from 'react';
import { FaQuoteLeft, FaQuoteRight, FaTimes } from 'react-icons/fa';

const quotes = [
    // Real Estate Facts & "Did You Know?"
    { text: "90% of all millionaires become so through owning real estate.", author: "Andrew Carnegie" },
    { text: "McDonald's is actually one of the world's largest real estate companies, not just a burger chain.", author: "Real Estate Fact" },
    { text: "The White House in Washington D.C. has 132 rooms, 35 bathrooms, and 6 levels.", author: "Property Trivia" },
    { text: "The term 'mortgage' comes from Old French words meaning 'death pledge'.", author: "Historical Fact" },
    { text: "Using a real estate agent to sell a home can increase the sale price by up to 22%.", author: "Market Insight" },
    { text: "The Burj Khalifa in Dubai is so tall that you can watch the sunset from the base, then take the elevator to the top to watch it again.", author: "Architectural Wonder" },
    { text: "Staged homes sell 73% faster than non-staged homes on average.", author: "Selling Tip" },
    { text: "The most expensive private home in the world is Antilia in Mumbai, valued at over $2 billion.", author: "Luxury Real Estate" },
    { text: "A 'buyers market' is when there are more homes for sale than there are buyers.", author: "Market Terminology" },
    { text: "Renovating a kitchen or bathroom usually offers the highest return on investment (ROI) for sellers.", author: "Investment Tip" },

    // Iconic Real Estate Wisdom
    { text: "Real estate cannot be lost or stolen, nor can it be carried away. Purchased with common sense..., it is about the safest investment in the world.", author: "Franklin D. Roosevelt" },
    { text: "Buy land, they're not making it anymore.", author: "Mark Twain" },
    { text: "The best investment on Earth is earth.", author: "Louis Glickman" },
    { text: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
    { text: "Location, location, location.", author: "Harold Samuel" },
    { text: "Landlords grow rich in their sleep.", author: "John Stuart Mill" },

    // Urban & Architectural Trivia
    { text: "Feng Shui concepts are increasingly requested by home buyers to ensure positive energy flow.", author: "Design Trend" },
    { text: "The 'Hollywood Sign' originally read 'Hollywoodland' and was an advertisement for a real estate development.", author: "LA Trivia" },
    { text: "In Japan, it is common to demolish and rebuild houses every 30 years rather than renovate.", author: "Global Real Estate" },
    { text: "The Great Pyramid of Giza was the tallest man-made structure for over 3,800 years.", author: "Ancient Architecture" },

    // Smart Home & Future
    { text: "Smart home technology can increase a home's resale value by up to 5%.", author: "Tech Insight" },
    { text: "Green buildings with solar panels sell 4% more than homes without them.", author: "Sustainability Fact" },

    // Indian Real Estate Context
    { text: "RERA (Real Estate Regulatory Authority) was introduced in 2016 to protect home buyers in India.", author: "Indian Real Estate" },
    { text: "Vaastu Shastra compliance can increase a property's asking price by 10-15% in India.", author: "Market Reality" },
    { text: "Bangalore is known as the 'Silicon Valley of India', driving massive commercial real estate value.", author: "City Spotlight" }
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
