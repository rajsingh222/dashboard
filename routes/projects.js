import express from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  updateSensorMonitoringConfig,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules
const createProjectValidation = [
  body('projectName').trim().notEmpty().withMessage('Project name is required'),
  body('projectId').trim().notEmpty().withMessage('Project ID is required'),
];

const addTeamMemberValidation = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('role')
    .isIn(['admin', 'engineer', 'viewer'])
    .withMessage('Invalid role'),
];

// All routes are protected
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProjectValidation, validate, createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.post('/:id/team', addTeamMemberValidation, validate, addTeamMember);

router.put('/:id/sensor-monitoring-config', updateSensorMonitoringConfig);

export default router;
