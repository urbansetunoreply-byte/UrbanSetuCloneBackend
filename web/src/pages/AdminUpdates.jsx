import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';
import {
    Plus, Edit, Trash2, Search, Filter,
    Calendar, Tag, Image as ImageIcon, CheckCircle, XCircle, Video, Loader, Upload, Play
} from 'lucide-react';
import ImagePreview from "../components/ImagePreview";
import VideoPreview from "../components/VideoPreview";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminUpdates() {
    usePageTitle('Platform Updates Management');
    const { currentUser } = useSelector((state) => state.user);

    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState(null);
    // Preview States
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showVideoPreview, setShowVideoPreview] = useState(false);
    const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

    const [formData, setFormData] = useState({
        title: '',
        version: '',
        description: '',
        category: 'new_feature',
        tags: '',
        imageUrls: [],
        videoUrls: [],
        isActive: true
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    // Delete Confirmation State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            // Ensure we hit the admin route which returns ALL updates
            const res = await fetch(`${API_BASE_URL}/api/updates`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setUpdates(data.data);
            } else {
                toast.error(data.message || 'Failed to fetch updates');
            }
        } catch (error) {
            toast.error('Error loading updates');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            version: '',
            description: '',
            category: 'new_feature',
            tags: '',
            imageUrls: [],
            videoUrls: [],
            isActive: true
        });
        setEditingUpdate(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const handleOpenEdit = (update) => {
        setEditingUpdate(update);
        setFormData({
            title: update.title,
            version: update.version,
            description: update.description,
            category: update.category,
            tags: update.tags.join(', '),
            imageUrls: update.imageUrls || (update.imageUrl ? [update.imageUrl] : []),
            videoUrls: update.videoUrls || (update.videoUrl ? [update.videoUrl] : []),
            isActive: update.isActive
        });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setDeleteTargetId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/updates/${deleteTargetId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Update deleted successfully');
                setUpdates(prev => prev.filter(u => u._id !== deleteTargetId));
            } else {
                toast.error(data.message || 'Failed to delete update');
            }
        } catch (error) {
            toast.error('Error deleting update');
        } finally {
            setShowDeleteModal(false);
            setDeleteTargetId(null);
        }
    };


    const handleFileUpload = async (file, type) => {
        if (!file) return;

        // Validation
        if (type === 'image') {
            if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
            if (file.size > 5 * 1024 * 1024) return toast.error('Image size must be less than 5MB');
            setUploadingImage(true);
        } else {
            if (!file.type.startsWith('video/')) return toast.error('Please upload a video file');
            if (file.size > 10 * 1024 * 1024) return toast.error('Video size must be less than 10MB');
            setUploadingVideo(true);
        }

        try {
            const uploadFormData = new FormData();
            uploadFormData.append(type === 'image' ? 'image' : 'video', file);

            const endpoint = type === 'image' ? '/api/upload/image' : '/api/upload/video';

            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                credentials: 'include',
                body: uploadFormData,
            });

            const data = await res.json();

            if (data.success || res.ok) {
                // Determine the correct key based on API response structure
                const url = type === 'image' ? (data.imageUrl || data.url) : (data.videoUrl || data.url);

                if (url) {
                    setFormData(prev => ({
                        ...prev,
                        [type === 'image' ? 'imageUrls' : 'videoUrls']: [
                            ...prev[type === 'image' ? 'imageUrls' : 'videoUrls'],
                            url
                        ]
                    }));
                    toast.success(`${type === 'image' ? 'Image' : 'Video'} uploaded successfully`);
                } else {
                    toast.error('Upload successful but no URL returned');
                }
            } else {
                toast.error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error uploading file');
        } finally {
            if (type === 'image') setUploadingImage(false);
            else setUploadingVideo(false);
        }
    };

    const handleRemoveMedia = (index, type) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            return toast.error('Title and description are required');
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
            };

            let url = `${API_BASE_URL}/api/updates`;
            let method = 'POST';

            if (editingUpdate) {
                url = `${url}/${editingUpdate._id}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editingUpdate ? 'Update updated successfully' : 'Update created successfully');
                setShowModal(false);
                fetchUpdates();
            } else {
                toast.error(data.message || 'Operation failed');
            }
        } catch (error) {
            toast.error('Error submitting form');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUpdates = updates.filter(update => {
        const matchesSearch = update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            update.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || update.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin')) {
        return <div className="p-10 text-center text-red-500">Access Denied</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Platform Updates</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-gray-500">Manage change logs, announcements, and features</p>
                            <a href="/updates" target="_blank" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                                View Live Page <Search size={14} />
                            </a>
                        </div>
                    </div>        </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus size={20} /> Create New Update
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search updates..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={18} className="text-gray-500" />
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        <option value="new_feature">New Feature</option>
                        <option value="improvement">Improvement</option>
                        <option value="bug_fix">Bug Fix</option>
                        <option value="announcement">Announcement</option>
                    </select>
                </div>
            </div>

            {/* Table List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-4">Loading updates...</p>
                    </div>
                ) : filteredUpdates.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        <p>No updates found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-sm">Update Details</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Category</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Version</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Release Date</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Status</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUpdates.map(update => (
                                    <tr key={update._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{update.title}</div>
                                            <div className="text-sm text-gray-500 line-clamp-1">{update.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                                        ${update.category === 'new_feature' ? 'bg-purple-100 text-purple-700' :
                                                    update.category === 'bug_fix' ? 'bg-red-100 text-red-700' :
                                                        update.category === 'improvement' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-yellow-100 text-yellow-700'}`}>
                                                {update.category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {update.version || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(update.releaseDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {update.isActive ? (
                                                <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full w-fit">
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded-full w-fit">
                                                    <XCircle size={12} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(update)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(update._id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingUpdate ? 'Edit Update' : 'Create New Update'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="e.g. Dark Mode Support"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="e.g. v1.2.0"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="new_feature">New Feature</option>
                                    <option value="improvement">Improvement</option>
                                    <option value="bug_fix">Bug Fix</option>
                                    <option value="announcement">Announcement</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-32 resize-none"
                                    placeholder="Describe the update details..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Comma separated)</label>
                                <div className="flex items-center border border-gray-300 rounded-lg px-3 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                                    <Tag size={18} className="text-gray-400 mr-2" />
                                    <input
                                        type="text"
                                        className="w-full py-2 outline-none"
                                        placeholder="e.g. ui, performance, security"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Media</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Image Upload */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Images</label>
                                                {uploadingImage && <Loader size={14} className="animate-spin text-blue-600" />}
                                            </div>
                                            <label className="cursor-pointer text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                                                <Upload size={14} /> Add Image
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e.target.files[0], 'image')}
                                                />
                                            </label>
                                        </div>

                                        {/* Image List */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {formData.imageUrls.map((url, index) => (
                                                <div
                                                    key={index}
                                                    className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 h-24 flex items-center justify-center group cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedImageIndex(index);
                                                        setShowImagePreview(true);
                                                    }}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Preview ${index}`}
                                                        className="max-h-full max-w-full object-contain"
                                                        onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Error'}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveMedia(index, 'imageUrls');
                                                        }}
                                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 hover:scale-110"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.imageUrls.length === 0 && (
                                                <div className="col-span-2 py-4 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                                    No images added
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Video Upload */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Videos</label>
                                                {uploadingVideo && <Loader size={14} className="animate-spin text-blue-600" />}
                                            </div>
                                            <label className="cursor-pointer text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium">
                                                <Upload size={14} /> Add Video
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="video/*"
                                                    onChange={(e) => handleFileUpload(e.target.files[0], 'video')}
                                                />
                                            </label>
                                        </div>

                                        {/* Video List */}
                                        <div className="space-y-2">
                                            {formData.videoUrls.map((url, index) => (
                                                <div
                                                    key={index}
                                                    className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group cursor-pointer h-32"
                                                    onClick={() => {
                                                        setSelectedVideoIndex(index);
                                                        setShowVideoPreview(true);
                                                    }}
                                                >
                                                    <video
                                                        src={url}
                                                        className="w-full h-full object-cover bg-black pointer-events-none"
                                                    />

                                                    {/* Play Icon Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                                                        <div className="bg-white/80 p-2 rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                                                            <Play size={18} className="text-gray-900 fill-current ml-0.5" />
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveMedia(index, 'videoUrls');
                                                        }}
                                                        className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 hover:scale-110"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.videoUrls.length === 0 && (
                                                <div className="py-4 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                                    No videos added
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="text-gray-700 font-medium cursor-pointer">
                                    Immediately publish this update
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-gray-100 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-200"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : (editingUpdate ? 'Update Changes' : 'Publish Update')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {/* Image Preview Modal */}
            <ImagePreview
                isOpen={showImagePreview}
                onClose={() => setShowImagePreview(false)}
                images={formData.imageUrls}
                initialIndex={selectedImageIndex}
            />

            {/* Video Preview Modal */}
            <VideoPreview
                isOpen={showVideoPreview}
                onClose={() => setShowVideoPreview(false)}
                videos={formData.videoUrls}
                initialIndex={selectedVideoIndex}
            />

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Update?</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to delete this update? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
