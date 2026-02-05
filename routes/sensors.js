import express from 'express';
import { body } from 'express-validator';
import {
  getSensors,
  getSensor,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorReadings,
  addSensorReading,
  getLatestReadings,
} from '../controllers/sensorController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Validation rules
const createSensorValidation = [
  body('sensorId').trim().notEmpty().withMessage('Sensor ID is required'),
  body('sensorName').trim().notEmpty().withMessage('Sensor name is required'),
  body('project').notEmpty().withMessage('Project ID is required'),
  body('sensorType').notEmpty().withMessage('Sensor type is required'),
];

const addReadingValidation = [
  body('value').isNumeric().withMessage('Value must be a number'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
];

// All routes are protected
router.use(protect);

router.route('/')
  .get(getSensors)
  .post(createSensorValidation, validate, createSensor);

router.route('/:id')
  .get(getSensor)
  .put(updateSensor)
  .delete(deleteSensor);

router.route('/:id/readings')
  .get(getSensorReadings)
  .post(addReadingValidation, validate, addSensorReading);

router.get('/project/:projectId/latest', getLatestReadings);

export default router;
