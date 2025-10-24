import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFilter, FaCalendar, FaUser, FaEye, FaHeart, FaTag } from 'react-icons/fa';

import { usePageTitle } from '../hooks/usePageTitle';
const PublicBlogs = () => {
  // Set page title
  usePageTitle("Blogs - Real Estate Blog Portal");

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

  // Separate useEffect for initial load and categories/tags
  useEffect(() => {
    fetchBlogs();
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

  // Immediate filter effects for category and tag changes
  useEffect(() => {
    if (pagination.current === 1) {
      fetchBlogs(false); // Don't show loading for immediate filter changes
    } else {
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [selectedCategory, selectedTag]);

  // Pagination effect
  useEffect(() => {
    fetchBlogs();
  }, [pagination.current]);

  const fetchBlogs = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const params = new URLSearchParams({
        published: 'true',
        page: pagination.current,
        limit: 9
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedTag !== 'all') params.append('tag', selectedTag);

      const response = await fetch(`${API_BASE_URL}/api/blogs?${params}`);

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

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchBlogs();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6 transform hover:scale-[1.02] transition-all duration-300">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 animate-fadeIn">
              📝 Real Estate Blog
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Stay updated with the latest insights, tips, and trends in real estate
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">💡 Tips</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">📈 Market Updates</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">🏠 Investment</span>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 text-lg"
              />
            </div>
          </form>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Categories */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FaFilter className="text-blue-500 text-lg" />
                <span className="text-lg font-semibold text-gray-700">🏷️ Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
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
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Tags */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FaTag className="text-green-500 text-lg" />
                <span className="text-lg font-semibold text-gray-700">🏷️ Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                    selectedTag === 'all'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  All
                </button>
                {tags.slice(0, 8).map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                      selectedTag === tag
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Blogs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all' || selectedTag !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No blog posts are available at the moment.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {blogs.map((blog) => (
              <article
                key={blog._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1"
              >
                {/* Enhanced Thumbnail */}
                {blog.thumbnail && (
                  <div className="relative overflow-hidden">
                    <img
                      src={blog.thumbnail}
                      alt={blog.title}
                      className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}

                <div className="p-4 sm:p-6">
                  {/* Enhanced Category */}
                  <div className="mb-4">
                    <span className="inline-block bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-300">
                      🏷️ {blog.category}
                    </span>
                  </div>

                  {/* Enhanced Title */}
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    <Link
                      to={`/blog/${blog.slug || blog._id}`}
                      className="hover:text-blue-600 transition-colors duration-300"
                    >
                      {blog.title}
                    </Link>
                  </h2>

                  {/* Enhanced Excerpt */}
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm sm:text-base">
                    {truncateText(blog.excerpt || blog.content, 120)}
                  </p>

                  {/* Enhanced Tags */}
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {blog.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300"
                        >
                          <FaTag className="mr-1 text-green-500" />
                          {tag}
                        </span>
                      ))}
                      {blog.tags.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded-lg">
                          +{blog.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Enhanced Meta Info */}
                  <div className="flex flex-col space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
                      <FaUser className="text-blue-500" />
                      <span className="font-medium truncate">{blog.author?.username || 'UrbanSetu Team'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <FaCalendar className="text-green-500" />
                        <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <FaEye className="text-purple-500" />
                          <span>{blog.views || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaHeart className="text-red-500" />
                          <span>{blog.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Read More Button */}
                  <div className="mt-4">
                    <Link
                      to={`/blog/${blog.slug || blog._id}`}
                      className="inline-flex items-center justify-center w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Read More
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="text-sm text-gray-600">
                  Page {pagination.current} of {pagination.pages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                    disabled={pagination.current === 1}
                    className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                            pagination.current === page
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                              : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
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
                    className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 sm:p-8 lg:p-12 text-center text-white shadow-2xl">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 animate-fadeIn">
              📈 Stay Updated with Real Estate Insights
            </h3>
            <p className="text-blue-100 mb-8 max-w-3xl mx-auto text-lg leading-relaxed">
              Get the latest property trends, investment tips, and market updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📧 Subscribe to Newsletter
              </a>
              <a
                href="/about"
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🏢 Learn More About Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBlogs;
