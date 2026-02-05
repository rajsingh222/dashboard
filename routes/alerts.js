import express from 'express';
import Alert from '../models/Alert.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get alerts for user's projects
// @route   GET /api/alerts
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, severity, projectId } = req.query;

    let query = {};

    if (projectId) {
      query.project = projectId;
    }

    if (status) {
      query.status = status;
    }

    if (severity) {
      query.severity = severity;
    }

    const alerts = await Alert.find(query)
      .populate('project', 'projectName projectId')
      .populate('sensor', 'sensorName sensorId')
      .populate('acknowledgedBy', 'fullName email')
      .populate('resolvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
    });
  }
});

// @desc    Acknowledge alert
// @route   PUT /api/alerts/:id/acknowledge
// @access  Private
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy: req.user._id,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert acknowledged',
      data: alert,
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging alert',
    });
  }
});

// @desc    Resolve alert
// @route   PUT /api/alerts/:id/resolve
// @access  Private
router.put('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert resolved',
      data: alert,
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving alert',
    });
  }
});

// @desc    Add note to alert
// @route   POST /api/alerts/:id/notes
// @access  Private
router.post('/:id/notes', async (req, res) => {
  try {
    const { note } = req.body;

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    alert.notes.push({
      user: req.user._id,
      note,
    });

    await alert.save();

    res.status(200).json({
      success: true,
      message: 'Note added to alert',
      data: alert,
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note',
    });
  }
});

export default router;
