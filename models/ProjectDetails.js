import mongoose from 'mongoose';

const projectDetailsSchema = new mongoose.Schema({
  project_id: {
    type: String,
    required: true,
    unique: true,
  },
  project_title: {
    type: String,
    default: '',
  },
  structure_type: {
    type: String,
    default: '',
  },
  construction_date: {
    type: Date,
    default: null,
  },
  area: {
    type: String,
    default: '',
  },
  city: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
  },
  country: {
    type: String,
    default: 'India',
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  project_images: {
    type: [String],
    default: [],
  },
  project_videos: {
    type: [String],
    default: [],
  },
  updated_by: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const ProjectDetails = mongoose.model('ProjectDetails', projectDetailsSchema);

export default ProjectDetails;
