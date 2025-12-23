import PropertyView from "../models/propertyView.model.js";
import Booking from "../models/booking.model.js";
import Review from "../models/review.model.js";
import Wishlist from "../models/wishlist.model.js";
import CoinTransaction from "../models/coinTransaction.model.js";
import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
import RentLockContract from "../models/rentLockContract.model.js";
import ImageFavorite from "../models/imageFavorite.model.js";
import Dispute from "../models/dispute.model.js";
import PropertyVerification from "../models/propertyVerification.model.js";
import cloudinary from 'cloudinary';

// Configure Cloudinary for base64 uploads
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Helper to determine personality
const getPersonality = (stats) => {
    if (stats.bookings > 0 || stats.rentals > 0) return { type: "The Action Taker", desc: "You don't just dream; you make moves. You secured your spot this year!" };
    if (stats.reviews > 5) return { type: "The Community Voice", desc: "Your opinions matter, and you've helped guide many others this year." };
    if (stats.views > 50 && stats.wishlist > 10) return { type: "The Dreamer", desc: "You have an eye for beauty and a wishlist full of possibilities." };
    if (stats.coins > 1000) return { type: "The Collector", desc: "You've engaged with everything UrbanSetu has to offer!" };
    return { type: "The Explorer", desc: "You're checking out the market and seeing what's out there." };
};

export const getUserYearInReview = async (req, res, next) => {
    try {
        const { year } = req.params;
        const userId = req.user.id;
        const currentYear = new Date().getFullYear();

        if (parseInt(year) > currentYear) {
            return res.status(400).json({ message: "The future hasn't been written yet! Check back at the end of the year." });
        }

        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

        // 1. Property Views & Active Days/Streaks
        const viewsAgg = await PropertyView.aggregate([
            {
                $match: {
                    viewerId: userId.toString(),
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const activeDays = viewsAgg.length;
        let streak = 0;
        let maxStreak = 0;
        if (activeDays > 0) {
            streak = 1;
            maxStreak = 1;
            for (let i = 1; i < viewsAgg.length; i++) {
                const prev = new Date(viewsAgg[i - 1]._id);
                const curr = new Date(viewsAgg[i]._id);
                const diffTime = Math.abs(curr - prev);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    streak++;
                    maxStreak = Math.max(maxStreak, streak);
                } else {
                    streak = 1;
                }
            }
        }

        const viewsCount = await PropertyView.countDocuments({
            viewerId: userId.toString(),
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // 2. Exploration & Top Type
        const explorationAgg = await PropertyView.aggregate([
            {
                $match: {
                    viewerId: userId.toString(),
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: "listings",
                    localField: "propertyId",
                    foreignField: "_id",
                    as: "listing"
                }
            },
            { $unwind: "$listing" },
            {
                $facet: {
                    topCities: [
                        { $group: { _id: "$listing.city", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 3 }
                    ],
                    topType: [
                        { $group: { _id: "$listing.type", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 1 }
                    ]
                }
            }
        ]);

        // 3. Activity by Month
        const monthlyActivity = await PropertyView.aggregate([
            {
                $match: {
                    viewerId: userId.toString(),
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const peakMonth = monthlyActivity.length > 0 ? monthNames[monthlyActivity[0]._id - 1] : null;

        // 4. Bookings & Rentals
        const bookingsCount = await Booking.countDocuments({
            buyerId: userId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $nin: ['cancelledByBuyer', 'cancelledBySeller', 'cancelledByAdmin'] }
        });

        const rentalsCount = await RentLockContract.countDocuments({
            tenantId: userId,
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'active'
        });

        const wishlistCount = await Wishlist.countDocuments({
            user: userId,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const favoriteCount = await ImageFavorite.countDocuments({
            user: userId,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const reviewsCount = await Review.countDocuments({
            user: userId,
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const coinsAgg = await CoinTransaction.aggregate([
            {
                $match: {
                    userId: userId.toString(),
                    type: 'credit',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const coinsEarned = coinsAgg.length > 0 ? coinsAgg[0].total : 0;

        const totalInteractions = viewsCount + bookingsCount + wishlistCount + reviewsCount + rentalsCount + (coinsEarned > 0 ? 1 : 0);

        const stats = {
            views: viewsCount,
            activeDays,
            maxStreak,
            bookings: bookingsCount,
            rentals: rentalsCount,
            wishlist: wishlistCount,
            favorites: favoriteCount,
            reviews: reviewsCount,
            coins: coinsEarned,
            peakMonth,
            topType: explorationAgg[0]?.topType[0]?._id || null,
            totalInteractions
        };

        const personality = getPersonality(stats);

        res.status(200).json({
            year,
            stats,
            topCities: explorationAgg[0]?.topCities.map(c => c._id).filter(Boolean),
            personality,
            isCurrentYear: parseInt(year) === currentYear
        });

    } catch (error) {
        next(error);
    }
};

export const getAdminYearInReview = async (req, res, next) => {
    try {
        const { year } = req.params;
        const currentYear = new Date().getFullYear();
        const adminId = req.user.id;

        if (parseInt(year) > currentYear) {
            return res.status(400).json({ message: "System logs for the future are currently unavailable." });
        }

        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

        // 1. Listings Verified & Documents Checked
        const listingsAgg = await Listing.aggregate([
            {
                $match: {
                    isVerified: true,
                    updatedAt: { $gte: startDate, $lte: endDate }
                }
            },
            { $count: "total" }
        ]);

        const verifications = await PropertyVerification.countDocuments({
            status: 'verified',
            badgeIssuedAt: { $gte: startDate, $lte: endDate }
        });

        // 2. Financials
        const bookingsAgg = await Booking.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$amount" }
                }
            }
        ]);

        const totalRevenue = bookingsAgg.length > 0 ? bookingsAgg[0].totalRevenue : 0;
        const totalBookings = bookingsAgg.length > 0 ? bookingsAgg[0].count : 0;

        // 3. User & Moderation
        const usersCount = await User.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const resolvedDisputes = await Dispute.countDocuments({
            status: 'resolved',
            updatedAt: { $gte: startDate, $lte: endDate }
        });

        const activeReports = await Dispute.countDocuments({
            status: 'pending',
            createdAt: { $gte: startDate, $lte: endDate }
        });

        // 4. Most Popular City
        const cityAgg = await Listing.aggregate([
            { $match: { isVerified: true, createdAt: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: "$city", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        const topCity = cityAgg.length > 0 ? cityAgg[0]._id : null;

        const hasActivity = verifications > 0 || totalBookings > 0 || usersCount > 0;

        res.status(200).json({
            year,
            stats: {
                listings: listingsAgg[0]?.total || 0,
                verifications,
                bookings: totalBookings,
                users: usersCount,
                revenue: totalRevenue,
                topCity,
                resolvedDisputes,
                activeReports
            },
            hasActivity,
            isCurrentYear: parseInt(year) === currentYear
        });
    } catch (error) {
        next(error);
    }
}

export const uploadYearInReviewImage = async (req, res, next) => {
    try {
        const { image, year } = req.body;
        const userId = req.user.id;

        if (!image) {
            return res.status(400).json({ message: "No image data provided" });
        }

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.v2.uploader.upload(image, {
            folder: `urbansetu/flashbacks/${year}`,
            public_id: `flashback_${userId}_${Date.now()}`,
            resource_type: 'image'
        });

        res.status(200).json({
            imageUrl: uploadResponse.secure_url,
            publicId: uploadResponse.public_id
        });
    } catch (error) {
        console.error("Flashback upload error:", error);
        res.status(500).json({ message: "Failed to upload flashback image", error: error.message });
    }
}
