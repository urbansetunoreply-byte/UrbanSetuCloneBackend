import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import LocationSelector from "../components/LocationSelector";
import ESGManagement from "../components/ESGManagement";
import { toast } from 'react-toastify';
import { usePageTitle } from '../hooks/usePageTitle';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CreateListing() {
  // Set page title
  usePageTitle("Create Listing - Add New Property");

  const [formData, setFormData] = useState({
    imageUrls: [],
    virtualTourImages: [], // New state for 360 images
    videoUrls: [],
    name: "",
    description: "",
    // Structured address fields
    propertyNumber: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    // Legacy address field for backward compatibility
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
  const [virtualTourErrors, setVirtualTourErrors] = useState({}); // Errors for 360 images
  const [uploadingVirtualTour, setUploadingVirtualTour] = useState({}); // Uplodaing state for 360
  const [videoErrors, setVideoErrors] = useState({});
  const [uploadingVideos, setUploadingVideos] = useState({});
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [consent, setConsent] = useState(false);
  // LocationSelector state
  const [locationState, setLocationState] = useState({ state: "", district: "", city: "", cities: [] });

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

  // Update formData when location changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      state: locationState.state,
      city: locationState.city || "",
    }));
  }, [locationState]);

  const validateImageUrl = (url) => {
    if (!url) return true;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return false;
    }

    // Check if it's an image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext =>
      url.toLowerCase().includes(ext)
    );

    // Check for Cloudinary URLs (they contain 'cloudinary.com')
    const isCloudinaryUrl = url.includes('cloudinary.com');

    return hasImageExtension || url.includes('images') || url.includes('img') || isCloudinaryUrl;
  };

  const validateVideoUrl = (url) => {
    if (!url) return true;
    try {
      new URL(url);
    } catch {
      return false;
    }
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.mkv'];
    const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    const isCloudinaryUrl = url.includes('cloudinary.com');
    return hasVideoExtension || url.includes('video') || isCloudinaryUrl;
  };

  const handleImageChange = (index, url) => {
    const newImageUrls = [...formData.imageUrls];
    newImageUrls[index] = url;
    setFormData({ ...formData, imageUrls: newImageUrls });

    // Validate image URL
    const newImageErrors = { ...imageErrors };
    if (url && !validateImageUrl(url)) {
      newImageErrors[index] = "Please enter a valid image URL";
    } else {
      delete newImageErrors[index];
    }
    setImageErrors(newImageErrors);
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

  const onHandleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });

    // Clear error for this image
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setVirtualTourErrors(prev => ({ ...prev, [index]: 'Please select an image file' }));
      return;
    }

    // Validate file size (10MB limit for 360 images as they are larger)
    if (file.size > 10 * 1024 * 1024) {
      setVirtualTourErrors(prev => ({ ...prev, [index]: 'File size must be less than 10MB' }));
      return;
    }

    setUploadingVirtualTour(prev => ({ ...prev, [index]: true }));
    setVirtualTourErrors(prev => ({ ...prev, [index]: '' }));

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      // We use the same image upload endpoint, it handles cloudinary
      const res = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok) {
        const newVirtualTourImages = [...formData.virtualTourImages];
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
      virtualTourImages: formData.virtualTourImages.filter((_, i) => i !== index),
    });
    const newErrors = { ...virtualTourErrors };
    delete newErrors[index];
    setVirtualTourErrors(newErrors);

    const newUploading = { ...uploadingVirtualTour };
    delete newUploading[index];
    setUploadingVirtualTour(newUploading);
  };

  const handleVirtualTourUrlChange = (index, url) => {
    const newImages = [...formData.virtualTourImages];
    newImages[index] = url;
    setFormData({ ...formData, virtualTourImages: newImages });
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

    // Images are optional
    if (formData.regularPrice < formData.discountPrice)
      return setError("Discount price should be less than regular price");

    // Validate required address fields
    if (!formData.propertyNumber) return setError("Property number is required");
    if (!formData.city) return setError("City is required");
    if (!formData.state) return setError("State is required");
    if (!formData.pincode) return setError("Pincode is required");

    // Check for image errors
    if (Object.keys(imageErrors).length > 0) {
      return setError("Please fix the image URL errors before submitting");
    }
    // Check for video errors
    if (Object.keys(videoErrors).length > 0) {
      return setError("Please fix the video URL errors before submitting");
    }

    // Only require consent for non-admin users
    if ((currentUser.role !== 'admin' && currentUser.role !== 'rootadmin') && !consent) {
      return setError('You must confirm that the data provided is genuine.');
    }

    setLoading(true);
    setError("");

    try {
      console.log("Sending form data:", formData);
      console.log("ESG data being sent:", formData.esg);

      // Prepare submission data
      const submissionData = { ...formData, userRef: currentUser._id };

      // For rentals, sync regular price with monthly rent
      if (submissionData.type === 'rent') {
        submissionData.regularPrice = submissionData.monthlyRent;
        submissionData.discountPrice = 0;
      }

      const res = await fetch(`${API_BASE_URL}/api/listing/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(submissionData),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        toast.success("Property Added Successfully!!");
        const newListingId = data.listing?._id || data._id;

        // If rental property, suggest verification and auto-generate prediction
        if (formData.type === "rent") {
          // Auto-generate rent prediction in background
          fetch(`${API_BASE_URL}/api/rental/predictions/${newListingId}`, {
            method: 'POST',
            credentials: 'include'
          }).catch(err => console.error('Error generating prediction:', err));

          setTimeout(() => {
            toast.info(
              <div>
                <p className="mb-2">Get your property verified to build trust!</p>
                <button
                  onClick={() => navigate(`/user/property-verification?listingId=${newListingId}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Request Verification
                </button>
              </div>,
              { autoClose: 8000 }
            );
          }, 1000);
        }
        navigate(getPreviousPath());
      } else {
        const errorMessage = data.message || "Failed to create listing";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.message || "An error occurred while creating the listing";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 relative">
        <h3 className="text-3xl font-extrabold text-blue-700 mb-6 text-center drop-shadow">
          Create a Listing
        </h3>

        <form onSubmit={onSubmitForm} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                id="name"
                placeholder="Property Name"
                required
                onChange={onHandleChanges}
                value={formData.name}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              id="description"
              placeholder="Property Description"
              required
              onChange={onHandleChanges}
              value={formData.description}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4 resize-y"
              rows={4}
            />
          </div>

          {/* Address Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Address Information</h4>
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
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                id="landmark"
                placeholder="Landmark (optional)"
                onChange={onHandleChanges}
                value={formData.landmark}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                id="pincode"
                placeholder="Pincode"
                required
                onChange={onHandleChanges}
                value={formData.pincode}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Property Type</h4>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                <input
                  type="radio"
                  name="type"
                  value="sale"
                  onChange={onHandleChanges}
                  checked={formData.type === "sale"}
                  className="text-blue-600"
                />
                <span className="font-medium">For Sale</span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                <input
                  type="radio"
                  name="type"
                  value="rent"
                  onChange={onHandleChanges}
                  checked={formData.type === "rent"}
                  className="text-blue-600"
                />
                <span className="font-medium">For Rent</span>
              </label>
            </div>
            <div className="mt-4">
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-1">Area (sq ft) *</span>
                <input
                  type="number"
                  id="area"
                  placeholder="Enter property area in square feet"
                  required
                  onChange={onHandleChanges}
                  value={formData.area}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Area refers to the total built-up area of the property including all rooms, kitchen, bathrooms, and common areas
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-1">Floor Number *</span>
                <input
                  type="number"
                  id="floor"
                  placeholder="Enter floor number (e.g., 0, 1, 2...)"
                  required
                  min="0"
                  onChange={onHandleChanges}
                  value={formData.floor}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Floor number refers to which floor the property is located on (Ground floor = 0, First floor = 1, Second floor = 2, etc.)
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-1">Property Age (years) *</span>
                <input
                  type="number"
                  id="propertyAge"
                  placeholder="Enter property age in years (0 for new construction)"
                  required
                  min="0"
                  onChange={onHandleChanges}
                  value={formData.propertyAge}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Property age refers to how many years ago the property was constructed/built
                </p>
              </div>
            </div>

            {/* Rent-Lock Plan Configuration (only for rental properties) */}
            {formData.type === "rent" && (
              <div className="mt-6 border-t pt-4">
                <h5 className="font-semibold text-gray-800 mb-3">Rent-Lock Plan Configuration</h5>
                <div className="space-y-4">
                  {/* Rent-Lock Plan Selection */}
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium mb-2">Rent-Lock Plan *</span>
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
                      value={formData.rentLockPlans.defaultPlan}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1_year">1 Year Rent-Lock</option>
                      <option value="3_year">3 Year Rent-Lock</option>
                      <option value="5_year">5 Year Rent-Lock</option>
                      <option value="custom">Custom Duration</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the rent-lock plan duration. Rent will remain fixed for this period.
                    </p>
                  </div>

                  {/* Custom Lock Duration (if custom plan selected) */}
                  {formData.rentLockPlans.defaultPlan === "custom" && (
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium mb-2">Custom Lock Duration (months) *</span>
                      <input
                        type="number"
                        id="customLockDuration"
                        min="1"
                        max="60"
                        onChange={onHandleChanges}
                        value={formData.customLockDuration}
                        placeholder="Enter duration in months (1-60)"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the lock duration in months (minimum 1 month, maximum 60 months).
                      </p>
                    </div>
                  )}

                  {/* Monthly Rent */}
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium mb-2">Monthly Rent (₹) *</span>
                    <input
                      type="number"
                      id="monthlyRent"
                      min="0"
                      onChange={onHandleChanges}
                      value={formData.monthlyRent}
                      placeholder="Enter monthly rent amount"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The fixed monthly rent amount that will remain unchanged during the rent-lock period.
                    </p>
                  </div>

                  {/* Security Deposit */}
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium mb-2">Security Deposit (months of rent) *</span>
                    <input
                      type="number"
                      id="securityDepositMonths"
                      min="0"
                      max="12"
                      onChange={onHandleChanges}
                      value={formData.securityDepositMonths}
                      placeholder="Enter months (typically 2-3 months)"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of months of rent as security deposit (typically 2-3 months).
                    </p>
                  </div>

                  {/* Maintenance Charges */}
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium mb-2">Maintenance Charges (₹/month) (Optional)</span>
                    <input
                      type="number"
                      id="maintenanceCharges"
                      min="0"
                      onChange={onHandleChanges}
                      value={formData.maintenanceCharges}
                      placeholder="Enter monthly maintenance charges (0 if none)"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Monthly maintenance charges, if applicable. Leave 0 if no maintenance charges.
                    </p>
                  </div>

                  {/* Advance Rent */}
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium mb-2">Advance Rent (months) (Optional)</span>
                    <input
                      type="number"
                      id="advanceRentMonths"
                      min="0"
                      max="12"
                      onChange={onHandleChanges}
                      value={formData.advanceRentMonths}
                      placeholder="Enter months of advance rent (0 if none)"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of months of rent to be paid in advance, if required. Leave 0 if no advance rent.
                    </p>
                  </div>

                  {/* Available Plans (multi-select) */}
                  <div className="flex flex-col">
                    <span className="text-gray-700 font-medium mb-2">Available Plans (Select all that apply)</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['1_year', '3_year', '5_year', 'custom'].map((plan) => (
                        <label key={plan} className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.rentLockPlans.availablePlans.includes(plan)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                rentLockPlans: {
                                  ...prev.rentLockPlans,
                                  availablePlans: checked
                                    ? [...prev.rentLockPlans.availablePlans, plan]
                                    : prev.rentLockPlans.availablePlans.filter(p => p !== plan)
                                }
                              }));
                            }}
                            className="text-blue-600"
                          />
                          <span className="text-gray-700 text-sm font-medium">
                            {plan === '1_year' ? '1 Year' :
                              plan === '3_year' ? '3 Years' :
                                plan === '5_year' ? '5 Years' : 'Custom'}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Select all rent-lock plans you want to offer to tenants. At least one plan should be selected.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Property Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-1">Bedrooms</span>
                <input
                  type="number"
                  id="bedrooms"
                  onChange={onHandleChanges}
                  value={formData.bedrooms}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-1">Bathrooms</span>
                <input
                  type="number"
                  id="bathrooms"
                  onChange={onHandleChanges}
                  value={formData.bathrooms}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-1">Regular Price (₹)</span>
                <input
                  type="number"
                  id="regularPrice"
                  disabled={formData.type === 'rent'}
                  onChange={onHandleChanges}
                  value={formData.type === 'rent' ? formData.monthlyRent : formData.regularPrice}
                  placeholder="Enter price"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.type === 'rent' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium mb-1">Discount Price (₹)</span>
                <input
                  type="number"
                  id="discountPrice"
                  disabled={formData.type === 'rent'}
                  onChange={onHandleChanges}
                  value={formData.type === 'rent' ? 0 : formData.discountPrice}
                  placeholder="Enter discount"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.type === 'rent' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Property Features */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Property Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["parking", "furnished", "offer"].map((item) => (
                <label key={item} className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-sm">
                  <input
                    type="checkbox"
                    id={item}
                    onChange={onHandleChanges}
                    checked={formData[item]}
                    className="text-blue-600"
                  />
                  <span className="text-gray-700 font-medium capitalize">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Property Images */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Property Images</h4>
            <p className="text-gray-600 text-sm mb-3">
              Upload images directly or add image URLs. Supported formats: JPG, PNG, GIF, WebP, SVG (max 5MB each)
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
                      className={`flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${imageErrors[index] ? 'border-red-500' : ''
                        }`}
                    />
                    <label className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition cursor-pointer">
                      {uploadingImages[index] ? 'Uploading...' : 'Upload File'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(index, e.target.files[0])}
                        className="hidden"
                        disabled={uploadingImages[index]}
                      />
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
                  {uploadingImages[index] && (
                    <p className="text-blue-500 text-sm">⏳ Uploading image...</p>
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Property Videos</h4>
            <p className="text-gray-600 text-sm mb-3">
              Upload videos directly or add video URLs. Supported formats: MP4, WebM, OGG, MOV, MKV (max 5MB each)
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
                      className={`flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${videoErrors[index] ? 'border-red-500' : ''
                        }`}
                    />
                    <label className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition cursor-pointer">
                      {uploadingVideos[index] ? 'Uploading...' : 'Upload File'}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoUpload(index, e.target.files[0])}
                        className="hidden"
                        disabled={uploadingVideos[index]}
                      />
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
                  {uploadingVideos[index] && (
                    <p className="text-blue-500 text-sm">⏳ Uploading video...</p>
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
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <FaCompass className="text-indigo-600 text-xl animate-pulse" />
              <h4 className="font-semibold text-gray-800">360° Virtual Tours</h4>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Upload equirectangular panoramic images for an immersive 360° view. Supported formats: JPG, PNG. (Max 10MB)
            </p>
            <div className="space-y-3">
              {formData.virtualTourImages.map((url, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`360 Image URL ${index + 1}`}
                      value={url || ""}
                      onChange={(e) => handleVirtualTourUrlChange(index, e.target.value)}
                      className={`flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${virtualTourErrors[index] ? 'border-red-500' : ''}`}
                    />
                    <label className="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 transition cursor-pointer flex items-center gap-2">
                      {uploadingVirtualTour[index] ? 'Uploading...' : 'Upload 360°'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleVirtualTourUpload(index, e.target.files[0])}
                        className="hidden"
                        disabled={uploadingVirtualTour[index]}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => onHandleRemoveVirtualTour(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                      ×
                    </button>
                  </div>
                  {virtualTourErrors[index] && (
                    <p className="text-red-500 text-sm">{virtualTourErrors[index]}</p>
                  )}
                  {uploadingVirtualTour[index] && (
                    <p className="text-indigo-500 text-sm animate-pulse">⏳ Processing panoramic image...</p>
                  )}
                  {url && (
                    <div className="mt-2">
                      <p className="text-xs text-green-600 font-semibold mb-1">✓ 360° Image Ready</p>
                      <img src={url} alt="360 Preview" className="h-20 w-auto rounded border border-gray-300 object-cover" />
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, virtualTourImages: [...formData.virtualTourImages, ""] })}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition mt-2 flex items-center gap-2"
              >
                <FaCompass /> Add 360° Image
              </button>
            </div>
          </div>

          {/* ESG Management Section */}
          <div className="mb-6">
            <ESGManagement
              esgData={formData.esg}
              onESGChange={(esgData) => setFormData({ ...formData, esg: esgData })}
              isEditing={false}
            />
          </div>

          {/* Consent Checkbox for Users */}
          {currentUser.role !== 'admin' && currentUser.role !== 'rootadmin' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="accent-blue-600 w-4 h-4"
                required
              />
              <label htmlFor="consent" className="text-sm text-gray-700 select-none">
                I confirm that <span className="font-semibold text-blue-700">all the information provided in this listing is true and genuine to the best of my knowledge</span>. Providing false information may result in account suspension or legal action.
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
              {loading ? "Creating..." : "Create Listing"}
            </button>
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
