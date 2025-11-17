import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your OTP for SafeCity',
    text: `Your OTP is ${otp}. It will expire in 10 minutes.`
  });
};
