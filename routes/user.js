import express from 'express';
import {
  getProfile,
  updateProfile,
  deleteAccount, 
  getMySafetyTips,
  updateSafetyTip,
  deleteSafetyTip,
  updateLocation,
  // --- 'getAllUsers' import removed ---
} from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';

const router = express.Router();

// --- Profile routes ---
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).required()
});

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, validate(updateProfileSchema), updateProfile);
router.delete('/profile', verifyToken, deleteAccount);

// --- 'POST /all' route removed ---

// --- Safety tips routes ---
const updateTipSchema = Joi.object({
  tip_id: Joi.string().uuid().required(),
  tip: Joi.string().min(5).required()
});

const deleteTipSchema = Joi.object({
  tip_id: Joi.string().uuid().required()
});

router.get('/tips', verifyToken, getMySafetyTips); 
router.put('/tips', verifyToken, validate(updateTipSchema), updateSafetyTip);
router.delete('/tips', verifyToken, validate(deleteTipSchema), deleteSafetyTip);

// --- Location update ---
const updateLocationSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required()
});

router.put('/location', verifyToken, validate(updateLocationSchema), updateLocation);

export default router;