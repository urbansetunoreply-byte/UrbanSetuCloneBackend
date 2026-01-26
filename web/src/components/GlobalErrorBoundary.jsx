import React from 'react';
import { FaServer, FaExclamationTriangle, FaSync, FaArrowRight } from 'react-icons/fa';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, redirectCountdown: 10 };
        this.timer = null;
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);

        // Report to backend monitor via VisitorTracker mechanism
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
            const userInfoStr = localStorage.getItem('persist:root');
            let userInfo = undefined;

            if (userInfoStr) {
                try {
                    const parsed = JSON.parse(userInfoStr);
                    const user = JSON.parse(parsed.user);
                    if (user && user.currentUser) {
                        userInfo = {
                            userId: user.currentUser._id,
                            username: user.currentUser.username,
                            email: user.currentUser.email,
                            role: user.currentUser.role
                        };
                    }
                } catch (e) { }
            }

            const body = {
                type: 'heartbeat', // Use heartbeat to avoid triggering a new pageview in logs
                userInfo,
                page: window.location.pathname,
                source: window.location.hostname,
                metrics: {
                    errors: [{
                        message: `React Error: ${error.message || 'Unknown'}`,
                        stack: error.stack?.slice(0, 1000),
                        source: 'GlobalErrorBoundary',
                        timestamp: new Date()
                    }]
                }
            };

            fetch(`${API_BASE_URL}/api/visitors/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }).catch(() => { });
        } catch (e) {
            console.error("Failed to report error:", e);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.hasError && !prevState.hasError) {
            this.startRedirectCountdown();
        }
    }

    componentWillUnmount() {
        if (this.timer) clearInterval(this.timer);
    }

    startRedirectCountdown = () => {
        this.timer = setInterval(() => {
            this.setState((prev) => {
                if (prev.redirectCountdown <= 1) {
                    clearInterval(this.timer);
                    this.handleRedirect();
                    return { redirectCountdown: 0 };
                }
                return { redirectCountdown: prev.redirectCountdown - 1 };
            });
        }, 1000);
    };

    getAlternativeUrl = () => {
        const currentHost = window.location.hostname;
        // Read auth state
        const token = localStorage.getItem('accessToken');
        const sessionId = localStorage.getItem('sessionId');
        const refreshToken = localStorage.getItem('refreshToken');
        const params = new URLSearchParams(window.location.search);

        if (token) params.set('transfer_token', token);
        if (sessionId) params.set('transfer_session', sessionId);
        if (refreshToken) params.set('transfer_refresh', refreshToken);

        const newSearch = params.toString();
        const suffix = newSearch ? `?${newSearch}` : '';

        // Logic to switch domains
        if (currentHost.includes('vercel.app')) {
            return `https://urbansetuglobal.onrender.com${window.location.pathname}${suffix}`;
        } else if (currentHost.includes('onrender.com')) {
            return `https://urbansetu.vercel.app${window.location.pathname}${suffix}`;
        }

        // Fallback/Localhost
        return null;
    };

    handleRedirect = () => {
        const altUrl = this.getAlternativeUrl();
        if (altUrl) {
            window.location.href = altUrl;
        } else {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            const altUrl = this.getAlternativeUrl();
            const isLocal = !altUrl;

            return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden text-center p-8">
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                            <FaExclamationTriangle className="text-3xl text-red-600 dark:text-red-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Something went wrong
                        </h1>

                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            We encountered an unexpected error while loading the application.
                            {altUrl && " Attempting to switch to our backup server for better stability."}
                        </p>

                        {altUrl ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 font-semibold mb-2">
                                    <FaServer />
                                    <span>Switching Server</span>
                                </div>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    Redirecting in <span className="font-bold">{this.state.redirectCountdown}</span> seconds...
                                </p>
                            </div>
                        ) : (
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Please check your internet connection or try reloading.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            {altUrl && (
                                <button
                                    onClick={this.handleRedirect}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                >
                                    Switch Server Now <FaArrowRight />
                                </button>
                            )}

                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <FaSync className="group-hover:animate-spin" /> Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
