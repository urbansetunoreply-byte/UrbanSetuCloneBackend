import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, ListBucketsCommand, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Configure AWS S3 Client v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Check if AWS S3 is properly configured
const bucketName = process.env.AWS_S3_BUCKET_NAME;
if (!bucketName) {
  console.error('❌ AWS_S3_BUCKET_NAME environment variable is not set');
  console.error('Please configure AWS S3 environment variables in Render dashboard');
}

// Configure multer for S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName || 'placeholder-bucket',
    acl: 'public-read',
    key: function (req, file, cb) {
      const { platform, version } = req.body;
      const timestamp = Date.now();
      const baseName = `${platform}-${version || 'v1.0.0'}-${timestamp}`;
      const fileName = `mobile-apps/latest-${baseName}.${file.originalname.split('.').pop()}`;
      cb(null, fileName);
    },
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        platform: req.body.platform,
        version: req.body.version,
        description: req.body.description
      });
    }
  }),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit
    fieldSize: 200 * 1024 * 1024, // 200MB for form fields
    files: 1, // Only one file
  },
  fileFilter: (req, file, cb) => {
    console.log('File being processed:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Allow specific file types
    const allowedTypes = [
      'application/vnd.android.package-archive', // APK
      'application/octet-stream', // iOS/IPA
      'application/x-msdownload', // EXE
      'application/x-msi', // MSI
      'application/x-apple-diskimage', // DMG
      'application/x-newton-compatible-pkg', // PKG
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(apk|ipa|exe|msi|dmg|pkg)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only APK, IPA, EXE, MSI, DMG, and PKG files are allowed.'), false);
    }
  },
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.log('Multer error:', error);
  if (error instanceof multer.MulterError) {
    console.log('Multer error code:', error.code);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 200MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please use the correct form field name.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed per upload.'
      });
    }
  }
  next(error);
};

// Test S3 connection
router.get('/test-s3', async (req, res) => {
  try {
    if (!bucketName) {
      return res.status(500).json({
        success: false,
        message: 'AWS S3 not configured. Please set AWS_S3_BUCKET_NAME environment variable.'
      });
    }
    
    console.log('Testing S3 connection...');
    const command = new ListBucketsCommand({});
    const result = await s3Client.send(command);
    res.json({
      success: true,
      message: 'S3 connection successful',
      buckets: result.Buckets.map(bucket => bucket.Name)
    });
  } catch (error) {
    console.error('S3 test error:', error);
    res.status(500).json({
      success: false,
      message: 'S3 connection failed: ' + error.message
    });
  }
});

// Get all deployment files from S3
router.get('/', verifyToken, async (req, res) => {
  try {
    if (!bucketName) {
      return res.status(500).json({
        success: false,
        message: 'AWS S3 not configured. Please set AWS_S3_BUCKET_NAME environment variable.'
      });
    }
    
    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'mobile-apps/',
      MaxKeys: 50
    });

    const result = await s3Client.send(command);
    
    const files = result.Contents.map(file => {
      const fileName = file.Key.split('/').pop();
      const fileExtension = fileName.split('.').pop();
      
      return {
        id: file.Key,
        name: fileName,
        url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${file.Key}`,
        size: file.Size,
        format: fileExtension,
        platform: getPlatformFromFormat(fileExtension),
        version: extractVersionFromFilename(fileName),
        createdAt: file.LastModified,
        isActive: file.Key.includes('latest'),
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error fetching deployment files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deployment files'
    });
  }
});

// Get active deployment files
router.get('/active', async (req, res) => {
  try {
    if (!bucketName) {
      return res.status(500).json({
        success: false,
        message: 'AWS S3 not configured. Please set AWS_S3_BUCKET_NAME environment variable.'
      });
    }
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'mobile-apps/latest-',
      MaxKeys: 10
    });

    const result = await s3Client.send(command);
    
    const activeFiles = result.Contents.map(file => {
      const fileName = file.Key.split('/').pop();
      const fileExtension = fileName.split('.').pop();
      
      return {
        id: file.Key,
        name: fileName,
        url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${file.Key}`,
        size: file.Size,
        format: fileExtension,
        platform: getPlatformFromFormat(fileExtension),
        version: extractVersionFromFilename(fileName),
        createdAt: file.LastModified,
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: activeFiles
    });
  } catch (error) {
    console.error('Error fetching active deployment files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active deployment files'
    });
  }
});

// Upload new deployment file to S3
router.post('/upload', verifyToken, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    console.log('Upload request received:', {
      hasFile: !!req.file,
      fileSize: req.file?.size,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length']
    });

    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    // Check for multer errors (file size, file type, etc.)
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file upload failed. Please check file size (max 200MB) and file type.'
      });
    }

    const { platform, version, description, isActive } = req.body;
    const file = req.file;

    console.log('S3 upload successful:', file.location);

    // Store deployment info
    const deploymentInfo = {
      publicId: file.key,
      url: file.location,
      platform: platform || getPlatformFromFormat(file.mimetype),
      version: version || extractVersionFromFilename(file.originalname),
      description: description || '',
      isActive: isActive === 'true',
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      fileSize: file.size,
      format: file.mimetype,
    };

    res.json({
      success: true,
      message: 'File uploaded successfully to S3',
      data: deploymentInfo
    });
  } catch (error) {
    console.error('Error uploading deployment file:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + (error.message || 'Unknown error')
    });
  }
});

// Set active deployment
router.put('/set-active/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;
    
    // First, remove 'latest' from all files
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'mobile-apps/latest-'
    });

    const allFiles = await s3Client.send(listCommand);
    
    for (const file of allFiles.Contents) {
      if (file.Key.includes('latest')) {
        const newKey = file.Key.replace('latest-', '');
        const copyCommand = new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${file.Key}`,
          Key: newKey
        });
        await s3Client.send(copyCommand);
        
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: file.Key
        });
        await s3Client.send(deleteCommand);
      }
    }

    // Set the selected file as active by adding 'latest' prefix
    const fileKey = decodeURIComponent(id);
    const newKey = fileKey.replace('mobile-apps/', 'mobile-apps/latest-');
    
    const copyCommand = new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${fileKey}`,
      Key: newKey
    });
    await s3Client.send(copyCommand);

    res.json({
      success: true,
      message: 'Active deployment updated successfully'
    });
  } catch (error) {
    console.error('Error setting active deployment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set active deployment'
    });
  }
});

// Delete deployment file
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }

    const { id } = req.params;
    const fileKey = decodeURIComponent(id);
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileKey
    });
    await s3Client.send(deleteCommand);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file'
    });
  }
});

// Helper functions
function getPlatformFromFormat(format) {
  const platformMap = {
    'apk': 'android',
    'ipa': 'ios',
    'exe': 'windows',
    'msi': 'windows',
    'dmg': 'macos',
    'pkg': 'macos',
  };
  return platformMap[format] || 'unknown';
}

function extractVersionFromFilename(filename) {
  const versionMatch = filename.match(/v?(\d+\.\d+\.\d+)/);
  return versionMatch ? versionMatch[1] : '1.0.0';
}

export default router;
