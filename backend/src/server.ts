import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import farmRoutes from './routes/farm.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/farm', farmRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;

// Start the HTTP server immediately so health checks always work
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('⏳ Connecting to MongoDB in background...');
});

// Connect to MongoDB asynchronously (won't block server startup)
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
})
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB connection error — API endpoints may fail:', err.message));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  server.close(() => mongoose.disconnect());
});
