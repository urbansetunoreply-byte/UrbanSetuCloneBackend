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
    const { cookiePreferences, referrer, page, source, utm, type } = req.body;
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
        source: source || 'Unknown',
        // Advanced Tracking
        pageViews: [{ path: page || '/', title: '', timestamp: new Date() }],
        sessionStart: new Date(),
        lastActive: new Date(),
        utm: utm || {}
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
        // Find the existing visitor first to check for duplicate page views
        const existingVisitor = await VisitorLog.findOne({ fingerprint, visitDate });

        if (existingVisitor) {
          // Always update lastActive and device info
          existingVisitor.device = device;
          existingVisitor.browser = browserInfo.name;
          existingVisitor.browserVersion = browserInfo.version;
          existingVisitor.os = os;
          existingVisitor.deviceType = deviceType;
          existingVisitor.lastActive = new Date();
          existingVisitor.timestamp = new Date(); // Update last seen

          if (cookiePreferences) {
            existingVisitor.cookiePreferences = cookiePreferences;
          }

          // Handle Page View Logic
          if (type !== 'heartbeat' && page) {
            const lastPage = existingVisitor.pageViews[existingVisitor.pageViews.length - 1];
            // Only add if path is different from last path
            // This prevents "refresh" duplicates or rapid-fire events
            if (!lastPage || lastPage.path !== page) {
              existingVisitor.pageViews.push({ path: page, title: '', timestamp: new Date() });
              existingVisitor.page = page;
            }
          }

          await existingVisitor.save();

          res.status(200).json({
            success: true,
            message: 'Visitor updated'
          });
        } else {
          // Fallback if not found (weird race condition)
          res.status(200).json({ success: true });
        }
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

// Get visitor statistics for admin (filtered)
export const getVisitorStats = async (req, res, next) => {
  try {
    const {
      days = 30,
      dateRange = 'today',
      device = 'all',
      location = 'all',
      search = '',
      analytics = 'any',
      marketing = 'any',
      functional = 'any'
    } = req.query;

    // 1. Build Base Filter (Non-Date)
    const baseFilter = {};
    if (device !== 'all') baseFilter.device = { $regex: device, $options: 'i' };
    if (location !== 'all') baseFilter.location = { $regex: location, $options: 'i' };
    if (search) {
      baseFilter.$or = [
        { ip: { $regex: search, $options: 'i' } },
        { fingerprint: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } }
      ];
    }
    const consent = {};
    if (analytics !== 'any') consent['cookiePreferences.analytics'] = analytics === 'true';
    if (marketing !== 'any') consent['cookiePreferences.marketing'] = marketing === 'true';
    if (functional !== 'any') consent['cookiePreferences.functional'] = functional === 'true';
    Object.assign(baseFilter, consent);

    // 2. Build Date Filter for Aggregates (Devices, Locations, Summary Counts)
    const dateFilter = {};
    const today = getStartOfDay();
    switch (dateRange) {
      case 'today':
        dateFilter.visitDate = today;
        break;
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter.visitDate = yesterday;
        break;
      }
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        dateFilter.visitDate = { $gte: sevenDaysAgo };
        break;
      case '30days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter.visitDate = { $gte: thirtyDaysAgo };
        break;
      case 'all':
      default:
        // No date constraint
        break;
    }

    const fullFilter = { ...baseFilter, ...dateFilter };

    // 3. Execute Queries

    // Total filtered visitors (for the "Visitors" card, usually total in range)
    // Note: The UI shows "Visitors" (Total) and "Today" (Today).
    // If filters are active, "Visitors" should probably match the filter count.
    const totalVisitors = await VisitorLog.countDocuments(fullFilter);

    // Today's count (Filtered)
    // If dateRange is NOT today, this might be 0 or irrelevant, but UI expects it.
    // We'll calculate "Count in Range" as "totalVisitors".
    // But let's keep "todayCount" specifically for Today matching the base filters?
    // Actually, if I filter "Yesterday", "todayCount" should be 0? Or should "todayCount" always be TODAY's count matching base filters?
    // Let's make "todayCount" represent the count matching BASE filters + Today.
    const todayCount = await VisitorLog.countDocuments({ ...baseFilter, visitDate: today });


    // Daily Stats (Graph) - Match Base Filter + Last N Days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    daysAgo.setHours(0, 0, 0, 0);

    const dailyStats = await VisitorLog.aggregate([
      {
        $match: {
          ...baseFilter, // Apply device/location/search filters
          visitDate: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: '$visitDate',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1
        }
      }
    ]);

    // Device Breakdown - Apply FULL filter (including Date Range)
    const deviceStats = await VisitorLog.aggregate([
      { $match: fullFilter },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $project: { _id: 0, device: '$_id', count: 1 } },
      { $sort: { count: -1 } } // Sort by count desc
    ]);

    // Location Breakdown - Apply FULL filter
    const locationStats = await VisitorLog.aggregate([
      { $match: fullFilter },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, location: '$_id', count: 1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalVisitors, // Filtered Total
        todayCount,    // Today's count (matching base filters)
        dailyStats,    // Graph Data (Base Filter + 30 Days)
        deviceStats,   // Filtered Breakdown
        locationStats  // Filtered Breakdown
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
        // No preset date filter
        break;
    }

    // Custom Date Range Support (overrides preset if provided)
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.visitDate = { $gte: start, $lte: end };
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
