import mongoose from 'mongoose';
import Listing from './models/listing.model.js';
import User from './models/user.model.js';

const migrateUserRefToObjectId = async () => {
  try {
    console.log('🔄 Starting userRef migration from String to ObjectId...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/urbansetu';
    console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find all listings with string userRef
    const listings = await Listing.find({ 
      userRef: { $type: 'string' } 
    });
    
    console.log(`📊 Found ${listings.length} listings with string userRef`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const listing of listings) {
      try {
        // Find the user by the string ID
        const user = await User.findById(listing.userRef);
        
        if (user) {
          // Update the listing with the ObjectId
          await Listing.findByIdAndUpdate(
            listing._id,
            { userRef: user._id }
          );
          
          console.log(`✅ Migrated listing ${listing._id} (${listing.name}) -> User ${user.email}`);
          migratedCount++;
        } else {
          console.log(`❌ User not found for listing ${listing._id} (${listing.name}) with userRef: ${listing.userRef}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error migrating listing ${listing._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} listings`);
    console.log(`❌ Errors: ${errorCount} listings`);
    console.log(`📊 Total processed: ${listings.length} listings`);
    
    // Verify the migration
    const remainingStringRefs = await Listing.countDocuments({ 
      userRef: { $type: 'string' } 
    });
    
    console.log(`\n🔍 Verification:`);
    console.log(`📊 Remaining string userRefs: ${remainingStringRefs}`);
    
    if (remainingStringRefs === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️ Some listings still have string userRefs');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the migration
migrateUserRefToObjectId();
