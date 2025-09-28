# Brevo Email Service Setup Guide

## 🚀 Complete Migration from Gmail to Brevo

This guide covers the complete setup for migrating from Gmail SMTP to Brevo email service for OTP sending and device notifications.

## 📋 Prerequisites

1. **Brevo Account**: Sign up at [brevo.com](https://www.brevo.com)
2. **API Key**: Generate API key from Brevo dashboard
3. **SMTP Credentials**: Get SMTP login and password from Brevo

## 🔧 Environment Variables Setup

### Backend Environment Variables (.env in api/ folder)

Add these variables to your `api/.env` file:

```bash
# ===========================================
# BREVO EMAIL SERVICE CONFIGURATION
# ===========================================

# Brevo API Configuration (Primary)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SMTP_LOGIN=980d8d001@smtp-brevo.com
BREVO_SMTP_PASSWORD=your_brevo_smtp_password_here
BREVO_SENDER_EMAIL=your_sender_email@yourdomain.com
BREVO_SENDER_NAME=UrbanSetu

# Gmail Fallback Configuration (Optional)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# ===========================================
# EXISTING CONFIGURATION (Keep as is)
# ===========================================
# ... your existing environment variables ...
```

### Frontend Environment Variables (.env in client/ folder)

**No frontend environment variables needed** - all email sending is handled by the backend.

## 🔑 Brevo Configuration Details

### 1. API Key Setup
- Go to Brevo Dashboard → Settings → API Keys
- Create a new API key with "Send emails" permission
- Copy the API key to `BREVO_API_KEY`

### 2. SMTP Configuration
- **SMTP Server**: `smtp-relay.brevo.com`
- **Port**: `587`
- **Login**: `980d8d001@smtp-brevo.com` (or your custom login)
- **Password**: Your Brevo SMTP password

### 3. Sender Configuration
- **Sender Email**: Use a verified domain email (e.g., `noreply@yourdomain.com`)
- **Sender Name**: `UrbanSetu` (or your preferred name)

## 📧 Email Templates

All OTP and notification emails are automatically configured with:

### 1. Signup OTP Email
- **Subject**: "Email Verification - UrbanSetu"
- **Template**: Professional blue-themed design
- **Expiration**: 10 minutes

### 2. Forgot Password OTP Email
- **Subject**: "Password Reset - UrbanSetu"
- **Template**: Professional red-themed design
- **Expiration**: 10 minutes

### 3. Profile Email OTP
- **Subject**: "Email Verification - Update Profile - UrbanSetu"
- **Template**: Professional green-themed design
- **Expiration**: 5 minutes

### 4. Login OTP Email
- **Subject**: "Login Verification - UrbanSetu"
- **Template**: Professional purple-themed design
- **Expiration**: 5 minutes

### 5. New Login Notification
- **Subject**: "New Login Detected - UrbanSetu"
- **Template**: Security alert with device details

### 6. Suspicious Login Alert
- **Subject**: "Suspicious Login Attempt - UrbanSetu"
- **Template**: High-priority security alert

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
# Install Brevo SDK (already added to package.json)
npm install @getbrevo/brevo
```

### 2. Update Environment Variables
1. Copy the environment variables above to your `api/.env` file
2. Replace placeholder values with your actual Brevo credentials
3. Restart your backend server

### 3. Test Configuration
```bash
# Test Brevo connection (admin only)
GET /api/email-monitor/brevo/test?sendTestEmail=true

# Check email service health
GET /api/email-monitor/health
```

## 🔄 Email Service Flow

### Primary: Brevo API
1. **First Attempt**: Uses Brevo API for all email sending
2. **Benefits**: 
   - Higher deliverability rates
   - Better analytics and tracking
   - Professional email templates
   - No SMTP connection issues

### Fallback: Gmail SMTP
1. **Fallback**: If Brevo fails, automatically falls back to Gmail SMTP
2. **Benefits**: 
   - Ensures email delivery even if Brevo is down
   - Maintains existing Gmail configuration

## 📊 Monitoring & Health Checks

### Available Endpoints
- `GET /api/email-monitor/health` - Overall email system health
- `GET /api/email-monitor/brevo/test` - Test Brevo connection
- `POST /api/email-monitor/test-connection` - Test Gmail fallback

### Health Check Features
- Brevo API status monitoring
- Gmail SMTP fallback status
- Email delivery statistics
- Error rate monitoring
- Automatic retry mechanisms

## 🚨 Troubleshooting

### Common Issues

1. **Brevo API Key Invalid**
   - Verify API key is correct
   - Check API key permissions
   - Ensure account is active

2. **SMTP Authentication Failed**
   - Verify SMTP login and password
   - Check if account is suspended
   - Ensure SMTP is enabled in Brevo

3. **Email Not Delivered**
   - Check sender email domain verification
   - Verify recipient email address
   - Check spam folder

4. **Rate Limiting**
   - Brevo has rate limits (check dashboard)
   - Gmail has daily sending limits
   - System automatically handles retries

### Debug Steps
1. Check server logs for Brevo initialization
2. Test Brevo connection via API endpoint
3. Verify environment variables are loaded
4. Check Brevo dashboard for delivery status

## 📈 Benefits of Brevo Migration

### Performance Improvements
- ✅ **Faster Delivery**: API-based sending vs SMTP
- ✅ **Higher Deliverability**: Professional email service
- ✅ **Better Analytics**: Detailed delivery tracking
- ✅ **No Connection Issues**: No SMTP timeout problems

### Reliability Features
- ✅ **Automatic Fallback**: Gmail backup if Brevo fails
- ✅ **Retry Logic**: Exponential backoff for failed sends
- ✅ **Health Monitoring**: Real-time service status
- ✅ **Error Handling**: Comprehensive error management

### Cost Benefits
- ✅ **Free Tier**: 300 emails/day free
- ✅ **Scalable**: Pay only for what you use
- ✅ **No Infrastructure**: Managed service

## 🔐 Security Features

- **API Key Authentication**: Secure API-based sending
- **Domain Verification**: Verified sender domains
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete email activity logs
- **Fraud Detection**: Built-in security monitoring

## 📞 Support

- **Brevo Documentation**: [developers.brevo.com](https://developers.brevo.com)
- **Brevo Support**: Available through dashboard
- **System Logs**: Check server logs for detailed error information

---

## ✅ Migration Checklist

- [ ] Brevo account created and verified
- [ ] API key generated and configured
- [ ] SMTP credentials obtained
- [ ] Environment variables updated
- [ ] Dependencies installed
- [ ] Backend server restarted
- [ ] Brevo connection tested
- [ ] Gmail fallback verified
- [ ] OTP emails tested
- [ ] Notification emails tested
- [ ] Health monitoring verified

**Migration Complete! 🎉**
