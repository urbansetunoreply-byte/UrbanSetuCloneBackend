import mongoose from 'mongoose';

const otpTrackingSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // May not exist for non-registered emails
  },
  failedOtpAttempts: {
    type: Number,
    default: 0,
    min: 0
  },
  otpRequestCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastOtpTimestamp: {
    type: Date,
    default: Date.now
  },
  lastFailedAttemptTimestamp: {
    type: Date,
    default: null
  },
  requiresCaptcha: {
    type: Boolean,
    default: false
  },
  captchaVerifiedAt: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: false
  },
  // Creation timestamp (no TTL; we need longer-term stats for progressive lockouts)
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Lockout management
  lockoutUntil: {
    type: Date,
    default: null
  },
  lockoutHistory: {
    type: [Date],
    default: []
  },
  requireExtraVerification: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
otpTrackingSchema.index({ email: 1, createdAt: -1 });
otpTrackingSchema.index({ ipAddress: 1, createdAt: -1 });
otpTrackingSchema.index({ requiresCaptcha: 1 });
otpTrackingSchema.index({ lockoutUntil: 1 });

// Static method to get or create tracking record
otpTrackingSchema.statics.getOrCreateTracking = async function(email, ipAddress, userAgent = null) {
  const emailLower = email.toLowerCase();
  
  // Try to find existing record
  let tracking = await this.findOne({ 
    email: emailLower,
    ipAddress 
  }).sort({ createdAt: -1 });
  
  // If no record exists, create new one
  if (!tracking) {
    tracking = new this({
      email: emailLower,
      ipAddress,
      userAgent,
      failedOtpAttempts: 0,
      otpRequestCount: 0,
      lastOtpTimestamp: new Date(),
      requiresCaptcha: false
    });
  }
  
  return tracking;
};

// Method to check if captcha is required
otpTrackingSchema.methods.checkCaptchaRequirement = function() {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const graceWindowAgo = new Date(now.getTime() - 10 * 60 * 1000); // 10-minute grace after captcha
  
  // Soft decay counters if it's been a while since last action
  if (this.lastOtpTimestamp && this.lastOtpTimestamp < tenMinutesAgo) {
    this.otpRequestCount = 0;
  }
  if (this.lastFailedAttemptTimestamp && this.lastFailedAttemptTimestamp < tenMinutesAgo) {
    this.failedOtpAttempts = 0;
  }
  
  // Check if captcha is required based on thresholds, but honor recent captcha verification
  // 3 OTP requests within 5 minutes -> captcha, unless captcha verified recently (grace period)
  if (this.otpRequestCount >= 3 && this.lastOtpTimestamp >= fiveMinutesAgo) {
    if (!this.captchaVerifiedAt || this.captchaVerifiedAt < graceWindowAgo) {
      this.requiresCaptcha = true;
    }
  }
  // 3 failed OTP verifications within recent window -> captcha
  if (this.failedOtpAttempts >= 3 && this.lastFailedAttemptTimestamp >= tenMinutesAgo) {
    this.requiresCaptcha = true;
  }
  
  return this.requiresCaptcha;
};

// Method to increment OTP request count
otpTrackingSchema.methods.incrementOtpRequest = function() {
  this.otpRequestCount += 1;
  this.lastOtpTimestamp = new Date();
  this.checkCaptchaRequirement();
  return this.save();
};

// Method to increment failed attempts
otpTrackingSchema.methods.incrementFailedAttempt = function() {
  this.failedOtpAttempts += 1;
  this.lastFailedAttemptTimestamp = new Date();
  this.checkCaptchaRequirement();
  return this.save();
};

// Method to verify captcha and reset requirement
otpTrackingSchema.methods.verifyCaptcha = function() {
  this.requiresCaptcha = false;
  this.captchaVerifiedAt = new Date();
  return this.save();
};

// Method to reset tracking (on successful login)
otpTrackingSchema.methods.resetTracking = function() {
  this.failedOtpAttempts = 0;
  this.otpRequestCount = 0;
  this.requiresCaptcha = false;
  this.captchaVerifiedAt = null;
  this.lastFailedAttemptTimestamp = null;
  return this.save();
};

// Determine if currently locked
otpTrackingSchema.methods.isLocked = function() {
  if (!this.lockoutUntil) return false;
  return new Date() < this.lockoutUntil;
};

// Register a lockout for a duration in ms
otpTrackingSchema.methods.registerLockout = function(durationMs) {
  const now = new Date();
  this.lockoutUntil = new Date(now.getTime() + durationMs);
  this.lockoutHistory.push(now);
  return this.save();
};

// Clear any active lockout
otpTrackingSchema.methods.clearLockout = function() {
  this.lockoutUntil = null;
  return this.save();
};

// Count lockouts in a window
otpTrackingSchema.methods.countLockoutsSince = function(sinceDate) {
  return (this.lockoutHistory || []).filter(d => new Date(d) >= sinceDate).length;
};

const OtpTracking = mongoose.model('OtpTracking', otpTrackingSchema);

export default OtpTracking;
