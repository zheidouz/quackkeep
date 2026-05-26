import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import farmRoutes from './routes/farm.js';

// Use a specific DNS server that resolves SRV records correctly
dns.setServers(['121.54.70.162', '8.8.8.8', '1.1.1.1']);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/farm', farmRoutes);

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
