import express from 'express';
import cors from 'cors';
import mongoose, { Schema, type Document } from 'mongoose';
import dns from 'dns';

// DNS fix for SRV lookup on some networks
dns.setServers(['121.54.70.162', '8.8.8.8', '1.1.1.1']);

// ── Schema ──────────────────────────────────────────────

interface ITransaction {
  id: string;
  date: string;
  type: 'revenue' | 'expense';
  amount: number;
  category: string;
  description: string;
}

interface IFarmState extends Document {
  ducksCount: number;
  eggsOnHand: number;
  totalEggsSold: number;
  feedKgRemaining: number;
  feedConsumptionPerDuckPerDay: number;
  eggDefaultSalePrice: number;
  duckDefaultSalePrice: number;
  transactions: ITransaction[];
}

const TransactionSchema = new Schema<ITransaction>({
  id: { type: String, required: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['revenue', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
}, { _id: false });

const FarmStateSchema = new Schema<IFarmState>({
  ducksCount: { type: Number, default: 0 },
  eggsOnHand: { type: Number, default: 0 },
  totalEggsSold: { type: Number, default: 0 },
  feedKgRemaining: { type: Number, default: 0 },
  feedConsumptionPerDuckPerDay: { type: Number, default: 0.15 },
  eggDefaultSalePrice: { type: Number, default: 0.5 },
  duckDefaultSalePrice: { type: Number, default: 15.0 },
  transactions: [TransactionSchema],
});

const FarmStateModel = mongoose.model<IFarmState>('FarmState', FarmStateSchema, 'farmstate');

// ── Express App ─────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/farm
app.get('/api/farm', async (_req, res) => {
  try {
    let farm = await FarmStateModel.findOne();
    if (!farm) farm = await FarmStateModel.create({});
    res.json(farm);
  } catch (err) {
    console.error('GET /api/farm error:', err);
    res.status(500).json({ error: 'Failed to fetch farm state' });
  }
});

// PUT /api/farm
app.put('/api/farm', async (req, res) => {
  try {
    let farm = await FarmStateModel.findOne();
    if (!farm) farm = new FarmStateModel();
    Object.assign(farm, req.body);
    await farm.save();
    res.json(farm);
  } catch (err) {
    console.error('PUT /api/farm error:', err);
    res.status(500).json({ error: 'Failed to update farm state' });
  }
});

// POST /api/farm/reset
app.post('/api/farm/reset', async (_req, res) => {
  try {
    await FarmStateModel.deleteMany({});
    const farm = await FarmStateModel.create({});
    res.json(farm);
  } catch (err) {
    console.error('POST /api/farm/reset error:', err);
    res.status(500).json({ error: 'Failed to reset farm state' });
  }
});

// ── Cached MongoDB connection ───────────────────────────

let cachedDb: typeof mongoose | null = null;

async function connectDB() {
  if (cachedDb) return;
  cachedDb = await mongoose.connect(process.env.MONGODB_URI!);
}

// ── Vercel Serverless Handler ───────────────────────────

export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
