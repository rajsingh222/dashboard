import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: [true, 'Please provide project name'],
      trim: true,
    },
    projectId: {
      type: String,
      required: [true, 'Please provide project ID'],
      unique: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    projectType: {
      type: String,
      enum: ['bridge', 'building', 'dam', 'tunnel', 'other'],
      default: 'building',
    },
    status: {
      type: String,
      enum: ['planning', 'in-progress', 'completed', 'on-hold', 'cancelled'],
      default: 'planning',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    client: {
      name: String,
      email: String,
      phone: String,
    },
    testingAgency: {
      name: String,
      email: String,
      phone: String,
      licenseNumber: String,
    },
    drawings: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadDate: Date,
      },
    ],
    reports: [
      {
        fileName: String,
        fileUrl: String,
        uploadDate: Date,
        reportType: String,
      },
    ],
    sensors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sensor',
      },
    ],
    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['admin', 'engineer', 'viewer'],
        },
        addedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    thresholdAlertsPdf: {
      fileName: String,
      fileUrl: String,
      uploadDate: Date,
      uploadedBy: String,
    },
    sensorMonitoringConfig: {
      alarms: [
        {
          name: String,
          status: {
            type: String,
            enum: ['Sensor active', 'Sensor fault', 'Sensor change', 'Sensor Unactive'],
            default: 'Sensor active',
          },
          percentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 100,
          },
        },
      ],
      sensors: [
        {
          sensorId: String,
          sensorType: String,
          location: String,
          samplingFrequency: String,
          status: {
            type: String,
            enum: ['Active', 'Inactive', 'Maintenance'],
            default: 'Active',
          },
        },
      ],
    },
    sensorLayoutImage: {
      fileName: String,
      filePath: String,
      uploadDate: Date,
      uploadedBy: String,
    },
    modeShapeVideos: [
      {
        fileName: String,
        filePath: String,
        title: String,
        uploadDate: Date,
        uploadedBy: String,
        order: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
projectSchema.index({ owner: 1, projectId: 1 });
projectSchema.index({ ownerEmail: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
