import React, { useState, useEffect } from 'react';
import { FaArrowUp, FaArrowDown, FaExchangeAlt, FaHistory, FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast } from 'react-toastify';

const CoinHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false); // Collapsible

    useEffect(() => {
        const getHistory = async () => {
            try {
                setLoading(true);
                // We use authenticatedFetch logic or standard fetch with credentials
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/coins/history`, {
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    setTransactions(data.transactions);
                }
            } catch (err) {
                console.error('Failed to fetch coin history', err);
            } finally {
                setLoading(false);
            }
        };
        getHistory();
    }, []);

    const toggleOpen = () => setIsOpen(!isOpen);

    if (!isOpen) {
        return (
            <button onClick={toggleOpen} className="w-full mt-4 flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <span className="font-semibold text-gray-700 flex items-center gap-2"><FaHistory className="text-blue-500" /> Transaction History</span>
                <FaChevronDown className="text-gray-400" />
            </button>
        )
    }

    return (
        <div className="w-full mt-4 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animation-[fadeIn_0.3s]">
            <div
                className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center cursor-pointer"
                onClick={toggleOpen}
            >
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FaHistory className="text-blue-500" />
                    Recent Transactions
                </h3>
                <FaChevronUp className="text-gray-400" />
            </div>

            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading history...</div>
                ) : transactions.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center text-gray-400">
                        <FaExchangeAlt className="text-3xl mb-2 opacity-20" />
                        <p>No transactions yet.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {transactions.map((tx) => (
                            <li key={tx._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 p-2 rounded-lg ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {tx.type === 'credit' ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{tx.description}</p>
                                        <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><FaCalendarAlt className="text-[10px]" /> {new Date(tx.createdAt).toLocaleDateString()}</span>
                                            <span className="bg-gray-200 px-1.5 rounded uppercase text-[10px] tracking-wider">{tx.source.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-bold text-lg ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <button className="text-xs text-blue-600 font-medium hover:underline">View All Activity</button>
            </div>
        </div>
    );
};

export default CoinHistory;
