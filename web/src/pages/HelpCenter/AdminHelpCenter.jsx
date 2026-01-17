import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaCheck, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { helpCategories } from '../../utils/helpCategories';
import ConfirmationModal from '../../components/ConfirmationModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminHelpCenter = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        content: '',
        tags: '',
        isPublished: true
    });

    // Delete State
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            // Using admin endpoint to see even unpublished ones if needed, or public GET
            // Using public GET is easier unless we restrict unpublished visibility.
            // But verifyAdmin middleware was put on /admin/all
            const res = await fetch(`${API_BASE_URL}/api/help/admin/all`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load articles");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (article = null) => {
        if (article) {
            setEditingArticle(article);
            setFormData({
                title: article.title,
                category: article.category,
                description: article.description,
                content: article.content,
                tags: article.tags ? article.tags.join(', ') : '',
                isPublished: article.isPublished
            });
        } else {
            setEditingArticle(null);
            setFormData({
                title: '',
                category: helpCategories[0]?.title || '', // Default to first category
                description: '',
                content: '',
                tags: '',
                isPublished: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            };

            const url = editingArticle
                ? `${API_BASE_URL}/api/help/admin/update/${editingArticle._id}`
                : `${API_BASE_URL}/api/help/admin/create`;

            const method = editingArticle ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(editingArticle ? 'Article updated' : 'Article created');
                setIsModalOpen(false);
                fetchArticles();
            } else {
                toast.error(data.message || 'Operation failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/help/admin/delete/${deleteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            if (res.ok) {
                toast.success('Article deleted');
                setArticles(articles.filter(a => a._id !== deleteId));
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('Delete failed');
        } finally {
            setShowDeleteConfirm(false);
            setDeleteId(null);
        }
    };

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage help articles and guides</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <FaPlus /> Create Article
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Stats</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
                            ) : filteredArticles.length > 0 ? (
                                filteredArticles.map(article => (
                                    <tr key={article._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{article.title}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{article.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {article.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {article.isPublished ? (
                                                <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-sm"><FaCheck className="text-xs" /> Published</span>
                                            ) : (
                                                <span className="text-yellow-600 dark:text-yellow-400 text-sm">Draft</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1"><FaEye className="text-blue-400" /> {article.views}</span>
                                                <span className="text-green-500">👍 {article.helpfulCount}</span>
                                                <span className="text-red-500">👎 {article.notHelpfulCount}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(article)}
                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => { setDeleteId(article._id); setShowDeleteConfirm(true); }}
                                                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-500">No articles found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Editor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingArticle ? 'Edit Article' : 'Create New Article'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="How to reset password"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Category</option>
                                        {helpCategories.map(cat => (
                                            <option key={cat.id} value={cat.title}>{cat.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (Short Summary)</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={300}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ideally 1-2 sentences for search results"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                                <div className="text-xs text-gray-500 mb-1">Markdown is supported (optional)</div>
                                <textarea
                                    required
                                    rows={12}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                    placeholder="# Header&#10;Steps to follow:&#10;1. Step one..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags (Comma Separated)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="security, password, login"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-6">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        checked={formData.isPublished}
                                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="isPublished" className="text-gray-700 dark:text-gray-300 font-medium">Publish Immediately</label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/30"
                                >
                                    {editingArticle ? 'Save Changes' : 'Create Article'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Article"
                message="Are you sure you want to delete this article? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                isDestructive={true}
            />
        </div>
    );
};

export default AdminHelpCenter;
