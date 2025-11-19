import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: false // Explicitly prevent index creation (username should NOT be unique)
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: false, // Not required for any account type
    unique: true,
    sparse: true, // Allows multiple null values for unique constraint
    validate: {
      validator: function(v) {
        // If mobile number is provided, validate 10-digit format
        if (!v) return true; // Allow empty
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    }
  },
  address: {
    type: String,
    required: false,
    trim: true
  },
  gender: {
    type: String,
    enum: ["male", "female", "other", "prefer-not-to-say"],
    required: false
  },
  isGeneratedMobile: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
  },
  role: {
    type: String,
    enum: ["user", "admin", "rootadmin"],
    default: "user"
  },
  isDefaultAdmin: {
    type: Boolean,
    default: false
  },
  adminApprovalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  adminApprovalDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  adminRequestDate: {
    type: Date,
    default: Date.now
  },
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  },
  status: {
    type: String,
    enum: ["active", "suspended"],
    default: "active"
  },
  suspendedAt: {
    type: Date,
    default: null
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  activeSessions: [
    {
      sessionId: {
        type: String,
        required: true
      },
      ip: {
        type: String,
        required: true
      },
      device: {
        type: String,
        required: true
      },
      location: {
        type: String,
        required: false
      },
      loginTime: {
        type: Date,
        default: Date.now
      },
      lastActive: {
        type: Date,
        default: Date.now
      }
    }
  ],
  lastKnownIp: {
    type: String,
    default: null
  },
  lastKnownDevice: {
    type: String,
    default: null
  },
  
  // Rental Profile
  rentalProfile: {
    isTenant: {
      type: Boolean,
      default: false
    },
    isLandlord: {
      type: Boolean,
      default: false
    },
    activeContractsAsTenant: {
      type: Number,
      default: 0,
      min: 0
    },
    activeContractsAsLandlord: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRentPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    totalRentReceived: {
      type: Number,
      default: 0,
      min: 0
    },
    averageTenantRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    averageLandlordRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    verifiedLandlord: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  
  // Auto-debit Settings
  autoDebitSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    defaultMethod: {
      type: String,
      enum: ['razorpay', 'paypal', 'bank_account', 'upi'],
      default: null
    },
    defaultDay: {
      type: Number, // Day of month (1-31)
      min: 1,
      max: 31,
      default: 1
    }
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
