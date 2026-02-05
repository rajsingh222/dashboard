import express from 'express';
import multer from 'multer';
import path from 'path';
import PanelReport from '../models/PanelReport.js';
import { panelReportStorage, deleteFromCloudinary, extractPublicId } from '../config/cloudinary.js';

const router = express.Router();

// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX allowed'), false);
  }
};

const upload = multer({
  storage: panelReportStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * @route   POST /api/panel-reports/upload
 * @desc    Upload a report for a panel
 * @access  Admin only
 */
router.post('/upload', upload.single('report'), async (req, res) => {
  try {
    const { project_id, panel_type, uploaded_by } = req.body;

    if (!project_id || !panel_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project_id, panel_type'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Valid panel types
    const validPanelTypes = ['designProof', 'loadTesting', 'nde'];
    if (!validPanelTypes.includes(panel_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid panel_type'
      });
    }

    // Create database record
    const panelReport = new PanelReport({
      project_id,
      panel_type,
      filename: req.file.filename,
      original_filename: req.file.originalname,
      file_path: req.file.path, // Cloudinary URL
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: uploaded_by || 'unknown'
    });

    await panelReport.save();

    res.json({
      success: true,
      message: 'Report uploaded successfully',
      data: {
        filename: req.file.filename,
        original_filename: req.file.originalname,
        file_path: req.file.path
      }
    });

  } catch (error) {
    console.error('Error uploading report:', error);
    
    // Delete uploaded file from Cloudinary if database save fails
    if (req.file && req.file.path) {
      const publicId = extractPublicId(req.file.path);
      if (publicId) {
        await deleteFromCloudinary(publicId, 'raw');
      }
    }

    res.status(500).json({
      success: false,
      message: 'Server error while uploading report',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/panel-reports/get/:project_id
 * @desc    Get all reports for a project
 * @access  Public (for logged-in users)
 */
router.get('/get/:project_id', async (req, res) => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Fetch all reports for this project, sorted by upload date (newest first)
    const reports = await PanelReport.find({ project_id })
      .sort({ uploaded_at: -1 });

    const response = {
      success: true,
      designProof: [],
      loadTesting: [],
      nde: []
    };

    // Organize by panel type
    reports.forEach(report => {
      const data = {
        _id: report._id, // Include the MongoDB ID for deletion
        filename: report.original_filename,
        file_path: report.file_path,
        uploaded_by: report.uploaded_by,
        uploaded_at: report.uploaded_at,
        file_size: report.file_size
      };

      if (report.panel_type === 'designProof') {
        response.designProof.push(data);
      } else if (report.panel_type === 'loadTesting') {
        response.loadTesting.push(data);
      } else if (report.panel_type === 'nde') {
        response.nde.push(data);
      }
    });

    res.json(response);

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/panel-reports/delete/:id
 * @desc    Delete a report
 * @access  Admin only
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('[Delete Report] Attempting to delete report with ID:', id);

    const report = await PanelReport.findById(id);
    if (!report) {
      console.log('[Delete Report] Report not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('[Delete Report] Found report:', report);

    // Delete file from Cloudinary
    const publicId = extractPublicId(report.file_path);
    if (publicId) {
      console.log('[Delete Report] Deleting from Cloudinary with public ID:', publicId);
      await deleteFromCloudinary(publicId, 'raw');
      console.log('[Delete Report] File deleted successfully from Cloudinary');
    } else {
      console.log('[Delete Report] No public ID found in file path:', report.file_path);
    }

    // Delete from database
    await PanelReport.findByIdAndDelete(id);
    console.log('[Delete Report] Report deleted from database');

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('[Delete Report] Error:', error);
    console.error('[Delete Report] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting report',
      error: error.message
    });
  }
});

export default router;
