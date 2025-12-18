import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

export default function SignoutModal() {
    const [index, setIndex] = useState(0);

    const states = [
        { title: "Signing Out...", subtitle: "Thank you for using UrbanSetu" },
        { title: "Securing Data...", subtitle: "Encrypting and closing session" },
        { title: "Clearing Cache...", subtitle: "Removing temporary files" },
        { title: "Almost Done...", subtitle: "Ensuring your account is safe" },
        { title: "Logging Off...", subtitle: "See you again soon!" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % states.length);
        }, 1500); // Change text every 1.5 seconds for better readability
        return () => clearInterval(interval);
    }, []);

    const current = states[index];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4 transform scale-100 animate-bounce-small">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LogOut className="text-blue-600 text-lg" />
                    </div>
                </div>
                <div className="text-center w-full">
                    <h3 className="text-xl font-bold text-gray-900 transition-all duration-300 min-h-[28px]">
                        {current.title}
                    </h3>
                    <p className="text-gray-500 text-sm mt-2 transition-all duration-300 min-h-[20px]">
                        {current.subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
}
