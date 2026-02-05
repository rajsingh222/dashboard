import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: String,
  },
  { _id: false }
);

const sensorSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: [true, 'Please provide sensor ID'],
      unique: true,
      trim: true,
    },
    sensorName: {
      type: String,
      required: [true, 'Please provide sensor name'],
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    sensorType: {
      type: String,
      required: true,
      enum: [
        'accelerometer',
        'strain_gauge',
        'displacement',
        'temperature',
        'humidity',
        'vibration',
        'tilt',
        'crack',
        'wind_speed',
        'wind_direction',
        'other',
      ],
    },
    location: {
      description: String,
      floor: String,
      section: String,
      coordinates: {
        x: Number,
        y: Number,
        z: Number,
      },
    },
    specifications: {
      manufacturer: String,
      model: String,
      range: {
        min: Number,
        max: Number,
      },
      accuracy: String,
      unit: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'faulty'],
      default: 'active',
    },
    installationDate: {
      type: Date,
    },
    lastCalibrationDate: {
      type: Date,
    },
    nextCalibrationDate: {
      type: Date,
    },
    thresholds: {
      warning: {
        min: Number,
        max: Number,
      },
      critical: {
        min: Number,
        max: Number,
      },
    },
    currentReading: {
      value: Number,
      timestamp: Date,
      unit: String,
    },
    dataRetentionDays: {
      type: Number,
      default: 365,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
sensorSchema.index({ project: 1, sensorId: 1 });
sensorSchema.index({ sensorType: 1 });
sensorSchema.index({ status: 1 });

const Sensor = mongoose.model('Sensor', sensorSchema);

export default Sensor;
