import express from 'express';
import multer from 'multer';
import path from 'path';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';
import { 
  sensorLayoutStorage, 
  modeShapeStorage,
  deleteFromCloudinary,
  extractPublicId
} from '../config/cloudinary.js';

const router = express.Router();

// Configure multer for sensor layout uploads (using Cloudinary)
const sensorLayoutUpload = multer({
  storage: sensorLayoutStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
  fileFilter: (req, file, cb) => {
    console.log('File filter - Field:', file.fieldname, 'Name:', file.originalname);
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const extname = path.extname(file.originalname).toLowerCase();
    
    if (allowedImageTypes.test(extname.replace('.', ''))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for sensor layout!'));
    }
  }
});

// Configure multer for mode shape video uploads (using Cloudinary)
const modeShapeUpload = multer({
  storage: modeShapeStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
  fileFilter: (req, file, cb) => {
    console.log('File filter - Field:', file.fieldname, 'Name:', file.originalname);
    const allowedVideoTypes = /mp4|avi|mov|wmv|webm/;
    const extname = path.extname(file.originalname).toLowerCase();
    
    if (allowedVideoTypes.test(extname.replace('.', ''))) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for mode shapes!'));
    }
  }
});

// Upload sensor layout image
router.post('/upload/sensor-layout/:projectId', protect, sensorLayoutUpload.single('sensorLayout'), async (req, res) => {
  try {
    console.log('=== UPLOAD SENSOR LAYOUT REQUEST ===');
    console.log('Project ID:', req.params.projectId);
    console.log('User:', req.user?.email);
    console.log('File received:', req.file ? req.file.filename : 'NO FILE');
    
    if (!req.file) {
      console.log('ERROR: No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      console.log('ERROR: Project not found:', req.params.projectId);
      // Delete uploaded file from Cloudinary if project not found
      const publicId = extractPublicId(req.file.path);
      if (publicId) {
        await deleteFromCloudinary(publicId, 'image');
      }
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('Project found:', project.projectName);

    // Delete old sensor layout image from Cloudinary if exists
    if (project.sensorLayoutImage && project.sensorLayoutImage.filePath) {
      const publicId = extractPublicId(project.sensorLayoutImage.filePath);
      if (publicId) {
        await deleteFromCloudinary(publicId, 'image');
      }
    }

    // Cloudinary URL is in req.file.path
    const filePath = req.file.path;
    
    project.sensorLayoutImage = {
      fileName: req.file.originalname,
      filePath: filePath, // This is now a Cloudinary URL
      uploadDate: new Date(),
      uploadedBy: req.user.email
    };

    await project.save();

    console.log('✓ Sensor layout uploaded successfully');
    console.log('File path:', filePath);

    res.status(200).json({
      success: true,
      message: 'Sensor layout image uploaded successfully',
      data: {
        fileName: req.file.originalname,
        filePath: filePath
      }
    });
  } catch (error) {
    console.error('ERROR uploading sensor layout:', error);
    if (req.file && req.file.path) {
      const publicId = extractPublicId(req.file.path);
      if (publicId) {
        await deleteFromCloudinary(publicId, 'image');
      }
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload sensor layout image',
      error: error.message
    });
  }
});

// Delete sensor layout image
router.delete('/delete/sensor-layout/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.sensorLayoutImage || !project.sensorLayoutImage.filePath) {
      return res.status(404).json({
        success: false,
        message: 'No sensor layout image found'
      });
    }

    // Delete file from Cloudinary
    const publicId = extractPublicId(project.sensorLayoutImage.filePath);
    if (publicId) {
      await deleteFromCloudinary(publicId, 'image');
    }

    project.sensorLayoutImage = undefined;
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Sensor layout image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sensor layout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sensor layout image',
      error: error.message
    });
  }
});

// Upload mode shape video
router.post('/upload/mode-shape/:projectId', protect, modeShapeUpload.single('modeShapeVideo'), async (req, res) => {
  try {
    console.log('=== UPLOAD MODE SHAPE VIDEO REQUEST ===');
    console.log('Project ID:', req.params.projectId);
    console.log('User:', req.user?.email);
    console.log('File received:', req.file ? req.file.filename : 'NO FILE');
    console.log('Body:', req.body);
    
    if (!req.file) {
      console.log('ERROR: No file in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, order } = req.body;
    
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      // Delete uploaded file from Cloudinary if project not found
      const publicId = extractPublicId(req.file.path);
      if (publicId) {
        await deleteFromCloudinary(publicId, 'video');
      }
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Cloudinary URL is in req.file.path
    const filePath = req.file.path;
    
    const videoData = {
      fileName: req.file.originalname,
      filePath: filePath, // This is now a Cloudinary URL
      title: title || `Mode Shape ${(project.modeShapeVideos?.length || 0) + 1}`,
      uploadDate: new Date(),
      uploadedBy: req.user.email,
      order: order || (project.modeShapeVideos?.length || 0) + 1
    };

    if (!project.modeShapeVideos) {
      project.modeShapeVideos = [];
    }

    project.modeShapeVideos.push(videoData);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Mode shape video uploaded successfully',
      data: videoData
    });
  } catch (error) {
    console.error('Error uploading mode shape video:', error);
    if (req.file && req.file.path) {
      const publicId = extractPublicId(req.file.path);
      if (publicId) {
        await deleteFromCloudinary(publicId, 'video');
      }
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload mode shape video',
      error: error.message
    });
  }
});

// Delete mode shape video
router.delete('/delete/mode-shape/:projectId/:videoId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const videoIndex = project.modeShapeVideos.findIndex(
      video => video._id.toString() === req.params.videoId
    );

    if (videoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const video = project.modeShapeVideos[videoIndex];
    
    // Delete file from Cloudinary
    const publicId = extractPublicId(video.filePath);
    if (publicId) {
      await deleteFromCloudinary(publicId, 'video');
    }

    project.modeShapeVideos.splice(videoIndex, 1);
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Mode shape video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mode shape video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete mode shape video',
      error: error.message
    });
  }
});

// Get media assets for a project
router.get('/get/:projectId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .select('sensorLayoutImage modeShapeVideos');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        sensorLayoutImage: project.sensorLayoutImage || null,
        modeShapeVideos: project.modeShapeVideos || []
      }
    });
  } catch (error) {
    console.error('Error fetching media assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media assets',
      error: error.message
    });
  }
});

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File is too large. Maximum size is 100MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  
  if (error) {
    console.error('Upload error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error uploading file'
    });
  }
  
  next();
});

export default router;
