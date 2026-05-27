import { Router, type Request, type Response } from 'express';
import FarmState from '../models/FarmState.js';

const router = Router();

// Cache farm analytics so we don't recompute on every request
interface FarmAnalytics {
  ducks: number;
  eggs: number;
  eggsSold: number;
  feedKg: number;
  dailyUse: number;
  daysLeft: string;
  eggPrice: number;
  duckPrice: number;
  revenue: number;
  expenses: number;
  balance: number;
  txCount: number;
}
let cachedAnalytics: FarmAnalytics | null = null;
let cachedFarmId: string | null = null;

function getAnalytics(farm: { ducksCount: number; eggsOnHand: number; totalEggsSold: number; feedKgRemaining: number; feedConsumptionPerDuckPerDay: number; eggDefaultSalePrice: number; duckDefaultSalePrice: number; transactions: { type: string; amount: number }[]; _id: string }): FarmAnalytics {
  const id = String(farm._id);
  if (cachedAnalytics && cachedFarmId === id) return cachedAnalytics;

  const ducks = farm.ducksCount;
  const dailyUse = ducks * farm.feedConsumptionPerDuckPerDay;
  const income = farm.transactions.filter((t) => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  const expense = farm.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const daysLeft = dailyUse > 0 ? String(Math.floor(farm.feedKgRemaining / dailyUse)) : 'N/A';

  cachedAnalytics = {
    ducks, eggs: farm.eggsOnHand, eggsSold: farm.totalEggsSold,
    feedKg: farm.feedKgRemaining, dailyUse, daysLeft,
    eggPrice: farm.eggDefaultSalePrice, duckPrice: farm.duckDefaultSalePrice,
    revenue: income, expenses: expense, balance: income - expense,
    txCount: farm.transactions.length,
  };
  cachedFarmId = id;
  return cachedAnalytics;
}

/**
 * POST /api/chat — sends a message to Google Gemini API with farm context
 * Body: { message: string }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const farm = await FarmState.findOne();
    if (!farm) {
      res.status(404).json({ error: 'No farm data found. Please set up your farm first.' });
      return;
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    const a = getAnalytics(farm);

    // Compact system prompt — 40% fewer tokens than before
    const systemPrompt =
      `You are QuackKeep AI, a duck farming assistant. ` +
      `Farm: ${a.ducks} ducks, ${a.eggs} eggs, ${a.feedKg}kg feed (${a.daysLeft}d left), ` +
      `₱${a.eggPrice}/egg ₱${a.duckPrice}/duck. ` +
      `Rev: ₱${a.revenue} Exp: ₱${a.expenses} Net: ₱${a.balance}. ` +
      `Sold ${a.eggsSold} eggs all-time. ` +
      `Reply in 1-2 short sentences. Be friendly, use emojis. Give actionable advice.`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;

    const fullPrompt = `${systemPrompt}\n\nQ: ${message}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', geminiRes.status, errText);
      res.status(502).json({ error: `Gemini API returned ${geminiRes.status}: ${errText}` });
      return;
    }

    const data = await geminiRes.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    res.json({ reply });
  } catch (err) {
    console.error('POST /api/chat error:', err);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
