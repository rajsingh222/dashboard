import express from 'express';
import multer from 'multer';
import path from 'path';
import ProjectDetails from '../models/ProjectDetails.js';
import Project from '../models/Project.js';
import { protect, authorize } from '../middleware/auth.js';
import { 
  projectImageStorage, 
  projectVideoStorage, 
  deleteFromCloudinary, 
  extractPublicId 
} from '../config/cloudinary.js';

const router = express.Router();

// Configure multer for image uploads (using Cloudinary)
const imageUpload = multer({
  storage: projectImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Configure multer for video uploads (using Cloudinary)
const videoUpload = multer({
  storage: projectVideoStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|avi|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
});

// Get project details
router.get('/get/:project_id', async (req, res) => {
  try {
    const { project_id } = req.params;
    
    console.log('[ProjectDetails API] Fetching details for project:', project_id);
    
    const projectDetails = await ProjectDetails.findOne({ project_id });
    
    console.log('[ProjectDetails API] Found details:', projectDetails ? 'Yes' : 'No');
    
    if (!projectDetails) {
      return res.json({
        success: true,
        data: null,
        message: 'No project details found. Default values will be used.'
      });
    }

    console.log('[ProjectDetails API] Returning project details:', {
      project_title: projectDetails.project_title,
      structure_type: projectDetails.structure_type,
      city: projectDetails.city,
      images_count: projectDetails.project_images?.length || 0,
      videos_count: projectDetails.project_videos?.length || 0
    });

    res.json({
      success: true,
      data: projectDetails
    });
  } catch (error) {
    console.error('[ProjectDetails API] Error fetching project details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project details',
      error: error.message
    });
  }
});

// Save or update project details (admin only)
router.post('/save', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      project_id,
      project_title,
      structure_type,
      construction_date,
      area,
      city,
      state,
      country,
      latitude,
      longitude,
      updated_by
    } = req.body;

    console.log('[ProjectDetails API] Saving details for project:', project_id);
    console.log('[ProjectDetails API] Data received:', {
      project_title,
      structure_type,
      city,
      country,
      updated_by
    });

    if (!project_id || !updated_by) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and updated_by are required'
      });
    }

    // Update ProjectDetails
    const projectDetails = await ProjectDetails.findOneAndUpdate(
      { project_id },
      {
        project_id,
          project_title,
          structure_type,
          construction_date: construction_date || null,
          area,
          city,
          state: state || '',
          country: country || 'India',
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          updated_by
      },
      { upsert: true, new: true }
    );

    console.log('[ProjectDetails API] Project details saved successfully for project:', project_id);

    // Sync back to main Project collection
    try {
      const mainProject = await Project.findById(project_id);
      
      if (mainProject) {
        // Update the main project with the new data
        mainProject.projectName = project_title || mainProject.projectName;
        mainProject.projectType = structure_type || mainProject.projectType;
        mainProject.startDate = construction_date || mainProject.startDate;
        
        // Update nested location object
        if (!mainProject.location) {
          mainProject.location = {};
        }
        
  mainProject.location.address = area || mainProject.location.address;
  mainProject.location.city = city || mainProject.location.city;
  mainProject.location.state = state || mainProject.location.state;
  mainProject.location.country = country || mainProject.location.country;
        
        if (!mainProject.location.coordinates) {
          mainProject.location.coordinates = {};
        }
        
        if (latitude) mainProject.location.coordinates.latitude = parseFloat(latitude);
        if (longitude) mainProject.location.coordinates.longitude = parseFloat(longitude);
        
        await mainProject.save();
        
        console.log('[ProjectDetails API] Main Project synced successfully');
      } else {
        console.log('[ProjectDetails API] Warning: Main project not found for ID:', project_id);
      }
    } catch (syncError) {
      console.error('[ProjectDetails API] Error syncing to main Project:', syncError);
      // Don't fail the request if sync fails
    }

    res.json({
      success: true,
      message: 'Project details saved successfully',
      data: projectDetails
    });
  } catch (error) {
    console.error('[ProjectDetails API] Error saving project details:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving project details',
      error: error.message
    });
  }
});

// Upload images (admin only)
router.post('/upload-images', protect, authorize('admin'), imageUpload.array('images', 10), async (req, res) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Cloudinary URLs are in req.files[].path
    const imageUrls = req.files.map(file => file.path);

    // Update project details with new images
    const projectDetails = await ProjectDetails.findOne({ project_id });
    
    if (projectDetails) {
      projectDetails.project_images = [
        ...projectDetails.project_images,
        ...imageUrls
      ];
      await projectDetails.save();
    } else {
      // Create new project details with images
      await ProjectDetails.create({
        project_id,
        project_images: imageUrls,
        updated_by: req.body.updated_by || 'admin'
      });
    }

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: imageUrls
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    // Clean up uploaded files from Cloudinary if error occurs
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const publicId = extractPublicId(file.path);
        if (publicId) {
          await deleteFromCloudinary(publicId, 'image');
        }
      }
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});

