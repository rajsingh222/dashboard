import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/media');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    console.log('File filter - Field:', file.fieldname, 'Name:', file.originalname);
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const allowedVideoTypes = /mp4|avi|mov|wmv|webm/;
    const extname = path.extname(file.originalname).toLowerCase();
    
    if (file.fieldname === 'sensorLayout') {
      if (allowedImageTypes.test(extname.replace('.', ''))) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for sensor layout!'));
      }
    } else if (file.fieldname === 'modeShapeVideo') {
      if (allowedVideoTypes.test(extname.replace('.', ''))) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for mode shapes!'));
      }
    } else {
      cb(null, true);
    }
  }
});

// Upload sensor layout image
router.post('/upload/sensor-layout/:projectId', protect, upload.single('sensorLayout'), async (req, res) => {
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
      // Delete uploaded file if project not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('Project found:', project.projectName);

    // Delete old sensor layout image if exists
    if (project.sensorLayoutImage && project.sensorLayoutImage.filePath) {
      const oldFilePath = path.join(__dirname, '..', project.sensorLayoutImage.filePath);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const filePath = `/uploads/media/${req.file.filename}`;
    
    project.sensorLayoutImage = {
      fileName: req.file.originalname,
      filePath: filePath,
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
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
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

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', project.sensorLayoutImage.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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
router.post('/upload/mode-shape/:projectId', protect, upload.single('modeShapeVideo'), async (req, res) => {
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
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const filePath = `/uploads/media/${req.file.filename}`;
    
    const videoData = {
      fileName: req.file.originalname,
      filePath: filePath,
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
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
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
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', video.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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
