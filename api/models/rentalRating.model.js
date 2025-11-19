import mongoose from "mongoose";

const rentalRatingSchema = new mongoose.Schema({
  // Rating Identification
  ratingId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentLockContract',
    required: true,
    unique: true // unique already creates an index
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tenant rates Landlord
  tenantToLandlordRating: {
    overallRating: {
      type: Number, // 1-5
      min: 1,
      max: 5,
      default: null
    },
    behaviorRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    maintenanceRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    honestyRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    communicationRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: String,
    ratedAt: Date
  },
  
  // Landlord rates Tenant
  landlordToTenantRating: {
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    cleanlinessRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    paymentPunctuality: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    behaviorRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    propertyCare: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    comment: String,
    ratedAt: Date
  },
  
  // Both parties rated
  bothRated: {
    type: Boolean,
    default: false
  },
  allRatingsCompletedAt: Date,
  
  createdAt: {
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
rentalRatingSchema.index({ tenantId: 1 });
rentalRatingSchema.index({ landlordId: 1 });
rentalRatingSchema.index({ contractId: 1 });

// Generate ratingId before saving
rentalRatingSchema.pre('save', async function(next) {
  if (!this.ratingId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    this.ratingId = `RATING-${timestamp}-${random}`;
  }
  
  // Check if both parties have rated
  const tenantRated = this.tenantToLandlordRating.overallRating !== null;
  const landlordRated = this.landlordToTenantRating.overallRating !== null;
  
  if (tenantRated && landlordRated && !this.bothRated) {
    this.bothRated = true;
    this.allRatingsCompletedAt = new Date();
  }
  
  this.updatedAt = Date.now();
  next();
});

// Virtual for average landlord rating
rentalRatingSchema.virtual('averageLandlordRating').get(function() {
  const ratings = this.tenantToLandlordRating;
  if (!ratings.overallRating) return null;
  
  const sum = (ratings.overallRating || 0) +
              (ratings.behaviorRating || 0) +
              (ratings.maintenanceRating || 0) +
              (ratings.honestyRating || 0) +
              (ratings.communicationRating || 0);
  
  const count = [ratings.overallRating, ratings.behaviorRating, ratings.maintenanceRating, 
                 ratings.honestyRating, ratings.communicationRating].filter(r => r !== null).length;
  
  return count > 0 ? sum / count : null;
});

// Virtual for average tenant rating
rentalRatingSchema.virtual('averageTenantRating').get(function() {
  const ratings = this.landlordToTenantRating;
  if (!ratings.overallRating) return null;
  
  const sum = (ratings.overallRating || 0) +
              (ratings.cleanlinessRating || 0) +
              (ratings.paymentPunctuality || 0) +
              (ratings.behaviorRating || 0) +
              (ratings.propertyCare || 0);
  
  const count = [ratings.overallRating, ratings.cleanlinessRating, ratings.paymentPunctuality,
                 ratings.behaviorRating, ratings.propertyCare].filter(r => r !== null).length;
  
  return count > 0 ? sum / count : null;
});

// Method to submit tenant rating
rentalRatingSchema.methods.submitTenantRating = function(ratings, comment) {
  this.tenantToLandlordRating = {
    overallRating: ratings.overallRating,
    behaviorRating: ratings.behaviorRating,
    maintenanceRating: ratings.maintenanceRating,
    honestyRating: ratings.honestyRating,
    communicationRating: ratings.communicationRating,
    comment: comment || '',
    ratedAt: new Date()
  };
  this.updatedAt = new Date();
};

// Method to submit landlord rating
rentalRatingSchema.methods.submitLandlordRating = function(ratings, comment) {
  this.landlordToTenantRating = {
    overallRating: ratings.overallRating,
    cleanlinessRating: ratings.cleanlinessRating,
    paymentPunctuality: ratings.paymentPunctuality,
    behaviorRating: ratings.behaviorRating,
    propertyCare: ratings.propertyCare,
    comment: comment || '',
    ratedAt: new Date()
  };
  this.updatedAt = new Date();
};

const RentalRating = mongoose.model("RentalRating", rentalRatingSchema);

export default RentalRating;

