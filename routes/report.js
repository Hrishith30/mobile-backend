import express from 'express';
import { createReport, getNearbyReports } from '../controllers/reportController.js';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';

const router = express.Router();

// --- Validation Schema for a new report ---
const reportSchema = Joi.object({
  report_type: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required()
});

// --- Validation Schema for getting nearby reports ---
const nearbySchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required()
});

// --- Routes ---
// POST /api/report
router.post('/', verifyToken, validate(reportSchema), createReport);

// POST /api/report/nearby
router.post('/nearby', verifyToken, validate(nearbySchema), getNearbyReports);


export default router;