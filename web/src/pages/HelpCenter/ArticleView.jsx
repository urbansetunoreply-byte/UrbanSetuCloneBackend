import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaThumbsUp, FaThumbsDown, FaChevronLeft, FaCalendarAlt, FaTag, FaBookOpen } from 'react-icons/fa';

const ArticleView = () => {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [voteStatus, setVoteStatus] = useState(null); // 'helpful', 'not_helpful' or null

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/api/help/article/${slug}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.message || 'Article not found');

                setArticle(data);
                if (data.userVote) {
                    setVoteStatus(data.userVote);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [slug]);

    const handleVote = async (type) => {
        // Optimistic UI update
        const previousStatus = voteStatus;

        // Toggle off if same type clicked, otherwise swap/set
        const newStatus = previousStatus === type ? null : type;
        setVoteStatus(newStatus);

        try {
            const res = await fetch(`${API_BASE_URL}/api/help/${article._id}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // Ensure auth header
                },
                body: JSON.stringify({ type })
            });

            if (!res.ok) {
                // Revert on error
                setVoteStatus(previousStatus);
                // toast.error("Failed to vote"); 
            }

        } catch (err) {
            console.error("Failed to vote", err);
            setVoteStatus(previousStatus);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
                <div className="max-w-4xl mx-auto animate-pulse">
                    {/* Back Link Skeleton */}
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-8 sm:p-12">
                            {/* Title Skeleton */}
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6"></div>

                            {/* Meta Row Skeleton */}
                            <div className="flex gap-4 mb-8">
                                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>

                            {/* Content Skeleton - Multiple lines */}
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Article Not Found</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">{error || "The article you are looking for does not exist."}</p>
                <Link to="/help-center" className="text-blue-600 hover:underline">Return to Help Center</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Rich Header Background */}
            <div className="h-64 bg-gradient-to-br from-blue-600 to-purple-700 relative">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <svg className="w-full h-full" fill="none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                        <path d="M0 0h100v100H0z" fill="url(#grid)" />
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M10 0L0 0 0 10" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                    </svg>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
                    <Link to="/help-center" className="text-white/80 hover:text-white inline-flex items-center mb-6 font-medium transition-colors">
                        <FaChevronLeft className="mr-2" />
                        Back to Help Center
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <FaBookOpen className="text-2xl text-yellow-300" />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">UrbanSetu Help Center</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 pb-20">
                <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-8 sm:p-12">
                        {/* Article Header */}
                        <div className="mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                    {article.category}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500 text-xs font-medium flex items-center">
                                    <FaCalendarAlt className="mr-1.5" />
                                    Last updated {new Date(article.updatedAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                                {article.title}
                            </h1>

                            {/* Tags */}
                            {article.tags && article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 text-sm">
                                    {article.tags.map((tag, idx) => (
                                        <span key={idx} className="inline-flex items-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                                            <FaTag className="mr-1 text-xs opacity-50" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="prose prose-lg dark:prose-invert max-w-none mb-12 text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {article.content}
                        </div>

                        {/* Voting Section */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 text-center border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Was this article helpful?</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleVote('helpful')}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium ${voteStatus === 'helpful'
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/30 scale-105'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 hover:border-green-200 dark:hover:border-green-800'
                                        } border border-gray-200 dark:border-gray-600`}
                                >
                                    <FaThumbsUp className={voteStatus === 'helpful' ? 'animate-bounce' : ''} />
                                    Yes
                                </button>
                                <button
                                    onClick={() => handleVote('not_helpful')}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium ${voteStatus === 'not_helpful'
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800'
                                        } border border-gray-200 dark:border-gray-600`}
                                >
                                    <FaThumbsDown className={voteStatus === 'not_helpful' ? 'animate-bounce' : ''} />
                                    No
                                </button>
                            </div>
                            {voteStatus && (
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium animate-fadeIn">
                                    Thanks for your feedback! It helps us improve our guides.
                                </p>
                            )}
                        </div>
                    </div>
                </article>

                {/* Contact CTA */}
                <div className="mt-8 text-center bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800/50">
                    <p className="text-blue-900 dark:text-blue-200 font-medium mb-3">
                        Still didn't find the answer?
                    </p>
                    <Link to="/contact" className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md">
                        Contact Support Team
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ArticleView;
