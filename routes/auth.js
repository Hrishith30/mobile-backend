// routes/auth.js
import express from 'express';
import { signup, verifyOTP, login, forgotPassword, resetPassword } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const signupSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const otpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});

// Routes
router.post('/signup', validate(signupSchema), signup);
router.post('/verify-otp', validate(otpSchema), verifyOTP);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Export as default (ES module)
export default router;
