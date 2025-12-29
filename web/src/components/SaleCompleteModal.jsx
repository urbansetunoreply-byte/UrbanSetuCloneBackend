import React from 'react';
import { FaHandshake, FaCheckDouble } from 'react-icons/fa';

const SaleCompleteModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <div className="flex flex-col items-center mb-4 text-center">
                    <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-3">
                        <FaHandshake className="text-3xl text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Confirm Sale Completion</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        Are you sure you want to mark this property as <strong>SOLD</strong>?
                    </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 mb-6">
                    <div className="text-sm text-red-700 dark:text-red-300">
                        <span className="font-bold">Warning:</span> This action is irreversible and will:
                        <ul className="list-disc ml-4 mt-1">
                            <li>Permanently mark the property as "Sold"</li>
                            <li>Disable all further edits and bookings</li>
                            <li>Send confirmation emails to both parties</li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-md transition-all transform hover:scale-105 font-bold flex items-center justify-center gap-2"
                    >
                        <FaCheckDouble /> Mark as Sold
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaleCompleteModal;
