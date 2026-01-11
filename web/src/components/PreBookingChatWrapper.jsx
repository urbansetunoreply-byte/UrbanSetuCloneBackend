import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { FaComments, FaTimes, FaPaperPlane, FaUser, FaCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { socket } from '../utils/socket';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PreBookingChatWrapper({ listingId, ownerId, listingTitle }) {
    const { currentUser } = useSelector((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);

    // State for Owner View
    const [inboxChats, setInboxChats] = useState([]);

    // State for Chat View
    const [activeChat, setActiveChat] = useState(null); // The full chat object
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef(null);

    const isOwner = currentUser && ownerId && currentUser._id === ownerId;

    // Toggle Chat Window
    const toggleChat = () => {
        if (!currentUser) {
            toast.info('Please sign in to chat with the owner.');
            return;
        }
        setIsOpen(!isOpen);
    };

    // 1. Fetch Data on Open
    useEffect(() => {
        if (isOpen && currentUser) {
            if (isOwner) {
                fetchOwnerChats();
            } else {
                initiateOrGetChat();
            }
        }
    }, [isOpen, currentUser, isOwner, listingId]);

    // 2. Fetch Owner's Inbox (All chats for this user)
    // Note: The controller `getUserChats` returns ALL chats for the user.
    // We might want to filter by listingId if we only want to show inquiries for THIS listing.
    // But usually an Inbox shows all. For this specific wrapper on a Listing page, 
    // maybe we should only show relevant chats? 
    // The user requirement says: "at owner side as single owner it should first show all the messsaged users"
    // So I will show all chats.
    const fetchOwnerChats = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/pre-booking-chat/user-chats`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` } // If using bearer, or relies on cookie
            });
            // Note: The fetch setup in this project usually relies on cookies ('credentials: include').
            // I'll use standard fetch with credentials.
            const data = await (await fetch(`${API_BASE_URL}/api/pre-booking-chat/user-chats`, { credentials: 'include' })).json();

            if (data.success) {
                setInboxChats(data.chats);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load chats');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Initiate/Get Chat for Buyer
    const initiateOrGetChat = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/pre-booking-chat/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ listingId, ownerId })
            });
            const data = await res.json();
            if (data.success) {
                setActiveChat(data.chat);
                setMessages(data.chat.messages || []);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Socket Listener
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (data) => {
            // data = { chatId, message, listingId, senderId }
            if (activeChat && data.chatId === activeChat._id) {
                setMessages((prev) => [...prev, data.message]);
                scrollToBottom();
            } else if (isOwner) {
                // If owner is in inbox view, update the last message preview
                fetchOwnerChats(); // Simple re-fetch to update order/preview
            }
        };

        socket.on('pre_booking_message', handleMessage);

        // Also listen for clear chat
        socket.on('chat_cleared', ({ chatId }) => {
            if (activeChat && activeChat._id === chatId) {
                setMessages([]);
            }
        });

        return () => {
            socket.off('pre_booking_message', handleMessage);
            socket.off('chat_cleared');
        };
    }, [activeChat, isOwner]);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, activeChat]);

    // Send Message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        setIsSending(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/pre-booking-chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ chatId: activeChat._id, content: newMessage })
            });
            const data = await res.json();
            if (data.success) {
                setNewMessage('');
                // Socket will handle the append
            } else {
                toast.error('Failed to send message');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    // Clear Chat
    const handleClearChat = async () => {
        if (!activeChat) return;
        if (!window.confirm("Are you sure you want to clear this chat?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/pre-booking-chat/${activeChat._id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setMessages([]);
                toast.success("Chat cleared");
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Render Functions
    const renderInbox = () => (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                <h3 className="font-semibold text-gray-800 dark:text-white">Inquiries</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {inboxChats.length === 0 ? (
                    <p className="text-center text-gray-500 mt-4">No inquiries yet.</p>
                ) : (
                    inboxChats.map(chat => {
                        const otherParticipant = chat.participants.find(p => p._id !== currentUser._id);
                        return (
                            <div
                                key={chat._id}
                                onClick={() => { setActiveChat(chat); setMessages(chat.messages); }}
                                className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {otherParticipant?.username?.[0]?.toUpperCase() || <FaUser />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="font-medium text-gray-900 dark:text-white truncate">{otherParticipant?.username}</h4>
                                            <span className="text-xs text-gray-500">
                                                {chat.lastMessage?.timestamp && new Date(chat.lastMessage.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{chat.listingId?.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                            {chat.lastMessage?.content || 'No messages'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    const renderChat = () => (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-600 text-white rounded-t-lg flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    {isOwner && (
                        <button onClick={() => setActiveChat(null)} className="mr-1 hover:bg-blue-700 p-1 rounded">
                            &larr;
                        </button>
                    )}
                    <div className="font-semibold">
                        {isOwner ?
                            activeChat?.participants.find(p => p._id !== currentUser._id)?.username
                            : 'Owner'}
                    </div>
                    <div className="text-xs opacity-75 flex items-center gap-1">
                        <FaCircle className="w-2 h-2 text-green-300" /> Online
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleClearChat} className="text-xs bg-red-500/20 hover:bg-red-500/40 p-1 rounded" title="Clear Chat">Clear</button>
                    <button onClick={toggleChat} className="hover:bg-blue-700 p-1 rounded"><FaTimes /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100 dark:bg-gray-900">
                {messages.map((msg, idx) => {
                    const isMe = msg.sender === currentUser._id;
                    return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                    }`}
                            >
                                <p>{msg.content}</p>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    <FaPaperPlane className="ml-1" />
                </button>
            </form>
        </div>
    );

    return (
        <>
            {/* Floating Entry Button */}
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                    title={isOwner ? "View Inquiries" : "Chat with Owner"}
                >
                    <FaComments className="w-6 h-6" />
                    {/* Badge for Owner */}
                    {isOwner && inboxChats.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                            {inboxChats.length}
                        </span>
                    )}
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp border border-gray-200 dark:border-gray-700">
                    {(isOwner && !activeChat) ? renderInbox() : renderChat()}
                </div>
            )}

            <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
        </>
    );
}
