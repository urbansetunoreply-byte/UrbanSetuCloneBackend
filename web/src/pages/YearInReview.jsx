import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHome, FaCity, FaHeart, FaStar, FaCoins, FaRocket, FaFlag,
    FaChevronRight, FaChevronLeft, FaShareAlt, FaChartLine, FaUsers,
    FaShieldAlt, FaDownload, FaCalendarAlt, FaBuilding, FaMagic
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import SocialSharePanel from '../components/SocialSharePanel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const YearInReview = ({ isAdmin = false }) => {
    const { year } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [shareUrl, setShareUrl] = useState(window.location.href);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const flashbackRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const endpoint = isAdmin
                    ? `${API_BASE_URL}/api/year-in-review/admin/${year}`
                    : `${API_BASE_URL}/api/year-in-review/user/${year}`;

                const res = await fetch(endpoint, { credentials: 'include' });
                const json = await res.json();

                if (res.ok) {
                    setData(json);
                } else {
                    toast.error(json.message || 'Failed to load flashback data');
                }
            } catch (error) {
                console.error('Error fetching flashback:', error);
                toast.error('Network error. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [year, isAdmin]);

    const slideContent = isAdmin ? {
        intro: {
            title: `Admin System Review ${year}`,
            subtitle: "Platform Excellence",
            content: "Driving the future of real estate management.",
            icon: <FaShieldAlt className="text-8xl text-indigo-400 mb-6" />,
            color: "from-gray-900 via-indigo-950 to-gray-900",
        },
        stats: {
            title: "Impact Summary",
            content: data?.stats?.users > 0
                ? `Empowered ${data.stats.users} users and verified ${data.stats.listings} listings.`
                : "Platform foundation established with core listings verified.",
            subtitle: data?.stats?.bookings > 0
                ? `${data.stats.bookings} successful bookings processed.`
                : "System reliability maintained at 100%.",
            icon: <FaChartLine className="text-8xl text-emerald-400 mb-6" />,
            color: "from-gray-900 via-emerald-950 to-gray-900",
        },
        finance: {
            id: 'admin-finance',
            title: "Growth Scale",
            content: data?.stats?.revenue > 0
                ? `₹${(data.stats.revenue).toLocaleString()} volume processed efficiently.`
                : "Scaling operations for higher volume next year.",
            subtitle: `Market leader in ${data?.stats?.topCity || 'Multiple Regions'}`,
            icon: <FaCoins className="text-8xl text-yellow-500 mb-6" />,
            color: "from-gray-900 via-yellow-950 to-gray-900",
        }
    } : {
        intro: {
            title: `Your ${year} Flashback`,
            subtitle: "UrbanSetu Journeys",
            content: `Hey ${currentUser?.username}, let's revisit your property highlights.`,
            icon: <FaHome className="text-8xl text-blue-400 mb-6" />,
            color: "from-blue-950 via-[#0a192f] to-blue-950",
        },
        peak: {
            title: "Peak Energy",
            content: data?.stats?.views > 0
                ? `You were most active during ${data?.stats?.peakMonth}!`
                : "You started your engine this year!",
            subtitle: data?.stats?.views > 0
                ? "The market was buzzing with your searches."
                : "Good things take time. Keep exploring!",
            icon: <FaCalendarAlt className="text-8xl text-orange-400 mb-6" />,
            color: "from-orange-950 via-[#1a0f00] to-orange-950",
        },
        type: {
            title: "Your Signature Style",
            content: data?.stats?.views > 0
                ? `You loved browsing ${data?.stats?.topType} properties.`
                : "Finding your preferred property style...",
            subtitle: data?.stats?.views > 0
                ? "You definitely know what you're looking for!"
                : "Diversity is the spice of life. Keep searching!",
            icon: <FaMagic className="text-8xl text-cyan-400 mb-6" />,
            color: "from-cyan-950 via-[#001a1a] to-cyan-950",
        },
        views: {
            title: "The Explorer",
            content: data?.stats?.views > 0
                ? `You discovered ${data.stats.views} properties!`
                : "Your exploration journey is just beginning.",
            subtitle: data?.topCities?.length > 0
                ? `Top cities: ${data.topCities.join(', ')}`
                : "New horizons are waiting for you.",
            icon: <FaCity className="text-8xl text-purple-400 mb-6" />,
            color: "from-purple-950 via-[#14001a] to-purple-950",
        },
        heart: {
            title: "Heart Strings",
            content: data?.stats?.wishlist > 0
                ? `You found ${data.stats.wishlist} properties to love.`
                : "Still waiting for that perfect match.",
            subtitle: data?.stats?.reviews > 0
                ? `You shared ${data.stats.reviews} insightful reviews.`
                : "Join the community talk next year!",
            icon: <FaHeart className="text-8xl text-pink-400 mb-6" />,
            color: "from-pink-950 via-[#1a000a] to-pink-950",
        },
        coins: {
            title: "SetuCoins Legend",
            content: data?.stats?.coins > 0
                ? `You earned a massive ${data.stats.coins} SetuCoins!`
                : "Time to start earning those rewards!",
            subtitle: "Every interaction brings you closer to exclusive benefits.",
            icon: <FaCoins className="text-8xl text-yellow-400 mb-6" />,
            color: "from-yellow-950 via-[#1a1500] to-yellow-950",
        },
        persona: {
            title: "Your 2024 Identity",
            content: data?.personality?.type || "The Urban Resident",
            subtitle: data?.personality?.desc || "A visionary hunter of perfect spaces.",
            icon: <FaRocket className="text-8xl text-emerald-400 mb-6" />,
            color: "from-emerald-950 via-[#001a0a] to-emerald-950",
            highlight: true
        },
        outro: {
            title: "Next Stop: 2025",
            content: `Thank you for being part of UrbanSetu's journey in ${year}.`,
            icon: <FaFlag className="text-8xl text-white mb-6" />,
            color: "from-[#0f172a] via-[#1e293b] to-[#0f172a]",
            outro: true
        }
    };

    const slides = Object.entries(slideContent).map(([key, val]) => ({ id: key, ...val }));

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const handleShare = async () => {
        setIsUploading(true);
        try {
            if (!flashbackRef.current) return;

            const canvas = await html2canvas(flashbackRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
                ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore')
            });

            const base64Image = canvas.toDataURL('image/png');

            const res = await fetch(`${API_BASE_URL}/api/year-in-review/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image, year }),
                credentials: 'include'
            });

            const json = await res.json();
            if (res.ok) {
                setShareUrl(json.imageUrl);
                setIsShareOpen(true);
            } else {
                toast.error('Cloudinary upload failed. Sharing direct link instead.');
                setIsShareOpen(true);
            }
        } catch (error) {
            console.error('Share upload failed:', error);
            setIsShareOpen(true);
        } finally {
            setIsUploading(false);
        }
    };

    const downloadFlashback = async () => {
        if (!flashbackRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(flashbackRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
                ignoreElements: (el) => el.hasAttribute('data-html2canvas-ignore')
            });
            const link = document.createElement('a');
            link.download = `UrbanSetu_Flashback_${year}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Flashback saved to gallery! ✨');
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Download failed. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center text-white">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 border-t-4 border-indigo-500 border-r-4 border-indigo-500/20 rounded-full mx-auto"
                    />
                    <h2 className="mt-8 text-2xl font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent animate-pulse">Reliving {year}</h2>
                </div>
            </div>
        );
    }

    const currentData = slides[currentSlide];

    return (
        <div ref={flashbackRef} className={`fixed inset-0 bg-gradient-to-br ${currentData.color} text-white flex flex-col overflow-hidden transition-all duration-1000 font-inter`}>
            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.5, 1], x: [0, 100, 0], y: [0, 50, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px]"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], x: [0, -100, 0], y: [0, -50, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[100px]"
                />
            </div>

            {/* Slide Progress */}
            <div data-html2canvas-ignore="true" className="absolute top-0 left-0 right-0 p-4 flex gap-1 z-50">
                {slides.map((_, idx) => (
                    <div key={idx} className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                        <motion.div
                            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]"
                            initial={{ width: "0%" }}
                            animate={{ width: idx < currentSlide ? "100%" : (idx === currentSlide ? "100%" : "0%") }}
                            transition={{ duration: idx === currentSlide ? 6 : 0.4, ease: "linear" }}
                            onAnimationComplete={() => { if (idx === currentSlide && !isDownloading && !isShareOpen) nextSlide(); }}
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Areas */}
            <div data-html2canvas-ignore="true" className="absolute inset-0 z-40 flex">
                <div className="w-[30%] h-full cursor-left-arrow" onClick={prevSlide} />
                <div className="w-[70%] h-full cursor-right-arrow" onClick={nextSlide} />
            </div>

            {/* Branding Overlay - Premium Style */}
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <h1 className="text-[15vw] font-black tracking-tighter uppercase whitespace-nowrap">UrbanSetu</h1>
            </div>

            {/* Header UI */}
            <div data-html2canvas-ignore="true" className="absolute top-8 right-6 left-6 z-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center">
                        <span className="font-black text-xs text-white">US</span>
                    </div>
                    <span className="font-black tracking-[0.2em] text-xs uppercase opacity-70">UrbanSetu</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={downloadFlashback}
                        disabled={isDownloading}
                        className="w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl backdrop-blur-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
                    >
                        <FaDownload className={isDownloading ? "animate-bounce" : ""} />
                    </button>
                    <button
                        onClick={() => navigate(isAdmin ? '/admin' : '/user')}
                        className="w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl backdrop-blur-xl flex items-center justify-center transition-all active:scale-95"
                    >
                        <FaTimes />
                    </button>
                </div>
            </div>

            {/* Main Slide Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-30">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentData.id}
                        initial={{ opacity: 0, y: 40, scale: 0.9, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -40, scale: 1.1, filter: "blur(15px)" }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-3xl w-full"
                    >
                        <motion.div
                            animate={{ y: [0, -15, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="inline-block"
                        >
                            {currentData.icon}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, tracking: "0.5em" }}
                            animate={{ opacity: 1, tracking: "0.15em" }}
                            transition={{ delay: 0.3 }}
                            className="text-[10px] md:text-xs font-black uppercase text-indigo-400 mb-4 block"
                        >
                            {currentData.subtitle}
                        </motion.div>

                        <h2 className={`text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter ${currentData.highlight ? 'bg-gradient-to-br from-yellow-300 via-orange-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg' : 'text-white'}`}>
                            {currentData.title}
                        </h2>

                        <p className="text-xl md:text-3xl font-medium text-indigo-100/80 max-w-xl mx-auto leading-relaxed">
                            {currentData.content}
                        </p>

                        {currentData.outro && (
                            <motion.div
                                data-html2canvas-ignore="true"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                                className="mt-12 flex flex-col items-center gap-6"
                            >
                                <button
                                    onClick={handleShare}
                                    disabled={isUploading}
                                    className="flex items-center gap-4 bg-white text-gray-900 px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-5 h-5 border-3 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                            Preparing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCloud className="animate-pulse" /> Cloud Share
                                        </>
                                    )}
                                </button>
                                <button onClick={() => navigate(isAdmin ? '/admin' : '/user')} className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors pb-4">Back to Dashboard</button>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer / Brand Indicator */}
            <div data-html2canvas-ignore="true" className="absolute bottom-10 left-0 right-0 flex justify-center items-center flex-col gap-2 z-50">
                <p className="text-[10px] font-black tracking-widest uppercase opacity-20">Verified Story • {year}</p>
                <div className="flex gap-1.5">
                    {slides.map((_, idx) => (
                        <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentSlide ? 'bg-indigo-400 w-10' : 'bg-white/10 w-2'}`} />
                    ))}
                </div>
            </div>

            {/* Social Share Panel Overlay */}
            <SocialSharePanel
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                url={shareUrl}
                title={`My UrbanSetu Flashback ${year}`}
                description={`I explored ${data?.stats?.views} properties and my 2024 persona is "${data?.personality?.type}"! Check out your own flashback at UrbanSetu.`}
            />

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .cursor-left-arrow { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m15 18-6-6 6-6'/%3E%3C/svg%3E"), auto; }
        .cursor-right-arrow { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m9 18 6-6-6-6'/%3E%3C/svg%3E"), auto; }
      `}</style>
        </div>
    );
};

// Add missing icon FaTimes
const FaTimes = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
    </svg>
);

const FaCloud = ({ className }) => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 640 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4z"></path>
    </svg>
);

export default YearInReview;
