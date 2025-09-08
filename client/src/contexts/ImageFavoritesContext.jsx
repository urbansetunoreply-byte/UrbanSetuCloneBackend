import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ImageFavoritesContext = createContext();

export const useImageFavorites = () => {
    const context = useContext(ImageFavoritesContext);
    if (!context) {
        throw new Error('useImageFavorites must be used within an ImageFavoritesProvider');
    }
    return context;
};

export const ImageFavoritesProvider = ({ children }) => {
    const { currentUser } = useSelector(state => state.user);
    const [favorites, setFavorites] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [favoritesData, setFavoritesData] = useState([]);

    // Load user's favorites when component mounts or user changes
    useEffect(() => {
        if (currentUser) {
            loadFavorites();
        } else {
            // Clear favorites when user logs out
            setFavorites(new Set());
            setFavoritesData([]);
        }
    }, [currentUser]);

    // Load all favorites from backend
    const loadFavorites = async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/api/image-favorites/user/${currentUser._id}`, {
                withCredentials: true
            });

            if (response.data.success) {
                const favoriteIds = new Set(response.data.favorites.map(fav => fav.imageId));
                setFavorites(favoriteIds);
                setFavoritesData(response.data.favorites);
            }
        } catch (error) {
            console.error('Failed to load favorites:', error);
            if (error.response?.status !== 401) {
                toast.error('Failed to load favorites');
            }
        } finally {
            setLoading(false);
        }
    };

    // Generate unique image ID from URL
    const generateImageId = (imageUrl) => {
        if (!imageUrl) return null;
        // Extract filename or create hash from URL
        const urlParts = imageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        // Remove query parameters
        const cleanFilename = filename.split('?')[0];
        return cleanFilename || btoa(imageUrl).slice(0, 20);
    };

    // Check if image is favorited
    const isFavorite = (imageUrl) => {
        const imageId = generateImageId(imageUrl);
        return imageId ? favorites.has(imageId) : false;
    };

    // Toggle favorite status
    const toggleFavorite = async (imageUrl, metadata = {}) => {
        if (!currentUser) {
            toast.error('Please login to save favorites');
            return false;
        }

        if (!imageUrl) {
            toast.error('Invalid image URL');
            return false;
        }

        const imageId = generateImageId(imageUrl);
        if (!imageId) {
            toast.error('Unable to process image');
            return false;
        }

        const isFav = favorites.has(imageId);

        try {
            if (isFav) {
                // Remove from favorites
                await axios.delete(`${API_BASE_URL}/api/image-favorites/remove/${imageId}`, {
                    withCredentials: true
                });

                // Update local state
                setFavorites(prev => {
                    const newFavorites = new Set(prev);
                    newFavorites.delete(imageId);
                    return newFavorites;
                });

                setFavoritesData(prev => prev.filter(fav => fav.imageId !== imageId));
                toast.success('Removed from favorites');
                return false;
            } else {
                // Add to favorites
                const favoriteData = {
                    imageUrl,
                    imageId,
                    listingId: metadata.listingId || null,
                    metadata: {
                        imageName: metadata.imageName || `image-${Date.now()}`,
                        imageType: metadata.imageType || 'image',
                        imageSize: metadata.imageSize || 0,
                        addedFrom: metadata.addedFrom || 'preview'
                    }
                };

                const response = await axios.post(`${API_BASE_URL}/api/image-favorites/add`, favoriteData, {
                    withCredentials: true
                });

                if (response.data.success) {
                    // Update local state
                    setFavorites(prev => new Set([...prev, imageId]));
                    setFavoritesData(prev => [...prev, response.data.favorite]);
                    toast.success('Added to favorites');
                    return true;
                }
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update favorites';
            
            if (error.response?.status === 400 && errorMessage.includes('already')) {
                // Handle duplicate case
                if (!isFav) {
                    setFavorites(prev => new Set([...prev, imageId]));
                }
                toast.success('Added to favorites');
                return true;
            } else {
                toast.error(errorMessage);
                return isFav; // Return original state on error
            }
        }
    };

    // Get favorites count
    const getFavoritesCount = () => favorites.size;

    // Get all favorites data
    const getAllFavorites = () => favoritesData;

    // Check multiple images at once
    const checkMultipleFavorites = (imageUrls) => {
        const results = {};
        imageUrls.forEach(url => {
            const imageId = generateImageId(url);
            if (imageId) {
                results[url] = favorites.has(imageId);
            }
        });
        return results;
    };

    // Bulk add to favorites
    const bulkAddToFavorites = async (images) => {
        if (!currentUser) {
            toast.error('Please login to save favorites');
            return;
        }

        try {
            const imageData = images.map(img => ({
                imageUrl: img.url,
                imageId: generateImageId(img.url),
                listingId: img.listingId || null,
                metadata: {
                    imageName: img.name || `image-${Date.now()}`,
                    imageType: img.type || 'image',
                    imageSize: img.size || 0,
                    addedFrom: img.addedFrom || 'bulk'
                }
            })).filter(img => img.imageId);

            const response = await axios.post(`${API_BASE_URL}/api/image-favorites/bulk/add`, {
                images: imageData
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Refresh favorites
                await loadFavorites();
                toast.success(`${response.data.addedCount} images added to favorites`);
            }
        } catch (error) {
            console.error('Failed to bulk add favorites:', error);
            toast.error('Failed to add images to favorites');
        }
    };

    // Bulk remove from favorites
    const bulkRemoveFromFavorites = async (imageUrls) => {
        if (!currentUser) return;

        try {
            const imageIds = imageUrls.map(url => generateImageId(url)).filter(Boolean);
            
            const response = await axios.post(`${API_BASE_URL}/api/image-favorites/bulk/remove`, {
                imageIds
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                // Update local state
                const removedIds = new Set(imageIds);
                setFavorites(prev => {
                    const newFavorites = new Set();
                    prev.forEach(id => {
                        if (!removedIds.has(id)) {
                            newFavorites.add(id);
                        }
                    });
                    return newFavorites;
                });

                setFavoritesData(prev => prev.filter(fav => !removedIds.has(fav.imageId)));
                toast.success(`${response.data.removedCount} images removed from favorites`);
            }
        } catch (error) {
            console.error('Failed to bulk remove favorites:', error);
            toast.error('Failed to remove images from favorites');
        }
    };

    const value = {
        favorites,
        favoritesData,
        loading,
        isFavorite,
        toggleFavorite,
        loadFavorites,
        getFavoritesCount,
        getAllFavorites,
        checkMultipleFavorites,
        bulkAddToFavorites,
        bulkRemoveFromFavorites,
        generateImageId
    };

    return (
        <ImageFavoritesContext.Provider value={value}>
            {children}
        </ImageFavoritesContext.Provider>
    );
};