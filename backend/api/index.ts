import express from 'express';
import cors from 'cors';
import mongoose, { type Mongoose } from 'mongoose';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import farmRoutes from '../src/routes/farm.js';
import chatRoutes from '../src/routes/chat.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/farm', farmRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Cached MongoDB connection for serverless cold starts
let cachedDb: Mongoose | null = null;

async function connectDB() {
  if (cachedDb) return;
  cachedDb = await mongoose.connect(MONGODB_URI!, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health check works without MongoDB
  if (req.url === '/api/health') {
    return app(req, res);
  }
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    res.status(502).json({ error: 'Database connection failed. Please try again later.' });
    return;
  }
  return app(req, res);
}
