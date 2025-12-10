import React, { useState, useEffect } from 'react';
import { FaShareAlt, FaCopy, FaTrash, FaClock, FaCheck, FaTimes, FaGlobe, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function ShareChatModal({ isOpen, onClose, sessionId, currentChatName }) {
    const [loading, setLoading] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [expiryType, setExpiryType] = useState('30days');
    const [customTitle, setCustomTitle] = useState(currentChatName || '');
    const [copied, setCopied] = useState(false);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

    useEffect(() => {
        if (isOpen && sessionId) {
            fetchShareInfo();
        }
    }, [isOpen, sessionId]);

    const fetchShareInfo = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shared-chat/manage/${sessionId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success && data.sharedChat) {
                setShareData(data.sharedChat);
                setCustomTitle(data.sharedChat.title);
                // Deduce expiry type logic if needed, but simple is fine
            } else {
                setShareData(null);
            }
        } catch (error) {
            console.error('Error fetching share info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLink = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shared-chat/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    sessionId,
                    title: customTitle,
                    expiresType: expiryType
                })
            });
            const data = await res.json();
            if (data.success) {
                setShareData(data.sharedChat);
                toast.success("Link generated successfully!");
            } else {
                toast.error(data.message || "Failed to generate link");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

    const handleRevokeLink = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shared-chat/${shareData.shareToken}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setShareData(null);
                setShowRevokeConfirm(false);
                toast.success("Link revoked successfully");
                onClose();
            } else {
                toast.error(data.message || "Failed to revoke");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/shared-chat/${shareData.shareToken}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: customTitle,
                    expiresType: expiryType,
                    isActive: shareData.isActive
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchShareInfo(); // Refresh
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to update");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!shareData) return;
        const url = `${window.location.origin}${shareData.url}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied!");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FaShareAlt /> Share Chat
                    </h3>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchShareInfo} className="hover:bg-white/20 p-2 rounded-full transition-colors" title="Refresh Views">
                            <FaSync />
                        </button>
                        <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {loading && !shareData && (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {!loading && !shareData && (
                        <>
                            <div className="text-center space-y-2">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaGlobe className="text-blue-500 text-3xl" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-800">Share this conversation</h4>
                                <p className="text-sm text-gray-500">
                                    Create a public link to share this chat. Anyone with the link will be able to view the messages.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chat Title (Public)</label>
                                    <input
                                        type="text"
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter a title for the shared chat"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link Expiry</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['7days', '30days', 'never'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setExpiryType(type)}
                                                className={`py-2 text-sm rounded-lg border transition-all ${expiryType === type
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {type === '7days' && '7 Days'}
                                                {type === '30days' && '30 Days'}
                                                {type === 'never' && 'No Expiry'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateLink}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition-transform transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Generating...' : 'Create Public Link'}
                                </button>
                            </div>
                        </>
                    )}

                    {shareData && !showRevokeConfirm && (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-green-800 text-sm">Link is Active</h4>
                                    <p className="text-xs text-green-700">This chat is publicly accessible via the link below.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shared Link</label>
                                <div className="flex gap-2">
                                    <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-gray-600 text-sm flex-1 truncate select-all">
                                        {window.location.origin}{shareData.url}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className={`px-4 rounded-lg font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-gray-800 text-white hover:bg-gray-900'
                                            }`}
                                    >
                                        {copied ? <FaCheck /> : <FaCopy />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <span className="text-gray-500 block text-xs uppercase tracking-wide">Views</span>
                                    <span className="font-bold text-gray-800 text-lg">{shareData.views}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <span className="text-gray-500 block text-xs uppercase tracking-wide">Expires</span>
                                    <span className="font-bold text-gray-800">
                                        {shareData.expiresAt
                                            ? new Date(shareData.expiresAt).toLocaleDateString('en-IN')
                                            : 'Never'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 flex gap-3">
                                <button
                                    onClick={handleUpdate}
                                    className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-lg transition-colors"
                                >
                                    Update Link
                                </button>
                                <button
                                    onClick={() => setShowRevokeConfirm(true)}
                                    className="flex-1 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <FaTrash className="text-sm" /> Revoke Link
                                </button>
                            </div>
                        </div>
                    )}

                    {shareData && showRevokeConfirm && (
                        <div className="space-y-6 text-center animate-fade-in">
                            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaTrash className="text-red-500 text-3xl" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Revoke Shared Link?</h4>
                            <p className="text-gray-600 text-sm">
                                Are you sure you want to delete this shared link? Anyone with the link will no longer be able to access this conversation.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowRevokeConfirm(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRevokeLink}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 text-white font-medium py-3 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                                >
                                    {loading ? 'Revoking...' : 'Yes, Revoke Link'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
