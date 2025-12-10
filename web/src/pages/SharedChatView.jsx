import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaRobot, FaUser, FaClock, FaCalendar, FaExclamationTriangle } from 'react-icons/fa';

export default function SharedChatView() {
    const { shareToken } = useParams();
    const [chatData, setChatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/shared-chat/view/${shareToken}`);
                const data = await res.json();
                if (data.success) {
                    setChatData(data.chat);
                } else {
                    setError(data.message || "Chat not found");
                }
            } catch (err) {
                setError("Failed to load chat");
            } finally {
                setLoading(false);
            }
        };
        fetchChat();
    }, [shareToken]);

    // Simple text formatter to handle basic markdown-like syntax
    const formatText = (text) => {
        if (!text) return null;

        // Split by code blocks first
        const parts = text.split(/(```[\s\S]*?```)/g);

        return parts.map((part, index) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                // Render code block
                const content = part.slice(3, -3).replace(/^\w+\n/, ''); // Remove language identifier if present
                return (
                    <div key={index} className="bg-gray-800 text-gray-200 p-3 rounded-lg my-2 font-mono text-sm overflow-x-auto">
                        <pre>{content}</pre>
                    </div>
                );
            }

            // Render text with bolding
            return (
                <div key={index} className="whitespace-pre-wrap">
                    {part.split(/(\*\*.*?\*\*)/g).map((subPart, subIndex) => {
                        if (subPart.startsWith('**') && subPart.endsWith('**')) {
                            return <strong key={subIndex}>{subPart.slice(2, -2)}</strong>;
                        }
                        return subPart;
                    })}
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationTriangle className="text-red-500 text-3xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Unavailable</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Go Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <FaRobot size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg leading-tight">{chatData.title}</h1>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span className="flex items-center gap-1"><FaCalendar size={10} /> {new Date(chatData.createdAt).toLocaleDateString()}</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="text-blue-600 font-medium">Shared via SetuAI</span>
                            </div>
                        </div>
                    </div>
                    <a href="/" className="hidden sm:block text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                        Try SetuAI
                    </a>
                </div>
            </header>

            {/* Chat Content */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
                {chatData.messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            {msg.role === 'user' ? <FaUser size={14} /> : <FaRobot size={16} />}
                        </div>

                        <div className={`flex-1 max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-tr-none'
                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                            }`}>
                            <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                                {formatText(msg.content)}
                            </div>
                            <div className={`mt-2 text-xs flex justify-end ${msg.role === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>
                                <FaClock className="mr-1 mt-0.5" />
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            {/* Footer CTA */}
            <footer className="bg-white border-t border-gray-200 py-8 mt-8">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Start your own conversation with SetuAI</h3>
                    <p className="text-gray-600 mb-6">Get instant answers about real estate, market trends, and more.</p>
                    <a href="/" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                        Launch SetuAI
                    </a>
                </div>
            </footer>
        </div>
    );
}
