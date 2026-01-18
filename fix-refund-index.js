// Script to fix the refundId index in MongoDB
// This needs to be run with admin credentials

const fetch = require('node-fetch');

async function fixRefundIndex() {
  try {
    console.log('Fixing refundId index...');
    
    // You'll need to replace this with actual admin credentials
    const response = await fetch('https://urbansetu-pvt4.onrender.com/api/payments/fix-refund-index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add admin JWT token here
        'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('âœ… Index fixed successfully:', result.message);
      console.log('Details:', result.details);
    } else {
      console.error('âŒ Error fixing index:', result.message);
    }
  } catch (error) {
    console.error('âŒ Error calling migration endpoint:', error.message);
  }
}

fixRefundIndex();
