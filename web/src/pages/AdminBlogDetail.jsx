import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { FaCalendar, FaUser, FaEye, FaHeart, FaTag, FaArrowLeft, FaShare, FaComment, FaEdit, FaTrash, FaCheck, FaTimes, FaImage, FaTags, FaGlobe, FaHome, FaExpand, FaVideo } from 'react-icons/fa';
import BlogEditModal from '../components/BlogEditModal';

const AdminBlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
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
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [propertySearch, setPropertySearch] = useState('');
  const textareaRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com';

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  useEffect(() => {
    if (showEditModal) {
      fetchProperties();
      fetchCategories();
    }
  }, [showEditModal]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/blogs/${slug}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setBlog(data.data);
        setComments(data.data.comments || []);
        fetchRelatedBlogs(data.data.category, data.data._id);
      } else {
        console.log(`Blog with slug "${slug}" not found`);
        navigate('/admin/blogs');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      navigate('/admin/blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBlogs = async (category, currentBlogId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs?category=${category}&published=true&limit=3`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const related = data.data.filter(blog => blog._id !== currentBlogId);
        setRelatedBlogs(related.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching related blogs:', error);
    }
  };

  const handleLike = async () => {
    if (liked) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setLiked(true);
        setBlog(prev => ({ ...prev, likes: (prev.likes || 0) + 1 }));
      }
    } catch (error) {
      console.error('Error liking blog:', error);
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
        setComment('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        fetchBlog();
      } else {
        alert('Error adding comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        navigate('/admin/blogs');
      } else {
        alert('Error deleting blog');
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const handleTogglePublish = async () => {
    if (blog.published) {
      setShowUnpublishConfirm(true);
    } else {
      // Direct publish without confirmation
      await updatePublishStatus(!blog.published);
    }
  };

  const updatePublishStatus = async (newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ published: newStatus })
      });

      if (response.ok) {
        setBlog(prev => ({ ...prev, published: newStatus }));
        setShowUnpublishConfirm(false);
      } else {
        alert('Error updating blog status');
      }
    } catch (error) {
      console.error('Error updating blog:', error);
    }
  };

  const handleEdit = () => {
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
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/blogs/${blog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setBlog(data.data);
        setShowEditModal(false);
        alert('Blog updated successfully!');
      } else {
        alert('Error updating blog');
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Error updating blog');
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
            to="/admin/blogs" 
            className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <FaArrowLeft />
            <span>Back to admin blogs</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Back Button */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/admin/blogs')}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-all duration-200 bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <FaArrowLeft className="text-sm" />
            <span className="font-medium">Back to admin blogs</span>
          </button>
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
            {/* Admin Actions */}
            <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                blog.published 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
              }`}>
                {blog.published ? '✅ Published' : '⏳ Draft'}
              </span>
              <button
                onClick={handleTogglePublish}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${
                  blog.published
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300'
                    : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                }`}
              >
                {blog.published ? '⏸️ Unpublish' : '🚀 Publish'}
              </button>
              <button
                onClick={handleEdit}
                className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300 transition-all duration-200 flex items-center space-x-1"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 hover:bg-red-200 border border-red-300 transition-all duration-200 flex items-center space-x-1"
              >
                <FaTrash />
                <span>Delete</span>
              </button>
              {blog.propertyId && (
                <Link
                  to={`/admin/listing/${blog.propertyId._id || blog.propertyId}`}
                  className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300 transition-all duration-200 flex items-center space-x-1"
                >
                  <FaHome />
                  <span>View Property</span>
                </Link>
              )}
            </div>

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
                    disabled={liked}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 ${
                      liked
                        ? 'bg-red-100 text-red-700 cursor-not-allowed border border-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 border border-gray-200'
                    }`}
                  >
                    <FaHeart className={liked ? 'text-red-500' : 'text-gray-500'} />
                    <span>{liked ? 'Liked' : 'Like'} ({blog.likes || 0})</span>
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
                    comments.map((comment, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {(comment.user?.username || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">
                              {comment.user?.username || 'Anonymous'}
                            </span>
                            <div className="text-sm text-gray-500">
                              {formatDate(comment.createdAt)}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                      </div>
                    ))
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
                        to={`/admin/blog/${relatedBlog.slug || relatedBlog._id}`}
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md mx-4 shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Blog Post</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete "{blog.title}"? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    <FaTimes className="inline mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
                  >
                    <FaTrash className="inline mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shared Blog Edit Modal */}
        <BlogEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          formData={formData}
          setFormData={setFormData}
          properties={properties}
          categories={categories}
          propertySearch={propertySearch}
          setPropertySearch={setPropertySearch}
          isEdit={true}
        />

        {/* Unpublish Confirmation Modal */}
        {showUnpublishConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform animate-slideDown">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                  <FaTimes className="text-yellow-600 text-xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                  Unpublish Blog
                </h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Are you sure you want to unpublish this blog? It will no longer be visible to public users.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUnpublishConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updatePublishStatus(false)}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Unpublish
                  </button>
                </div>
              </div>
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
      </div>
    </div>
  );
};

export default AdminBlogDetail;
