import mongoose from "mongoose";

const propertyVerificationSchema = new mongoose.Schema({
  // Verification Identification
  verificationId: {
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
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Verification Status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'verified', 'rejected'],
    default: 'pending',
    index: true
  },
  
  // Documents Verified
  documents: {
    ownershipProof: {
      verified: {
        type: Boolean,
        default: false
      },
      documentUrl: String,
      documentType: String, // 'sale_deed', 'gift_deed', 'inheritance', 'lease', 'other'
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      rejectionReason: String
    },
    identityProof: {
      verified: {
        type: Boolean,
        default: false
      },
      documentUrl: String,
      documentType: String, // 'aadhaar', 'pan', 'passport', 'driving_license', 'other'
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      rejectionReason: String
    },
    addressProof: {
      verified: {
        type: Boolean,
        default: false
      },
      documentUrl: String,
      documentType: String, // 'utility_bill', 'bank_statement', 'rent_agreement', 'other'
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      rejectionReason: String
    }
  },
  
  // Property Inspection
  photosVerified: {
    type: Boolean,
    default: false
  },
  locationVerified: {
    type: Boolean,
    default: false
  },
  amenitiesVerified: {
    type: Boolean,
    default: false
  },
  
  // Physical Inspection (optional)
  physicalInspection: {
    scheduled: {
      type: Boolean,
      default: false
    },
    scheduledDate: Date,
    inspected: {
      type: Boolean,
      default: false
    },
    inspectionDate: Date,
    inspector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    inspectionNotes: String,
    inspectionReportUrl: String
  },
  
  // Verification Badge
  verifiedBadgeIssued: {
    type: Boolean,
    default: false
  },
  badgeIssuedAt: Date,
  badgeExpiry: Date, // Annual renewal
  badgeNumber: String, // Unique badge number
  
  // Payment
  verificationFee: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  
  // Rejection
  rejectionReason: String,
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Admin Notes
  adminNotes: String,
  
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
propertyVerificationSchema.index({ landlordId: 1, status: 1 });
propertyVerificationSchema.index({ status: 1, createdAt: -1 }); // For admin dashboard
propertyVerificationSchema.index({ badgeExpiry: 1 }); // For renewal tracking

// Generate verificationId before saving
propertyVerificationSchema.pre('save', async function(next) {
  if (!this.verificationId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9).toUpperCase();
    this.verificationId = `VERIFY-${timestamp}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Generate badge number when verified
propertyVerificationSchema.pre('save', async function(next) {
  if (this.status === 'verified' && !this.badgeNumber && !this.badgeIssuedAt) {
    const badgeNum = `UV-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    this.badgeNumber = badgeNum;
    this.badgeIssuedAt = new Date();
    
    // Set expiry to 1 year from now
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    this.badgeExpiry = expiry;
  }
  next();
});

// Virtual for checking if verification is complete
propertyVerificationSchema.virtual('isComplete').get(function() {
  return this.documents.ownershipProof.verified &&
         this.documents.identityProof.verified &&
         this.documents.addressProof.verified &&
         this.photosVerified &&
         this.locationVerified;
});

// Virtual for checking if badge is expired
propertyVerificationSchema.virtual('isBadgeExpired').get(function() {
  if (!this.badgeExpiry) return false;
  return new Date() > new Date(this.badgeExpiry);
});

// Method to check if renewal is due (within 30 days)
propertyVerificationSchema.methods.isRenewalDue = function() {
  if (!this.badgeExpiry) return false;
  const now = new Date();
  const renewalDate = new Date(this.badgeExpiry);
  renewalDate.setDate(renewalDate.getDate() - 30); // 30 days before expiry
  return now >= renewalDate && now < this.badgeExpiry;
};

const PropertyVerification = mongoose.model("PropertyVerification", propertyVerificationSchema);

export default PropertyVerification;

