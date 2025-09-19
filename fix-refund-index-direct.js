// Direct MongoDB script to fix the refundId index
// Run this with: node fix-refund-index-direct.js

import mongoose from 'mongoose';

async function fixRefundIndex() {
  try {
    // Connect to MongoDB using the same connection string as your app
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-estate';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('refundrequests');

    // List existing indexes
    console.log('Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique}, sparse: ${index.sparse})`);
    });

    // Drop the existing unique index on refundId
    try {
      await collection.dropIndex('refundId_1');
      console.log('✅ Dropped existing refundId_1 index');
    } catch (err) {
      console.log('ℹ️  Index refundId_1 may not exist:', err.message);
    }

    // Create a new sparse unique index on refundId
    await collection.createIndex({ refundId: 1 }, { unique: true, sparse: true });
    console.log('✅ Created new sparse unique index on refundId');

    // Verify the new index
    console.log('Updated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique}, sparse: ${index.sparse})`);
    });

    console.log('🎉 RefundId index fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing refundId index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixRefundIndex();