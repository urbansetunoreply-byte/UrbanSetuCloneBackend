import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for Cloudinary - IMAGES
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'urbansetu-chat/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
    resource_type: 'image',
  },
});

// Configure multer storage for Cloudinary - VIDEOS (resource_type video)
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'urbansetu-chat/videos',
    allowed_formats: ['mp4', 'webm', 'ogg', 'mov', 'mkv'],
    resource_type: 'video',
  },
});

// Configure multer storage for Cloudinary - DOCUMENTS (resource_type raw)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'urbansetu-chat/documents',
    // Allow any document format; Cloudinary "raw" accepts arbitrary
    resource_type: 'raw',
  },
});

// Configure multer storage for Cloudinary - AUDIO (resource_type video per Cloudinary spec for audio)
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'urbansetu-chat/audio',
    // Cloudinary treats audio as resource_type 'video'
    allowed_formats: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'opus'],
    resource_type: 'video',
  },
});

// Configure multer per type (5MB limit)
const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed!'));
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) return cb(null, true);
    return cb(new Error('Only video files are allowed!'));
  },
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // accept any non-image/video as document, plus common application/* types
    if (
      file.mimetype.startsWith('application/') ||
      file.mimetype.startsWith('text/') ||
      (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/'))
    ) return cb(null, true);
    return cb(new Error('Invalid document type'));
  },
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) return cb(null, true);
    return cb(new Error('Only audio files are allowed!'));
  },
});

// Upload single image
router.post('/image', uploadImage.single('image'), async (req, res) => {
  try {
    console.log('Upload request received:', req.file ? 'File present' : 'No file');
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
    });
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('File uploaded successfully:', req.file.path);
    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: 'File upload error', error: error.message });
  }
  if (error) {
    return res.status(400).json({ message: error.message || 'Upload error' });
  }
  next();
});

// Upload multiple images
router.post('/images', uploadImage.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const uploadedImages = req.files.map(file => ({
      imageUrl: file.path,
      publicId: file.filename,
    }));

    res.status(200).json({
      message: 'Images uploaded successfully',
      images: uploadedImages,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading images', error: error.message });
  }
});

// Delete image from Cloudinary
router.delete('/image/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.v2.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.status(200).json({ message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete image' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
});

// Upload single video
router.post('/video', uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }
    // CloudinaryStorage returns path/public id similar to images
    res.status(200).json({
      message: 'Video uploaded successfully',
      videoUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Error uploading video', error: error.message });
  }
});

// Upload single document
router.post('/document', uploadDocument.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No document file provided' });
    }
    res.status(200).json({
      message: 'Document uploaded successfully',
      documentUrl: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
});

// Upload single audio
router.post('/audio', uploadAudio.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }
    res.status(200).json({
      message: 'Audio uploaded successfully',
      audioUrl: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ message: 'Error uploading audio', error: error.message });
  }
});

export default router;