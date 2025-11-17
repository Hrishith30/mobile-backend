import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createUser, getUserByEmail, updateUser } from '../models/userModel.js';
import { sendOTPEmail } from '../config/mailer.js';
import crypto from 'crypto';
dotenv.config();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
const OTP_EXPIRES_IN_MINUTES = 10;

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  const { data: existingUser } = await getUserByEmail(email);
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const password_hash = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  // Set OTP expiration
  const otp_expires_at = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

  const { error } = await createUser({
    name,
    email,
    password_hash,
    verified: false,
    otp,
    otp_expires_at // <-- CHANGED
  });
  if (error) return res.status(500).json({ message: 'Error creating user' });

  await sendOTPEmail(email, otp);
  res.json({ message: 'OTP sent to email, please verify' });
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const { data: user } = await getUserByEmail(email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.otp != otp) return res.status(400).json({ message: 'Invalid OTP' });

  // --- CHANGED: Added Expiry Check ---
  if (new Date() > new Date(user.otp_expires_at)) {
    return res.status(400).json({ message: 'OTP has expired' });
  }
  // ---

  await updateUser(email, { verified: true, otp: null, otp_expires_at: null }); // <-- CHANGED
  res.json({ message: 'User verified successfully' });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const { data: user } = await getUserByEmail(email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.verified) return res.status(400).json({ message: 'Account not verified' });

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  res.json({ token });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const { data: user } = await getUserByEmail(email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const otp = generateOTP();
  // Set OTP expiration
  const otp_expires_at = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

  await updateUser(email, { otp, otp_expires_at }); // <-- CHANGED
  await sendOTPEmail(email, otp);
  res.json({ message: 'OTP sent to email' });
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const { data: user } = await getUserByEmail(email);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.otp != otp) return res.status(400).json({ message: 'Invalid OTP' });

  // --- CHANGED: Added Expiry Check ---
  if (new Date() > new Date(user.otp_expires_at)) {
    return res.status(400).json({ message: 'OTP has expired' });
  }
  // ---

  const password_hash = await bcrypt.hash(newPassword, 10);
  await updateUser(email, { password_hash, otp: null, otp_expires_at: null }); // <-- CHANGED
  res.json({ message: 'Password reset successfully' });
};