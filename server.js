// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import locationRoutes from './routes/location.js';
import userRoutes from './routes/user.js';
import reportRoutes from './routes/report.js';

dotenv.config();

const app = express(); 

// Middleware
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/report', reportRoutes);

// Root endpoint
app.get('/', (req, res) => res.send(`${process.env.APP_NAME} API Running`));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));