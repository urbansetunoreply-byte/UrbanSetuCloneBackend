import Listing from "../models/listing.model.js";
import { errorHandler } from "../utils/error.js";

// @desc    Get overall market overview (Top stats)
// @route   GET /api/market/overview
// @access  Public
export const getMarketOverview = async (req, res, next) => {
    try {
        // 1. Total Active Listings
        const totalListings = await Listing.countDocuments({ availabilityStatus: 'available' });

        // 2. Average Price (of all active listings)
        const avgPriceResult = await Listing.aggregate([
            { $match: { availabilityStatus: 'available' } },
            { $group: { _id: null, avgPrice: { $avg: "$regularPrice" } } }
        ]);
        const avgPrice = avgPriceResult.length > 0 ? Math.round(avgPriceResult[0].avgPrice) : 0;

        // 3. New Projects (Listings created in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newProjects = await Listing.countDocuments({
            createdAt: { $gte: thirtyDaysAgo },
            availabilityStatus: 'available'
        });

        // 4. Most Demanded Areas (Top 5 by View Count average)
        const topAreas = await Listing.aggregate([
            { $match: { availabilityStatus: 'available' } },
            {
                $group: {
                    _id: "$district", // Group by Area/District
                    avgViews: { $avg: "$viewCount" },
                    avgPrice: { $avg: "$regularPrice" },
                    count: { $sum: 1 },
                    city: { $first: "$city" }
                }
            },
            { $sort: { avgViews: -1 } },
            { $limit: 5 }
        ]);

        // 5. Price Trend (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const priceTrends = await Listing.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    avgPrice: { $avg: "$regularPrice" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const formattedTrends = priceTrends.map(item => {
            const date = new Date(item._id.year, item._id.month - 1); // Month is 1-indexed in Mongo
            return {
                name: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
                price: Math.round(item.avgPrice),
                listings: item.count
            };
        });

        res.status(200).json({
            success: true,
            data: {
                totalListings,
                avgPrice,
                newProjects,
                topAreas: topAreas.map(area => ({
                    area: area._id || 'Unknown',
                    city: area.city,
                    avgViews: Math.round(area.avgViews),
                    avgPrice: Math.round(area.avgPrice),
                    listingCount: area.count,
                    trend: area.avgViews > 100 ? 'High Demand' : 'Stable' // Simple logic
                })),
                priceTrends: formattedTrends
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get trends for specific city
// @route   GET /api/market/city/:city
// @access  Public
export const getCityTrends = async (req, res, next) => {
    const { city } = req.params;
    try {
        // Normalize city name for case-insensitive match
        const cityRegex = new RegExp(city, 'i');

        // 1. Stats for this city
        const cityStats = await Listing.aggregate([
            { $match: { city: { $regex: cityRegex }, availabilityStatus: 'available' } },
            {
                $group: {
                    _id: null,
                    avgPrice: { $avg: "$regularPrice" },
                    total: { $sum: 1 },
                    avgViews: { $avg: "$viewCount" }
                }
            }
        ]);

        if (cityStats.length === 0) {
            return res.status(200).json({ success: true, data: null, message: "No data found for this city" });
        }

        // 2. Area breakdown
        const areaBreakdown = await Listing.aggregate([
            { $match: { city: { $regex: cityRegex }, availabilityStatus: 'available' } },
            {
                $group: {
                    _id: "$district",
                    avgPrice: { $avg: "$regularPrice" },
                    minPrice: { $min: "$regularPrice" },
                    maxPrice: { $max: "$regularPrice" },
                    count: { $sum: 1 },
                    totalViews: { $sum: "$viewCount" }
                }
            },
            { $sort: { avgPrice: -1 } } // Highest price areas first
        ]);

        // 3. Asset Type Distribution
        const typeDistribution = await Listing.aggregate([
            { $match: { city: { $regex: cityRegex }, availabilityStatus: 'available' } },
            { $group: { _id: "$type", count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    city: city,
                    avgPrice: Math.round(cityStats[0].avgPrice),
                    totalListings: cityStats[0].total,
                    demandScore: Math.round(cityStats[0].avgViews)
                },
                areas: areaBreakdown.map(a => ({
                    name: a._id || 'Others',
                    avgPrice: Math.round(a.avgPrice),
                    priceRange: `${(a.minPrice / 100000).toFixed(1)}L - ${(a.maxPrice / 100000).toFixed(1)}L`,
                    listings: a.count,
                    popularity: a.totalViews
                })),
                propertyTypes: typeDistribution.map(t => ({
                    name: t._id,
                    value: t.count
                }))
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get lists of cities available (for dropdowns)
// @route   GET /api/market/cities
// @access  Public
export const getAvailableCities = async (req, res, next) => {
    try {
        const cities = await Listing.distinct('city', { availabilityStatus: 'available' });
        res.status(200).json({ success: true, data: cities.filter(c => c) });
    } catch (error) {
        next(error);
    }
};
