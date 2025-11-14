# Render Environment Variables Setup

## 🚨 **Current Issue**
Your backend is crashing because AWS S3 environment variables are not configured in Render.

## 🔧 **Quick Fix - Add Environment Variables in Render**

### **Step 1: Go to Render Dashboard**
1. Login to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Click on **"Environment"** tab

### **Step 2: Add AWS S3 Environment Variables**
Add these 4 environment variables:

```
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=urbansetu-mobile-apps-your-suffix
```

### **Step 3: Deploy**
1. Click **"Save Changes"**
2. Render will automatically redeploy
3. Check logs to confirm S3 is working

## 🎯 **What Happens After Setup**

### **With S3 Configured:**
- ✅ Server starts successfully
- ✅ Supports files up to 200MB
- ✅ Uses AWS S3 for storage
- ✅ Admin can upload large APKs

### **Without S3 (Current):**
- ❌ Server crashes on startup
- ❌ "bucket is required" error
- ❌ Deployment fails

## 🔄 **Fallback System**

The code now includes a fallback system:
- **If AWS S3 configured** → Uses S3 (supports 200MB)
- **If AWS S3 not configured** → Uses Cloudinary (10MB limit)

## 📋 **Environment Variables Reference**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Yes | AWS Access Key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS Secret Key | `abc123...` |
| `AWS_REGION` | No | AWS Region | `us-east-1` |
| `AWS_S3_BUCKET_NAME` | Yes | S3 Bucket Name | `urbansetu-mobile-apps-123` |

## 🚀 **After Adding Variables**

1. **Server will start** without crashing
2. **Admin panel** will work for file uploads
3. **Header/About pages** will work for downloads
4. **Large APK files** (up to 200MB) supported

## 🆘 **If You Don't Want to Set Up AWS S3 Right Now**

The system will automatically fall back to Cloudinary with a 10MB limit. Your server will start working again, but you'll need to compress APK files to under 10MB.

## ✅ **Test After Setup**

1. **Check server logs** - should show "Using AWS S3 deployment route"
2. **Test S3 connection** - `GET /api/deployment/test-s3`
3. **Upload test file** - via admin panel
4. **Test download** - via Header/About pages

## 🎉 **Summary**

**Add the 4 AWS environment variables in Render, and your server will start working with 200MB APK support!**
