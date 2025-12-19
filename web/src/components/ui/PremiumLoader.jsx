
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const PremiumLoader = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
        "Signing you in...",
        "Activating SetuIntelligence...",
        "Analyzing User Preferences...",
        "Finalizing Data...",
        "Welcome to UrbanSetu."
    ];

    useEffect(() => {
        if (currentStep < steps.length) {
            const stepDuration = currentStep === steps.length - 1 ? 1000 : 800;

            const timer = setTimeout(() => {
                if (currentStep === steps.length - 1) {
                    // Last step, wait and then complete
                    setTimeout(onComplete, 500);
                } else {
                    setCurrentStep(prev => prev + 1);
                }
            }, stepDuration);

            return () => clearTimeout(timer);
        }
    }, [currentStep, steps.length, onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
            <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-blue-100 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full animate-pulse shadow-lg flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 animate-pulse mb-2 transition-all duration-300 transform">
                {steps[currentStep]}
            </h2>

            <div className="w-64 h-1.5 bg-gray-100 rounded-full mt-6 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
            </div>

            <p className="text-sm text-gray-400 mt-4 font-medium tracking-wide">SECURE LOGIN</p>
        </div>
    );
};

export default PremiumLoader;
