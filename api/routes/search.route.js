import express from 'express';
import Listing from '../models/listing.model.js';

const router = express.Router();

// Get search suggestions based on property names, addresses, and cities
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const searchTerm = query.trim();

    // Search in multiple fields: name, address, city, state
    const suggestions = await Listing.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
        { city: { $regex: searchTerm, $options: 'i' } },
        { state: { $regex: searchTerm, $options: 'i' } },
        { district: { $regex: searchTerm, $options: 'i' } }
      ]
    })
      .select('name address city state type regularPrice discountPrice offer imageUrls bedrooms bathrooms')
      .limit(parseInt(limit))
      .lean();

    // Format suggestions for frontend
    const formattedSuggestions = suggestions.map(listing => ({
      _id: listing._id,
      id: listing._id,
      name: listing.name,
      address: listing.address,
      city: listing.city,
      state: listing.state,
      type: listing.type,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      regularPrice: listing.regularPrice,
      discountPrice: listing.discountPrice,
      offer: listing.offer,
      price: listing.offer ? listing.discountPrice : listing.regularPrice,
      image: listing.imageUrls && listing.imageUrls.length > 0 ? listing.imageUrls[0] : null,
      imageUrls: listing.imageUrls,
      displayText: `${listing.name} - ${listing.type} in ${listing.city}${listing.state ? `, ${listing.state}` : ''}`
    }));

    res.json({
      success: true,
      suggestions: formattedSuggestions
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search suggestions'
    });
  }
});

export default router;
