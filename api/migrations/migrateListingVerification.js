/**
 * Database Migration Script
 * Purpose: Grandfather existing listings as verified and public
 * 
 * IMPORTANT: Run this ONCE before deploying the verification system
 * 
 * This script updates all existing listings that don't have the new
 * verification fields to be verified and public by default.
 */

import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import dotenv from 'dotenv';

dotenv.config();

const migrateExistingListings = async () => {
    try {
        console.log('🔄 Starting database migration for property verification...');

        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database');

        // Find all listings that need migration
        const listingsToMigrate = await Listing.find({
            $or: [
                { isVerified: { $exists: false } },
                { visibility: { $exists: false } },
                { isVerified: null },
                { visibility: null }
            ]
        });

        console.log(`📊 Found ${listingsToMigrate.length} listings to migrate`);

        if (listingsToMigrate.length === 0) {
            console.log('✅ No listings need migration. All listings are up to date.');
            await mongoose.disconnect();
            return;
        }

        // Update all existing listings to be verified and public
        const result = await Listing.updateMany(
            {
                $or: [
                    { isVerified: { $exists: false } },
                    { visibility: { $exists: false } },
                    { isVerified: null },
                    { visibility: null }
                ]
            },
            {
                $set: {
                    isVerified: true,
                    visibility: 'public'
                }
            }
        );

        console.log(`✅ Migration completed successfully!`);
        console.log(`   - Matched: ${result.matchedCount} listings`);
        console.log(`   - Modified: ${result.modifiedCount} listings`);
        console.log(`   - Acknowledged: ${result.acknowledged}`);

        // Verify migration
        const verifiedCount = await Listing.countDocuments({ isVerified: true });
        const publicCount = await Listing.countDocuments({ visibility: 'public' });
        const totalCount = await Listing.countDocuments();

        console.log('\n📈 Post-Migration Statistics:');
        console.log(`   - Total Listings: ${totalCount}`);
        console.log(`   - Verified Listings: ${verifiedCount}`);
        console.log(`   - Public Listings: ${publicCount}`);
        console.log(`   - Unverified Listings: ${totalCount - verifiedCount}`);
        console.log(`   - Private Listings: ${totalCount - publicCount}`);

        // Disconnect from database
        await mongoose.disconnect();
        console.log('\n✅ Database disconnected');
        console.log('🎉 Migration completed successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

// Run migration
migrateExistingListings();
