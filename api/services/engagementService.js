import Listing from '../models/listing.model.js';
import RentLockContract from '../models/rentLockContract.model.js';
import SavedSearch from '../models/savedSearch.model.js';
import User from '../models/user.model.js';
import {
    sendSearchAlertEmail,
    sendLeaseRenewalReminderEmail,
    sendIncompleteListingOnboardingEmail
} from '../utils/emailService.js';

// 1. Search Alerts Logic
export const checkAndSendSearchAlerts = async () => {
    console.log('🔍 Checking for new properties matching saved searches...');
    try {
        const activeSearches = await SavedSearch.find({ isActive: true });
        let emailsSent = 0;

        for (const search of activeSearches) {
            // Find properties created since last alert (or last 24h)
            const lastCheck = search.lastAlertSentAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

            const query = {
                createdAt: { $gt: lastCheck },
                visibility: 'public',
                isVerified: true,
                availabilityStatus: 'available'
            };

            // Apply filters
            if (search.criteria.location) {
                query.$or = [
                    { city: { $regex: search.criteria.location, $options: 'i' } },
                    { locality: { $regex: search.criteria.location, $options: 'i' } }, // Assuming locality exists or matching address
                    { address: { $regex: search.criteria.location, $options: 'i' } }
                ];
            }
            if (search.criteria.type) query.type = search.criteria.type;
            if (search.criteria.minPrice || search.criteria.maxPrice) {
                query.regularPrice = {};
                if (search.criteria.minPrice) query.regularPrice.$gte = search.criteria.minPrice;
                if (search.criteria.maxPrice) query.regularPrice.$lte = search.criteria.maxPrice;
            }
            if (search.criteria.bedrooms) query.bedrooms = { $gte: search.criteria.bedrooms };

            const newProperties = await Listing.find(query).limit(5);

            if (newProperties.length > 0) {
                const user = await User.findById(search.userId);
                if (user && user.email) {
                    // Format properties for email
                    const propData = newProperties.map(p => ({
                        title: p.name,
                        location: `${p.city}, ${p.state}`,
                        price: p.offer ? p.discountPrice : p.regularPrice,
                        image: p.imageUrls[0]
                    }));

                    await sendSearchAlertEmail(user.email, user.username, search.criteria, propData);

                    // Update last alert time
                    search.lastAlertSentAt = new Date();
                    await search.save();
                    emailsSent++;
                }
            }
        }
        return { success: true, emailsSent };
    } catch (error) {
        console.error('Error sending search alerts:', error);
        return { success: false, error: error.message };
    }
};

// 2. Lease Renewal Reminders Logic
export const checkAndSendLeaseRenewalReminders = async () => {
    console.log('📜 Checking for expiring leases...');
    try {
        const today = new Date();
        // Check for exactly 60 days or 30 days away
        const targetDates = [60, 30].map(days => {
            const date = new Date(today);
            date.setDate(date.getDate() + days);
            return { days, date };
        });

        let emailsSent = 0;

        for (const { days, date } of targetDates) {
            // Find contracts expiring on this specific date (ignoring time)
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const expiringContracts = await RentLockContract.find({
                status: 'active',
                endDate: { $gte: startOfDay, $lte: endOfDay }
            }).populate('landlordId tenantId listingId');

            for (const contract of expiringContracts) {
                if (contract.landlordId && contract.landlordId.email) {
                    await sendLeaseRenewalReminderEmail(
                        contract.landlordId.email,
                        contract.landlordId.username,
                        {
                            id: contract.contractId,
                            propertyName: contract.listingId.name,
                            tenantName: contract.tenantId.username,
                            expiryDate: contract.endDate
                        },
                        days
                    );
                    emailsSent++;
                }
            }
        }
        return { success: true, emailsSent };
    } catch (error) {
        console.error('Error sending lease reminders:', error);
        return { success: false, error: error.message };
    }
};

// 3. Incomplete Listing Nudges Logic
export const checkAndSendIncompleteListingNudges = async () => {
    console.log('📝 Checking for incomplete listings...');
    try {
        // Find listings created > 24 hours ago but < 48 hours ago, and still private
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const draftListings = await Listing.find({
            visibility: 'private',
            isVerified: false,
            createdAt: { $gte: fortyEightHoursAgo, $lte: twentyFourHoursAgo }
        }).populate('userRef');

        let emailsSent = 0;

        for (const listing of draftListings) {
            if (listing.userRef && listing.userRef.email) {
                // Calculate abstract "completion percentage" based on missing fields
                let score = 0;
                if (listing.name) score += 10;
                if (listing.imageUrls.length > 0) score += 30;
                if (listing.regularPrice) score += 20;
                if (listing.address) score += 20;
                if (listing.description) score += 10;
                if (score < 100) score += 10; // Bonus for starting

                await sendIncompleteListingOnboardingEmail(
                    listing.userRef.email,
                    listing.userRef.username,
                    {
                        id: listing._id,
                        title: listing.name,
                        completionPercentage: Math.min(90, score) // Cap at 90 to show "almost there"
                    }
                );
                emailsSent++;
            }
        }
        return { success: true, emailsSent };
    } catch (error) {
        console.error('Error sending incomplete listing nudges:', error);
        return { success: false, error: error.message };
    }
};
