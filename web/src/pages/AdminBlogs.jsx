import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash, Search, Filter, Globe, Home, Eye, EyeOff,
  ExternalLink, ChevronLeft, ChevronRight, FileText, LayoutTemplate,
  CheckCircle, XCircle, RefreshCw, Image as ImageIcon
} from 'lucide-react';
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
        fetchBlogs(false);
      } else {
        setPagination(prev => ({ ...prev, current: 1 }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Immediate filter effects
  useEffect(() => {
    if (pagination.current === 1) {
      fetchBlogs(false);
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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
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
      const response = await fetch(`${API_BASE_URL}/api/listing/get?limit=1000&type=all&offer=false&furnished=false&parking=false`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(Array.isArray(data) ? data : []);
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
        setCategories(data.data);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 pb-20 pt-10 px-4 shadow-xl relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white mix-blend-overlay filter blur-3xl animate-float"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-300 mix-blend-overlay filter blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center relative z-10 animate-slideInFromTop">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Blog <span className="text-yellow-300">Management</span>
            </h1>
            <p className="text-blue-100 text-lg font-light max-w-xl">
              Create, edit, and manage insights and property updates for your audience.
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="group bg-white text-blue-700 px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
          >
            <div className="bg-blue-100 p-1 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            Create New Blog
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow max-w-7xl mx-auto px-4 w-full -mt-10 relative z-10 pb-20">

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Search */}
            <div className="relative group lg:col-span-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LayoutTemplate className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="global">Global Blogs</option>
                <option value="property">Property Specific</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CheckCircle className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Blogs List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" /> All Blogs
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">{pagination.total}</span>
            </h2>
            <button onClick={() => fetchBlogs(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 animate-pulse font-medium">Loading content...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-1">No blogs found</h3>
              <p className="text-sm">Get started by creating a new blog post.</p>
              <button onClick={handleCreate} className="mt-4 text-blue-600 font-semibold hover:underline">Create Blog</button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left">Article</th>
                      <th className="px-6 py-4 text-left">Type</th>
                      <th className="px-6 py-4 text-left">Category</th>
                      <th className="px-6 py-4 text-left">Property</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Views</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {blogs.map((blog) => (
                      <tr key={blog._id} className="group hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-200">
                              {blog.thumbnail ? (
                                <img src={blog.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <FileText className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800 line-clamp-1 group-hover:text-blue-700 transition-colors">{blog.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{new Date(blog.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${!blog.propertyId
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            }`}>
                            {!blog.propertyId ? <Globe className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                            {!blog.propertyId ? 'Global' : 'Property'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium border border-gray-200">
                            {blog.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {blog.propertyId ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-800">{blog.propertyId.name}</div>
                              <div className="text-xs text-gray-500">{blog.propertyId.city}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => togglePublish(blog)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 border ${blog.published
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }`}
                          >
                            {blog.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {blog.published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-gray-600">{blog.views || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleViewDetails(blog)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Public Page">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(blog)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(blog._id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden p-4 space-y-4">
                {blogs.map((blog) => (
                  <div key={blog._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
                          {blog.thumbnail ? (
                            <img src={blog.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 line-clamp-1">{blog.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{blog.views || 0} views</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => togglePublish(blog)}
                          className={`p-1.5 rounded-full ${blog.published ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}
                        >
                          {blog.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${!blog.propertyId ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                        {!blog.propertyId ? <Globe className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                        {!blog.propertyId ? 'Global' : 'Property'}
                      </span>
                      <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                        {blog.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 border-t border-gray-100 pt-3 mt-3">
                      <button onClick={() => handleViewDetails(blog)} className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">
                        <ExternalLink className="w-4 h-4" /> View
                      </button>
                      <button onClick={() => handleEdit(blog)} className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(blog._id)} className="flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
                  <span className="text-sm text-gray-500">
                    Showing page {pagination.current} of {pagination.pages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                      disabled={pagination.current === 1}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-800 shadow-sm">
                      {pagination.current}
                    </div>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                      disabled={pagination.current === pagination.pages}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Shared Blog Edit Modal */}
      </div>

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
  );
};

export default AdminBlogs;
