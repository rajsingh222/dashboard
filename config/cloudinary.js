import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Sensor Layout Storage (Images)
export const sensorLayoutStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dashboard-sppl/sensor-layouts',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 2000, height: 2000, crop: 'limit' }], // Limit max size
    public_id: (req, file) => `sensorLayout-${Date.now()}-${Math.floor(Math.random() * 100000000)}`,
  },
});

// Mode Shape Videos Storage
export const modeShapeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dashboard-sppl/mode-shapes',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
    resource_type: 'video',
    public_id: (req, file) => `modeShapeVideo-${Date.now()}-${Math.floor(Math.random() * 100000000)}`,
  },
});

// Panel Reports Storage (PDFs, DOCs)
export const panelReportStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dashboard-sppl/panel-reports',
    allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    resource_type: 'raw',
    public_id: (req, file) => `panelReport-${Date.now()}-${Math.floor(Math.random() * 100000000)}`,
  },
});

// Final Report Storage
export const finalReportStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dashboard-sppl/final-reports',
    allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    resource_type: 'raw',
    public_id: (req, file) => `finalReport-${Date.now()}-${Math.floor(Math.random() * 100000000)}`,
  },
});

// Project Images Storage
export const projectImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dashboard-sppl/project-images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
    public_id: (req, file) => `projectImage-${Date.now()}-${Math.floor(Math.random() * 100000000)}`,
  },
});

// Project Videos Storage
export const projectVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dashboard-sppl/project-videos',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
    resource_type: 'video',
    public_id: (req, file) => `projectVideo-${Date.now()}-${Math.floor(Math.random() * 100000000)}`,
  },
});

// Threshold PDFs Storage
export const thresholdPdfStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dashboard-sppl/threshold-pdfs',
    allowed_formats: ['pdf'],
    resource_type: 'raw',
    public_id: (req, file) => `thresholdPdf-${Date.now()}-${Math.floor(Math.random() * 100000000)}`,
  },
});

// Helper function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper to extract public_id from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url) return null;
  
  // Cloudinary URLs look like:
  // https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/file.ext
  // or https://res.cloudinary.com/cloud_name/raw/upload/v123456/folder/file.ext
  
  const matches = url.match(/\/([^\/]+\/[^\/]+)\.[^.]+$/);
  if (matches && matches[1]) {
    return matches[1];
  }
  
  // Alternative pattern for full path extraction
  const altMatches = url.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  if (altMatches && altMatches[1]) {
    return altMatches[1];
  }
  
  return null;
};

export default cloudinary;
