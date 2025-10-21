import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { FaCalendar, FaUser, FaEye, FaHeart, FaTag, FaArrowLeft, FaShare, FaComment, FaHome, FaExpand, FaTimes } from 'react-icons/fa';
import ImagePreview from '../components/ImagePreview';
import VideoPreview from '../components/VideoPreview';

const PublicBlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const textareaRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

  useEffect(() => {
    fetchBlog();
    checkAuthStatus();
  }, [slug]);

  useEffect(() => {
    if (blog && isLoggedIn) {
      checkLikeStatus();
    }
  }, [blog, isLoggedIn]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/blogs/${slug}`);

      if (response.ok) {
        const data = await response.json();
        setBlog(data.data);
        setComments(data.data.comments || []);
        fetchRelatedBlogs(data.data.category, data.data._id);
      } else {
        // Blog not found - redirect to blogs page
        console.log(`Blog with slug "${slug}" not found`);
        navigate('/blogs');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (category, currentBlogId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs?category=${category}&published=true&limit=3`);
      if (response.ok) {
        const data = await response.json();
        // Filter out current blog
        const related = data.data.filter(blog => blog._id !== currentBlogId);
        setRelatedBlogs(related.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include'
      });
      setIsLoggedIn(response.ok);
    } catch (error) {
      setIsLoggedIn(false);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}/like-status`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.data.isLiked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert('Please log in to like this blog');
      return;
    }

    if (likeLoading) return;
    
    setLikeLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.data.isLiked);
        setBlog(prev => ({ ...prev, likes: data.data.likes }));
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error updating like');
      }
    } catch (error) {
      console.error('Error liking blog:', error);
      alert('Error updating like');
    } finally {
      setLikeLoading(false);
    }
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    autoResizeTextarea();
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ content: comment })
      });

      if (response.ok) {
        const responseData = await response.json();
        // Add the new comment to the existing comments state
        setComments(prevComments => [...prevComments, responseData.data]);
        setComment('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else {
        const errorData = await response.json();
        // Show user-friendly message for authentication errors
        if (response.status === 401) {
          alert('Please log in to comment');
        } else {
          alert(errorData.message || 'Error adding comment');
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowImagePreview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg font-medium">Loading blog post...</p>
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">📝</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Blog post not found</h1>
          <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/blogs" 
            className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaArrowLeft />
            <span>Back to all posts</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Back Button */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/blogs')}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-all duration-200 bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <FaArrowLeft className="text-sm" />
            <span className="font-medium">Back to all posts</span>
          </button>
          {blog.propertyId && (
            <Link
              to={`/listing/${blog.propertyId._id || blog.propertyId}`}
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-all duration-200 bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transform hover:scale-105"
            >
              <FaHome className="text-sm" />
              <span className="font-medium">View Property</span>
            </Link>
          )}
        </div>

        {/* Enhanced Blog Article */}
        <article className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
          {/* Enhanced Media Gallery */}
          <div className="relative">
            <Swiper
              modules={[Navigation]}
              navigation={true}
              className="h-48 sm:h-64 md:h-96"
              onSlideChange={(swiper) => {
                setSelectedImageIndex(swiper.activeIndex);
              }}
            >
              {(() => {
                const images = blog.imageUrls || [];
                const videos = blog.videoUrls || [];
                const mediaItems = [
                  // Include thumbnail as first image if it exists
                  ...(blog.thumbnail ? [{ type: 'image', url: blog.thumbnail }] : []),
                  ...images.map((u) => ({ type: 'image', url: u })),
                  ...videos.map((u, vi) => ({ type: 'video', url: u, vIndex: vi })),
                ];
                return mediaItems.length > 0 ? mediaItems.map((item, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative group">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={`${blog.title} - Image ${index + 1}`}
                          className="w-full h-48 sm:h-64 md:h-96 object-cover transition-transform duration-200 group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Available";
                            e.target.className = "w-full h-48 sm:h-64 md:h-96 object-cover opacity-50";
                          }}
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-48 sm:h-64 md:h-96 object-cover bg-black"
                          onError={(e) => {
                            e.target.poster = "https://via.placeholder.com/800x600?text=Video+Not+Available";
                          }}
                          muted
                          playsInline
                        />
                      )}
                      {/* Media type badge */}
                      <div className="absolute top-2 right-2">
                        <span className="bg-black bg-opacity-60 text-white text-[10px] sm:text-xs px-2 py-1 rounded-md tracking-wide">
                          {item.type === 'image' ? 'Image' : 'Video'}
                        </span>
                      </div>
                      {/* Expand Button Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <FaExpand className="text-gray-700" />
                        </div>
                      </div>
                      {/* Click to expand text */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Click to expand
                      </div>
                      {/* Invisible clickable overlay */}
                      <button
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.type === 'image') {
                            handleImageClick(index);
                          } else {
                            setSelectedVideoIndex(item.vIndex || 0);
                            setShowVideoPreview(true);
                          }
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.type === 'image') {
                            handleImageClick(index);
                          } else {
                            setSelectedVideoIndex(item.vIndex || 0);
                            setShowVideoPreview(true);
                          }
                        }}
                        aria-label={`Expand ${item.type} ${index + 1}`}
                      />
                    </div>
                  </SwiperSlide>
                )) : (
                <SwiperSlide>
                  <div className="w-full h-48 sm:h-64 md:h-96 bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">📝</div>
                      <p className="text-lg">No media available</p>
                    </div>
                  </div>
                </SwiperSlide>
              )
              })()}
            </Swiper>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Enhanced Category */}
            <div className="mb-4 sm:mb-6">
              <span className="inline-block bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-sm font-semibold px-4 py-2 rounded-full border border-orange-300 shadow-sm">
                🏷️ {blog.category}
              </span>
            </div>

            {/* Property Information */}
            {blog.propertyId && (
              <div className="mb-4 sm:mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <FaHome className="text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Related Property</span>
                </div>
                <div className="text-gray-700">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {blog.propertyId.name || 'Property'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {blog.propertyId.city && blog.propertyId.state 
                      ? `${blog.propertyId.city}, ${blog.propertyId.state}`
                      : 'Property Location'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Enhanced Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              {blog.title}
            </h1>

            {/* Enhanced Meta Info */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-6 text-sm text-gray-600 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <FaUser className="text-orange-500" />
                <span className="font-medium">{blog.author?.username || 'UrbanSetu Team'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <FaCalendar className="text-orange-500" />
                <span className="font-medium">{formatDate(blog.publishedAt || blog.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <FaEye className="text-orange-500" />
                <span className="font-medium">{blog.views || 0} views</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <FaHeart className="text-orange-500" />
                <span className="font-medium">{blog.likes || 0} likes</span>
              </div>
            </div>

            {/* Enhanced Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                {blog.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300 hover:from-orange-200 hover:to-orange-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <FaTag className="mr-1 text-orange-600" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Enhanced Content */}
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-orange-600 prose-strong:text-gray-900">
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            </div>

            {/* Enhanced Actions */}
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                      liked
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 border border-gray-200'
                    } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FaHeart className={liked ? 'text-red-500' : 'text-gray-500'} />
                    <span>
                      {likeLoading ? 'Updating...' : (liked ? 'Liked' : 'Like')} ({blog.likes || 0})
                    </span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 border border-gray-200"
                  >
                    <FaShare />
                    <span>Share</span>
                  </button>
                  
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center space-x-2 px-4 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 border border-gray-200"
                  >
                    <FaComment />
                    <span>Comments ({comments.length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Comments Section */}
            {showComments && (
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 sm:mb-8 flex items-center space-x-2">
                  <FaComment className="text-orange-500" />
                  <span>Comments</span>
                </h3>
                
                {/* Enhanced Comment Form */}
                <form onSubmit={handleComment} className="mb-8">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <textarea
                      ref={textareaRef}
                      value={comment}
                      onChange={handleCommentChange}
                      placeholder="Write a comment..."
                      rows={3}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md resize-none overflow-hidden"
                      style={{ minHeight: '3rem', maxHeight: '12rem' }}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base self-start sm:self-center"
                    >
                      Post Comment
                    </button>
                  </div>
                </form>

                {/* Enhanced Comments List */}
                <div className="space-y-4 sm:space-y-6">
                  {comments.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl">
                      <div className="text-4xl mb-4">💬</div>
                      <p className="text-gray-600 text-lg">No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comments.map((comment, index) => {
                      const isAdminComment = comment.user?.username === 'UrbanSetuBlogManagement';
                      return (
                        <div key={index} className={`rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 border ${
                          isAdminComment 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                            : 'bg-gradient-to-r from-gray-50 to-orange-50 border-gray-100'
                        }`}>
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                              isAdminComment ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-orange-500'
                            }`}>
                              {(comment.user?.username || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className={`font-semibold ${
                                isAdminComment ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {comment.user?.username || 'Anonymous'}
                              </span>
                              {isAdminComment && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Official
                                </span>
                              )}
                              <div className="text-sm text-gray-500">
                                {formatDate(comment.createdAt)}
                              </div>
                            </div>
                          </div>
                          <p className={`leading-relaxed ${
                            isAdminComment ? 'text-blue-800' : 'text-gray-700'
                          }`}>{comment.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Enhanced Related Blogs */}
        {relatedBlogs.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center space-x-2">
              <span>📚</span>
              <span>Related Posts</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {relatedBlogs.map((relatedBlog) => (
                <article
                  key={relatedBlog._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {relatedBlog.thumbnail && (
                    <div className="relative overflow-hidden">
                      <img
                        src={relatedBlog.thumbnail}
                        alt={relatedBlog.title}
                        className="w-full h-32 sm:h-40 object-cover transition-transform duration-300 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  )}
                  <div className="p-4 sm:p-6">
                    <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2 text-sm sm:text-base">
                      <Link
                        to={`/blog/${relatedBlog.slug || relatedBlog._id}`}
                        className="hover:text-orange-600 transition-colors"
                      >
                        {relatedBlog.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3 sm:mb-4">
                      {relatedBlog.excerpt || relatedBlog.content.slice(0, 100) + '...'}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                      <FaCalendar className="mr-2 text-orange-500" />
                      <span>{formatDate(relatedBlog.publishedAt || relatedBlog.createdAt)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {showImagePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setShowImagePreview(false)}
                className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 text-white rounded-full p-2 hover:bg-opacity-30 transition-all duration-200"
              >
                <FaTimes className="text-xl" />
              </button>
              <img
                src={(() => {
                  const images = blog.imageUrls || [];
                  return images[selectedImageIndex] || '';
                })()}
                alt={`${blog.title} - Image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x600?text=Image+Not+Available";
                }}
              />
            </div>
          </div>
        )}

        {/* Video Preview Modal */}
        {showVideoPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full w-full">
              <button
                onClick={() => setShowVideoPreview(false)}
                className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 text-white rounded-full p-2 hover:bg-opacity-30 transition-all duration-200"
              >
                <FaTimes className="text-xl" />
              </button>
              <video
                src={(() => {
                  const videos = blog.videoUrls || [];
                  return videos[selectedVideoIndex] || '';
                })()}
                controls
                autoPlay
                className="w-full h-auto max-h-full rounded-lg"
                onError={(e) => {
                  e.target.poster = "https://via.placeholder.com/800x600?text=Video+Not+Available";
                }}
              />
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {blog && ((blog.thumbnail) || (blog.imageUrls && blog.imageUrls.length > 0)) && (
          <ImagePreview
            isOpen={showImagePreview}
            onClose={() => setShowImagePreview(false)}
            images={[
              ...(blog.thumbnail ? [blog.thumbnail] : []),
              ...(blog.imageUrls || [])
            ]}
            initialIndex={selectedImageIndex}
            listingId={blog._id}
            metadata={{
              addedFrom: 'blog',
              blogTitle: blog.title,
              blogCategory: blog.category
            }}
          />
        )}

        {/* Video Preview Modal */}
        {blog && blog.videoUrls && blog.videoUrls.length > 0 && (
          <VideoPreview
            isOpen={showVideoPreview}
            onClose={() => setShowVideoPreview(false)}
            videos={blog.videoUrls}
            initialIndex={selectedVideoIndex}
          />
        )}
      </div>
    </div>
  );
};

export default PublicBlogDetail;
