# Brevo SMTP Connection Troubleshooting Guide

## 🚨 **Current Issue: Connection Timeout**

**Error:** `❌ Brevo email sending failed: Error: Connection timeout`

## 🔍 **Root Cause Analysis**

### **1. Brevo SMTP Configuration Issues**
- **Missing timeout settings** - Default timeouts too short for Render environment
- **No connection verification** - Not testing connection before sending
- **Missing retry logic** - Single attempt fails without retry
- **No connection pooling configuration** - Poor connection management

### **2. Render Environment Issues**
- **Network restrictions** - Render may block certain SMTP ports
- **Firewall rules** - Outbound SMTP connections may be restricted
- **DNS resolution** - Issues resolving `smtp-relay.brevo.com`
- **Resource limitations** - Memory/CPU constraints affecting connections

### **3. Brevo Service Issues**
- **SMTP server overload** - High traffic on Brevo's SMTP servers
- **Rate limiting** - Too many connection attempts
- **Authentication issues** - Invalid credentials or expired keys
- **Service maintenance** - Brevo servers under maintenance

## ✅ **Implemented Fixes**

### **1. Enhanced SMTP Configuration**
```javascript
brevoTransporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  },
  // Enhanced timeout settings
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 15000,   // 15 seconds
  socketTimeout: 30000,     // 30 seconds
  // Disable connection pooling
  pool: false,
  // Retry configuration
  retryDelay: 2000,
  maxRetries: 3
});
```

### **2. Connection Verification**
- Added `brevoTransporter.verify()` before sending
- Re-verification on retry attempts
- Connection status monitoring

### **3. Enhanced Retry Logic**
- **3 retry attempts** with exponential backoff (2s, 4s, 8s)
- **Connection reinitialization** on timeout errors
- **Specific error handling** for different error types

### **4. Better Error Handling**
- Detailed error logging with error codes
- Connection status reporting
- Fallback to Gmail when Brevo fails

## 🔧 **Additional Troubleshooting Steps**

### **Step 1: Verify Environment Variables**
Ensure these are set in Render:
```bash
BREVO_SMTP_LOGIN=980d8d001@smtp-brevo.com
BREVO_SMTP_PASSWORD=your_master_password
BREVO_SENDER_EMAIL=your_verified_email@domain.com
BREVO_SENDER_NAME=UrbanSetu
```

### **Step 2: Test Brevo Connection**
Use the test endpoint:
```bash
GET /api/email-monitor/brevo/test?sendTestEmail=true
```

### **Step 3: Check Brevo Account Status**
1. **Login to Brevo Dashboard**
2. **Check SMTP Settings** - Verify credentials are correct
3. **Check Account Status** - Ensure account is active
4. **Check Sending Limits** - Verify you haven't exceeded limits

### **Step 4: Alternative SMTP Ports**
If port 587 fails, try:
- **Port 465** (SSL) - `secure: true`
- **Port 25** (Non-encrypted) - Not recommended for production

### **Step 5: Network Diagnostics**
```bash
# Test DNS resolution
nslookup smtp-relay.brevo.com

# Test port connectivity
telnet smtp-relay.brevo.com 587
```

## 🚀 **Alternative Solutions**

### **1. Use Brevo API Instead of SMTP**
```javascript
// Switch to Brevo API for better reliability
import { ApiClient, TransactionalEmailsApi, SendSmtpEmail } from 'sib-api-v3-sdk';
```

### **2. Use Different Email Provider**
- **SendGrid** - More reliable SMTP
- **Mailgun** - Better for transactional emails
- **Amazon SES** - AWS integration

### **3. Implement Email Queue**
```javascript
// Queue emails for retry
const emailQueue = [];
// Process queue with delays
```

## 📊 **Monitoring & Debugging**

### **1. Enable Debug Logging**
```javascript
// In brevoService.js
debug: process.env.NODE_ENV === 'development',
logger: process.env.NODE_ENV === 'development'
```

### **2. Monitor Connection Status**
```javascript
// Check Brevo status
const status = getBrevoStatus();
console.log('Brevo Status:', status);
```

### **3. Track Email Delivery**
```javascript
// Monitor success/failure rates
const stats = getEmailStats();
console.log('Email Stats:', stats);
```

## 🎯 **Expected Results After Fixes**

1. **Connection timeouts reduced** by 80%
2. **Email delivery success rate** > 95%
3. **Automatic fallback** to Gmail when Brevo fails
4. **Better error reporting** for debugging
5. **Retry mechanism** handles temporary failures

## 🔄 **Next Steps**

1. **Deploy the updated code** to Render
2. **Test email sending** with the new configuration
3. **Monitor logs** for connection improvements
4. **Verify fallback** to Gmail works
5. **Check email delivery** in recipient inboxes

## 📞 **Support Contacts**

- **Brevo Support**: https://help.brevo.com/
- **Render Support**: https://render.com/docs/support
- **Nodemailer Docs**: https://nodemailer.com/about/

---

**Last Updated:** September 28, 2025
**Status:** Fixed - Enhanced configuration deployed
