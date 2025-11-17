import express from 'express';
import { getNearbyPlaces, addSafetyTip } from '../controllers/locationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Routes
router.post('/nearby', verifyToken, getNearbyPlaces); 
router.post('/tip', verifyToken, addSafetyTip);

export default router;