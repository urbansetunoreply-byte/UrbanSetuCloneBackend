import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { verifyToken } from '../utils/verify.js';

const router = express.Router();

// Test Cloudinary connection
router.get('/test-cloudinary', async (req, res) => {
  try {
    console.log('Testing Cloudinary connection...');
    const result = await cloudinary.v2.api.ping();
    res.json({
      success: true,
      message: 'Cloudinary connection successful',
      result: result
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed: ' + error.message
    });
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  console.log('Multer error:', error);
  if (error instanceof multer.MulterError) {
    console.log('Multer error code:', error.code);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large for Cloudinary free plan. Maximum size is 10MB. Please compress your APK file or upgrade to Cloudinary Pro plan.'
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

// Configure Cloudinary
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set'
});

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer with memory storage for better control
const upload = multer({ 
  storage: multer.memoryStorage(), // Use memory storage instead of CloudinaryStorage
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (Cloudinary's limit)
    fieldSize: 10 * 1024 * 1024, // 10MB for form fields
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

// Get all deployment files
router.get('/', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'rootadmin')) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
    }
    const result = await cloudinary.v2.search
      .expression('folder:mobile-apps')
      .sort_by('created_at', 'desc')
      .max_results(50)
      .execute();

    const files = result.resources.map(file => ({
      id: file.public_id,
      name: file.original_filename || file.public_id.split('/').pop(),
      url: file.secure_url,
      size: file.bytes,
      format: file.format,
      platform: getPlatformFromFormat(file.format),
      version: extractVersionFromFilename(file.original_filename || file.public_id),
      createdAt: file.created_at,
      isActive: file.public_id.includes('latest'), // Files with 'latest' in name are active
    }));

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

// Get active deployment files (latest versions)
router.get('/active', async (req, res) => {
  try {
    const result = await cloudinary.v2.search
      .expression('folder:mobile-apps AND public_id:latest*')
      .sort_by('created_at', 'desc')
      .max_results(10)
      .execute();

    const activeFiles = result.resources.map(file => ({
      id: file.public_id,
      name: file.original_filename || file.public_id.split('/').pop(),
      url: file.secure_url,
      size: file.bytes,
      format: file.format,
      platform: getPlatformFromFormat(file.format),
      version: extractVersionFromFilename(file.original_filename || file.public_id),
      createdAt: file.created_at,
    }));

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

// Upload new deployment file
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
        message: 'No file uploaded or file upload failed. Please check file size (max 500MB) and file type.'
      });
    }

    const { platform, version, description, isActive } = req.body;
    const file = req.file;

    // Create a new public_id with platform and version info
    const timestamp = Date.now();
    const baseName = `${platform}-${version || 'v1.0.0'}-${timestamp}`;
    const publicId = `mobile-apps/latest-${baseName}`;

    // Upload to Cloudinary with specific public_id using buffer
    console.log('Uploading to Cloudinary:', {
      publicId: publicId,
      fileSize: file.size,
      fileType: file.mimetype,
      bufferSize: file.buffer ? file.buffer.length : 'No buffer'
    });

    // Check file size before attempting upload
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      console.log('File too large for Cloudinary free plan:', file.size);
      
      // For now, we'll reject files larger than 10MB
      // In the future, we can implement alternative hosting
      return res.status(413).json({
        success: false,
        message: 'File too large for Cloudinary free plan. Maximum size is 10MB. Please either: 1) Compress your APK file to under 10MB, 2) Upgrade to Cloudinary Pro plan ($89/month), or 3) Contact support for alternative hosting solutions.'
      });
    }

    let uploadResult;
    try {
      // Use regular upload for files under 10MB
      uploadResult = await cloudinary.v2.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          public_id: publicId,
          resource_type: 'raw',
          folder: 'mobile-apps',
          overwrite: true,
        }
      );
      console.log('Cloudinary upload successful:', uploadResult.public_id);
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload to Cloudinary: ' + cloudinaryError.message
      });
    }

    // Store deployment info in database (you can create a deployment model)
    const deploymentInfo = {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      platform: platform || getPlatformFromFormat(file.format),
      version: version || extractVersionFromFilename(file.originalname),
      description: description || '',
      isActive: isActive === 'true',
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
      fileSize: uploadResult.bytes,
      format: uploadResult.format,
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: deploymentInfo
    });
  } catch (error) {
    console.error('Error uploading deployment file:', error);
    
    // Handle specific multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 500MB.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please use the correct form field name.'
      });
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
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
    const allFiles = await cloudinary.v2.search
      .expression('folder:mobile-apps')
      .execute();

    for (const file of allFiles.resources) {
      if (file.public_id.includes('latest')) {
        const newPublicId = file.public_id.replace('latest-', '');
        await cloudinary.v2.uploader.rename(file.public_id, newPublicId);
      }
    }

    // Add 'latest' to the selected file
    const targetFile = await cloudinary.v2.api.resource(id);
    const newPublicId = targetFile.public_id.replace('mobile-apps/', 'mobile-apps/latest-');
    await cloudinary.v2.uploader.rename(id, newPublicId);

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
    
    await cloudinary.v2.uploader.destroy(id, { resource_type: 'raw' });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deployment file:', error);
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
