import VisitorLog from '../models/visitorLog.model.js';
import crypto from 'crypto';
import { getDeviceInfo, getBrowserInfo, getOSInfo, getDeviceType, getLocationFromIP } from '../utils/sessionManager.js';

// Generate fingerprint for visitor (IP + User-Agent + Source hash)
const generateFingerprint = (ip, userAgent, source = 'Unknown') => {
  const combined = `${ip}|${userAgent}|${source}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

// Get start of day (00:00:00)
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Track visitor when they accept cookies
export const trackVisitor = async (req, res, next) => {
  try {
    const { cookiePreferences, referrer, page, source } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';

    // Generate fingerprint
    const fingerprint = generateFingerprint(ip, userAgent, source);

    // Get device and location info
    const device = getDeviceInfo(userAgent);
    const browserInfo = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const deviceType = getDeviceType(userAgent);
    const location = getLocationFromIP(ip);

    // Get today's date (start of day for grouping)
    const visitDate = getStartOfDay();

    // Try to create visitor log (will fail if already exists for today)
    try {
      const visitorLog = await VisitorLog.create({
        fingerprint,
        ip,
        device,
        browser: browserInfo.name,
        browserVersion: browserInfo.version,
        os,
        deviceType,
        location,
        userAgent,
        cookiePreferences: cookiePreferences || {
          necessary: true,
          analytics: false,
          marketing: false,
          functional: false
        },
        visitDate,
        referrer: referrer || 'Direct',
        page: page || '/',
        source: source || 'Unknown'
      });

      res.status(201).json({
        success: true,
        message: 'Visitor tracked successfully',
        visitor: {
          id: visitorLog._id,
          device: visitorLog.device,
          location: visitorLog.location
        }
      });
    } catch (error) {
      // If duplicate (visitor already tracked today), update preferences and device info
      if (error.code === 11000) {
        await VisitorLog.findOneAndUpdate(
          { fingerprint, visitDate },
          {
            device,
            browser: browserInfo.name,
            browserVersion: browserInfo.version,
            os,
            deviceType,
            cookiePreferences: cookiePreferences || {
              necessary: true,
              analytics: false,
              marketing: false,
              functional: false
            },
            timestamp: new Date()
          }
        );

        res.status(200).json({
          success: true,
          message: 'Visitor preferences updated'
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error tracking visitor:', error);
    next(error);
  }
};

// Get daily visitor count for public access
export const getDailyVisitorCount = async (req, res, next) => {
  try {
    const today = getStartOfDay();
    const count = await VisitorLog.countDocuments({
      visitDate: today
    });

    res.status(200).json({
      success: true,
      count,
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error getting daily visitor count:', error);
    next(error);
  }
};

// Get visitor statistics for admin (all time + daily)
export const getVisitorStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    // Get total unique visitors
    const totalVisitors = await VisitorLog.countDocuments();

    // Get today's count
    const today = getStartOfDay();
    const todayCount = await VisitorLog.countDocuments({
      visitDate: today
    });

    // Get daily statistics for the last N days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    daysAgo.setHours(0, 0, 0, 0);

    const dailyStats = await VisitorLog.aggregate([
      {
        $match: {
          visitDate: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: '$visitDate',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      }
    ]);

    // Get device breakdown
    const deviceStats = await VisitorLog.aggregate([
      {
        $match: {
          visitDate: today
        }
      },
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          device: '$_id',
          count: 1
        }
      }
    ]);

    // Get location breakdown
    const locationStats = await VisitorLog.aggregate([
      {
        $match: {
          visitDate: today
        }
      },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          location: '$_id',
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalVisitors,
        todayCount,
        dailyStats,
        deviceStats,
        locationStats
      }
    });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    next(error);
  }
};

// Get all visitors with pagination (admin only)
export const getAllVisitors = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      dateRange = 'today',
      device = 'all',
      location = 'all',
      search = '',
      // New optional consent filters: 'any' | 'true' | 'false'
      analytics = 'any',
      marketing = 'any',
      functional = 'any'
    } = req.query;

    // Build filter
    let filter = {};

    // Date range filter
    const today = getStartOfDay();
    switch (dateRange) {
      case 'today':
        filter.visitDate = today;
        break;
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        filter.visitDate = yesterday;
        break;
      }
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filter.visitDate = { $gte: sevenDaysAgo };
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filter.visitDate = { $gte: thirtyDaysAgo };
        break;
      case 'all':
      default:
        // No date filter
        break;
    }

    // Device filter
    if (device !== 'all') {
      filter.device = { $regex: device, $options: 'i' };
    }

    // Location filter
    if (location !== 'all') {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Search filter (IP or fingerprint)
    if (search) {
      filter.$or = [
        { ip: { $regex: search, $options: 'i' } },
        { fingerprint: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } }
      ];
    }

    // Consent filters
    const consent = {};
    if (analytics !== 'any') consent['cookiePreferences.analytics'] = analytics === 'true';
    if (marketing !== 'any') consent['cookiePreferences.marketing'] = marketing === 'true';
    if (functional !== 'any') consent['cookiePreferences.functional'] = functional === 'true';
    Object.assign(filter, consent);

    // Get total count
    const total = await VisitorLog.countDocuments(filter);

    // Get visitors with pagination
    const skip = (page - 1) * limit;
    const visitors = await VisitorLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-fingerprint'); // Exclude only fingerprint, keep userAgent for admin debugging

    res.status(200).json({
      success: true,
      visitors,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting visitors:', error);
    next(error);
  }
};

// Clear old visitor logs (admin only) - keep last 90 days
export const clearOldVisitorLogs = async (req, res, next) => {
  try {
    const { days = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    cutoffDate.setHours(0, 0, 0, 0);

    const result = await VisitorLog.deleteMany({
      visitDate: { $lt: cutoffDate }
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} old visitor logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing old visitor logs:', error);
    next(error);
  }
};
