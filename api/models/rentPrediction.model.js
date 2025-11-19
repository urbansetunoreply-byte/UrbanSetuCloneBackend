import mongoose from "mongoose";

const rentPredictionSchema = new mongoose.Schema({
  // Prediction Identification
  predictionId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
    index: true,
    unique: true
  },
  
  // AI Predictions
  predictedRent: {
    type: Number,
    required: true,
    min: 0
  },
  marketAverageRent: {
    type: Number,
    required: true,
    min: 0
  },
  priceComparison: {
    type: String,
    enum: ['overpriced', 'fair', 'underpriced'],
    required: true
  },
  priceDifference: {
    type: Number, // % difference from market average
    required: true
  },
  
  // Market Trends
  predictedFutureRent: [{
    year: {
      type: Number,
      required: true
    },
    predictedRent: {
      type: Number,
      required: true,
      min: 0
    },
    confidence: {
      type: Number, // 0-100
      min: 0,
      max: 100,
      default: 75
    }
  }],
  
  // Factors Influencing Prediction
  influencingFactors: [{
    factor: {
      type: String, // 'location', 'amenities', 'size', 'age', 'neighborhood', etc.
      required: true
    },
    impact: {
      type: Number, // -100 to 100 (negative = reduces rent, positive = increases rent)
      min: -100,
      max: 100,
      required: true
    },
    description: String
  }],
  
  // Locality Score (pre-computed)
  localityScore: {
    safety: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    accessibility: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    waterAvailability: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    schools: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    offices: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    traffic: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    grocery: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    medical: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    shopping: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    overall: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    }
  },
  
  // Model Information
  modelVersion: {
    type: String,
    default: '1.0'
  },
  accuracy: {
    type: Number, // 0-100
    min: 0,
    max: 100,
    default: 85
  },
  
  // Data Sources
  dataPointsUsed: {
    type: Number,
    default: 0
  },
  similarPropertiesCount: {
    type: Number,
    default: 0
  },
  
  predictedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
rentPredictionSchema.index({ listingId: 1 });
rentPredictionSchema.index({ priceComparison: 1 });
rentPredictionSchema.index({ 'localityScore.overall': -1 }); // For sorting by locality score

// Generate predictionId before saving
rentPredictionSchema.pre('save', async function(next) {
  if (!this.predictionId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    this.predictionId = `PREDICT-${timestamp}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Virtual for price difference amount
rentPredictionSchema.virtual('priceDifferenceAmount').get(function() {
  if (!this.predictedRent || !this.marketAverageRent) return 0;
  return Math.abs(this.predictedRent - this.marketAverageRent);
});

// Method to calculate overall locality score
rentPredictionSchema.methods.calculateOverallLocalityScore = function() {
  const scores = this.localityScore;
  const weights = {
    safety: 0.20,
    accessibility: 0.15,
    waterAvailability: 0.10,
    schools: 0.10,
    offices: 0.10,
    traffic: 0.10,
    grocery: 0.10,
    medical: 0.08,
    shopping: 0.07
  };
  
  const overall = 
    (scores.safety * weights.safety) +
    (scores.accessibility * weights.accessibility) +
    (scores.waterAvailability * weights.waterAvailability) +
    (scores.schools * weights.schools) +
    (scores.offices * weights.offices) +
    (scores.traffic * weights.traffic) +
    (scores.grocery * weights.grocery) +
    (scores.medical * weights.medical) +
    (scores.shopping * weights.shopping);
  
  this.localityScore.overall = Math.round(overall * 10) / 10; // Round to 1 decimal
  return this.localityScore.overall;
};

const RentPrediction = mongoose.model("RentPrediction", rentPredictionSchema);

export default RentPrediction;