// Upload video (admin only)
router.post('/upload-video', protect, authorize('admin'), videoUpload.single('video'), async (req, res) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Cloudinary URL is in req.file.path
    const videoUrl = req.file.path;

    // Update project details with new video
    const projectDetails = await ProjectDetails.findOne({ project_id });
    
    if (projectDetails) {
      projectDetails.project_videos = [
        ...projectDetails.project_videos,
        videoUrl
      ];
      await projectDetails.save();
    } else {
      // Create new project details with video
      await ProjectDetails.create({
        project_id,
        project_videos: [videoUrl],
        updated_by: req.body.updated_by || 'admin'
      });
    }

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: videoUrl
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    // Clean up uploaded file from Cloudinary if error occurs
    if (req.file && req.file.path) {
      const publicId = extractPublicId(req.file.path);
      if (publicId) {
        await deleteFromCloudinary(publicId, 'video');
      }
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading video',
      error: error.message
    });
  }
});

// Delete image (admin only)
router.delete('/delete-image', protect, authorize('admin'), async (req, res) => {
  try {
    const { project_id, image_url } = req.body;

    if (!project_id || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and image URL are required'
      });
    }

    const projectDetails = await ProjectDetails.findOne({ project_id });
    
    if (!projectDetails) {
      return res.status(404).json({
        success: false,
        message: 'Project details not found'
      });
    }

    // Remove image URL from array
    projectDetails.project_images = projectDetails.project_images.filter(
      img => img !== image_url
    );
    await projectDetails.save();

    // Delete file from Cloudinary
    const publicId = extractPublicId(image_url);
    if (publicId) {
      await deleteFromCloudinary(publicId, 'image');
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

// Delete video (admin only)
router.delete('/delete-video', protect, authorize('admin'), async (req, res) => {
  try {
    const { project_id, video_url } = req.body;

    if (!project_id || !video_url) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and video URL are required'
      });
    }

    const projectDetails = await ProjectDetails.findOne({ project_id });
    
    if (!projectDetails) {
      return res.status(404).json({
        success: false,
        message: 'Project details not found'
      });
    }

    // Remove video URL from array
    projectDetails.project_videos = projectDetails.project_videos.filter(
      vid => vid !== video_url
    );
    await projectDetails.save();

    // Delete file from Cloudinary
    const publicId = extractPublicId(video_url);
    if (publicId) {
      await deleteFromCloudinary(publicId, 'video');
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting video',
      error: error.message
    });
  }
});

// Get unified project data (merges Project + ProjectDetails)
router.get('/unified/:project_id', async (req, res) => {
  try {
    const { project_id } = req.params;
    
    console.log('[ProjectDetails API] Fetching unified data for project:', project_id);
    
    // Fetch both in parallel
    const [mainProject, projectDetails] = await Promise.all([
      Project.findById(project_id).populate('owner', 'fullName email'),
      ProjectDetails.findOne({ project_id })
    ]);

    if (!mainProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Merge the data - ProjectDetails takes priority where it exists
    const unifiedData = {
      // Main project data
      _id: mainProject._id,
      projectId: mainProject.projectId,
      projectName: projectDetails?.project_title || mainProject.projectName,
      description: mainProject.description,
      owner: mainProject.owner,
      ownerEmail: mainProject.ownerEmail,
      
      // Type/Status
      projectType: projectDetails?.structure_type || mainProject.projectType,
      status: mainProject.status,
      
      // Dates
      startDate: projectDetails?.construction_date || mainProject.startDate,
      endDate: mainProject.endDate,
      createdAt: mainProject.createdAt,
      updatedAt: mainProject.updatedAt,
      
      // Location - merge both sources
      location: {
        address: projectDetails?.area || mainProject.location?.address || '',
        city: projectDetails?.city || mainProject.location?.city || '',
        state: projectDetails?.state || mainProject.location?.state || '',
        country: projectDetails?.country || mainProject.location?.country || 'India',
        pincode: mainProject.location?.pincode || '',
        coordinates: {
          latitude: projectDetails?.latitude || mainProject.location?.coordinates?.latitude,
          longitude: projectDetails?.longitude || mainProject.location?.coordinates?.longitude
        }
      },
      
      // Client & Testing Agency
      client: mainProject.client,
      testingAgency: mainProject.testingAgency,
      
      // Media from ProjectDetails
      project_images: projectDetails?.project_images || [],
      project_videos: projectDetails?.project_videos || [],
      
      // Arrays
      drawings: mainProject.drawings || [],
      reports: mainProject.reports || [],
      sensors: mainProject.sensors || [],
      teamMembers: mainProject.teamMembers || [],
      
      // Flags
      isActive: mainProject.isActive,
      
      // Metadata
      hasProjectDetails: !!projectDetails,
      lastUpdatedBy: projectDetails?.updated_by
    };

    console.log('[ProjectDetails API] Unified data prepared for:', mainProject.projectId);

    res.json({
      success: true,
      data: unifiedData
    });
  } catch (error) {
    console.error('[ProjectDetails API] Error fetching unified data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unified project data',
      error: error.message
    });
  }
});

export default router;
