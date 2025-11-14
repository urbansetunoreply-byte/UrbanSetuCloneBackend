import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixUsernameIndex() {
  try {
    // Connect to MongoDB using the same connection string as the app
    // Use environment variable first, then fallback to hardcoded string
    const mongoUri = process.env.MONGO || 'mongodb+srv://Rajashekar:Rajashekar@mern-estate.kzrjh.mongodb.net/mern-estate?retryWrites=true&w=majority&appName=mern-estate&tls=true&tlsAllowInvalidCertificates=true';
    
    if (!mongoUri) {
      console.error('❌ MONGO connection string is not available');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all current indexes before fixing
    console.log('\n📋 Current indexes on users collection:');
    const indexesBefore = await collection.indexes();
    indexesBefore.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check if username_1 index exists
    const usernameIndexExists = indexesBefore.some(idx => idx.name === 'username_1');
    
    if (usernameIndexExists) {
      console.log('\n🔧 Attempting to drop username_1 unique index...');
      try {
        const result = await collection.dropIndex('username_1');
        console.log('✅ Successfully dropped username_1 index');
        console.log('   Result:', result);
      } catch (error) {
        // Index might not exist or might have a different name
        if (error.code === 27) {
          console.log('ℹ️  Index username_1 does not exist (might have been already dropped)');
        } else {
          console.error('❌ Error dropping index:', error.message);
          // Try alternative: drop index by key pattern
          try {
            await collection.dropIndex({ username: 1 });
            console.log('✅ Successfully dropped index using key pattern');
          } catch (altError) {
            console.error('❌ Alternative drop method also failed:', altError.message);
          }
        }
      }
    } else {
      console.log('ℹ️  username_1 index does not exist - no action needed');
    }

    // List indexes after fixing
    console.log('\n📋 Indexes after fix:');
    const indexesAfter = await collection.indexes();
    indexesAfter.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Verify no unique index on username
    const hasUniqueUsernameIndex = indexesAfter.some(idx => 
      idx.name === 'username_1' || 
      (idx.key && idx.key.username === 1 && idx.unique === true)
    );

    if (hasUniqueUsernameIndex) {
      console.error('❌ WARNING: Unique index on username still exists!');
      console.error('   Please manually remove it from MongoDB');
    } else {
      console.log('✅ Confirmed: No unique index on username field');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('✨ Fix completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the fix
fixUsernameIndex();
