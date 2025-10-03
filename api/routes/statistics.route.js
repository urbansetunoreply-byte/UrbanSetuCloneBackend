import express from 'express';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import Booking from '../models/booking.model.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get general statistics
router.get('/', auth, async (req, res) => {
  try {
    const [
      totalListings,
      totalUsers,
      totalBookings,
      recentListings,
      recentBookings,
      monthlyRevenue
    ] = await Promise.all([
      Listing.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments(),
      Listing.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userRef', 'username email'),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('buyerId', 'username email')
        .populate('listingId', 'name address'),
      Booking.aggregate([
        {
          $match: {
            paymentStatus: 'completed',
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$paymentAmount' }
          }
        }
      ])
    ]);

    const totalRevenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;

    res.json({
      success: true,
      data: {
        totalListings,
        totalUsers,
        totalBookings,
        totalRevenue,
        recentListings,
        recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get user-specific statistics
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [
      userListings,
      userBookings,
      userWishlistCount,
      userReviews
    ] = await Promise.all([
      Listing.countDocuments({ userRef: userId }),
      Booking.countDocuments({ buyerId: userId }),
      // Assuming you have a wishlist model
      // Wishlist.countDocuments({ userId }),
      0, // Placeholder for wishlist count
      // Assuming you have a review model
      // Review.countDocuments({ userId }),
      0 // Placeholder for review count
    ]);

    res.json({
      success: true,
      data: {
        userListings,
        userBookings,
        userWishlistCount,
        userReviews
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

// Get listing statistics
router.get('/listings', auth, async (req, res) => {
  try {
    const [
      totalListings,
      rentListings,
      saleListings,
      furnishedListings,
      parkingListings,
      offerListings
    ] = await Promise.all([
      Listing.countDocuments(),
      Listing.countDocuments({ type: 'rent' }),
      Listing.countDocuments({ type: 'sale' }),
      Listing.countDocuments({ furnished: true }),
      Listing.countDocuments({ parking: true }),
      Listing.countDocuments({ offer: true })
    ]);

    res.json({
      success: true,
      data: {
        totalListings,
        rentListings,
        saleListings,
        furnishedListings,
        parkingListings,
        offerListings
      }
    });
  } catch (error) {
    console.error('Error fetching listing statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing statistics'
    });
  }
});

// Get booking statistics
router.get('/bookings', auth, async (req, res) => {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ status: 'completed' })
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings
      }
    });
  } catch (error) {
    console.error('Error fetching booking statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics'
    });
  }
});

export default router;
