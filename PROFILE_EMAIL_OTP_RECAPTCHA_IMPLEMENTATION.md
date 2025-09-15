# Profile Email OTP with Conditional reCAPTCHA Implementation

This document describes the implementation of conditional reCAPTCHA for profile email OTP requests in UrbanSetu MERN application.

## 🎯 **Features Implemented**

### ✅ **Conditional reCAPTCHA Logic**
- **No reCAPTCHA on first OTP request** - Users can request profile email OTP normally initially
- **reCAPTCHA triggered after 3+ failed OTP attempts** - Security kicks in after multiple failures
- **reCAPTCHA triggered after 3+ OTP requests in 10 minutes** - Rate limiting protection
- **Dynamic reCAPTCHA rendering** - Only shows when backend signals it's required
- **Submit button disabled** until reCAPTCHA is solved when required

### ✅ **Security Features**
- **OTP expiry**: 5 minutes (reduced from 10 for better security)
- **Rate limiting**: Max 3 OTP requests per 10 minutes per user
- **Failed attempt tracking**: MongoDB-based tracking with TTL
- **IP-based tracking**: Prevents abuse across different users
- **Security logging**: All OTP events are logged for monitoring
- **Automatic cleanup**: Expired tracking records are automatically removed

### ✅ **User Experience**
- **Seamless integration**: reCAPTCHA only appears when needed
- **Clear feedback**: Users understand why reCAPTCHA is required
- **Responsive design**: Works on all device sizes
- **Error handling**: Graceful fallbacks for reCAPTCHA failures

## 📁 **Files Modified/Created**

### **Backend Files**

#### 1. **`api/models/otpTracking.model.js`** (Already exists from OTP login implementation)
- MongoDB schema for tracking OTP requests and failed attempts
- TTL indexes for automatic cleanup
- Methods for incrementing counters and checking thresholds

#### 2. **`api/middleware/otpRecaptcha.js`** (Already exists from OTP login implementation)
- Middleware for conditional reCAPTCHA validation
- Rate limiting for reCAPTCHA verification requests
- Integration with OTP tracking system

#### 3. **`api/controllers/emailVerification.controller.js`** (Updated)
- **`sendProfileEmailOTP`**: Updated to use OTP tracking system
- **`verifyOTP`**: Enhanced to handle profile email OTP verification with tracking
- Added security logging for all OTP events
- Integrated with reCAPTCHA middleware

#### 4. **`api/routes/auth.route.js`** (Updated)
- Added OTP reCAPTCHA middleware to `/send-profile-email-otp` route
- Conditional reCAPTCHA validation based on tracking thresholds

### **Frontend Files**

#### 5. **`client/src/pages/Profile.jsx`** (Updated)
- Added reCAPTCHA state management for profile email OTP
- Implemented conditional reCAPTCHA rendering
- Updated OTP send/verify handlers to include reCAPTCHA logic
- Enhanced UI to show reCAPTCHA when required

## 🔧 **Technical Implementation Details**

### **Backend Flow**

1. **OTP Request Tracking**:
   ```javascript
   // When user requests profile email OTP
   await otpTracking.incrementOtpRequest();
   
   // Check if reCAPTCHA is required
   const requiresCaptcha = otpTracking.requiresCaptcha;
   ```

2. **Conditional reCAPTCHA Middleware**:
   ```javascript
   // Middleware checks tracking thresholds
   if (otpTracking.otpRequestCount >= 3 || otpTracking.failedOtpAttempts >= 3) {
     // Require reCAPTCHA verification
     return validateRecaptcha({ required: true });
   }
   ```

3. **OTP Verification with Tracking**:
   ```javascript
   // On failed OTP verification
   if (storedData.type === 'profile_email' && otpTracking) {
     await otpTracking.incrementFailedAttempt();
   }
   ```

### **Frontend Flow**

1. **State Management**:
   ```javascript
   const [profileRecaptchaToken, setProfileRecaptchaToken] = useState(null);
   const [showProfileRecaptcha, setShowProfileRecaptcha] = useState(false);
   const [profileRequiresCaptcha, setProfileRequiresCaptcha] = useState(false);
   ```

2. **Conditional Rendering**:
   ```javascript
   // Show reCAPTCHA only when required
   {showProfileRecaptcha && emailValidation.available === true && 
    !emailValidation.loading && !otpSent && !emailVerified && 
    formData.email !== originalEmail && emailEditMode && (
     <RecaptchaWidget ... />
   )}
   ```

3. **Submit Button Logic**:
   ```javascript
   // Disable button if reCAPTCHA required but not completed
   disabled={otpLoading || !canResend || !formData.email || 
            (profileRequiresCaptcha && !profileRecaptchaToken)}
   ```

## 🚀 **Usage Examples**

### **Normal Flow (No reCAPTCHA)**
1. User edits email in profile
2. Clicks "Send OTP" button
3. OTP sent successfully
4. User enters OTP and verifies

### **Rate Limited Flow (With reCAPTCHA)**
1. User requests OTP 3+ times in 10 minutes
2. Backend signals `requiresCaptcha: true`
3. Frontend shows reCAPTCHA widget
4. User completes reCAPTCHA
5. OTP sent successfully after verification

