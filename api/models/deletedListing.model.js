import mongoose from 'mongoose';

const deletedListingSchema = new mongoose.Schema({
  // Original listing data
  originalListingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true
  },
  
  // Listing data (stored as JSON to preserve all original data)
  listingData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // User who owned the listing
  userRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Who deleted the listing
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Deletion type
  deletionType: {
    type: String,
    enum: ['owner', 'admin'],
    required: true
  },
  
  // Reason for deletion (if admin deleted)
  deletionReason: {
    type: String,
    default: null
  },
  
  // Restoration token
  restorationToken: {
    type: String,
    required: true,
    unique: true
  },
  
  // Token expiry date (30 days from deletion)
  tokenExpiry: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  
  // Whether the listing has been restored
  isRestored: {
    type: Boolean,
    default: false
  },
  
  // When it was restored (if applicable)
  restoredAt: {
    type: Date,
    default: null
  },
  
  // Who restored it (if applicable)
  restoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Whether the token has been used
  isUsed: {
    type: Boolean,
    default: false
  },
  
  // Deletion timestamp
  deletedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
// Note: restorationToken already has unique: true in field definition, so no need for separate index
deletedListingSchema.index({ userRef: 1 });
deletedListingSchema.index({ tokenExpiry: 1 });
deletedListingSchema.index({ isRestored: 1 });

// Method to check if token is valid
deletedListingSchema.methods.isTokenValid = function() {
  return !this.isUsed && !this.isRestored && new Date() < this.tokenExpiry;
};

// Method to mark as used
deletedListingSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

// Method to restore listing
deletedListingSchema.methods.restoreListing = function(restoredBy) {
  this.isRestored = true;
  this.restoredAt = new Date();
  this.restoredBy = restoredBy;
  this.isUsed = true;
  return this.save();
};

export default mongoose.model('DeletedListing', deletedListingSchema);
