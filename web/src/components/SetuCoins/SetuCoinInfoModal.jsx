import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCoins, FaCheckCircle, FaStar, FaTrophy, FaTimes } from 'react-icons/fa';

const SetuCoinInfoModal = ({ isOpen, onClose }) => {
    // Handle Esc key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-[scaleIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-slate-100/80 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all z-20 backdrop-blur-sm"
                >
                    <FaTimes />
                </button>

                {/* Modal Header */}
                <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-8 text-white relative">
                    <FaCoins className="absolute bottom-[-10px] right-[-10px] text-8xl text-white/20 rotate-12" />
                    <h2 className="text-3xl font-black mb-1 flex items-center gap-3">
                        <FaTrophy className="text-yellow-200 animate-bounce" /> SetuCoins
                    </h2>
                    <p className="text-white/80 font-medium">Your loyalty rewards ecosystem.</p>
                </div>

                {/* Modal Body */}
                <div className="p-8 space-y-6">
                    <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FaStar className="text-yellow-500" /> What are SetuCoins?
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            SetuCoins are UrbanSetu's exclusive reward currency. They represent our appreciation for long-term residents and active community members.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <FaCheckCircle className="text-green-500" /> How to Earn?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <p className="font-bold text-slate-800 text-xs mb-1">Rent Cashback</p>
                                <p className="text-[10px] text-slate-500">1% of every rent payment back in coins.</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <p className="font-bold text-slate-800 text-xs mb-1">Consistency</p>
                                <p className="text-[10px] text-slate-500">Bonus for staying on streak.</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <p className="font-bold text-slate-800 text-xs mb-1">Services</p>
                                <p className="text-[10px] text-slate-500">Earn by booking handyman/cleaning.</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <p className="font-bold text-slate-800 text-xs mb-1">Engagement</p>
                                <p className="text-[10px] text-slate-500">Earn through platform activity.</p>
                            </div>
                        </div>
                    </section>

                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg">
                            ₹
                        </div>
                        <div>
                            <p className="text-slate-800 font-bold text-xs">Real Value Redemption</p>
                            <p className="text-[10px] text-slate-500">Every 10 Coins = ₹1 Discount on platform services.</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
                    >
                        Got it, Thanks!
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.8) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default SetuCoinInfoModal;
