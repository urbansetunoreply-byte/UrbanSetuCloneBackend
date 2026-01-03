import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Rocket,
    Zap,
    Bug,
    Megaphone,
    Calendar,
    Tag,
    Search,
    ArrowRight,
    Filter
} from 'lucide-react';

import UpdatesSkeleton from '../components/skeletons/UpdatesSkeleton';

import { usePageTitle } from '../hooks/usePageTitle';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const Updates = () => {
    usePageTitle("Platform Updates - What's New");
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchUpdates();
    }, [filter, page]);

    const fetchUpdates = async () => {
        try {
            const query = new URLSearchParams({
                page: page,
                limit: 10,
                ...(filter !== 'all' && { category: filter })
            });

            const res = await fetch(`${API_BASE_URL}/api/updates/public?${query}`);
            const data = await res.json();

            if (data.success) {
                if (page === 1) {
                    setUpdates(data.data);
                } else {
                    setUpdates(prev => [...prev, ...data.data]);
                }
                setHasMore(data.data.length === 10);
            }
        } catch (error) {
            console.error('Failed to fetch updates:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'all', label: 'All Updates' },
        { id: 'new_feature', label: 'New Features', icon: Rocket, color: 'blue' },
        { id: 'improvement', label: 'Improvements', icon: Zap, color: 'amber' },
        { id: 'bug_fix', label: 'Bug Fixes', icon: Bug, color: 'red' },
        { id: 'announcement', label: 'Announcements', icon: Megaphone, color: 'purple' }
    ];

    const getCategoryIcon = (type) => {
        switch (type) {
            case 'new_feature': return <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
            case 'improvement': return <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
            case 'bug_fix': return <Bug className="w-5 h-5 text-red-600 dark:text-red-400" />;
            case 'announcement': return <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
            default: return <Rocket className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
        }
    };

    const getCategoryColor = (type) => {
        switch (type) {
            case 'new_feature': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'improvement': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'bug_fix': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'announcement': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 transition-colors duration-300">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <div className="text-center max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium text-sm mb-6 border border-blue-100 dark:border-blue-800"
                    >
                        <Rocket className="w-4 h-4" />
                        <span>Product Changelog</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight"
                    >
                        What's New in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">UrbanSetu</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                        Stay up to date with the latest features, improvements, and bug fixes. We're constantly working to make your experience better.
                    </motion.p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => { setFilter(cat.id); setPage(1); }}
                            className={`
                px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 border
                ${filter === cat.id
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 shadow-lg shadow-blue-50 dark:shadow-none ring-2 ring-blue-500/10 dark:ring-blue-500/20 scale-105'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                }
              `}
                        >
                            {cat.icon && <cat.icon className={`w-4 h-4 ${filter === cat.id ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Feed */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">


                    {loading && page === 1 ? (
                        <UpdatesSkeleton />
                    ) : updates.length > 0 ? (
                        updates.map((update, index) => (
                            <motion.div
                                key={update._id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative flex items-center md:items-center gap-4 md:gap-0 md:justify-normal md:odd:flex-row-reverse group is-active"
                            >
                                {/* Timeline Icon */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 bg-gray-50 dark:bg-gray-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-100 dark:group-hover:border-blue-800">
                                    {getCategoryIcon(update.category)}
                                </div>

                                {/* Content Card */}
                                <div className="flex-1 md:flex-none md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900/50 transition-all duration-300 group-hover:-translate-y-1">

                                    <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(update.category)}`}>
                                            {update.category.charAt(0).toUpperCase() + update.category.slice(1)}
                                        </span>
                                        <time className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(update.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </time>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors break-words">
                                        {update.title}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                                        <span className="font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600 text-xs">
                                            v{update.version}
                                        </span>
                                        {update.tags?.map((tag, i) => (
                                            <span key={i} className="text-gray-500 dark:text-gray-400 flex items-center gap-1 bg-gray-50/50 dark:bg-gray-700/30 px-2 py-0.5 rounded-full border border-gray-100/50 dark:border-gray-600/50">
                                                <Tag className="w-3 h-3" /> {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="prose prose-blue dark:prose-invert prose-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap break-words">
                                        {update.description}
                                    </div>

                                    {/* Media Gallery */}
                                    <div className="space-y-4 mt-4">
                                        {/* Images */}
                                        {(update.imageUrls?.length > 0 ? update.imageUrls : (update.imageUrl ? [update.imageUrl] : [])).map((url, i) => (
                                            <div key={`img-${i}`} className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm group/image relative">
                                                <img
                                                    src={url}
                                                    alt={`${update.title} ${i + 1}`}
                                                    className="w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-500"
                                                />
                                            </div>
                                        ))}

                                        {/* Videos */}
                                        {(update.videoUrls?.length > 0 ? update.videoUrls : (update.videoUrl ? [update.videoUrl] : [])).map((url, i) => (
                                            <div key={`vid-${i}`} className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm bg-black">
                                                <video
                                                    src={url}
                                                    className="w-full h-auto"
                                                    controls
                                                    playsInline
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Link */}
                                    {update.actionUrl && (
                                        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <a
                                                href={update.actionUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold group/link transition-colors"
                                            >
                                                Explore it here
                                                <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : ( // Empty State
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm mx-auto max-w-lg">
                            <Search className="w-16 h-16 text-gray-200 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No updates found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or check back later.</p>
                            <button
                                onClick={() => setFilter('all')}
                                className="mt-6 px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                            >
                                View All Updates
                            </button>
                        </div>
                    )}
                </div>

                {/* Load More */}
                {hasMore && !loading && updates.length > 0 && (
                    <div className="text-center mt-16">
                        <button
                            onClick={() => setPage(prev => prev + 1)}
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm hover:shadow-md"
                        >
                            Load Previous Updates
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Updates;
