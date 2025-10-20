import Listing from '../models/listing.model.js';

/**
 * Search properties for @ suggestions
 */
export const searchPropertiesForSuggestions = async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Query must be at least 2 characters long'
            });
        }

        // Search properties by name, city, type, or description
        const searchQuery = {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { city: { $regex: query, $options: 'i' } },
                { district: { $regex: query, $options: 'i' } },
                { type: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        };

        const properties = await Listing.find(searchQuery)
            .select('name city district state regularPrice discountPrice type bedrooms bathrooms area imageUrls')
            .limit(parseInt(limit))
            .lean();

        // Format properties for suggestions
        const suggestions = properties.map(prop => ({
            id: prop._id,
            name: prop.name,
            location: `${prop.city}, ${prop.state}`,
            price: prop.discountPrice || prop.regularPrice,
            originalPrice: prop.regularPrice,
            type: prop.type,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            area: prop.area,
            image: prop.imageUrls?.[0] || null,
            displayText: `${prop.name} - ${prop.city} (₹${(prop.discountPrice || prop.regularPrice).toLocaleString()})`
        }));

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
