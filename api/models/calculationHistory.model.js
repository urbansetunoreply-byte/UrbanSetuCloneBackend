import mongoose from 'mongoose';

const calculationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  calculationType: {
    type: String,
    required: true,
    enum: ['ROI', 'Mortgage', 'Portfolio', 'Market Analysis', 'Risk Assessment']
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  resultData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: false // Optional, for property-specific calculations
  },
  location: {
    city: String,
    state: String,
    district: String
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    maxlength: 50
  }],
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better query performance
calculationHistorySchema.index({ userId: 1, calculationType: 1 });
calculationHistorySchema.index({ userId: 1, createdAt: -1 });
calculationHistorySchema.index({ propertyId: 1 });

// Virtual for formatted creation date
calculationHistorySchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to get user's calculation history
calculationHistorySchema.statics.getUserHistory = async function(userId, calculationType = null, limit = 50) {
  const query = { userId };
  if (calculationType) {
    query.calculationType = calculationType;
  }
  
  return await this.find(query)
    .populate('propertyId', 'name price city state type bedrooms area')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Method to get calculation statistics
calculationHistorySchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$calculationType',
        count: { $sum: 1 },
        lastCalculated: { $max: '$createdAt' }
      }
    }
  ]);
  
  return stats;
};

// Method to search calculations
calculationHistorySchema.statics.searchCalculations = async function(userId, searchTerm, calculationType = null) {
  const query = { 
    userId,
    $or: [
      { notes: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      { 'location.city': { $regex: searchTerm, $options: 'i' } },
      { 'location.state': { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (calculationType) {
    query.calculationType = calculationType;
  }
  
  return await this.find(query)
    .populate('propertyId', 'name price city state type bedrooms area')
    .sort({ createdAt: -1 })
    .limit(20);
};

const CalculationHistory = mongoose.model('CalculationHistory', calculationHistorySchema);

export default CalculationHistory;