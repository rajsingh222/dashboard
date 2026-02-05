import mongoose from 'mongoose';

const PanelConfigSchema = new mongoose.Schema({
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
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  parameters: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Compound unique index to prevent duplicate configs for same project+panel
PanelConfigSchema.index({ project_id: 1, panel_type: 1 }, { unique: true });

export default mongoose.model('PanelConfig', PanelConfigSchema);
