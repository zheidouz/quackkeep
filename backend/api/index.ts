import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'dns';
import farmRoutes from '../src/routes/farm.js';

// DNS fix for SRV lookup on some networks
dns.setServers(['121.54.70.162', '8.8.8.8', '1.1.1.1']);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/farm', farmRoutes);

// Cached MongoDB connection for serverless cold starts
let cachedDb: typeof mongoose | null = null;

async function connectDB() {
  if (cachedDb) return;
  cachedDb = await mongoose.connect(process.env.MONGODB_URI!);
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
