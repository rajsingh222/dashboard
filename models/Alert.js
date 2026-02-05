import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    sensor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sensor',
    },
    alertType: {
      type: String,
      enum: ['threshold_warning', 'threshold_critical', 'sensor_offline', 'data_anomaly', 'system'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    value: Number,
    threshold: {
      min: Number,
      max: Number,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
      default: 'active',
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    notes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        note: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
alertSchema.index({ project: 1, status: 1, createdAt: -1 });
alertSchema.index({ sensor: 1, status: 1 });
alertSchema.index({ severity: 1, status: 1 });

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
