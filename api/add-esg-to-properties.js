import mongoose from 'mongoose';
import Listing from './models/listing.model.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/urbansetu');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Add ESG data to properties
const addESGData = async () => {
  try {
    console.log('🌱 Adding ESG data to properties...');
    
    // Get properties without ESG data
    const properties = await Listing.find({
      $or: [
        { 'esg.esgScore': { $exists: false } },
        { 'esg.esgScore': 0 }
      ]
    }).limit(5);

    console.log(`📊 Found ${properties.length} properties to update`);

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      
      // Generate sample ESG data
      const esgData = {
        environmental: {
          energyRating: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          carbonFootprint: Math.floor(Math.random() * 200) + 100,
          renewableEnergy: Math.random() > 0.5,
          waterEfficiency: ['Excellent', 'Good', 'Average'][Math.floor(Math.random() * 3)],
          wasteManagement: ['Good', 'Average'][Math.floor(Math.random() * 2)],
          greenCertification: Math.random() > 0.7 ? 'LEED' : 'None',
          solarPanels: Math.random() > 0.6,
          rainwaterHarvesting: Math.random() > 0.8
        },
        social: {
          accessibility: ['Fully Accessible', 'Partially Accessible'][Math.floor(Math.random() * 2)],
          communityImpact: Math.floor(Math.random() * 40) + 60,
          affordableHousing: Math.random() > 0.8,
          localEmployment: Math.floor(Math.random() * 10) + 5,
          socialAmenities: ['Community Center', 'Playground', 'Gym'].slice(0, Math.floor(Math.random() * 3) + 1),
          diversityInclusion: ['Good', 'Average'][Math.floor(Math.random() * 2)]
        },
        governance: {
          transparency: ['Good', 'Average'][Math.floor(Math.random() * 2)],
          ethicalStandards: ['Good', 'Average'][Math.floor(Math.random() * 2)],
          compliance: ['Fully Compliant', 'Mostly Compliant'][Math.floor(Math.random() * 2)],
          riskManagement: ['Good', 'Average'][Math.floor(Math.random() * 2)],
          stakeholderEngagement: ['Good', 'Average'][Math.floor(Math.random() * 2)]
        },
        esgScore: Math.floor(Math.random() * 30) + 60, // 60-90 range
        esgRating: 'A',
        lastEsgUpdate: new Date()
      };

      // Update the property
      await Listing.findByIdAndUpdate(property._id, {
        $set: { esg: esgData }
      });
      
      console.log(`✅ Updated property ${i + 1}/${properties.length}: ${property.name}`);
    }

    console.log('🎉 ESG data added successfully!');
    console.log('📈 Now try the ESG recommendations again');
    
  } catch (error) {
    console.error('❌ Error adding ESG data:', error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await addESGData();
  process.exit(0);
};

runScript();
