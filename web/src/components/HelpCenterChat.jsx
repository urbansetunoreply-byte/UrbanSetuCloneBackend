import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaRobot, FaUser, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

const HelpCenterChat = () => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm the UrbanSetu AI Assistant. ask me any question about our platform, services, or real estate policies, and I'll do my best to help!",
            id: 'init-1'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [showEscalation, setShowEscalation] = useState(false);
    const messagesEndRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Generate a random session ID for this visitor if not present
        if (!sessionId) {
            setSessionId(`help_guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        }
    }, [sessionId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setShowEscalation(false); // Reset escalation on new query

        // Add user message
        const newUserMsg = { role: 'user', content: userMessage, id: Date.now() };
        setMessages(prev => [...prev, newUserMsg]);
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId: sessionId,
                    history: messages.map(m => ({ role: m.role, content: m.content })),
                    tone: 'friendly', // Force friendly tone for help center
                    responseLength: 'medium'
                })
            });

            const data = await res.json();

            if (data.success) {
                const aiMsg = { role: 'assistant', content: data.response, id: Date.now() + 1 };
                setMessages(prev => [...prev, aiMsg]);

                // Simple heuristic for escalation:
                // If response contains uncertainty phrases, show escalation button
                const lowerResponse = data.response.toLowerCase();
                if (
                    lowerResponse.includes("i'm not sure") ||
                    lowerResponse.includes("i don't know") ||
                    lowerResponse.includes("contact support") ||
                    lowerResponse.includes("customer service") ||
                    lowerResponse.includes("cannot answer")
                ) {
                    setShowEscalation(true);
                }
            } else {
                throw new Error(data.message || 'Failed to get response');
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again later.",
                isError: true,
                id: Date.now() + 1
            }]);
            setShowEscalation(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-[600px] w-full max-w-4xl mx-auto my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <FaRobot className="text-white text-xl" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">UrbanSetu Instant Help</h3>
                        <p className="text-blue-100 text-xs">AI-powered 24/7 Support</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-green-500 text-white'
                                }`}>
                                {msg.role === 'user' ? <FaUser size={12} /> : <FaRobot size={14} />}
                            </div>

                            <div className={`p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
                                }`}>
                                {msg.isError ? (
                                    <div className="flex items-center gap-2 text-red-500">
                                        <FaExclamationTriangle />
                                        <span>{msg.content}</span>
                                    </div>
                                ) : (
                                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex flex-row gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
                                <FaRobot size={14} />
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Escalation Prompt */}
                {showEscalation && (
                    <div className="flex justify-center my-4 animate-fadeIn">
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4 max-w-lg text-center sm:text-left">
                            <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-200">
                                <FaExclamationTriangle />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Need more help?</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300">The AI might be unsure. You can contact our human support team directly.</p>
                            </div>
                            <Link
                                to="/contact"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                                Contact Support <FaArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question here about buying, renting, or our policies..."
                        className="w-full pl-6 pr-14 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white shadow-inner transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <FaPaperPlane className={`text-sm ${isLoading ? 'animate-pulse' : ''}`} />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        UrbanSetu AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HelpCenterChat;
