# OTP Login with Conditional reCAPTCHA Implementation

This document describes the implementation of conditional reCAPTCHA for OTP login flow in UrbanSetu MERN application.

## 🎯 **Features Implemented**

### ✅ **Conditional reCAPTCHA Logic**
- **No reCAPTCHA on first OTP request** - Users can request OTP normally initially
- **reCAPTCHA triggered after 3+ failed OTP attempts** - Security kicks in after multiple failures
- **reCAPTCHA triggered after 3+ OTP requests in 10 minutes** - Rate limiting protection
- **Dynamic reCAPTCHA rendering** - Only shows when backend signals it's required
- **Submit button disabled** until reCAPTCHA is solved when required

### ✅ **Security Features**
- **OTP expiry**: 5 minutes (reduced from 10 for better security)
- **Rate limiting**: Max 3 OTP requests per 10 minutes per user
- **Failed attempt tracking**: MongoDB-based tracking with TTL
- **IP-based tracking**: Prevents abuse from same IP
- **Comprehensive logging**: All security events are logged

### ✅ **MongoDB Integration**
- **OtpTracking model**: Tracks user behavior and requirements
- **Automatic cleanup**: TTL-based document expiration
- **Efficient queries**: Indexed for performance
- **Scalable design**: Ready for production use

## 📁 **Files Created/Modified**

### **New Files:**
- `api/models/otpTracking.model.js` - MongoDB model for OTP tracking
- `api/middleware/otpRecaptcha.js` - OTP-specific reCAPTCHA middleware
- `OTP_RECAPTCHA_IMPLEMENTATION.md` - This documentation

### **Modified Files:**
- `api/controllers/auth.controller.js` - Updated OTP controllers
- `api/routes/auth.route.js` - Added OTP reCAPTCHA middleware
- `client/src/pages/SignIn.jsx` - Added conditional reCAPTCHA UI

## 🔧 **How It Works**

### **1. First OTP Request (No reCAPTCHA)**
```
User enters email → Clicks "Send OTP" → OTP sent immediately
```

### **2. After 3 Failed OTP Attempts**
```
User enters wrong OTP 3 times → Backend signals requiresCaptcha: true
→ Frontend shows reCAPTCHA widget → User must solve before next OTP request
```

### **3. After 3 OTP Requests in 10 Minutes**
```
User requests OTP 3 times in 10 min → Backend signals requiresCaptcha: true
→ Frontend shows reCAPTCHA widget → User must solve before next OTP request
```

### **4. Successful OTP Verification**
```
User enters correct OTP → All tracking counters reset → reCAPTCHA requirement cleared
```

## 🗄️ **MongoDB Schema**

### **OtpTracking Collection**
```javascript
{
  email: String,                    // User's email (indexed)
  userId: ObjectId,                 // Reference to User (optional)
  failedOtpAttempts: Number,        // Count of failed OTP attempts
  otpRequestCount: Number,          // Count of OTP requests in time window
  lastOtpTimestamp: Date,           // Last OTP request time
  lastFailedAttemptTimestamp: Date, // Last failed attempt time
  requiresCaptcha: Boolean,         // Whether captcha is required
  captchaVerifiedAt: Date,          // When captcha was last verified
  ipAddress: String,                // User's IP address
  userAgent: String,                // User's browser info
  createdAt: Date,                  // Document creation time (TTL index)
  expiresAt: Date                   // Auto-cleanup after 10 minutes
}
```

### **Indexes**
- `{ email: 1, createdAt: -1 }` - Efficient email-based queries
- `{ ipAddress: 1, createdAt: -1 }` - IP-based tracking
- `{ requiresCaptcha: 1 }` - Quick captcha requirement checks
- `{ createdAt: 1 }` - TTL index for automatic cleanup

## 🔄 **API Flow**

### **Send OTP Request**
```javascript
POST /api/auth/send-login-otp
{
  "email": "user@example.com",
  "recaptchaToken": "optional_captcha_token" // Only when required
}

Response:
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "requiresCaptcha": false // Indicates if captcha is now required
}
```

### **Verify OTP Request**
```javascript
POST /api/auth/verify-login-otp
{
  "email": "user@example.com",
  "otp": "123456"
}

Response (on failure):
{
  "success": false,
  "message": "Invalid OTP. Please try again.",
  "requiresCaptcha": true // Indicates captcha is now required
}
```

## 🛡️ **Security Implementation**

### **Rate Limiting**
- **OTP Requests**: 3 per 10 minutes per user
- **reCAPTCHA Verification**: 15 per minute per IP
- **Failed Attempts**: Tracked and logged

### **Tracking Logic**
```javascript
// Check captcha requirement
if (otpRequestCount >= 3 || failedOtpAttempts >= 3) {
  requiresCaptcha = true;
}

// Reset counters after 10 minutes
if (lastOtpTimestamp < tenMinutesAgo) {
  otpRequestCount = 0;
  failedOtpAttempts = 0;
  requiresCaptcha = false;
}
```