### **Failed Attempts Flow (With reCAPTCHA)**
1. User enters wrong OTP 3+ times
2. Backend signals `requiresCaptcha: true`
3. Frontend shows reCAPTCHA widget
4. User completes reCAPTCHA
5. Can request new OTP after verification

## 🔒 **Security Considerations**

### **Rate Limiting**
- **OTP Requests**: Max 3 per 10 minutes per email
- **reCAPTCHA Verification**: Max 15 per minute per IP
- **Failed Attempts**: Max 3 per OTP before requiring reCAPTCHA

### **Tracking & Monitoring**
- All OTP events are logged with timestamps
- IP addresses and user agents are tracked
- Failed attempts are monitored for suspicious activity
- Automatic cleanup prevents database bloat

### **Data Protection**
- OTP tokens are stored temporarily (5 minutes)
- Tracking data has TTL for automatic cleanup
- No sensitive user data is stored in tracking records

## 🧪 **Testing Scenarios**

### **Test Case 1: Normal OTP Request**
1. Edit email in profile
2. Click "Send OTP"
3. Verify OTP is sent without reCAPTCHA
4. Enter correct OTP and verify

### **Test Case 2: Rate Limiting Trigger**
1. Request OTP 3 times in quick succession
2. Verify reCAPTCHA appears on 4th request
3. Complete reCAPTCHA
4. Verify OTP is sent after reCAPTCHA

### **Test Case 3: Failed Attempts Trigger**
1. Request OTP and enter wrong OTP 3 times
2. Verify reCAPTCHA appears on next request
3. Complete reCAPTCHA
4. Verify OTP is sent after reCAPTCHA

### **Test Case 4: reCAPTCHA Expiry**
1. Trigger reCAPTCHA requirement
2. Let reCAPTCHA expire
3. Verify error message appears
4. Verify reCAPTCHA resets and can be completed again

## 📊 **Monitoring & Analytics**

### **Security Events Logged**
- `profile_otp_request_successful`: Successful OTP request
- `profile_otp_verification_failed`: Failed OTP verification
- `profile_otp_verification_successful`: Successful OTP verification
- `recaptcha_required`: When reCAPTCHA is triggered
- `recaptcha_verification_failed`: Failed reCAPTCHA verification

### **Metrics to Monitor**
- OTP request frequency per user
- reCAPTCHA trigger rate
- Failed OTP attempt patterns
- reCAPTCHA completion rate

## 🔄 **Future Enhancements**

### **Potential Improvements**
1. **Adaptive Thresholds**: Adjust limits based on user behavior
2. **Geolocation Tracking**: Different limits for different regions
3. **Device Fingerprinting**: Track devices for better security
4. **Machine Learning**: Detect suspicious patterns automatically
5. **Multi-factor Authentication**: Add SMS backup for OTP

### **Alternative CAPTCHA Providers**
- **hCaptcha**: Privacy-focused alternative
- **Cloudflare Turnstile**: Free alternative
- **Custom CAPTCHA**: In-house solution

## 🚨 **Troubleshooting**

### **Common Issues**

1. **reCAPTCHA Not Showing**
   - Check if `VITE_RECAPTCHA_SITE_KEY` is set
   - Verify tracking thresholds are met
   - Check browser console for errors

2. **OTP Not Sending After reCAPTCHA**
   - Verify reCAPTCHA token is included in request
   - Check backend logs for verification errors
   - Ensure rate limits are not exceeded

3. **Tracking Not Working**
   - Check MongoDB connection
   - Verify TTL indexes are created
   - Check for expired tracking records

### **Debug Commands**
```bash
# Check tracking records
db.otptrackings.find({email: "user@example.com"})

# Check rate limiting
db.otptrackings.find({ipAddress: "192.168.1.1"})

# Clean up expired records
db.otptrackings.deleteMany({createdAt: {$lt: new Date(Date.now() - 24*60*60*1000)}})
```

## 📝 **Configuration**

### **Environment Variables**
```bash
# Frontend
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
VITE_CAPTCHA_PROVIDER=recaptcha

# Backend
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

### **Rate Limiting Configuration**
```javascript
// In otpRecaptcha.js
const windowMs = 10 * 60 * 1000; // 10 minutes
const maxOtpRequests = 3; // Max OTP requests per window
const maxFailedAttempts = 3; // Max failed attempts before reCAPTCHA
```

## ✅ **Implementation Status**

- ✅ **Backend OTP Tracking**: MongoDB model with TTL
- ✅ **Conditional reCAPTCHA Middleware**: Rate limiting and validation
- ✅ **Profile Email OTP Controller**: Updated with tracking integration
- ✅ **Frontend Profile Page**: Conditional reCAPTCHA rendering
- ✅ **Security Logging**: Comprehensive event tracking
- ✅ **Error Handling**: Graceful fallbacks and user feedback
- ✅ **Testing**: All scenarios covered
- ✅ **Documentation**: Complete implementation guide

## 🎉 **Conclusion**

The profile email OTP with conditional reCAPTCHA implementation provides a robust security solution that:

- **Protects against abuse** without hindering legitimate users
- **Scales automatically** based on user behavior
- **Provides clear feedback** to users about security requirements
- **Maintains excellent UX** by only showing reCAPTCHA when needed
- **Integrates seamlessly** with existing authentication flows

The implementation is production-ready and follows security best practices for rate limiting, tracking, and user experience.
