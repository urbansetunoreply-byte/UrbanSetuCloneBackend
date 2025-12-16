import React, { useState } from 'react';
import { FaUpload, FaTrash, FaImage, FaVideo, FaSpinner, FaExpand } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ImagePreview from '../ImagePreview';
import VideoPreview from '../VideoPreview';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ROOM_OPTIONS = [
  { value: 'living_room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'parking', label: 'Parking' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'other', label: 'Other' }
];

export default function ConditionImageUpload({
  existingImages = [],
  existingVideos = [],
  onUpdate,
  readOnly = false
}) {
  const [images, setImages] = useState(existingImages || []);
  const [videos, setVideos] = useState(existingVideos || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        return {
          url: data.imageUrl,
          room: 'living_room', // Default, user can change
          description: '',
          uploadedAt: new Date(),
          uploadedBy: null // Will be set by backend
        };
      });

      const uploaded = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploaded];
      setImages(newImages);
      if (onUpdate) onUpdate({ images: newImages, videos });
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload images');
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch(`${API_BASE_URL}/api/upload/video`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      const newVideo = {
        url: data.videoUrl,
        room: 'living_room',
        description: '',
        uploadedAt: new Date(),
        uploadedBy: null
      };

      const newVideos = [...videos, newVideo];
      setVideos(newVideos);
      if (onUpdate) onUpdate({ images, videos: newVideos });
      toast.success('Video uploaded');
    } catch (error) {
      toast.error('Failed to upload video');
      console.error(error);
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (onUpdate) onUpdate({ images: newImages, videos });
  };

  const removeVideo = (index) => {
    const newVideos = videos.filter((_, i) => i !== index);
    setVideos(newVideos);
    if (onUpdate) onUpdate({ images, videos: newVideos });
  };

  const updateImage = (index, updates) => {
    const newImages = images.map((img, i) =>
      i === index ? { ...img, ...updates } : img
    );
    setImages(newImages);
    if (onUpdate) onUpdate({ images: newImages, videos });
  };

  const updateVideo = (index, updates) => {
    const newVideos = videos.map((vid, i) =>
      i === index ? { ...vid, ...updates } : vid
    );
    setVideos(newVideos);
    if (onUpdate) onUpdate({ images, videos: newVideos });
  };

  return (
    <div className="space-y-6">
      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaImage className="inline mr-2" />
          Property Condition Images
        </label>
        {!readOnly && (
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 mb-4">
            {uploadingImage ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaUpload />
            )}
            <span className="text-sm font-medium text-blue-700">
              {uploadingImage ? 'Uploading...' : 'Upload Images'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
          </label>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {images.map((img, index) => (
              <div key={index} className="border rounded-lg p-2 space-y-2">
                <div className="relative aspect-square bg-gray-100 rounded overflow-hidden group">
                  <img
                    src={img.url}
                    alt={`Property condition ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      setPreviewImages(images.map(i => i.url || i));
                      setPreviewIndex(index);
                      setShowImagePreview(true);
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x300?text=Image+Error';
                    }}
                  />
                  <button
                    onClick={() => {
                      setPreviewImages(images.map(i => i.url || i));
                      setPreviewIndex(index);
                      setShowImagePreview(true);
                    }}
                    className="absolute top-1 left-1 bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Preview image"
                  >
                    <FaExpand className="text-xs" />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                </div>
                {!readOnly ? (
                  <>
                    <select
                      value={img.room || 'living_room'}
                      onChange={(e) => updateImage(index, { room: e.target.value })}
                      className="w-full text-xs border rounded p-1"
                    >
                      {ROOM_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={img.description || ''}
                      onChange={(e) => updateImage(index, { description: e.target.value })}
                      className="w-full text-xs border rounded p-1"
                    />
                  </>
                ) : (
                  <div className="text-xs">
                    <div className="font-medium">{ROOM_OPTIONS.find(o => o.value === img.room)?.label || img.room}</div>
                    {img.description && <div className="text-gray-600">{img.description}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaVideo className="inline mr-2" />
          Property Condition Videos
        </label>
        {!readOnly && (
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 mb-4">
            {uploadingVideo ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaUpload />
            )}
            <span className="text-sm font-medium text-purple-700">
              {uploadingVideo ? 'Uploading...' : 'Upload Video'}
            </span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
              disabled={uploadingVideo}
            />
          </label>
        )}

        {videos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {videos.map((vid, index) => (
              <div key={index} className="border rounded-lg p-2 space-y-2">
                <div className="relative bg-gray-100 rounded">
                  <VideoPreview videoUrl={vid.url} />
                  {!readOnly && (
                    <button
                      onClick={() => removeVideo(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                </div>
                {!readOnly ? (
                  <>
                    <select
                      value={vid.room || 'living_room'}
                      onChange={(e) => updateVideo(index, { room: e.target.value })}
                      className="w-full text-xs border rounded p-1"
                    >
                      {ROOM_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={vid.description || ''}
                      onChange={(e) => updateVideo(index, { description: e.target.value })}
                      className="w-full text-xs border rounded p-1"
                    />
                  </>
                ) : (
                  <div className="text-xs">
                    <div className="font-medium">{ROOM_OPTIONS.find(o => o.value === vid.room)?.label || vid.room}</div>
                    {vid.description && <div className="text-gray-600">{vid.description}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && previewImages.length > 0 && (
        <ImagePreview
          isOpen={showImagePreview}
          onClose={() => {
            setShowImagePreview(false);
            setPreviewImages([]);
            setPreviewIndex(0);
          }}
          images={previewImages}
          initialIndex={previewIndex}
        />
      )}
    </div>
  );
}