### **Logging Events**
- `otp_request_successful` - Successful OTP request
- `otp_verification_failed` - Failed OTP verification
- `otp_login_successful` - Successful OTP login
- `otp_captcha_verification_failed` - Failed captcha verification
- `otp_captcha_rate_limit_exceeded` - Rate limit exceeded

## 🎨 **Frontend Implementation**

### **State Management**
```javascript
const [otpRecaptchaToken, setOtpRecaptchaToken] = useState(null);
const [otpRecaptchaError, setOtpRecaptchaError] = useState("");
const [showOtpRecaptcha, setShowOtpRecaptcha] = useState(false);
const [otpRequiresCaptcha, setOtpRequiresCaptcha] = useState(false);
```

### **Conditional Rendering**
```javascript
{showOtpRecaptcha && (
  <RecaptchaWidget
    ref={otpRecaptchaRef}
    onVerify={handleOtpRecaptchaVerify}
    onExpire={handleOtpRecaptchaExpire}
    onError={handleOtpRecaptchaError}
    disabled={otpLoading}
  />
)}
```

### **Button State**
```javascript
disabled={
  loading || 
  otpLoading || 
  (!otpSent && !canResend) || 
  (otpRequiresCaptcha && !otpRecaptchaToken)
}
```

## 🧪 **Testing Scenarios**

### **Test Case 1: Normal Flow**
1. Enter email → Click "Send OTP"
2. Enter correct OTP → Login successful
3. **Expected**: No reCAPTCHA shown

### **Test Case 2: Failed Attempts**
1. Enter email → Click "Send OTP"
2. Enter wrong OTP 3 times
3. Try to send OTP again
4. **Expected**: reCAPTCHA appears, must be solved

### **Test Case 3: Rate Limiting**
1. Enter email → Click "Send OTP" 3 times in 10 minutes
2. Try to send OTP again
3. **Expected**: reCAPTCHA appears, must be solved

### **Test Case 4: Successful After Captcha**
1. Trigger reCAPTCHA requirement
2. Solve reCAPTCHA → Send OTP
3. Enter correct OTP → Login
4. **Expected**: All counters reset, no reCAPTCHA on next attempt

## 🔧 **Environment Variables**

### **Required Variables**
```env
# Backend
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Frontend
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**
- OTP request success rate
- reCAPTCHA trigger frequency
- Failed attempt patterns
- Rate limiting effectiveness

### **Log Analysis**
```javascript
// Example log entries
{
  "event": "otp_request_successful",
  "email": "user@example.com",
  "requiresCaptcha": false,
  "timestamp": "2024-01-15T10:30:00Z"
}

{
  "event": "otp_captcha_verification_failed",
  "email": "user@example.com",
  "errorCodes": ["timeout-or-duplicate"],
  "timestamp": "2024-01-15T10:35:00Z"
}
```

## 🚀 **Deployment Notes**

### **Database Migration**
- No existing data migration required
- New collection will be created automatically
- TTL indexes will start working immediately

### **Performance Considerations**
- MongoDB queries are optimized with proper indexes
- TTL cleanup runs automatically
- Rate limiting uses in-memory store (consider Redis for production)

### **Monitoring Setup**
- Monitor OtpTracking collection size
- Set up alerts for high failure rates
- Track reCAPTCHA verification success rates

## 🔒 **Security Best Practices**

1. **Never expose secret keys** in frontend code
2. **Always validate reCAPTCHA** on backend
3. **Log all security events** for monitoring
4. **Use HTTPS** for all reCAPTCHA communications
5. **Monitor for abuse patterns** and adjust thresholds
6. **Regular security audits** of tracking data

## 🐛 **Troubleshooting**

### **Common Issues**

1. **reCAPTCHA not showing when expected**
   - Check backend logs for `requiresCaptcha` signals
   - Verify tracking data in MongoDB
   - Check frontend state management

2. **reCAPTCHA showing when not needed**
   - Check if counters are being reset properly
   - Verify TTL is working correctly
   - Check for stale tracking data

3. **Rate limiting too aggressive**
   - Adjust thresholds in `otpTracking.model.js`
   - Check if TTL cleanup is working
   - Monitor IP-based tracking

### **Debug Commands**
```javascript
// Check tracking data
db.otpTrackings.find({email: "user@example.com"}).sort({createdAt: -1})

// Check captcha requirements
db.otpTrackings.find({requiresCaptcha: true})

// Monitor rate limiting
db.otpTrackings.aggregate([
  {$group: {_id: "$ipAddress", count: {$sum: 1}}},
  {$sort: {count: -1}}
])
```

## 📈 **Future Enhancements**

1. **Machine Learning**: Use ML to detect suspicious patterns
2. **Geolocation**: Add location-based risk assessment
3. **Device Fingerprinting**: Track devices for better security
4. **Progressive Challenges**: Escalating security measures
5. **Analytics Dashboard**: Real-time security monitoring

---

This implementation provides robust security for OTP login while maintaining a smooth user experience. The conditional reCAPTCHA system ensures that legitimate users are not inconvenienced while protecting against abuse and automated attacks.
