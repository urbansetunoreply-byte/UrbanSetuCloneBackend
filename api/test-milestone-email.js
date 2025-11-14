import mongoose from 'mongoose';
import Listing from './models/listing.model.js';
import User from './models/user.model.js';

const testMilestoneEmail = async () => {
  try {
    console.log('🧪 Testing milestone email system...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/urbansetu';
    console.log(`🔌 Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find a listing to test with
    const listing = await Listing.findById('68ed54d4d2beaa96d81c0b56');
    
    if (!listing) {
      console.log('❌ Listing not found');
      return;
    }
    
    console.log(`📊 Listing found: ${listing.name}`);
    console.log(`👤 UserRef type: ${typeof listing.userRef}`);
    console.log(`👤 UserRef value: ${listing.userRef}`);
    
    // Try to populate userRef
    const populatedListing = await Listing.findById(listing._id).populate('userRef', 'email username');
    console.log(`👤 Populated UserRef:`, populatedListing.userRef);
    
    // Try to find user directly
    if (typeof listing.userRef === 'string') {
      const user = await User.findById(listing.userRef);
      console.log(`👤 Direct user lookup:`, user ? { email: user.email, username: user.username } : 'Not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the test
testMilestoneEmail();
