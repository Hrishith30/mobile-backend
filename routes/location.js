import express from 'express';
import { getNearbyPlaces, addSafetyTip, getSafetyAdvice } from '../controllers/locationController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// --- CHANGED: This is now a POST request ---
router.post('/nearby', verifyToken, getNearbyPlaces); 
// ---
router.post('/tip', verifyToken, addSafetyTip);
router.post('/advice', verifyToken, getSafetyAdvice);

export default router;