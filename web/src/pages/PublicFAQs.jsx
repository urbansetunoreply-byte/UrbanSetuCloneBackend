import React, { useState, useEffect } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaThumbsUp, FaThumbsDown, FaFilter } from 'react-icons/fa';

const PublicFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

  // Separate useEffect for initial load and categories
  useEffect(() => {
    fetchFAQs();
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

  // Immediate filter effect for category changes
  useEffect(() => {
    if (pagination.current === 1) {
      fetchFAQs(false); // Don't show loading for immediate filter changes
    } else {
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [selectedCategory]);

  // Pagination effect
  useEffect(() => {
    fetchFAQs();
  }, [pagination.current]);

  const fetchFAQs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams({
        isGlobal: 'true',
        page: pagination.current,
        limit: 10
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`${API_BASE_URL}/api/faqs?${params}`);

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

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faqs/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFAQClick = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleRating = async (faqId, helpful) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/faqs/${faqId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ helpful })
      });

      if (response.ok) {
        // Refresh FAQs to show updated ratings
        fetchFAQs();
      }
    } catch (error) {
      console.error('Error rating FAQ:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchFAQs();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6 transform hover:scale-[1.02] transition-all duration-300">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 animate-fadeIn">
              ❓ Frequently Asked Questions
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Find answers to common questions about UrbanSetu and our real estate services
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">🏠 Property</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">💰 Investment</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">📋 Process</span>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 hover:border-orange-300 text-lg"
              />
            </div>
          </form>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <FaFilter className="text-orange-500 text-lg" />
              <span className="text-lg font-semibold text-gray-700">🏷️ Filter by category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced FAQs List */}
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading FAQs...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No FAQs found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No FAQs are available at the moment.'
                }
              </p>
            </div>
          ) : (
            faqs.map((faq) => (
              <div
                key={faq._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
              >
                <button
                  onClick={() => handleFAQClick(faq._id)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-6 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-blue-50 focus:outline-none focus:bg-gradient-to-r focus:from-orange-50 focus:to-blue-50 transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                        {faq.question}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                        <span className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 px-3 py-1 rounded-full font-medium border border-orange-300">
                          🏷️ {faq.category}
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>👁️ {faq.views} views</span>
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedFAQ === faq._id ? (
                        <FaChevronUp className="text-orange-500 text-xl" />
                      ) : (
                        <FaChevronDown className="text-orange-500 text-xl" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedFAQ === faq._id && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-orange-50">
                    <div className="pt-4 sm:pt-6">
                      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                        <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                          {faq.answer}
                        </p>
                        
                        {/* Enhanced Rating Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>📅</span>
                            <span>Last updated: {new Date(faq.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Was this helpful?</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleRating(faq._id, true)}
                                className="flex items-center space-x-1 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-all duration-200 border border-green-200 text-sm font-medium"
                              >
                                <FaThumbsUp />
                                <span>Yes ({faq.helpful || 0})</span>
                              </button>
                              <button
                                onClick={() => handleRating(faq._id, false)}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-all duration-200 border border-red-200 text-sm font-medium"
                              >
                                <FaThumbsDown />
                                <span>No ({faq.notHelpful || 0})</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Enhanced Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 sm:mt-12 flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-orange-50 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-1"
              >
                <span>←</span>
                <span className="hidden sm:inline">Previous</span>
              </button>
              
              <div className="flex items-center space-x-1 sm:space-x-2">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                      className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        pagination.current === page
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-orange-50 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-1"
              >
                <span className="hidden sm:inline">Next</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Contact CTA */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
          <div className="max-w-2xl mx-auto">
            <div className="text-4xl sm:text-5xl mb-4">🤔</div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Still have questions?
            </h3>
            <p className="text-orange-100 mb-6 text-base sm:text-lg">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>📞</span>
                <span>Contact Support</span>
              </a>
              <a
                href="/about"
                className="bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>ℹ️</span>
                <span>Learn More About Us</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFAQs;
