import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaGlobe, FaHome, FaEye, FaEyeSlash, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';

const AdminFAQs = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, global, property
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    propertyId: '',
    isGlobal: false,
    tags: [],
    priority: 0,
    isActive: true
  });

  const [propertySearch, setPropertySearch] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

  // Separate useEffect for initial load and static data
  useEffect(() => {
    fetchFAQs();
    fetchProperties();
    fetchCategories();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pagination.current === 1) {
        fetchFAQs(false); // Don't show loading for search
      } else {
        setPagination(prev => ({ ...prev, current: 1 }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Immediate filter effects for type and category changes
  useEffect(() => {
    if (pagination.current === 1) {
      fetchFAQs(false); // Don't show loading for immediate filter changes
    } else {
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [filterType, filterCategory]);

  // Pagination effect
  useEffect(() => {
    fetchFAQs();
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

  const fetchFAQs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 10
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterType === 'global') params.append('isGlobal', 'true');
      if (filterType === 'property') params.append('propertyId', 'exists');
      if (filterCategory !== 'all') params.append('category', filterCategory);

      const response = await fetch(`${API_BASE_URL}/api/faqs?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFaqs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
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
        console.log('FAQ Properties fetched:', data);
        // The API returns listings directly, not in a listings property
        setProperties(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch properties for FAQ:', response.status);
        const errorData = await response.text();
        console.error('FAQ Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching properties for FAQ:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faqs/categories`);
      if (response.ok) {
        const data = await response.json();
        console.log('FAQ Categories fetched:', data.data);
        setCategories(data.data);
      } else {
        console.error('Failed to fetch FAQ categories:', response.status);
      }
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
    }
  };

  const handleCreate = () => {
    setEditingFAQ(null);
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      propertyId: '',
      isGlobal: false,
      tags: [],
      priority: 0,
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (faq) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      propertyId: faq.propertyId?._id || '',
      isGlobal: faq.isGlobal,
      tags: faq.tags || [],
      priority: faq.priority,
      isActive: faq.isActive
    });
    setShowModal(true);
  };

  const handleViewProperty = (faq) => {
    if (faq.propertyId && faq.propertyId._id) {
      navigate(`/admin/listing/${faq.propertyId._id}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingFAQ 
        ? `${API_BASE_URL}/api/faqs/${editingFAQ._id}`
        : `${API_BASE_URL}/api/faqs`;
      
      const method = editingFAQ ? 'PUT' : 'POST';
      
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
        alert(editingFAQ ? 'FAQ updated successfully!' : 'FAQ created successfully!');
        setShowModal(false);
        fetchFAQs();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to save FAQ'}`);
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Error: Failed to save FAQ. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/faqs/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          fetchFAQs();
        }
      } catch (error) {
        console.error('Error deleting FAQ:', error);
      }
    }
  };

  const toggleActive = async (faq) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faqs/${faq._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isActive: !faq.isActive
        })
      });

      if (response.ok) {
        fetchFAQs();
      }
    } catch (error) {
      console.error('Error toggling FAQ status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 animate-fadeIn">
                ❓ FAQ Management
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage property-specific and global FAQs
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium"
            >
              <FaPlus className="text-lg" /> 
              <span className="hidden sm:inline">Add FAQ</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📝 Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300"
              >
                <option value="all">All FAQs</option>
                <option value="global">Global FAQs</option>
                <option value="property">Property FAQs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchFAQs}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium"
              >
                <FaFilter className="text-lg" /> 
                <span className="hidden sm:inline">Apply Filters</span>
                <span className="sm:hidden">Apply</span>
              </button>
            </div>
          </div>
        </div>

        {/* FAQs List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading FAQs...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {faqs.map((faq) => (
                      <tr key={faq._id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {faq.question}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                            faq.isGlobal 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}>
                            {faq.isGlobal ? (
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
                        <td className="px-6 py-4 text-sm text-gray-900">{faq.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {faq.propertyId ? (
                            <div>
                              <div className="font-medium">{faq.propertyId.name}</div>
                              <div className="text-gray-500">{faq.propertyId.city}, {faq.propertyId.state}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleActive(faq)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              faq.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {faq.isActive ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}
                            {faq.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-2">
                            {faq.propertyId && faq.propertyId._id && (
                              <button
                                onClick={() => handleViewProperty(faq)}
                                className="text-green-600 hover:text-green-900"
                                title="View Property"
                              >
                                <FaExternalLinkAlt />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(faq)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit FAQ"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(faq._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete FAQ"
                            >
                              <FaTrash />
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
                {faqs.map((faq) => (
                  <div key={faq._id} className="bg-gradient-to-r from-white to-orange-50 rounded-xl shadow-lg p-4 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                          {faq.question}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(faq.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {faq.propertyId && faq.propertyId._id && (
                          <button
                            onClick={() => handleViewProperty(faq)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="View Property"
                          >
                            <FaExternalLinkAlt className="text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(faq)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Edit FAQ"
                        >
                          <FaEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete FAQ"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-xs text-gray-500 block">Type</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          faq.isGlobal 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {faq.isGlobal ? (
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
                          onClick={() => toggleActive(faq)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            faq.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {faq.isActive ? <FaEye className="mr-1" /> : <FaEyeSlash className="mr-1" />}
                          {faq.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-1 font-medium">{faq.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <span className="ml-1 font-medium">{faq.priority}</span>
                      </div>
                    </div>
                    
                    {faq.propertyId && (
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <span className="text-xs text-gray-500">Property:</span>
                        <div className="text-sm font-medium text-gray-900">{faq.propertyId.name}</div>
                        <div className="text-xs text-gray-500">{faq.propertyId.city}, {faq.propertyId.state}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Enhanced Pagination */}
              {pagination.pages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50">
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
                      <span className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium">
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

        {/* Enhanced Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto transform animate-slideDown">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingFAQ ? '✏️ Edit FAQ' : '❓ Create FAQ'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">❓ Question *</label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300"
                    placeholder="Enter your question..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💬 Answer *</label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300"
                    placeholder="Enter the answer..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">⭐ Priority</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🏠 Property (Optional)</label>
                  <input
                    type="text"
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    placeholder="Search properties by name, city, or state..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300 mb-2"
                  />
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      propertyId: e.target.value,
                      isGlobal: e.target.value === ''
                    }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300"
                  >
                    <option value="">Select Property (Leave empty for global FAQ)</option>
                    {properties
                      .filter((property) => {
                        const searchTerm = propertySearch.trim().toLowerCase();
                        if (!searchTerm) return true;
                        
                        const name = (property.name || "").toLowerCase();
                        const city = (property.city || "").toLowerCase();
                        const state = (property.state || "").toLowerCase();
                        
                        return (
                          name.includes(searchTerm) ||
                          city.includes(searchTerm) ||
                          state.includes(searchTerm)
                        );
                      })
                      .map(property => (
                        <option key={property._id} value={property._id}>
                          {property.name} - {property.city}, {property.state}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isGlobal}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          isGlobal: e.target.checked,
                          propertyId: e.target.checked ? '' : prev.propertyId
                        }))}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        🌍 Global FAQ
                      </span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        ✅ Active
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {editingFAQ ? '✏️ Update FAQ' : '❓ Create FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFAQs;
