import express from 'express';
import PanelConfig from '../models/PanelConfig.js';

const router = express.Router();

/**
 * @route   POST /api/panel-config/save
 * @desc    Save panel configuration (Design Proof, Load Testing, NDE)
 * @access  Admin only
 */
router.post('/save', async (req, res) => {
  try {
    let { project_id, panel_type, config } = req.body;

    // If config is a string, parse it
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid config format'
        });
      }
    }

    // Validation
    if (!project_id || !panel_type || !config) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project_id, panel_type, config'
      });
    }

    // Valid panel types
    const validPanelTypes = ['designProof', 'loadTesting', 'nde'];
    if (!validPanelTypes.includes(panel_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid panel_type. Must be: designProof, loadTesting, or nde'
      });
    }

    // Find existing config or create new one
    let panelConfig = await PanelConfig.findOne({ project_id, panel_type });

    if (panelConfig) {
      // Update existing
      panelConfig.title = config.title || '';
      panelConfig.description = config.description || '';
      panelConfig.parameters = config.parameters || '';
      panelConfig.notes = config.notes || '';
      panelConfig.updated_at = new Date();
    } else {
      // Create new
      panelConfig = new PanelConfig({
        project_id,
        panel_type,
        title: config.title || '',
        description: config.description || '',
        parameters: config.parameters || '',
        notes: config.notes || ''
      });
    }

    await panelConfig.save();

    res.json({
      success: true,
      message: 'Configuration saved successfully',
      data: panelConfig
    });

  } catch (error) {
    console.error('Error saving panel config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving configuration',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/panel-config/get/:project_id
 * @desc    Get all panel configurations for a project
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

    // Fetch all panel configs for this project
    const configs = await PanelConfig.find({ project_id });

    const response = {
      success: true,
      designProof: null,
      loadTesting: null,
      nde: null
    };

    // Organize by panel type
    configs.forEach(config => {
      const data = {
        title: config.title,
        description: config.description,
        parameters: config.parameters,
        notes: config.notes,
        applyToOthers: false
      };

      if (config.panel_type === 'designProof') {
        response.designProof = data;
      } else if (config.panel_type === 'loadTesting') {
        response.loadTesting = data;
      } else if (config.panel_type === 'nde') {
        response.nde = data;
      }
    });

    res.json(response);

  } catch (error) {
    console.error('Error fetching panel configs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching configurations',
      error: error.message
    });
  }
});

export default router;
