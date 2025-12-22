import React, { useState, useEffect } from 'react';
import PublicFAQsSkeleton from '../components/skeletons/PublicFAQsSkeleton';
import {
  Search, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  Filter, HelpCircle, MessageCircle, Phone, Mail,
  Info, ArrowRight, MessageSquare
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const PublicFAQs = () => {
  // Set page title
  usePageTitle("FAQs - Real Estate FAQ Portal");

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userReactions, setUserReactions] = useState({});
  const [reactionLoading, setReactionLoading] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

  // Separate useEffect for initial load and categories
  useEffect(() => {
    fetchFAQs();
    fetchCategories();
    checkAuthStatus();
  }, []);

  // Check user reactions when logged in and FAQs are loaded
  useEffect(() => {
    if (isLoggedIn && faqs.length > 0) {
      checkUserReactions();
    }
  }, [isLoggedIn, faqs]);

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

  const checkAuthStatus = async () => {
    try {
      // Try to check reaction status for the first FAQ to determine if user is authenticated
      if (faqs.length > 0) {
        const response = await fetch(`${API_BASE_URL}/api/faqs/${faqs[0]._id}/reaction-status`, {
          credentials: 'include'
        });
        if (response.ok) {
          setIsLoggedIn(true);
        } else if (response.status === 401) {
          setIsLoggedIn(false);
        }
      }
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  const checkUserReactions = async () => {
    try {
      const reactions = {};
      for (const faq of faqs) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/faqs/${faq._id}/reaction-status`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            reactions[faq._id] = data.data.reaction;
          }
        } catch (error) {
          console.error(`Error checking reaction for FAQ ${faq._id}:`, error);
        }
      }
      setUserReactions(reactions);
    } catch (error) {
      console.error('Error checking user reactions:', error);
    }
  };

  const handleRating = async (faqId, type, e) => {
    e.stopPropagation(); // Prevent toggling accordion
    if (reactionLoading[faqId]) return;

    setReactionLoading(prev => ({ ...prev, [faqId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/faqs/${faqId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        const data = await response.json();

        // Update FAQ in the list
        setFaqs(prevFaqs =>
          prevFaqs.map(faq =>
            faq._id === faqId
              ? { ...faq, helpful: data.data.helpful, notHelpful: data.data.notHelpful }
              : faq
          )
        );

        // Update user reactions
        setUserReactions(prev => ({
          ...prev,
          [faqId]: data.data.reaction
        }));

        setIsLoggedIn(true); // User is authenticated if reaction worked
      } else {
        if (response.status === 401) {
          alert('Please log in to rate this FAQ');
          setIsLoggedIn(false);
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Error rating FAQ');
        }
      }
    } catch (error) {
      console.error('Error rating FAQ:', error);
      alert('Error rating FAQ');
    } finally {
      setReactionLoading(prev => ({ ...prev, [faqId]: false }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchFAQs();
  };

  if (loading && faqs.length === 0) {
    return <PublicFAQsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500 blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-semibold mb-6 backdrop-blur-md">
            Help Center
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100 drop-shadow-sm">
            Frequently Asked Questions
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            Everything you need to know about UrbanSetu, properties, and managing your real estate journey.
          </p>

          {/* Search Bar in Hero */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl text-lg text-gray-800 placeholder-gray-400 shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">

        {/* Categories & Filter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold min-w-max">
              <Filter className="w-5 h-5 text-blue-500" />
              <span>Filter by Category:</span>
            </div>
            <div className="flex flex-wrap gap-2 w-full">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQs List */}
        <div className="space-y-4">
          {faqs.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center shadow-lg border border-gray-100 animate-fade-in-up">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || selectedCategory !== 'all'
                  ? 'We couldn\'t find any FAQs matching your search criteria. Try adjusting your filters.'
                  : 'No FAQs are universally available at the moment.'
                }
              </p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-6 px-6 py-2 bg-blue-100 text-blue-700 font-semibold rounded-xl hover:bg-blue-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {faqs.map((faq, index) => (
                <div
                  key={faq._id}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedFAQ === faq._id
                    ? 'shadow-lg border-blue-200 ring-1 ring-blue-100'
                    : 'shadow-sm border-gray-100 hover:shadow-md hover:border-gray-200'
                    }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    onClick={() => handleFAQClick(faq._id)}
                    className="w-full px-6 py-5 text-left flex items-start justify-between gap-4 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-md border border-blue-100">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className={`text-lg font-bold transition-colors ${expandedFAQ === faq._id ? 'text-blue-700' : 'text-gray-800 group-hover:text-blue-600'}`}>
                        {faq.question}
                      </h3>
                    </div>
                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${expandedFAQ === faq._id ? 'bg-blue-100 text-blue-600 rotate-180' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'
                      }`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedFAQ === faq._id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="px-6 pb-6 pt-2">
                      <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed mb-4">
                        {faq.answer}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Last updated: {new Date(faq.updatedAt).toLocaleDateString()}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">Was this helpful?</span>

                          <button
                            onClick={(e) => handleRating(faq._id, 'like', e)}
                            disabled={reactionLoading[faq._id]}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${userReactions[faq._id] === 'like'
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-white text-gray-500 border border-gray-200 hover:border-green-300 hover:text-green-600'
                              }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${userReactions[faq._id] === 'like' ? 'fill-current' : ''}`} />
                            <span>{faq.helpful || 0}</span>
                          </button>

                          <button
                            onClick={(e) => handleRating(faq._id, 'dislike', e)}
                            disabled={reactionLoading[faq._id]}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${userReactions[faq._id] === 'dislike'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-white text-gray-500 border border-gray-200 hover:border-red-300 hover:text-red-600'
                              }`}
                          >
                            <ThumbsDown className={`w-4 h-4 ${userReactions[faq._id] === 'dislike' ? 'fill-current' : ''}`} />
                            <span>{faq.notHelpful || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-md border border-gray-100">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>

              <div className="flex items-center gap-1 font-medium px-2">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setPagination(prev => ({ ...prev, current: page }))}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${pagination.current === page
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {pagination.pages > 5 && <span className="text-gray-400">...</span>}
              </div>

              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronDown className="w-5 h-5 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 mb-12 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>

          <div className="p-8 md:p-12 text-center relative z-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 border border-blue-100 shadow-sm">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
              Can't find the answer you're looking for? Please chat to our friendly team.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30">
                <MessageSquare className="w-5 h-5" />
                Contact Support
              </a>
              <a href="mailto:support@urbansetu.com" className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all">
                <Mail className="w-5 h-5" />
                Email Us
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicFAQs;
