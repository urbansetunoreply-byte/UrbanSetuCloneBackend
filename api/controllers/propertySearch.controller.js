import Listing from '../models/listing.model.js';
import { searchCachedProperties, needsReindexing, indexAllProperties } from '../services/dataSyncService.js';

/**
 * Search properties for @ suggestions
 */
export const searchPropertiesForSuggestions = async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;
        
        // Check if data needs re-indexing
        if (needsReindexing()) {
            console.log('🔄 Property search: Data needs re-indexing, updating cache...');
            try {
                await indexAllProperties();
                console.log('✅ Property cache updated');
            } catch (error) {
                console.error('❌ Error updating property cache:', error);
            }
        }
        
        // Search cached properties (much faster)
        const suggestions = searchCachedProperties(query || '', parseInt(limit));

        res.status(200).json({
            success: true,
            data: suggestions,
            count: suggestions.length
        });

    } catch (error) {
        console.error('Error searching properties for suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching properties',
            error: error.message
        });
    }
};

/**
 * Get property details by ID for reference
 */
export const getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const property = await Listing.findById(id)
            .select('name city district state regularPrice discountPrice type bedrooms bathrooms area description imageUrls')
            .lean();

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Format property for reference
        const propertyRef = {
            id: property._id,
            name: property.name,
            location: `${property.city}, ${property.state}`,
            price: property.discountPrice || property.regularPrice,
            originalPrice: property.regularPrice,
            type: property.type,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            description: property.description,
            image: property.imageUrls?.[0] || null,
            referenceText: `[Property: ${property.name} - ${property.city} | ₹${(property.discountPrice || property.regularPrice).toLocaleString()} | ${property.bedrooms}BHK | ${property.area} sq ft]`
        };

        res.status(200).json({
            success: true,
            data: propertyRef
        });

    } catch (error) {
        console.error('Error getting property by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting property details',
            error: error.message
        });
    }
};
