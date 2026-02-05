import mongoose from 'mongoose';

const finalReportSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  uploaded_by: {
    type: String,
    required: true
  },
  uploaded_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('FinalReport', finalReportSchema);
