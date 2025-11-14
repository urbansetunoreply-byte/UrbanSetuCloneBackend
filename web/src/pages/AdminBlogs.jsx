import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaGlobe, FaHome, FaEye, FaEyeSlash, FaImage, FaTags, FaTimes, FaExternalLinkAlt, FaVideo } from 'react-icons/fa';
import BlogEditModal from '../components/BlogEditModal';

import { usePageTitle } from '../hooks/usePageTitle';
const AdminBlogs = () => {
  // Set page title
  usePageTitle("Blogs - Admin Panel");

  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, global, property
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, published, draft
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    thumbnail: '',
    imageUrls: [],
    videoUrls: [],
    propertyId: '',
    tags: [],
    category: 'Real Estate Tips',
    published: false
  });

  const [tagInput, setTagInput] = useState('');
  const [propertySearch, setPropertySearch] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

  // Separate useEffect for initial load and static data
  useEffect(() => {
    fetchProperties();
    fetchCategories();
    fetchTags();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.current === 1) {
        fetchBlogs(false); // Don't show loading for search
      } else {
        setPagination(prev => ({ ...prev, current: 1 }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Immediate filter effects for type, category, and status changes
  useEffect(() => {
    if (pagination.current === 1) {
      fetchBlogs(false); // Don't show loading for immediate filter changes
    } else {
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [filterType, filterCategory, filterStatus]);

  // Pagination effect
  useEffect(() => {
    fetchBlogs();
  }, [pagination.current]);

  // Scroll lock effect for modal
  useEffect(() => {
    if (showModal) {
      // Lock scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to ensure scroll is unlocked when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const fetchBlogs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 10
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterType === 'global') params.append('propertyId', 'null');
      if (filterType === 'property') params.append('propertyId', 'exists');
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStatus === 'published') params.append('published', 'true');
      if (filterStatus === 'draft') params.append('published', 'false');
      if (filterStatus === 'all') params.append('published', 'all');


      const response = await fetch(`${API_BASE_URL}/api/blogs?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        
        setBlogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      // Get all properties by setting a high limit and no filters
      const response = await fetch(`${API_BASE_URL}/api/listing/get?limit=1000&type=all&offer=false&furnished=false&parking=false`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Properties fetched:', data);
        // The API returns listings directly, not in a listings property
        setProperties(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch properties:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/categories`);
      if (response.ok) {
        const data = await response.json();
        console.log('Categories fetched:', data.data);
        setCategories(data.data);
      } else {
        console.error('Failed to fetch categories:', response.status);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/tags`);
      if (response.ok) {
        const data = await response.json();
        setTags(data.data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCreate = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      thumbnail: '',
      imageUrls: [],
      videoUrls: [],
      propertyId: '',
      tags: [],
      category: 'Real Estate Tips',
      published: false
    });
    setShowModal(true);
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt,
      thumbnail: blog.thumbnail,
      imageUrls: blog.imageUrls || [],
      videoUrls: blog.videoUrls || [],
      propertyId: blog.propertyId?._id || '',
      tags: blog.tags || [],
      category: blog.category,
      published: blog.published
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingBlog 
        ? `${API_BASE_URL}/api/blogs/${editingBlog._id}`
        : `${API_BASE_URL}/api/blogs`;
      
      const method = editingBlog ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          propertyId: formData.propertyId || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(editingBlog ? 'Blog updated successfully!' : 'Blog created successfully!');
        setShowModal(false);
        fetchBlogs();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to save blog'}`);
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Error: Failed to save blog. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          fetchBlogs();
        }
      } catch (error) {
        console.error('Error deleting blog:', error);
      }
    }
  };

  const handleViewDetails = (blog) => {
    const slug = blog.slug || blog._id;
    navigate(`/admin/blog/${slug}`);
  };

  const togglePublish = async (blog) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          published: !blog.published
        })
      });

      if (response.ok) {
        fetchBlogs();
      }
    } catch (error) {
      console.error('Error toggling blog status:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, we'll use a placeholder. In production, you'd upload to Cloudinary
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, thumbnail: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // For now, we'll use FileReader for preview. In production, upload to Cloudinary
    const uploadPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(uploadPromises);

    if (type === 'image') {
      setFormData(prev => ({ 
        ...prev, 
        imageUrls: [...(prev.imageUrls || []), ...results] 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        videoUrls: [...(prev.videoUrls || []), ...results] 
      }));
    }
  };

  const removeMedia = (index, type) => {
    if (type === 'image') {
      setFormData(prev => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        videoUrls: (prev.videoUrls || []).filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 animate-fadeIn">
                📝 Blog Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage property-specific and global blog posts
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium"
            >
              <FaPlus className="text-lg" /> 
              <span className="hidden sm:inline">Add Blog</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search blogs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📝 Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              >
                <option value="all">All Blogs</option>
                <option value="global">Global Blogs</option>
                <option value="property">Property Blogs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => fetchBlogs(true)}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium"
              >
                <FaFilter className="text-lg" /> 
                <span className="hidden sm:inline">Apply Filters</span>
                <span className="sm:hidden">Apply</span>
              </button>
            </div>
          </div>
        </div>

        {/* Blogs List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading blogs...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blogs.map((blog) => {
                      return (
                      <tr key={blog._id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {blog.thumbnail && (
                              <img 
                                src={blog.thumbnail} 
                                alt={blog.title}
                                className="w-12 h-12 rounded-lg object-cover mr-3 shadow-sm"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {blog.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(blog.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            !blog.propertyId 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {!blog.propertyId ? (
                              <>
                                <FaGlobe className="mr-1" /> Global
                              </>
                            ) : (
                              <>
                                <FaHome className="mr-1" /> Property
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{blog.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {blog.propertyId ? (
                            <div>
                              <div className="font-medium">{blog.propertyId.name}</div>
                              <div className="text-gray-500">{blog.propertyId.city}, {blog.propertyId.state}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => togglePublish(blog)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                              blog.published 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {blog.published ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}
                            {blog.published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{blog.views || 0}</td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(blog)}
                              className="text-green-600 hover:text-green-900"
                              title="View Details"
                            >
                              <FaExternalLinkAlt />
                            </button>
                            <button
                              onClick={() => handleEdit(blog)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Blog"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(blog._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Blog"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden p-4 space-y-4">
                {blogs.map((blog) => {
                  // Debug logging for draft filter display
                  if (filterStatus === 'draft') {
                    console.log('Displaying blog in mobile draft filter:', {
                      title: blog.title,
                      published: blog.published,
                      status: blog.published ? 'published' : 'draft'
                    });
                  }
                  return (
                  <div key={blog._id} className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg p-4 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        {blog.thumbnail && (
                          <img 
                            src={blog.thumbnail} 
                            alt={blog.title}
                            className="w-12 h-12 rounded-lg object-cover shadow-sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {blog.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(blog)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <FaExternalLinkAlt className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleEdit(blog)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit Blog"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete Blog"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-xs text-gray-500 block">Type</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          !blog.propertyId 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {!blog.propertyId ? (
                            <>
                              <FaGlobe className="mr-1" /> Global
                            </>
                          ) : (
                            <>
                              <FaHome className="mr-1" /> Property
                            </>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Status</span>
                        <button
                          onClick={() => togglePublish(blog)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            blog.published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {blog.published ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}
                          {blog.published ? 'Published' : 'Draft'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-1 font-medium">{blog.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Views:</span>
                        <span className="ml-1 font-medium">{blog.views || 0}</span>
                      </div>
                    </div>
                    
                    {blog.propertyId && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-500">Property:</span>
                        <div className="text-sm font-medium text-gray-900">{blog.propertyId.name}</div>
                        <div className="text-xs text-gray-500">{blog.propertyId.city}, {blog.propertyId.state}</div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* Enhanced Pagination */}
              {pagination.pages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700 text-center sm:text-left">
                      Showing {((pagination.current - 1) * 10) + 1} to {Math.min(pagination.current * 10, pagination.total)} of {pagination.total} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                        disabled={pagination.current === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                      >
                        ← Previous
                      </button>
                      <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                        {pagination.current} / {pagination.pages}
                      </span>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                        disabled={pagination.current === pagination.pages}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Shared Blog Edit Modal */}
        <BlogEditModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          properties={properties}
          categories={categories}
          propertySearch={propertySearch}
          setPropertySearch={setPropertySearch}
          isEdit={!!editingBlog}
        />
      </div>
    </div>
  );
};

export default AdminBlogs;
