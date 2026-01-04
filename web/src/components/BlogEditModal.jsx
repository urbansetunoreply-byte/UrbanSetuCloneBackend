import React, { useState, useEffect } from 'react';
import { FaTimes, FaImage, FaVideo, FaTags, FaPencilAlt, FaPlus, FaCloudUploadAlt, FaPlay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ImagePreview from './ImagePreview';
import VideoPreview from './VideoPreview';

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
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);

  const handleMediaUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file sizes
    for (const file of files) {
      if (type === 'image' && file.size > 10 * 1024 * 1024) {
        toast.error(`Image ${file.name} exceeds 10MB limit.`);
        return;
      }
      if (type === 'video' && file.size > 100 * 1024 * 1024) {
        toast.error(`Video ${file.name} exceeds 100MB limit.`);
        return;
      }
    }

    setUploading(true);
    try {
      // Upload files to Cloudinary via backend
      const uploadPromises = files.map(async (file) => {
        const bodyFormData = new FormData();
        bodyFormData.append(type === 'image' ? 'image' : 'video', file);

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com'}/api/upload/${type}`, {
          method: 'POST',
          body: bodyFormData,
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
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
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

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Thumbnail image size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const bodyFormData = new FormData();
      bodyFormData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://urbansetu.onrender.com'}/api/upload/image`, {
        method: 'POST',
        body: bodyFormData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to upload thumbnail');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, thumbnail: data.imageUrl }));
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast.error('Failed to upload thumbnail. Please try again.');
    } finally {
      setUploading(false);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-2 sm:p-4 animate-fade-in transition-all">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform animate-slideUp border border-gray-100 dark:border-gray-700 flex flex-col transition-colors duration-300">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-5 sm:p-7 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-2xl">
                {isEdit ? <FaPencilAlt className="text-blue-600 dark:text-blue-400 text-xl" /> : <FaPlus className="text-blue-600 dark:text-blue-400 text-xl" />}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {isEdit ? 'Edit Blog' : 'Create New Blog'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 active:scale-95 shadow-sm hover:shadow"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-5 sm:p-8 custom-scrollbar">
          <form onSubmit={onSubmit} className="space-y-8 pb-10">
            {/* Title Section */}
            <div className="group">
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 ml-1 uppercase tracking-wider">📝 Blog Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 font-bold placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Hook your audience with a catchy title..."
                required
              />
            </div>

            {/* Excerpt Section */}
            <div>
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 ml-1 uppercase tracking-wider">📄 Short Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
                className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 font-medium placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                placeholder="A brief summary that appears in search results and cards..."
              />
            </div>

            {/* Content Section */}
            <div>
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 ml-1 uppercase tracking-wider">📖 Full Content <span className="text-red-500">*</span></label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 font-medium placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Tell your story. Support Markdown if possible..."
                required
              />
            </div>

            {/* Media Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 dark:bg-gray-700/30 p-6 rounded-3xl border border-gray-100 dark:border-gray-700">

              {/* Thumbnail */}
              <div className="space-y-4">
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">🖼️ Main Thumbnail</label>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    id="thumbnail-upload"
                  />
                  {!formData.thumbnail ? (
                    <label htmlFor="thumbnail-upload" className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all group">
                      <FaCloudUploadAlt className="text-4xl text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors mb-2" />
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Upload Featured Image</span>
                    </label>
                  ) : (
                    <div
                      className="relative group overflow-hidden rounded-2xl shadow-xl aspect-video bg-gray-200 dark:bg-gray-800 cursor-pointer"
                      onClick={() => setPreviewImage(formData.thumbnail)}
                    >
                      <img
                        src={formData.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <label
                          htmlFor="thumbnail-upload"
                          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 cursor-pointer transition-colors pointer-events-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaCloudUploadAlt className="text-xl" />
                        </label>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, thumbnail: '' }));
                          }}
                          className="p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 ml-3 transition-colors pointer-events-auto"
                        >
                          <FaTimes className="text-xl" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {uploading && formData.thumbnail && <div className="text-blue-500 font-bold animate-pulse text-sm mt-2 text-center">Uploading new thumbnail...</div>}
              </div>

              {/* Additional Media */}
              <div className="space-y-4">
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  📸 Media Gallery <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal ml-1 normal-case">(Max: 10MB/Img, 100MB/Vid)</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleMediaUpload(e, 'image')}
                    className="hidden"
                    id="images-upload"
                  />
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={(e) => handleMediaUpload(e, 'video')}
                    className="hidden"
                    id="videos-upload"
                  />
                  <label htmlFor="images-upload" className="inline-flex items-center px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 shadow-sm transition-all active:scale-95">
                    <FaImage className="mr-2 text-blue-500 dark:text-blue-400" />
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">+ Image</span>
                  </label>
                  <label htmlFor="videos-upload" className="inline-flex items-center px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-purple-500 dark:hover:border-purple-400 shadow-sm transition-all active:scale-95">
                    <FaVideo className="mr-2 text-purple-500 dark:text-purple-400" />
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">+ Video</span>
                  </label>
                </div>

                {uploading && <div className="text-blue-500 font-bold animate-pulse text-sm mt-2">⏳ Uploading media... Please wait.</div>}

                {(formData.imageUrls?.length > 0 || formData.videoUrls?.length > 0) && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                    {formData.imageUrls?.map((url, index) => (
                      <div key={`img-${index}`} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer" onClick={() => setPreviewImage(url)}>
                        <img src={url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeMedia(index, 'image'); }}
                          className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                          <FaTimes className="text-[10px]" />
                        </button>
                      </div>
                    ))}
                    {formData.videoUrls?.map((url, index) => (
                      <div key={`vid-${index}`} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-600 bg-black cursor-pointer" onClick={() => setPreviewVideo(url)}>
                        <video src={url} className="w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full group-hover:scale-110 transition-transform">
                            <FaPlay className="text-white text-lg ml-1" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeMedia(index, 'video'); }}
                          className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                        >
                          <FaTimes className="text-[10px]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Categorization Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 ml-1 uppercase tracking-wider">🏷️ Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 font-bold appearance-none cursor-pointer transition-all"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 ml-1 uppercase tracking-wider">🏠 Link to Property</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    placeholder="Search by ID or Title..."
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 font-medium placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 font-bold transition-all"
                  >
                    <option value="">Global Blog (No property)</option>
                    {properties
                      .filter((p) => {
                        const s = propertySearch.trim().toLowerCase();
                        if (!s) return true;
                        return (p.name || "").toLowerCase().includes(s) || (p._id || "").toLowerCase().includes(s);
                      })
                      .map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.city})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 ml-1 uppercase tracking-wider">🏷️ Tags & Keywords</label>
              <div className="flex flex-wrap gap-2 mb-4 min-h-[44px] p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
                {formData.tags?.length === 0 && <span className="text-gray-400 dark:text-gray-500 text-sm py-1">Add keywords to reach more people...</span>}
                {formData.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-md animate-scale-in"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Type a tag and press Enter..."
                  className="flex-1 px-5 py-4 border border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 dark:focus:border-blue-400 font-bold placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-6 py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-600 dark:hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            {/* Status Section */}
            <div className="p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 shadow-sm">
              <label className="flex items-center group cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-all duration-300"></div>
                  <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-6 shadow-sm"></div>
                </div>
                <div className="ml-4">
                  <span className="block text-base font-black text-gray-800 dark:text-white tracking-tight">🚀 Publish Blog Post</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Visible to all users immediately</span>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-700 p-5 sm:p-7 flex flex-col sm:flex-row justify-end gap-3 z-10 transition-colors duration-300">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-black hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95 border border-gray-200 dark:border-gray-600 shadow-sm"
          >
            DISCARD
          </button>
          <button
            type="submit"
            form="blog-form"
            onClick={(e) => {
              // The form is handled by onSubmit of the form element
              // But since we scroll the form, we might need a reference or just triggers it
            }}
            className="flex-1 sm:flex-none px-12 py-4 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-black hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/30 active:scale-95 tracking-widest uppercase text-sm"
          >
            {isEdit ? 'Update Details' : 'Launch Blog'}
          </button>
        </div>

        {/* Hidden form trigger for footer button */}
        <form
          id="blog-form"
          onSubmit={onSubmit}
          className="hidden"
        />
      </div >
      {previewImage && (
        <ImagePreview
          isOpen={!!previewImage}
          images={[previewImage]}
          onClose={() => setPreviewImage(null)}
        />
      )}
      {
        previewVideo && (
          <VideoPreview
            isOpen={!!previewVideo}
            videos={[previewVideo]}
            onClose={() => setPreviewVideo(null)}
          />
        )
      }
    </div >
  );
};

export default BlogEditModal;
