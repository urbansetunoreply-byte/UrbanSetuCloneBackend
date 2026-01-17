import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaSearch, FaArrowRight, FaChevronLeft, FaEdit, FaBookOpen, FaFire, FaClock, FaCheckCircle, FaTag } from 'react-icons/fa';
import { helpCategories } from '../../utils/helpCategories';

const HelpCenter = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const fetchArticles = async (category = '', search = '') => {
        try {
            setLoading(true);
            let url = `${API_BASE_URL}/api/help?limit=20`;
            if (category) url += `&category=${encodeURIComponent(category)}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            if (!category && !search) {
                url += `&sort=popular`;
            }

            const res = await fetch(url);
            const data = await res.json();
            setArticles(data);
        } catch (error) {
            console.error("Failed to fetch articles", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const handleSearch = () => {
        fetchArticles(selectedCategory?.id || '', searchTerm);
    };

    const { currentUser } = useSelector((state) => state.user);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
                {/* Background elements */}
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
                <div className="absolute top-0 left-0 w-48 h-48 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>

                {currentUser && (currentUser.role === 'admin' || currentUser.role === 'rootadmin') && (
                    <Link
                        to="/admin/help-center"
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-all text-sm font-medium flex items-center gap-2 z-20"
                    >
                        <FaEdit /> Manage Help Center
                    </Link>
                )}

                <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
                    {/* Brand Logo / Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl animate-float">
                            <FaBookOpen className="text-5xl text-yellow-400 drop-shadow-lg" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
                        <span className="bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">How can we</span>
                        <br />
                        <span className="text-white">help you today?</span>
                    </h1>

                    <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-light">
                        Find advice, answers, and support from the <span className="font-semibold text-yellow-300">UrbanSetu Team</span>.
                    </p>

                    <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-2xl max-w-2xl mx-auto flex items-center transform transition-all hover:scale-[1.01] focus-within:ring-4 focus-within:ring-blue-400/30">
                        <FaSearch className="text-gray-400 ml-4 text-xl" />
                        <input
                            type="text"
                            placeholder="Search for answers (e.g. 'reset password')"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full px-4 py-3 bg-transparent text-gray-900 dark:text-white border-none focus:ring-0 placeholder-gray-400 text-lg outline-none"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                        >
                            Search
                        </button>
                    </div>

                    {/* Popular Tags / Quick Links */}
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <span className="text-white/80 text-sm font-medium mr-2 self-center">Popular:</span>
                        {['Login Issue', 'Account', 'Payment', 'Listings', 'Safety'].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => { setSearchTerm(tag); handleSearch(); }}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm text-white transition-all backdrop-blur-sm"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-20 relative z-20">
                {/* Categories Grid - Only show if NO search term is active */}
                {!searchTerm && (
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-10 text-center flex items-center justify-center gap-3">
                            <span className="w-12 h-1 bg-blue-600 rounded-full"></span>
                            Browse by Category
                            <span className="w-12 h-1 bg-blue-600 rounded-full"></span>
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                            {helpCategories.map((cat, index) => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setSelectedCategory(cat.title); setSearchTerm(''); }}
                                    className={`
                                        group relative p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-4 text-center overflow-hidden
                                        ${selectedCategory === cat.title
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:-translate-y-1'
                                        }
                                    `}
                                >
                                    <div className={`
                                        p-4 rounded-full text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                                        ${selectedCategory === cat.title ? 'bg-white/20' : 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400'}
                                    `}>
                                        {cat.icon}
                                    </div>
                                    <span className="font-semibold">{cat.title}</span>
                                    {selectedCategory === cat.title && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Articles Section */}
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Main Content Area */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                {searchTerm ? (
                                    <>
                                        <FaSearch className="text-blue-500" />
                                        Search Results for "{searchTerm}"
                                    </>
                                ) : (
                                    <>
                                        {selectedCategory ? (
                                            <>
                                                <span className="text-3xl text-blue-500">
                                                    {helpCategories.find(c => c.title === selectedCategory)?.icon}
                                                </span>
                                                {selectedCategory}
                                            </>
                                        ) : (
                                            <>
                                                <FaFire className="text-orange-500" />
                                                Popular Articles
                                            </>
                                        )}
                                    </>
                                )}
                            </h2>
                            {(searchTerm || selectedCategory) && (
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedCategory(null); fetchArticles(); }}
                                    className="text-blue-600 hover:underline text-sm font-medium"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : articles.length > 0 ? (
                            <div className="space-y-4">
                                {articles.map((article, index) => (
                                    <Link
                                        to={`/help-center/article/${article.slug}`}
                                        key={article._id}
                                        className="group block bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"></div>

                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                                        {article.category}
                                                    </span>
                                                    {article.tags && article.tags.length > 0 && (
                                                        <span className="hidden sm:inline-flex items-center text-xs text-gray-400">
                                                            <FaTag className="mr-1 text-[10px]" />
                                                            {article.tags.slice(0, 2).join(', ')}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {article.title}
                                                </h3>

                                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                                                    {article.description}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <FaClock /> 5 min read
                                                    </span>
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                        <FaCheckCircle className="text-[10px]" /> Update verified
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <FaArrowRight className="transform group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                                <div className="bg-gray-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaSearch className="text-3xl text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No answers found</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                    We couldn't find any articles matching your search. Try different keywords or browse categories.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Quick Links only on Desktop */}
                    <div className="hidden lg:block w-80 space-y-8 sticky top-24 self-start">
                        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <h3 className="text-xl font-bold mb-2 relative z-10">Still need help?</h3>
                            <p className="text-blue-100 text-sm mb-6 relative z-10 w-3/4 mx-auto">Our support team is available 24/7 to assist you with any issues.</p>
                            <Link to="/contact" className="inline-block w-full py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-md">
                                Contact Support
                            </Link>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Links</h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                                        <FaArrowRight className="text-xs" /> About UrbanSetu
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/privacy-policy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                                        <FaArrowRight className="text-xs" /> Privacy Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/terms-and-conditions" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2">
                                        <FaArrowRight className="text-xs" /> Terms of Service
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
