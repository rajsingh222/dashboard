import mongoose from 'mongoose';

const PanelReportSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    index: true
  },
  panel_type: {
    type: String,
    required: true,
    enum: ['designProof', 'loadTesting', 'nde'],
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  original_filename: {
    type: String,
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  file_size: {
    type: Number
  },
  mime_type: {
    type: String
  },
  uploaded_by: {
    type: String,
    default: 'unknown'
  },
  uploaded_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
PanelReportSchema.index({ project_id: 1, panel_type: 1 });

export default mongoose.model('PanelReport', PanelReportSchema);
