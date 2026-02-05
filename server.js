import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/error.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route imports
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import sensorRoutes from './routes/sensors.js';
import adminRoutes from './routes/admin.js';
import alertRoutes from './routes/alerts.js';
import panelConfigRoutes from './routes/panelConfig.js';
import panelReportsRoutes from './routes/panelReports.js';
import finalReportRoutes from './routes/finalReport.js';
import projectDetailsRoutes from './routes/projectDetails.js';
import mediaAssetsRoutes from './routes/mediaAssets.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.ADMIN_FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers for static files - allow configured origins
app.use('/uploads', (req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter(Boolean); // Remove undefined values
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  
  next();
});

// Serve static files (uploaded reports and media)
// Files are stored in public/uploads which is one level up from backend directory
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
// Also serve from backend/uploads for panel reports and media
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to auth routes (relaxed for development)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.',
  }));

  app.use('/api/auth/signup', rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many signup attempts, please try again later.',
  }));
} else {
  // Development: More permissive limits
  app.use('/api/auth/login', rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many login attempts, please try again later.',
  }));

  app.use('/api/auth/signup', rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50,
    message: 'Too many signup attempts, please try again later.',
  }));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/panel-config', panelConfigRoutes);
app.use('/api/panel-reports', panelReportsRoutes);
app.use('/api/final-report', finalReportRoutes);
app.use('/api/project-details', projectDetailsRoutes);
app.use('/api/media-assets', mediaAssetsRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
========================================================
                                                      
   Dashboard SPPL Backend Server                  
                                                      
   Environment: ${process.env.NODE_ENV || 'development'}                           
   Port: ${PORT}                                         
   Database: Connected                                
                                                      
   API Endpoints:                                     
   - Auth:     http://localhost:${PORT}/api/auth      
   - Projects: http://localhost:${PORT}/api/projects  
   - Sensors:  http://localhost:${PORT}/api/sensors   
   - Admin:    http://localhost:${PORT}/api/admin     
   - Alerts:   http://localhost:${PORT}/api/alerts
   - Panel Config: http://localhost:${PORT}/api/panel-config
   - Project Details: http://localhost:${PORT}/api/project-details    
                                                      
========================================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;


