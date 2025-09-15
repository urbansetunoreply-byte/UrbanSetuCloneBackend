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
  // TTL index for automatic cleanup
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes TTL
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
otpTrackingSchema.index({ email: 1, createdAt: -1 });
otpTrackingSchema.index({ ipAddress: 1, createdAt: -1 });
otpTrackingSchema.index({ requiresCaptcha: 1 });

// Static method to get or create tracking record
otpTrackingSchema.statics.getOrCreateTracking = async function(email, ipAddress, userAgent = null) {
  const emailLower = email.toLowerCase();
  
  // Try to find existing record
  let tracking = await this.findOne({ 
    email: emailLower,
    ipAddress 
  }).sort({ createdAt: -1 });
  
  // If no record exists or it's older than 10 minutes, create new one
  if (!tracking || (Date.now() - tracking.createdAt.getTime()) > 10 * 60 * 1000) {
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
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  
  // Reset counters if it's been more than 10 minutes
  if (this.lastOtpTimestamp < tenMinutesAgo) {
    this.otpRequestCount = 0;
    this.failedOtpAttempts = 0;
    this.requiresCaptcha = false;
    this.captchaVerifiedAt = null;
  }
  
  // Check if captcha is required based on thresholds
  if (this.otpRequestCount >= 3 || this.failedOtpAttempts >= 3) {
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

const OtpTracking = mongoose.model('OtpTracking', otpTrackingSchema);

export default OtpTracking;
