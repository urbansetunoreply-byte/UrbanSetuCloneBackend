import React, { useState } from 'react';
import { FaTimes, FaFlag, FaExclamationTriangle } from 'react-icons/fa';

export default function ReportModal({ isOpen, onClose, onReport, title = "Report Discussion" }) {
    const [reason, setReason] = useState('');
    const [category, setCategory] = useState('Inappropriate Content');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        onReport(`${category}: ${reason}`);
        setReason('');
        onClose();
    };

    const categories = [
        "Inappropriate Content",
        "Spam",
        "Harassment",
        "False Information",
        "Hate Speech",
        "Other"
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="bg-red-50 p-6 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-red-600">
                        <div className="bg-red-100 p-2 rounded-full">
                            <FaFlag className="text-xl" />
                        </div>
                        <h3 className="text-xl font-bold">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                        <FaExclamationTriangle className="text-amber-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                            Our moderators will review this discussion. Please provide details to help us understand the violation.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-gray-800"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Details</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please explain why you are reporting this..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-[120px] text-gray-800"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!reason.trim()}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-red-200"
                        >
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
