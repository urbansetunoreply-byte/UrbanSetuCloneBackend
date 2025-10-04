# AWS S3 Setup Guide for Large APK Storage

## 🚀 **Why AWS S3 for Large APK Storage?**

- **File Size Limit**: Up to 5TB per file (vs Cloudinary's 10MB free limit)
- **Cost**: ~$0.023 per GB/month + $0.09 per GB transfer
- **Reliability**: 99.999999999% (11 9's)
- **CDN**: CloudFront integration available
- **Global**: Multiple regions worldwide

## 📋 **Step 1: Create AWS Account**

1. Go to [AWS Console](https://aws.amazon.com/)
2. Sign up for free account (12 months free tier)
3. Add payment method (required even for free tier)

## 🪣 **Step 2: Create S3 Bucket**

1. **Login to AWS Console**
2. **Navigate to S3 Service**
3. **Click "Create bucket"**
4. **Configure bucket:**
   ```
   Bucket name: urbansetu-mobile-apps-[random-suffix]
   Region: us-east-1 (or your preferred region)
   Object Ownership: ACLs enabled
   Block Public Access: Uncheck "Block all public access"
   ```
5. **Click "Create bucket"**

## 🔑 **Step 3: Create IAM User for API Access**

1. **Navigate to IAM Service**
2. **Click "Users" → "Create user"**
3. **User name**: `urbansetu-s3-user`
4. **Access type**: Programmatic access
5. **Attach policies**: Create custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::urbansetu-mobile-apps-*",
                "arn:aws:s3:::urbansetu-mobile-apps-*/*"
            ]
        }
    ]
}
```

6. **Save Access Key ID and Secret Access Key**

## ⚙️ **Step 4: Configure Environment Variables**

Add these to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=urbansetu-mobile-apps-your-suffix
```

## 🔧 **Step 5: Update Render Environment Variables**

1. **Go to Render Dashboard**
2. **Select your backend service**
3. **Go to Environment tab**
4. **Add these variables:**
   ```
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=urbansetu-mobile-apps-your-suffix
   ```

## 📱 **Step 6: Test the Setup**

1. **Deploy your backend with S3 configuration**
2. **Test S3 connection:**
   ```
   GET /api/deployment/test-s3
   ```
3. **Upload a test APK:**
   ```
   POST /api/deployment/upload
   ```

## 💰 **Cost Estimation for 200MB APK:**

| Usage | Monthly Cost |
|-------|-------------|
| **Storage (200MB)** | ~$0.005 |
| **Downloads (1000/month)** | ~$0.18 |
| **Uploads (10/month)** | ~$0.001 |
| **Total** | **~$0.19/month** |

## 🛡️ **Security Best Practices:**

1. **Use IAM roles instead of access keys when possible**
2. **Enable MFA on AWS account**
3. **Set up CloudTrail for audit logging**
4. **Use bucket policies to restrict access**
5. **Enable versioning for file recovery**

## 🌐 **Optional: CloudFront CDN Setup**

For faster global downloads:

1. **Create CloudFront distribution**
2. **Origin**: Your S3 bucket
3. **Default root object**: index.html
4. **Caching**: Optimize for downloads
5. **Update download URLs to use CloudFront domain**

## 🔄 **Migration from Cloudinary:**

1. **Keep both systems running temporarily**
2. **Update frontend to use S3 URLs**
3. **Migrate existing files to S3**
4. **Remove Cloudinary dependency**

## 📊 **Monitoring & Alerts:**

1. **Set up CloudWatch alarms for:**
   - Storage usage
   - Request count
   - Error rates
2. **Configure billing alerts**
3. **Monitor download patterns**

## 🆘 **Troubleshooting:**

### **Common Issues:**

1. **"Access Denied"**
   - Check IAM permissions
   - Verify bucket policy

2. **"Bucket not found"**
   - Check bucket name spelling
   - Verify region

3. **"Invalid credentials"**
   - Regenerate access keys
   - Check environment variables

### **Test Commands:**

```bash
# Test S3 connection
curl -X GET https://your-backend.com/api/deployment/test-s3

# List files
curl -X GET https://your-backend.com/api/deployment/ -H "Authorization: Bearer your-token"

# Upload test file
curl -X POST https://your-backend.com/api/deployment/upload \
  -H "Authorization: Bearer your-token" \
  -F "file=@test.apk" \
  -F "platform=android" \
  -F "version=1.0.0"
```

## ✅ **Success Checklist:**

- [ ] AWS account created
- [ ] S3 bucket created with public access
- [ ] IAM user created with proper permissions
- [ ] Environment variables configured
- [ ] Backend deployed with S3 configuration
- [ ] Test upload successful
- [ ] Download links working
- [ ] Admin panel showing S3 files

## 🎯 **Next Steps:**

1. **Set up the AWS S3 bucket**
2. **Configure environment variables**
3. **Deploy the updated backend**
4. **Test with your 200MB APK**
5. **Update frontend to use S3 URLs**

This setup will handle your 200MB APK files efficiently and cost-effectively! 🚀
