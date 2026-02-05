import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserPassword,
  getDashboardStats,
  getAllProjects,
  getAllSensors,
  getAllAlerts,
  getSystemHealth,
  createAdminUser,
  assignProjectToUser,
  removeProjectFromUser,
  createProjectForUser,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  assignThresholdPdf,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/system/health', getSystemHealth);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/change-password', changeUserPassword);
router.delete('/users/:id', deleteUser);
router.post('/create-admin', createAdminUser);

// User project assignment
router.get('/users/:userId/projects', getUserProjects);
router.post('/users/:userId/assign-project', assignProjectToUser);
router.delete('/users/:userId/remove-project/:projectId', removeProjectFromUser);

// Project management (admin CRUD)
router.get('/projects', getAllProjects);
router.get('/projects/:id', getProjectById);
router.post('/projects/create', createProjectForUser);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);
router.post('/projects/:id/assign-threshold-pdf', assignThresholdPdf);

// Sensor management
router.get('/sensors', getAllSensors);

// Alert management
router.get('/alerts', getAllAlerts);

export default router;
