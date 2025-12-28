import React from 'react';

export default function SharedChatViewSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col animate-pulse font-sans transition-colors duration-300">

            {/* Header Skeleton */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm transition-colors duration-300">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl transition-colors duration-300"></div>
                        <div className="space-y-2">
                            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>
                    </div>
                    <div className="hidden sm:block h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors duration-300"></div>
                </div>
            </header>

            {/* Chat Content Skeleton */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">

                {/* Bot Message */}
                <div className="flex gap-4">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0 transition-colors duration-300"></div>
                    <div className="flex-1 max-w-[85%] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm rounded-tl-none transition-colors duration-300">
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>
                    </div>
                </div>

                {/* User Message */}
                <div className="flex gap-4 flex-row-reverse">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0 transition-colors duration-300"></div>
                    <div className="flex-1 max-w-[85%] bg-gray-800 dark:bg-gray-900 rounded-2xl p-4 shadow-sm rounded-tr-none transition-colors duration-300">
                        <div className="space-y-2">
                            <div className="h-4 w-3/4 bg-gray-700 dark:bg-gray-800 rounded ml-auto transition-colors duration-300"></div>
                            <div className="h-4 w-1/2 bg-gray-700 dark:bg-gray-800 rounded ml-auto transition-colors duration-300"></div>
                        </div>
                    </div>
                </div>

                {/* Bot Message */}
                <div className="flex gap-4">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0 transition-colors duration-300"></div>
                    <div className="flex-1 max-w-[85%] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm rounded-tl-none transition-colors duration-300">
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer CTA Skeleton */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 mt-8 transition-colors duration-300">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-4 flex flex-col items-center">
                    <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                    <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-300"></div>
                    <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl mt-2 transition-colors duration-300"></div>
                </div>
            </footer>

        </div>
    );
}
