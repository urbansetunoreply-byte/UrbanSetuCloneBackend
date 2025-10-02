# Backend Environment Variables for Mobile App Support

## Required Environment Variables

Add these to your backend `.env` file or hosting platform (Render):

```bash
# Basic Configuration
NODE_ENV=production
PORT=3000

# Database
MONGO_URI=your_mongodb_connection_string

# JWT Authentication
JWT_SECRET=your_jwt_secret_key

# CORS Configuration (Important for Mobile)
CORS_ORIGIN=*
# Or specify your domains:
# CORS_ORIGIN=https://urbansetu.vercel.app,http://localhost:3000

# Security Settings
CSRF_SECRET=your_csrf_secret_key
SESSION_SECRET=your_session_secret

# Email Configuration (for OTP)
BREVO_API_KEY=your_brevo_api_key
FROM_EMAIL=noreply@urbansetu.com

# reCAPTCHA (Optional for mobile - can be disabled)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload (if using)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Payment (if using)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Admin Configuration
DEFAULT_ADMIN_EMAIL=admin@urbansetu.com
DEFAULT_ADMIN_PASSWORD=your_secure_admin_password
```

## Mobile-Specific Backend Modifications Needed

### 1. Update CORS Configuration

In your `api/index.js`, make sure CORS allows mobile requests:

```javascript
// Add this to your CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://urbansetu.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      // Add your production domains
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for mobile apps
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Cookie'],
}));
```

### 2. Mobile-Friendly CSRF (Optional)

You can create a mobile-specific route that bypasses CSRF for mobile apps:

```javascript
// Add to your auth routes
router.post("/mobile/signin", signInRateLimit, bruteForceProtection, SignIn);
router.post("/mobile/signup", signUpRateLimit, SignUp);
```

### 3. User-Agent Detection

The mobile app sends `User-Agent: UrbanSetuMobile/1.0` which helps with:
- Rate limiting per device
- Analytics
- Security monitoring

## Testing the Setup

1. **Test CSRF Token Endpoint:**
   ```bash
   curl -X GET https://urbansetu.onrender.com/api/auth/csrf-token \
     -H "User-Agent: UrbanSetuMobile/1.0" \
     -v
   ```

2. **Test Mobile Login:**
   ```bash
   curl -X POST https://urbansetu.onrender.com/api/auth/signin \
     -H "Content-Type: application/json" \
     -H "User-Agent: UrbanSetuMobile/1.0" \
     -H "X-CSRF-Token: YOUR_TOKEN" \
     -d '{"email":"test@example.com","password":"password"}' \
     -v
   ```

## Security Considerations

1. **CSRF Protection:** Mobile app properly handles CSRF tokens
2. **Rate Limiting:** Configured per IP/User-Agent
3. **JWT Tokens:** Stored securely in AsyncStorage
4. **HTTPS Only:** All API calls use HTTPS in production
5. **Input Validation:** All endpoints validate input data

## Deployment Notes

### For Render.com:
1. Add all environment variables in the Render dashboard
2. Make sure `NODE_ENV=production`
3. Ensure your MongoDB connection string is correct
4. Test all endpoints after deployment

### For Other Platforms:
- Ensure environment variables are properly set
- Configure CORS for your domain
- Test mobile app connectivity

## Troubleshooting

### Common Issues:

1. **CSRF Token Errors:**
   - Check if CORS is properly configured
   - Verify User-Agent header is being sent
   - Ensure cookies are being handled correctly

2. **Authentication Failures:**
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Ensure user exists in database

3. **Network Errors:**
   - Verify API base URL is correct
   - Check if server is running
   - Test with curl/Postman first

### Debug Mode:
Set `DEBUG=true` in environment to see detailed logs for CSRF and authentication.
