import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import LocationSelector from "../components/LocationSelector";
import ESGManagement from "../components/ESGManagement";
import { toast } from 'react-toastify';
import { FaCompass } from "react-icons/fa";
import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function EditListing() {
  // Set page title
  usePageTitle("Edit Listing - Update Property");

  const [formData, setFormData] = useState({
    imageUrls: [],
    virtualTourImages: [], // 360 images
    videoUrls: [],
    name: "",
    description: "",
    propertyNumber: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    type: "sale",
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 0,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
    locationLink: "",
    area: "",
    floor: "",
    propertyAge: "",
    // ESG Data
    esg: {
      environmental: {
        energyRating: 'Not Rated',
        carbonFootprint: 0,
        renewableEnergy: false,
        waterEfficiency: 'Not Rated',
        wasteManagement: 'Not Rated',
        greenCertification: 'None',
        solarPanels: false,
        rainwaterHarvesting: false
      },
      social: {
        accessibility: 'Not Rated',
        communityImpact: 0,
        affordableHousing: false,
        localEmployment: 0,
        socialAmenities: [],
        diversityInclusion: 'Not Rated'
      },
      governance: {
        transparency: 'Not Rated',
        ethicalStandards: 'Not Rated',
        compliance: 'Not Rated',
        riskManagement: 'Not Rated',
        stakeholderEngagement: 'Not Rated'
      }
    },
    // Rent-Lock Plan Configuration (for rental properties)
    rentLockPlans: {
      availablePlans: [],
      defaultPlan: '1_year'
    },
    monthlyRent: 0,
    securityDepositMonths: 2,
    maintenanceCharges: 0,
    advanceRentMonths: 0,
    customLockDuration: 12 // in months, if custom plan
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [virtualTourErrors, setVirtualTourErrors] = useState({});
  const [uploadingVirtualTour, setUploadingVirtualTour] = useState({});
  const [videoErrors, setVideoErrors] = useState({});
  const [uploadingVideos, setUploadingVideos] = useState({});
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [consent, setConsent] = useState(false);
  const [locationState, setLocationState] = useState({ state: "", district: "", city: "", cities: [] });
  const [isLocked, setIsLocked] = useState(false);

  // Get the previous path for redirection
  const getPreviousPath = () => {
    const from = location.state?.from;
    if (from) return from;

    // Default paths based on user role
    if (currentUser.role === 'admin' || currentUser.role === 'rootadmin') {
      return "/admin/my-listings";
    } else {
      return "/user/my-listings";
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      const listingId = params.listingId;
      const apiUrl = `${API_BASE_URL}/api/listing/get/${listingId}`;
      const res = await fetch(apiUrl, { credentials: 'include' });
      const data = await res.json();
      if (data.success === false) {
        setError(data.message);
        return;
      }

      // Check if property is sold or under contract (non-admins cannot edit)
      if ((data.availabilityStatus === 'sold' || data.availabilityStatus === 'under_contract') &&
        currentUser.role !== 'admin' &&
        currentUser.role !== 'rootadmin') {
        toast.error(`Cannot edit property that is ${data.availabilityStatus === 'sold' ? 'sold' : 'under contract'}.`);
        navigate(getPreviousPath());
        return;
      }

      setFormData({
        ...formData,
        ...data,
      });
      if (data.isRentLocked && currentUser.role !== 'admin' && currentUser.role !== 'rootadmin') setIsLocked(true);
      setLocationState({
        state: data.state || "",
        district: data.district || "",
        city: data.city || "",
        cities: [],
      });
    };
    fetchListing();
    // eslint-disable-next-line
  }, [params.listingId]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      state: locationState.state,
      city: locationState.city || "",
    }));
  }, [locationState]);

  const validateImageUrl = (url) => {
    if (!url) return true;
    try { new URL(url); } catch { return false; }
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));

    // Check for Cloudinary URLs (they contain 'cloudinary.com')
    const isCloudinaryUrl = url.includes('cloudinary.com');

    return hasImageExtension || url.includes('images') || url.includes('img') || isCloudinaryUrl;
  };

  const validateVideoUrl = (url) => {
    if (!url) return true;
    try { new URL(url); } catch { return false; }
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];
    const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    const isCloudinaryUrl = url.includes('cloudinary.com');
    return hasVideoExtension || url.includes('video') || isCloudinaryUrl;
  };

  const handleImageChange = (index, url) => {
    const newImageUrls = [...formData.imageUrls];
    newImageUrls[index] = url;
    setFormData({ ...formData, imageUrls: newImageUrls });
    const newImageErrors = { ...imageErrors };
    if (url && !validateImageUrl(url)) {
      newImageErrors[index] = "Please enter a valid image URL";
    } else {
      delete newImageErrors[index];
    }
    setImageErrors(newImageErrors);
  };

  const onHandleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
    const newImageErrors = { ...imageErrors };
    delete newImageErrors[index];
    setImageErrors(newImageErrors);

    // Clear uploading state
    const newUploadingImages = { ...uploadingImages };
    delete newUploadingImages[index];
    setUploadingImages(newUploadingImages);
  };

  const onHandleRemoveVideo = (index) => {
    setFormData({
      ...formData,
      videoUrls: formData.videoUrls.filter((_, i) => i !== index),
    });
    const newVideoErrors = { ...videoErrors };
    delete newVideoErrors[index];
    setVideoErrors(newVideoErrors);
    const newUploadingVideos = { ...uploadingVideos };
    delete newUploadingVideos[index];
    setUploadingVideos(newUploadingVideos);
  };

  // --- Virtual Tour (360) Handlers ---

  const handleVirtualTourUpload = async (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setVirtualTourErrors(prev => ({ ...prev, [index]: 'Please select an image file' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setVirtualTourErrors(prev => ({ ...prev, [index]: 'File size must be less than 10MB' }));
      return;
    }
    setUploadingVirtualTour(prev => ({ ...prev, [index]: true }));
    setVirtualTourErrors(prev => ({ ...prev, [index]: '' }));
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });
      const data = await res.json();
      if (res.ok) {
        const newVirtualTourImages = [...(formData.virtualTourImages || [])];
        newVirtualTourImages[index] = data.imageUrl;
        setFormData(prev => ({ ...prev, virtualTourImages: newVirtualTourImages }));
        setVirtualTourErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      } else {
        setVirtualTourErrors(prev => ({ ...prev, [index]: data.message || 'Upload failed' }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setVirtualTourErrors(prev => ({ ...prev, [index]: 'Upload failed. Please try again.' }));
    } finally {
      setUploadingVirtualTour(prev => ({ ...prev, [index]: false }));
    }
  };

  const onHandleRemoveVirtualTour = (index) => {
    setFormData({
      ...formData,
      virtualTourImages: (formData.virtualTourImages || []).filter((_, i) => i !== index),
    });
    const newErrors = { ...virtualTourErrors };
    delete newErrors[index];
    setVirtualTourErrors(newErrors);
    const newUploading = { ...uploadingVirtualTour };
    delete newUploading[index];
    setUploadingVirtualTour(newUploading);
  };

  const handleVirtualTourUrlChange = (index, url) => {
    const newImages = [...(formData.virtualTourImages || [])];
    newImages[index] = url;
    setFormData({ ...formData, virtualTourImages: newImages });
  };


  const handleFileUpload = async (index, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageErrors(prev => ({ ...prev, [index]: 'Please select an image file' }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setImageErrors(prev => ({ ...prev, [index]: 'File size must be less than 5MB' }));
      return;
    }

    setUploadingImages(prev => ({ ...prev, [index]: true }));
    setImageErrors(prev => ({ ...prev, [index]: '' }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok) {
        // Update the image URL with the uploaded image URL
        const newImageUrls = [...formData.imageUrls];
        newImageUrls[index] = data.imageUrl;
        setFormData(prev => ({ ...prev, imageUrls: newImageUrls }));

        // Clear any existing errors for this image
        setImageErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      } else {
        setImageErrors(prev => ({ ...prev, [index]: data.message || 'Upload failed' }));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setImageErrors(prev => ({ ...prev, [index]: 'Upload failed. Please try again.' }));
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleVideoUrlChange = (index, url) => {
    const newVideoUrls = [...formData.videoUrls];
    newVideoUrls[index] = url;
    setFormData({ ...formData, videoUrls: newVideoUrls });
    const newVideoErrors = { ...videoErrors };
    if (url && !validateVideoUrl(url)) {
      newVideoErrors[index] = 'Please enter a valid video URL';
    } else {
      delete newVideoErrors[index];
    }
    setVideoErrors(newVideoErrors);
  };

  const handleVideoUpload = async (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setVideoErrors(prev => ({ ...prev, [index]: 'Please select a video file' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setVideoErrors(prev => ({ ...prev, [index]: 'File size must be less than 5MB' }));
      return;
    }
    setUploadingVideos(prev => ({ ...prev, [index]: true }));
    setVideoErrors(prev => ({ ...prev, [index]: '' }));
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('video', file);
      const res = await fetch(`${API_BASE_URL}/api/upload/video`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });
      const data = await res.json();
      if (res.ok) {
        const newVideoUrls = [...formData.videoUrls];
        newVideoUrls[index] = data.videoUrl;
        setFormData(prev => ({ ...prev, videoUrls: newVideoUrls }));
        setVideoErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      } else {
        setVideoErrors(prev => ({ ...prev, [index]: data.message || 'Upload failed' }));
      }
    } catch (error) {
      console.error('Video upload error:', error);
      setVideoErrors(prev => ({ ...prev, [index]: 'Upload failed. Please try again.' }));
    } finally {
      setUploadingVideos(prev => ({ ...prev, [index]: false }));
    }
  };

  const onHandleChanges = (e) => {
    const { id, value, checked, type, name } = e.target;
    let newValue = type === "checkbox" ? checked : value;
    if (["regularPrice", "discountPrice", "bedrooms", "bathrooms"].includes(id)) {
      newValue = Number(value);
    }
    setFormData({
      ...formData,
      [name || id]: newValue,
    });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.type) return setError("Please select a listing type (Sale or Rent)");

    // Validate rent-lock plan configuration for rental properties
    if (formData.type === "rent") {
      if (formData.rentLockPlans.availablePlans.length === 0) {
        return setError("Please select at least one available rent-lock plan.");
      }
      if (!formData.monthlyRent || formData.monthlyRent <= 0) {
        return setError("Please enter a valid monthly rent amount.");
      }
      if (!formData.securityDepositMonths || formData.securityDepositMonths < 0) {
        return setError("Please enter a valid security deposit (months of rent).");
      }
      if (formData.rentLockPlans.defaultPlan === "custom" && (!formData.customLockDuration || formData.customLockDuration < 1 || formData.customLockDuration > 60)) {
        return setError("Custom lock duration must be between 1 and 60 months.");
      }
      if (formData.maintenanceCharges < 0) {
        return setError("Maintenance charges cannot be negative.");
      }
      if (formData.advanceRentMonths < 0 || formData.advanceRentMonths > 12) {
        return setError("Advance rent must be between 0 and 12 months.");
      }
    }

    // Images are optional when editing as well
    if (formData.regularPrice < formData.discountPrice)
      return setError("Discount price should be less than regular price");
    if (!formData.propertyNumber) return setError("Property number is required");
    if (!formData.city) return setError("City is required");
    if (!formData.state) return setError("State is required");
    if (!formData.pincode) return setError("Pincode is required");
    if (Object.keys(imageErrors).length > 0) {
      return setError("Please fix the image URL errors before submitting");
    }
    if (Object.keys(videoErrors).length > 0) {
      return setError("Please fix the video URL errors before submitting");
    }
    if ((currentUser.role !== 'admin' && currentUser.role !== 'rootadmin') && !consent) {
      return setError('You must confirm that the data provided is genuine.');
    }
    setLoading(true);
    setError("");
    try {
      const apiUrl = `${API_BASE_URL}/api/listing/update/${params.listingId}`;

      // Prepare request body - preserve original ownership for admin edits
      let requestBody = formData;
      if (currentUser.role === 'admin' || currentUser.role === 'rootadmin') {
        // Admin editing - don't change ownership, just update the data
        requestBody = { ...formData };
      } else {
        // Regular user editing their own listing - maintain ownership
        requestBody = { ...formData, userRef: currentUser._id };
      }

      // For rentals, sync regular price with monthly rent
      if (requestBody.type === 'rent') {
        requestBody.regularPrice = requestBody.monthlyRent;
        requestBody.discountPrice = 0;
      }

      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      };
      const res = await fetch(apiUrl, options);
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Property Details Updated Successfully!!");
        navigate(getPreviousPath());
      } else {
        const errorMessage = data.message || "Failed to update listing";
        setError(errorMessage);
        toast.error(errorMessage);
      }
      setLoading(false);
    } catch (error) {
      const errorMessage = error.message || "An error occurred while updating the listing";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-950 dark:to-gray-900 min-h-screen py-10 px-2 md:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 relative transition-colors">
        <h3 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400 mb-6 text-center drop-shadow transition-colors">
          Edit Listing
        </h3>
        {isLocked && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-6 rounded shadow-sm transition-colors">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  Active Rent-Lock Plan
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                  This property is currently under an active Rent-Lock contract. Critical details like address, price, and property type cannot be modified until the contract ends.
                </p>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={onSubmitForm} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg transition-colors">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 transition-colors">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                id="name"
                placeholder="Property Name"
                required
                onChange={onHandleChanges}
                value={formData.name}
                className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <textarea
              id="description"
              placeholder="Property Description"
              required
              onChange={onHandleChanges}
              value={formData.description}
              className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4 resize-y transition-colors"
              rows={4}
            />
          </div>

          {/* Address Information */}
          <fieldset disabled={isLocked} className="contents">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg relative transition-colors">
              {isLocked && <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 z-10 rounded-lg cursor-not-allowed" title="Address cannot be changed during active Rent-Lock"></div>}
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 transition-colors">
                Address Information {isLocked && <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">Locked</span>}
              </h4>
              <div className="mb-4">
                <LocationSelector value={locationState} onChange={setLocationState} mode="form" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  id="propertyNumber"
                  placeholder="Property Number/Flat Number"
                  required
                  onChange={onHandleChanges}
                  value={formData.propertyNumber}
                  className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <input
                  type="text"
                  id="landmark"
                  placeholder="Landmark (optional)"
                  onChange={onHandleChanges}
                  value={formData.landmark}
                  className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <input
                  type="text"
                  id="pincode"
                  placeholder="Pincode"
                  required
                  onChange={onHandleChanges}
                  value={formData.pincode}
                  className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength="6"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                <input
                  type="text"
                  id="locationLink"
                  placeholder="Google Maps Location Link (Optional)"
                  onChange={onHandleChanges}
                  value={formData.locationLink}
                  className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          </fieldset>

          {/* Property Type */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg transition-colors">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 transition-colors">Property Type</h4>
            <fieldset disabled={isLocked} className="contents">
              <div className="flex gap-6 relative">
                {isLocked && <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 z-10 rounded-lg cursor-not-allowed" title="Property Type cannot be changed during active Rent-Lock"></div>}
                <label className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value="sale"
                    onChange={onHandleChanges}
                    checked={formData.type === "sale"}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <span className="font-medium dark:text-gray-200">For Sale</span>
                </label>
                <label className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value="rent"
                    onChange={onHandleChanges}
                    checked={formData.type === "rent"}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <span className="font-medium dark:text-gray-200">For Rent</span>
                </label>
              </div>
            </fieldset>
            <div className="mt-4">
              <div className="flex flex-col">
                <span className="text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors">Area (sq ft) *</span>
                <input
                  type="number"
                  id="area"
                  placeholder="Enter property area in square feet"
                  required
                  onChange={onHandleChanges}
                  value={formData.area}
                  className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  Area refers to the total built-up area of the property including all rooms, kitchen, bathrooms, and common areas
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-col">
                <span className="text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors">Floor Number *</span>
                <input
                  type="number"
                  id="floor"
                  placeholder="Enter floor number (e.g., 0, 1, 2...)"
                  required
                  min="0"
                  onChange={onHandleChanges}
                  value={formData.floor}
                  className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  Floor number refers to which floor the property is located on (Ground floor = 0, First floor = 1, Second floor = 2, etc.)
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-col">
                <span className="text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors">Property Age (years) *</span>
                <input
                  type="number"
                  id="propertyAge"
                  placeholder="Enter property age in years (0 for new construction)"
                  required
                  min="0"
                  onChange={onHandleChanges}
                  value={formData.propertyAge}
                  className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  Property age refers to how many years ago the property was constructed/built
                </p>
              </div>
            </div>

            {/* Rent-Lock Plan Configuration (only for rental properties) */}
            {formData.type === "rent" && (
              <fieldset disabled={isLocked} className="contents">
                <div className="mt-6 border-t dark:border-gray-700 pt-4 relative transition-colors">
                  {isLocked && <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-900/50 z-10 rounded-lg cursor-not-allowed" title="Rent-Lock Plan cannot be changed during active Rent-Lock"></div>}
                  <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 transition-colors">
                    Rent-Lock Plan Configuration {isLocked && <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">Locked</span>}
                  </h5>
                  <div className="space-y-4">
                    {/* Rent-Lock Plan Selection */}
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors">Rent-Lock Plan *</span>
                      <select
                        id="rentLockPlan"
                        name="defaultPlan"
                        onChange={(e) => {
                          const selectedPlan = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            rentLockPlans: {
                              ...prev.rentLockPlans,
                              defaultPlan: selectedPlan,
                              availablePlans: prev.rentLockPlans.availablePlans.includes(selectedPlan)
                                ? prev.rentLockPlans.availablePlans
                                : [...prev.rentLockPlans.availablePlans, selectedPlan]
                            }
                          }));
                        }}
                        value={formData.rentLockPlans?.defaultPlan || '1_year'}
                        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <option value="1_year">1 Year Rent-Lock</option>
                        <option value="3_year">3 Year Rent-Lock</option>
                        <option value="5_year">5 Year Rent-Lock</option>
                        <option value="custom">Custom Duration</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                        Select the rent-lock plan duration. Rent will remain fixed for this period.
                      </p>
                    </div>

                    {/* Custom Lock Duration (if custom plan selected) */}
                    {formData.rentLockPlans?.defaultPlan === "custom" && (
                      <div className="flex flex-col">
                        <span className="text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors">Custom Lock Duration (months) *</span>
                        <input
                          type="number"
                          id="customLockDuration"
                          min="1"
                          max="60"
                          onChange={onHandleChanges}
                          value={formData.customLockDuration}
                          placeholder="Enter duration in months (1-60)"
                          className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                          Enter the lock duration in months (minimum 1 month, maximum 60 months).
                        </p>
                      </div>
                    )}

                    {/* Monthly Rent */}
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors">Monthly Rent (₹) *</span>
                      <input
                        type="number"
                        id="monthlyRent"
                        min="0"
                        onChange={onHandleChanges}
                        value={formData.monthlyRent}
                        placeholder="Enter monthly rent amount"
                        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                        The fixed monthly rent amount that will remain unchanged during the rent-lock period.
                      </p>
                    </div>

                    {/* Security Deposit */}
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors">Security Deposit (months of rent) *</span>
                      <input
                        type="number"
                        id="securityDepositMonths"
                        min="0"
                        max="12"
                        onChange={onHandleChanges}
                        value={formData.securityDepositMonths}
                        placeholder="Enter months (typically 2-3 months)"
                        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                        Number of months of rent as security deposit (typically 2-3 months).
                      </p>
                    </div>

                    {/* Maintenance Charges */}
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors">Maintenance Charges (₹/month) (Optional)</span>
                      <input
                        type="number"
                        id="maintenanceCharges"
                        min="0"
                        onChange={onHandleChanges}
                        value={formData.maintenanceCharges}
                        placeholder="Enter monthly maintenance charges (0 if none)"
                        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                        Monthly maintenance charges, if applicable. Leave 0 if no maintenance charges.
                      </p>
                    </div>

                    {/* Advance Rent */}
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors">Advance Rent (months) (Optional)</span>
                      <input
                        type="number"
                        id="advanceRentMonths"
                        min="0"
                        max="12"
                        onChange={onHandleChanges}
                        value={formData.advanceRentMonths}
                        placeholder="Enter months of advance rent (0 if none)"
                        className="w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                        Number of months of rent to be paid in advance, if required. Leave 0 if no advance rent.
                      </p>
                    </div>

                    {/* Available Plans (multi-select) */}
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-gray-300 font-medium mb-2 transition-colors">Available Plans (Select all that apply)</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['1_year', '3_year', '5_year', 'custom'].map((plan) => (
                          <label key={plan} className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer border dark:border-gray-700 transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.rentLockPlans?.availablePlans.includes(plan)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  rentLockPlans: {
                                    ...prev.rentLockPlans,
                                    availablePlans: checked
                                      ? [...(prev.rentLockPlans?.availablePlans || []), plan]
                                      : (prev.rentLockPlans?.availablePlans || []).filter(p => p !== plan)
                                  }
                                }));
                              }}
                              className="text-blue-600 dark:text-blue-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors">
                              {plan === '1_year' ? '1 Year' :
                                plan === '3_year' ? '3 Years' :
                                  plan === '5_year' ? '5 Years' : 'Custom'}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                        Select all rent-lock plans you want to offer to tenants. At least one plan should be selected.
                      </p>
                    </div>
                  </div>
                </div>
              </fieldset>
            )}
          </div>

          {/* Property Details Grid */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg transition-colors">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 transition-colors">Property Pricing Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors">{formData.type === 'rent' ? 'Monthly Rent (₹)' : 'Regular Price (₹)'}</span>
                <fieldset disabled={isLocked || formData.type === 'rent'} className="contents">
                  <input
                    type="number"
                    id="regularPrice"
                    disabled={formData.type === 'rent' || isLocked}
                    onChange={onHandleChanges}
                    value={formData.type === 'rent' ? formData.monthlyRent : formData.regularPrice}
                    placeholder="Enter price"
                    className={`w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${formData.type === 'rent' || isLocked ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                  />
                </fieldset>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-700 dark:text-gray-300 font-medium mb-1 transition-colors">Discount Price (₹)</span>
                <fieldset disabled={isLocked || formData.type === 'rent'} className="contents">
                  <input
                    type="number"
                    id="discountPrice"
                    disabled={formData.type === 'rent' || isLocked}
                    onChange={onHandleChanges}
                    value={formData.type === 'rent' ? 0 : formData.discountPrice}
                    placeholder="Enter discount"
                    className={`w-full p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${formData.type === 'rent' || isLocked ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                  />
                </fieldset>
              </div>
            </div>
          </div>

          {/* Property Features */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg transition-colors">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 transition-colors">Property Amenities</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["parking", "furnished", "offer"].map((item) => (
                <label key={item} className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    id={item}
                    onChange={onHandleChanges}
                    checked={formData[item]}
                    className="text-blue-600 dark:text-blue-400 w-5 h-5 transition-colors"
                  />
                  <span className="text-gray-700 dark:text-gray-300 font-medium capitalize transition-colors">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Property Images */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg transition-colors">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 transition-colors">Property Images</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 transition-colors">
              Upload images directly or add image URLs. Supported formats: JPG, PNG, GIF, WebP, SVG (max 5MB per image)
            </p>
            <div className="space-y-3">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`Image URL ${index + 1} (e.g., https://example.com/image.jpg)`}
                      value={url || ""}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      className={`flex-1 p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${imageErrors[index] ? 'border-red-500' : ''
                        }`}
                    />
                    <label className={`p-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-2 ${uploadingImages[index] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(index, e.target.files[0])}
                        disabled={uploadingImages[index]}
                      />
                      {uploadingImages[index] ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-sm text-gray-600">Upload</span>
                        </>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => onHandleRemoveImage(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition"
                      title="Remove this photo"
                    >
                      ×
                    </button>
                  </div>
                  {imageErrors[index] && (
                    <p className="text-red-500 text-sm">{imageErrors[index]}</p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, imageUrls: [...formData.imageUrls, ""] })}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mt-2"
              >
                Add Photo
              </button>
            </div>

            {/* Image Preview */}
            {formData.imageUrls.some(url => url) && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Image Preview:</h5>
                <div className="grid grid-cols-3 gap-4">
                  {formData.imageUrls.map((url, index) => (
                    url && (
                      <div key={url} className="relative">
                        <img
                          src={url}
                          alt="listing"
                          className="w-full h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                            e.target.className = "w-full h-24 object-cover rounded-lg opacity-50";
                          }}
                        />
                        <button
                          onClick={() => onHandleRemoveImage(index)}
                          type="button"
                          className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full hover:bg-red-600 transition"
                        >
                          ×
                        </button>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Property Videos */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg transition-colors">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 transition-colors">Property Videos</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 transition-colors">
              Upload videos directly or add video URLs. Supported formats: MP4, WebM, OGG, MOV, MKV (max 5MB per video)
            </p>
            <div className="space-y-3">
              {formData.videoUrls.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`Video URL ${index + 1} (e.g., https://example.com/video.mp4)`}
                      value={url || ""}
                      onChange={(e) => handleVideoUrlChange(index, e.target.value)}
                      className={`flex-1 p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${videoErrors[index] ? 'border-red-500' : ''
                        }`}
                    />
                    <label className={`p-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-2 ${uploadingVideos[index] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleVideoUpload(index, e.target.files[0])}
                        disabled={uploadingVideos[index]}
                      />
                      {uploadingVideos[index] ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-sm text-gray-600">Upload</span>
                        </>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => onHandleRemoveVideo(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition"
                      title="Remove this video"
                    >
                      ×
                    </button>
                  </div>
                  {videoErrors[index] && (
                    <p className="text-red-500 text-sm">{videoErrors[index]}</p>
                  )}
                  {url && (
                    <div className="w-full rounded-lg overflow-hidden bg-black">
                      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                        <video
                          src={url}
                          className="absolute inset-0 w-full h-full object-contain bg-black"
                          controls
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, videoUrls: [...formData.videoUrls, ""] })}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mt-2"
              >
                Add Video
              </button>
            </div>
          </div>

          {/* 360° Virtual Tour Images (New) */}
          <div className={`bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border-2 ${formData.isVerified ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-dashed border-gray-300 dark:border-gray-700 relative'} transition-colors`}>

            {/* Locked Overlay for Unverified Properties */}
            {!formData.isVerified && (
              <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex items-center justify-center rounded-lg backdrop-blur-[2px] transition-colors">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-indigo-100 dark:border-indigo-900 max-w-md text-center transform hover:scale-105 transition-transform duration-300">
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FaCompass className="text-indigo-600 dark:text-indigo-400 text-2xl" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2 transition-colors">Premium Feature Locked 🔒</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed transition-colors">
                    360° virtual tours are a <span className="font-semibold text-indigo-600 dark:text-indigo-400">premium feature</span> available exclusively for verified properties.
                  </p>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-900/30 py-3 px-4 rounded-lg border border-indigo-100 dark:border-indigo-800 transition-colors">
                    ✨ Verify this property to unlock this immersive feature!
                  </div>
                </div>
              </div>
            )}

            <div className={!formData.isVerified ? "opacity-40 pointer-events-none filter blur-[1px] select-none" : ""}>
              <div className="flex items-center gap-2 mb-3">
                <FaCompass className="text-indigo-600 dark:text-indigo-400 text-xl animate-pulse" />
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 transition-colors">360° Virtual Tours</h4>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 transition-colors">
                Upload equirectangular panoramic images for an immersive 360° view.
              </p>
              <div className="space-y-3">
                {(formData.virtualTourImages || []).map((url, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={`360 Image URL ${index + 1}`}
                        value={url || ""}
                        onChange={(e) => handleVirtualTourUrlChange(index, e.target.value)}
                        className={`flex-1 p-3 border dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${virtualTourErrors[index] ? 'border-red-500' : ''}`}
                      />
                      <label className={`p-3 border-2 border-dashed border-indigo-300 dark:border-indigo-900/50 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2 ${uploadingVirtualTour[index] ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleVirtualTourUpload(index, e.target.files[0])}
                          disabled={uploadingVirtualTour[index]}
                        />
                        {uploadingVirtualTour[index] ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                            <span className="text-sm text-indigo-600 dark:text-indigo-400">Uploading...</span>
                          </>
                        ) : (
                          <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Upload 360°</span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => onHandleRemoveVirtualTour(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition"
                        title="Remove 360 image"
                      >
                        ×
                      </button>
                    </div>
                    {virtualTourErrors[index] && (
                      <p className="text-red-500 text-sm">{virtualTourErrors[index]}</p>
                    )}
                    {url && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">✓ 360° Image Ready</p>
                        <img src={url} alt="360 Preview" className="h-20 w-auto rounded border border-gray-300 dark:border-gray-700 object-cover" />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, virtualTourImages: [...(formData.virtualTourImages || []), ""] })}
                  className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition mt-2 flex items-center gap-2 shadow-md"
                >
                  <span>+</span> Add 360° Image
                </button>
              </div>
            </div>
          </div>

          {/* ESG Management Section */}
          <div className="mb-6">
            <ESGManagement
              esgData={formData.esg}
              onESGChange={(esgData) => setFormData({ ...formData, esg: esgData })}
              isEditing={true}
            />
          </div>

          {/* Consent Checkbox for Users */}
          {currentUser.role !== 'admin' && currentUser.role !== 'rootadmin' && (
            <div className="flex items-center gap-2 mt-2 transition-colors">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="accent-blue-600 w-4 h-4 dark:bg-gray-800 dark:border-gray-700"
                required
              />
              <label htmlFor="consent" className="text-sm text-gray-700 dark:text-gray-300 select-none transition-colors">
                I confirm that <span className="font-semibold text-blue-700 dark:text-blue-400 transition-colors">all the information provided in this listing is true and genuine to the best of my knowledge</span>. Providing false information may result in account suspension or legal action.
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(getPreviousPath())}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-all transform hover:scale-105 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Listing"}
            </button>
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}

