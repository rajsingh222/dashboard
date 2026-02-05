import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema(
  {
    sensor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sensor',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    quality: {
      type: String,
      enum: ['good', 'fair', 'poor', 'invalid'],
      default: 'good',
    },
    metadata: {
      temperature: Number,
      humidity: Number,
      batteryLevel: Number,
      signalStrength: Number,
    },
    isAnomaly: {
      type: Boolean,
      default: false,
    },
    anomalyReason: String,
  },
  {
    timestamps: false,
  }
);

// Index for faster queries
sensorReadingSchema.index({ sensor: 1, timestamp: -1 });
sensorReadingSchema.index({ project: 1, timestamp: -1 });
sensorReadingSchema.index({ timestamp: 1 });

// TTL index to auto-delete old data (optional)
// sensorReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);

export default SensorReading;
