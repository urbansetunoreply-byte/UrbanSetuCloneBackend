import React from 'react';
import { FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';

const TokenPaidModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <div className="flex flex-col items-center mb-4 text-center">
                    <div className="bg-blue-100 p-4 rounded-full mb-3">
                        <FaMoneyBillWave className="text-3xl text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Confirm Token Receipt</h3>
                    <p className="text-gray-600 mt-2">
                        Are you sure you want to mark the token payment as received?
                    </p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <p className="text-sm text-yellow-700">
                        <span className="font-bold">Note:</span> This action will:
                        <ul className="list-disc ml-4 mt-1">
                            <li>Mark the property as "Under Contract" (Sale-Lock)</li>
                            <li>Notify the buyer via email</li>
                            <li>Restrict other bookings for this property</li>
                        </ul>
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md transition-all transform hover:scale-105 font-bold flex items-center justify-center gap-2"
                    >
                        <FaCheckCircle /> Confirm Received
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TokenPaidModal;
