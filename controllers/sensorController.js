import Sensor from '../models/Sensor.js';
import SensorReading from '../models/SensorReading.js';
import Project from '../models/Project.js';
import Alert from '../models/Alert.js';

// @desc    Get all sensors for a project
// @route   GET /api/sensors?projectId=xxx
// @access  Private
export const getSensors = async (req, res) => {
  try {
    const { projectId, sensorType, status } = req.query;

    let query = {};

    if (projectId) {
      query.project = projectId;
    }

    if (sensorType) {
      query.sensorType = sensorType;
    }

    if (status) {
      query.status = status;
    }

    const sensors = await Sensor.find(query)
      .populate('project', 'projectName projectId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sensors.length,
      data: sensors,
    });
  } catch (error) {
    console.error('Get sensors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sensors',
    });
  }
};

// @desc    Get single sensor
// @route   GET /api/sensors/:id
// @access  Private
export const getSensor = async (req, res) => {
  try {
    const sensor = await Sensor.findById(req.params.id).populate(
      'project',
      'projectName projectId owner'
    );

    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found',
      });
    }

    res.status(200).json({
      success: true,
      data: sensor,
    });
  } catch (error) {
    console.error('Get sensor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor',
    });
  }
};

// @desc    Create new sensor
// @route   POST /api/sensors
// @access  Private
export const createSensor = async (req, res) => {
  try {
    const { project: projectId } = req.body;

    // Verify project exists and user has access
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check authorization
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add sensors to this project',
      });
    }

    const sensor = await Sensor.create(req.body);

    // Add sensor to project
    project.sensors.push(sensor._id);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Sensor created successfully',
      data: sensor,
    });
  } catch (error) {
    console.error('Create sensor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sensor',
      error: error.message,
    });
  }
};

// @desc    Update sensor
// @route   PUT /api/sensors/:id
// @access  Private
export const updateSensor = async (req, res) => {
  try {
    let sensor = await Sensor.findById(req.params.id).populate('project');

    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found',
      });
    }

    // Check authorization
    const isOwner =
      sensor.project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this sensor',
      });
    }

    sensor = await Sensor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Sensor updated successfully',
      data: sensor,
    });
  } catch (error) {
    console.error('Update sensor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sensor',
    });
  }
};

// @desc    Delete sensor
// @route   DELETE /api/sensors/:id
// @access  Private
export const deleteSensor = async (req, res) => {
  try {
    const sensor = await Sensor.findById(req.params.id).populate('project');

    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found',
      });
    }

    // Check authorization
    const isOwner =
      sensor.project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this sensor',
      });
    }

    await sensor.deleteOne();

    // Remove from project
    await Project.findByIdAndUpdate(sensor.project._id, {
      $pull: { sensors: sensor._id },
    });

    // Delete associated readings
    await SensorReading.deleteMany({ sensor: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Sensor deleted successfully',
    });
  } catch (error) {
    console.error('Delete sensor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sensor',
    });
  }
};

// @desc    Get sensor readings
// @route   GET /api/sensors/:id/readings
// @access  Private
export const getSensorReadings = async (req, res) => {
  try {
    const { startDate, endDate, limit = 1000 } = req.query;

    let query = { sensor: req.params.id };

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const readings = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error('Get sensor readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor readings',
    });
  }
};

// @desc    Add sensor reading
// @route   POST /api/sensors/:id/readings
// @access  Private
export const addSensorReading = async (req, res) => {
  try {
    const sensor = await Sensor.findById(req.params.id);

    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found',
      });
    }

    const reading = await SensorReading.create({
      sensor: req.params.id,
      project: sensor.project,
      ...req.body,
    });

    // Update sensor's current reading
    sensor.currentReading = {
      value: reading.value,
      timestamp: reading.timestamp,
      unit: reading.unit,
    };
    await sensor.save();

    // Check thresholds and create alerts if needed
    await checkThresholds(sensor, reading);

    res.status(201).json({
      success: true,
      message: 'Reading added successfully',
      data: reading,
    });
  } catch (error) {
    console.error('Add sensor reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding sensor reading',
    });
  }
};

// Helper function to check thresholds
const checkThresholds = async (sensor, reading) => {
  try {
    const { thresholds } = sensor;
    if (!thresholds) return;

    let alertType = null;
    let severity = null;

    // Check critical thresholds
    if (thresholds.critical) {
      if (
        (thresholds.critical.max && reading.value > thresholds.critical.max) ||
        (thresholds.critical.min && reading.value < thresholds.critical.min)
      ) {
        alertType = 'threshold_critical';
        severity = 'critical';
      }
    }

    // Check warning thresholds
    if (!alertType && thresholds.warning) {
      if (
        (thresholds.warning.max && reading.value > thresholds.warning.max) ||
        (thresholds.warning.min && reading.value < thresholds.warning.min)
      ) {
        alertType = 'threshold_warning';
        severity = 'high';
      }
    }

    // Create alert if threshold exceeded
    if (alertType) {
      await Alert.create({
        project: sensor.project,
        sensor: sensor._id,
        alertType,
        severity,
        title: `${sensor.sensorName} ${severity} threshold exceeded`,
        message: `Sensor reading of ${reading.value}${reading.unit} exceeds ${severity} threshold`,
        value: reading.value,
        threshold: thresholds[severity === 'critical' ? 'critical' : 'warning'],
      });
    }
  } catch (error) {
    console.error('Check thresholds error:', error);
  }
};

// @desc    Get latest reading for all sensors in a project
// @route   GET /api/sensors/project/:projectId/latest
// @access  Private
export const getLatestReadings = async (req, res) => {
  try {
    const sensors = await Sensor.find({ project: req.params.projectId });

    const latestReadings = await Promise.all(
      sensors.map(async (sensor) => {
        const reading = await SensorReading.findOne({ sensor: sensor._id })
          .sort({ timestamp: -1 })
          .limit(1);

        return {
          sensor: sensor,
          latestReading: reading,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: latestReadings,
    });
  } catch (error) {
    console.error('Get latest readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching latest readings',
    });
  }
};
