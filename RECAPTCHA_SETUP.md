# Google reCAPTCHA v2 Setup Guide for UrbanSetu

This guide explains how to set up Google reCAPTCHA v2 ("I'm not a robot" checkbox) in your UrbanSetu MERN application.

## Features Implemented

✅ **reCAPTCHA Integration**
- Added to Sign Up form (always required)
- Added to Sign In form (only after 3 failed attempts)
- Added to Forgot Password form (always required)

✅ **Security Features**
- Rate limiting for reCAPTCHA verification requests
- Logging of failed reCAPTCHA attempts
- Easy migration path to hCaptcha

✅ **Frontend Components**
- Reusable `RecaptchaWidget` component
- Error handling and user feedback
- Disabled submit buttons until reCAPTCHA is verified

✅ **Backend Middleware**
- Express middleware for reCAPTCHA validation
- Integration with Google's siteverify API
- Conditional reCAPTCHA based on failed attempts

## Getting Your API Keys

### Step 1: Create a Google reCAPTCHA Account

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Sign in with your Google account
3. Click "Create" to add a new site

### Step 2: Configure Your Site

1. **Label**: Enter a descriptive name (e.g., "UrbanSetu Production")
2. **reCAPTCHA type**: Select "reCAPTCHA v2" → "I'm not a robot" Checkbox
3. **Domains**: Add your domains:
   - `localhost` (for development)
   - `yourdomain.com` (for production)
   - `www.yourdomain.com` (if you use www)
4. **Accept Terms**: Check the reCAPTCHA Terms of Service
5. Click "Submit"

### Step 3: Get Your Keys

After creating the site, you'll see:
- **Site Key** (public key for frontend)
- **Secret Key** (private key for backend)

## Environment Variables Setup

### Frontend (.env file in `client/` directory)

```env
# reCAPTCHA Configuration
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
VITE_CAPTCHA_PROVIDER=recaptcha

# Optional: hCaptcha (for easy migration)
VITE_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key_here
```

### Backend (.env file in root directory)

```env
# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_secret_key_here

# Optional: hCaptcha (for easy migration)
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key_here
```

## File Structure

```
client/
├── src/
│   ├── components/
│   │   └── RecaptchaWidget.jsx          # Reusable reCAPTCHA component
│   ├── config/
│   │   └── recaptcha.js                 # reCAPTCHA configuration
│   └── pages/
│       ├── SignUp.jsx                   # Updated with reCAPTCHA
│       ├── SignIn.jsx                   # Updated with conditional reCAPTCHA
│       └── ForgotPassword.jsx           # Updated with reCAPTCHA

api/
├── middleware/
│   └── recaptcha.js                     # Backend reCAPTCHA validation
└── routes/
    └── auth.route.js                    # Updated with reCAPTCHA middleware
```

## How It Works

### Sign Up Form
- reCAPTCHA is **always required**
- Submit button is disabled until reCAPTCHA is verified
- Token is sent to backend for validation

### Sign In Form
- reCAPTCHA is **conditionally required** after 3 failed attempts
- Failed attempts are tracked in localStorage
- reCAPTCHA appears automatically after 3rd failed attempt

### Forgot Password Form
- reCAPTCHA is **always required**
- Must be completed before proceeding to password reset

### Backend Validation
- All reCAPTCHA tokens are verified with Google's API
- Rate limiting prevents abuse (10 verifications per minute per IP)
- Failed attempts are logged for security monitoring

## Testing

### Development Testing
1. Set up your environment variables
2. Start both frontend and backend servers
3. Test each form to ensure reCAPTCHA appears and works correctly

### Production Testing
1. Deploy with production environment variables
2. Test from different IP addresses
3. Verify rate limiting works correctly
4. Check logs for any reCAPTCHA errors

## Migration to hCaptcha

The system is designed for easy migration to hCaptcha:

1. Change `VITE_CAPTCHA_PROVIDER=hcaptcha` in frontend .env
2. Add hCaptcha keys to both frontend and backend .env files
3. No code changes required!

## Troubleshooting

### Common Issues

1. **reCAPTCHA not loading**
   - Check if `VITE_RECAPTCHA_SITE_KEY` is set correctly
   - Verify domain is added to reCAPTCHA admin console
   - Check browser console for errors

2. **"Invalid site key" error**
   - Ensure site key matches the one in reCAPTCHA admin console
   - Check if domain is properly configured

3. **Backend validation failing**
   - Verify `RECAPTCHA_SECRET_KEY` is set correctly
   - Check if secret key matches the site key
   - Ensure backend can reach Google's API

4. **Rate limiting issues**
   - Check if you're hitting the 10 requests/minute limit
   - Wait a minute and try again
   - Check logs for rate limit messages

### Debug Mode

To enable debug logging, add to your backend .env:
```env
NODE_ENV=development
```

This will show detailed reCAPTCHA verification logs in the console.

## Security Notes

- Never expose your secret key in frontend code
- Always validate reCAPTCHA tokens on the backend
- Monitor logs for suspicious activity
- Consider implementing additional security measures for high-risk operations

## Support

If you encounter issues:
1. Check the browser console for frontend errors
2. Check the backend logs for server errors
3. Verify your reCAPTCHA configuration in the admin console
4. Ensure all environment variables are set correctly
