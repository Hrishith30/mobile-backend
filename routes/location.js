import express from 'express';
import { getNearbyPlaces, addSafetyTip, getSafetyAdvice } from '../controllers/locationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/nearby', verifyToken, getNearbyPlaces); 
router.post('/tip', verifyToken, addSafetyTip);

export default router;