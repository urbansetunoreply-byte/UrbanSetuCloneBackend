import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaImage, FaVideo, FaTags } from 'react-icons/fa';

const BlogEditModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  properties,
  categories,
  propertySearch,
  setPropertySearch,
  isEdit = false
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleMediaUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      // Upload files to Cloudinary
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append(type === 'image' ? 'image' : 'video', file);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com'}/api/upload/${type}`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        return type === 'image' ? data.imageUrl : data.videoUrl;
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
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com'}/api/upload/image`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload thumbnail');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, thumbnail: data.imageUrl }));
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      alert('Failed to upload thumbnail. Please try again.');
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto transform animate-slideDown">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isEdit ? '✏️ Edit Blog' : '📝 Create New Blog'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📝 Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              placeholder="Enter blog title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📄 Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              placeholder="Enter blog excerpt..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📖 Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              placeholder="Enter blog content..."
              required
            />
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🖼️ Thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
              id="thumbnail-upload"
            />
            <label htmlFor="thumbnail-upload" className="inline-flex items-center px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl cursor-pointer transition-all duration-300 hover:border-blue-300">
              <FaImage className="mr-2 text-blue-600" />
              <span className="font-medium">Upload Image</span>
            </label>
            {formData.thumbnail && (
              <div className="relative mt-3">
                <img
                  src={formData.thumbnail}
                  alt="Thumbnail preview"
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>

          {/* Additional Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">📸 Additional Images</label>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleMediaUpload(e, 'image')}
                className="hidden"
                id="images-upload"
              />
              <label htmlFor="images-upload" className="inline-flex items-center px-4 py-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl cursor-pointer transition-all duration-300 hover:border-green-300">
                <FaImage className="mr-2 text-green-600" />
                <span className="font-medium">Upload Multiple Images</span>
              </label>

              {formData.imageUrls && formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-20 rounded-xl object-cover shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(index, 'image')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Videos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🎥 Videos</label>
            <div className="space-y-4">
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => handleMediaUpload(e, 'video')}
                className="hidden"
                id="videos-upload"
              />
              <label htmlFor="videos-upload" className="inline-flex items-center px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl cursor-pointer transition-all duration-300 hover:border-purple-300">
                <FaVideo className="mr-2 text-purple-600" />
                <span className="font-medium">Upload Multiple Videos</span>
              </label>

              {formData.videoUrls && formData.videoUrls.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.videoUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <video
                        src={url}
                        className="w-full h-32 rounded-xl object-cover shadow-lg"
                        muted
                        playsInline
                      />
                      <button
                        type="button"
                        onClick={() => removeMedia(index, 'video')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏠 Property (Optional)</label>
              <input
                type="text"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="Search properties by name, city, or state..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 mb-2"
              />
              <select
                value={formData.propertyId}
                onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              >
                <option value="">Select Property (Leave empty for global blog)</option>
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Tags</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add a tag..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300"
              >
                <FaTags />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                🚀 Published
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200"
            >
              {isEdit ? 'Update Blog' : 'Create Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogEditModal;
