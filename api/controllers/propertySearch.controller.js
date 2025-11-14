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
 * Resolve a public listing URL to property data
 */
export const resolvePropertyFromUrl = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ success: false, message: 'url is required' });

        // Expect formats like:
        // https://urbansetu.vercel.app/user/listing/<id>
        // or your deployment host variants
        const match = url.match(/\/listing\/(\w{24})/);
        const id = match?.[1];
        if (!id) return res.status(400).json({ success: false, message: 'Could not parse listing id from url' });

        const prop = await Listing.findById(id)
            .select('name city district state regularPrice discountPrice type bedrooms bathrooms area description imageUrls')
            .lean();

        if (!prop) return res.status(404).json({ success: false, message: 'Property not found' });

        const property = {
            id: prop._id,
            name: prop.name,
            location: `${prop.city}, ${prop.state}`,
            price: prop.discountPrice || prop.regularPrice,
            originalPrice: prop.regularPrice,
            type: prop.type,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            area: prop.area,
            description: prop.description,
            image: prop.imageUrls?.[0] || null
        };

        res.status(200).json({ success: true, data: property });
    } catch (error) {
        console.error('Error resolving property from url:', error);
        res.status(500).json({ success: false, message: 'Error resolving property from url', error: error.message });
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
