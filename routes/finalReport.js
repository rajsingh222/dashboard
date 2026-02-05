import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import FinalReport from '../models/FinalReport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/final-reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'final-report-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, DOCX, XLS, and XLSX files are allowed'));
  }
});

// Upload final report
router.post('/upload', upload.single('report'), async (req, res) => {
  try {
    const { project_id, uploaded_by } = req.body;

    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if a final report already exists for this project
    let existingReport = await FinalReport.findOne({ project_id });

    const file_path = `/uploads/final-reports/${req.file.filename}`;

    if (existingReport) {
      // Delete old file if it exists
      const oldFilePath = path.join(__dirname, '..', existingReport.file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // Update existing report
      existingReport.filename = req.file.originalname;
      existingReport.file_path = file_path;
      existingReport.uploaded_by = uploaded_by;
      existingReport.uploaded_at = new Date();
      await existingReport.save();

      return res.json({
        success: true,
        message: 'Final report updated successfully',
        report: existingReport
      });
    } else {
      // Create new report
      const newReport = new FinalReport({
        project_id,
        filename: req.file.originalname,
        file_path,
        uploaded_by,
        uploaded_at: new Date()
      });

      await newReport.save();

      return res.json({
        success: true,
        message: 'Final report uploaded successfully',
        report: newReport
      });
    }
  } catch (error) {
    console.error('Error uploading final report:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading final report',
      error: error.message
    });
  }
});

// Get final report for a project
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const report = await FinalReport.findOne({ project_id: projectId });

    if (!report) {
      return res.json({
        success: true,
        report: null,
        message: 'No final report found for this project'
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching final report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching final report',
      error: error.message
    });
  }
});

// Delete final report
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const report = await FinalReport.findOne({ project_id: projectId });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Final report not found'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', report.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await FinalReport.deleteOne({ project_id: projectId });

    res.json({
      success: true,
      message: 'Final report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting final report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting final report',
      error: error.message
    });
  }
});

export default router;
