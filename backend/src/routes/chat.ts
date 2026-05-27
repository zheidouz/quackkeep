import { Router, type Request, type Response } from 'express';
import FarmState from '../models/FarmState.js';
import FarmerProfile from '../models/FarmerProfile.js';

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

function getAnalytics(farm: { ducksCount: number; eggsOnHand: number; totalEggsSold: number; feedKgRemaining: number; feedConsumptionPerDuckPerDay: number; eggDefaultSalePrice: number; duckDefaultSalePrice: number; transactions: { type: string; amount: number }[]; _id: unknown }): FarmAnalytics {
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

// Simple log event parser — detects farm log intent from user message
interface LogEventData {
  type: string;
  qty: number;
  desc: string;
  unitPrice: number;
  infertileCount: number;
}

function parseLogMessage(msg: string, _farm: unknown): LogEventData | null {
  const lower = msg.toLowerCase();

  // Map keywords to event types
  const patterns: { keywords: string[]; type: string; priceRequired?: boolean }[] = [
    { keywords: ['nangolekta', 'nakolekta', 'collect', 'pulot'], type: 'egg-collect' },
    { keywords: ['benta', 'sell', 'sold', 'bentang'], type: 'egg-sell' },
    { keywords: ['bili', 'buy', 'bought', 'bilhin'], type: 'duck-buy' },
    { keywords: ['pisa', 'hatch', 'napisa'], type: 'duck-hatch' },
    { keywords: ['itik', 'benta ng itik', 'sold duck'], type: 'duck-sell' },
    { keywords: ['patay', 'lost', 'namatay', 'nawala'], type: 'duck-lost' },
    { keywords: ['feed', 'feeds', 'feed bag', 'pakain'], type: 'feed-buy' },
    { keywords: ['gamit', 'use feed', 'consume'], type: 'feed-use' },
    { keywords: ['labor', 'sweldo', 'pasweldo', 'manggagawa'], type: 'expense-labor' },
    { keywords: ['vitamins', 'gamat', 'vet', 'beterinaryo', 'mediko'], type: 'expense-med' },
    { keywords: ['transport', 'hatid', 'sundo', 'byahe', 'deliver'], type: 'expense-transport' },
  ];

  // Check if any keyword matches
  const matched = patterns.find((p) => p.keywords.some((k) => lower.includes(k)));
  if (!matched) return null;

  // Extract quantity — look for numbers
  const nums = msg.match(/\d+/g);
  if (!nums) return null;
  const qty = parseInt(nums[0], 10);
  if (qty <= 0) return null;

  // Extract price if mentioned
  const priceMatch = msg.match(/(?:₱|php|peso|presyo)?\s*(\d+)\s*(?:pesos|php|₱)?/i);
  const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

  const desc = msg.trim();
  const infertileCount = 0;

  return { type: matched.type, qty, desc, unitPrice, infertileCount };
}

// Execute a log event against MongoDB
async function executeLogEvent(event: LogEventData): Promise<string> {
  const freshFarm = await FarmState.findOne();
  if (!freshFarm) throw new Error('Farm not found');

  let transaction: { id: string; date: string; type: 'revenue' | 'expense'; amount: number; category: string; description: string } | null = null;
  let resultMsg = '';

  switch (event.type) {
    case 'egg-collect': {
      freshFarm.eggsOnHand += event.qty;
      resultMsg = `+${event.qty} eggs collected`;
      break;
    }
    case 'egg-sell': {
      if (event.qty > freshFarm.eggsOnHand) throw new Error(`Only ${freshFarm.eggsOnHand} eggs available`);
      freshFarm.eggsOnHand -= event.qty;
      freshFarm.totalEggsSold += event.qty;
      const amount = event.qty * freshFarm.eggDefaultSalePrice;
      transaction = { id: crypto.randomUUID(), date: new Date().toISOString(), type: 'revenue', amount, category: 'Sales', description: event.desc || `Sold ${event.qty} eggs` };
      resultMsg = `+${event.qty} eggs sold (₱${amount.toFixed(2)})`;
      break;
    }
    case 'duck-buy': {
      const buyPrice = event.unitPrice || 0;
      freshFarm.ducksCount += event.qty;
      transaction = { id: crypto.randomUUID(), date: new Date().toISOString(), type: 'expense', amount: event.qty * buyPrice, category: 'Misc Expenses', description: event.desc || `Bought ${event.qty} ducks` };
      resultMsg = `+${event.qty} ducks bought`;
      break;
    }
    case 'duck-sell': {
      if (event.qty > freshFarm.ducksCount) throw new Error(`Only ${freshFarm.ducksCount} ducks available`);
      const duckPrice = event.unitPrice || freshFarm.duckDefaultSalePrice;
      freshFarm.ducksCount -= event.qty;
      transaction = { id: crypto.randomUUID(), date: new Date().toISOString(), type: 'revenue', amount: event.qty * duckPrice, category: 'Sales', description: event.desc || `Sold ${event.qty} ducks` };
      resultMsg = `+${event.qty} ducks sold`;
      break;
    }
    case 'duck-lost': {
      if (event.qty > freshFarm.ducksCount) throw new Error(`Only ${freshFarm.ducksCount} ducks available`);
      freshFarm.ducksCount -= event.qty;
      resultMsg = `-${event.qty} ducks lost`;
      break;
    }
    case 'feed-buy': {
      freshFarm.feedKgRemaining += event.qty;
      transaction = { id: crypto.randomUUID(), date: new Date().toISOString(), type: 'expense', amount: event.qty * (event.unitPrice || 0), category: 'Misc Expenses', description: event.desc || `Bought ${event.qty}kg feed` };
      resultMsg = `+${event.qty}kg feed purchased`;
      break;
    }
    case 'feed-use': {
      if (event.qty > freshFarm.feedKgRemaining) throw new Error(`Only ${freshFarm.feedKgRemaining}kg feed available`);
      freshFarm.feedKgRemaining -= event.qty;
      resultMsg = `-${event.qty}kg feed used`;
      break;
    }
    case 'duck-hatch': {
      const totalEggs = event.qty + event.infertileCount;
      if (totalEggs > freshFarm.eggsOnHand) throw new Error(`Only ${freshFarm.eggsOnHand} eggs available`);
      freshFarm.eggsOnHand -= totalEggs;
      freshFarm.ducksCount += event.qty;
      resultMsg = `+${event.qty} ducklings hatched`;
      break;
    }
    case 'expense-labor':
    case 'expense-med':
    case 'expense-transport': {
      const catMap: Record<string, string> = { 'expense-labor': 'Labor', 'expense-med': 'Vitamins & Medicine', 'expense-transport': 'Transport Costs' };
      transaction = { id: crypto.randomUUID(), date: new Date().toISOString(), type: 'expense', amount: event.qty, category: catMap[event.type] || 'Misc Expenses', description: event.desc || event.type.replace('expense-', '') };
      resultMsg = `Expense ₱${event.qty} recorded`;
      break;
    }
    default:
      throw new Error('Unknown event type');
  }

  if (transaction) freshFarm.transactions.unshift(transaction);
  await freshFarm.save();
  cachedFarmId = null; // invalidate analytics cache

  return resultMsg;
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

    // Fetch farmer profile
    const profile = await FarmerProfile.findOne();

    // Build system prompt with farm data + personal profile
    const personal = profile
      ? `${profile.farmerName} at ${profile.farmName}${profile.location ? ', ' + profile.location : ''}`
      : 'a duck farmer';

    const goal = profile?.farmGoal ? ` Goal: ${profile.farmGoal}.` : '';
    const breed = profile?.breed ? ` Breed: ${profile.breed}.` : '';
    const since = profile?.since ? ` Farming since ${profile.since}.` : '';
    const custom = profile?.customFields && Object.keys(profile.customFields).length > 0
      ? ` Extra info: ${Object.entries(profile.customFields).map(([k, v]) => `${k}: ${v}`).join(', ')}. `
      : '';

    const systemPrompt =
      `You are QuackKeep AI, helping ${personal}.` +
      `${breed}${since}${goal}${custom}` +
      `Farm: ${a.ducks} ducks, ${a.eggs} eggs, ${a.feedKg}kg feed (${a.daysLeft}d left), ` +
      `₱${a.eggPrice}/egg ₱${a.duckPrice}/duck. ` +
      `Rev: ₱${a.revenue} Exp: ₱${a.expenses} Net: ₱${a.balance}. ` +
      `Sold ${a.eggsSold} eggs all-time. ` +
      `Reply in Tagalog. Be friendly, use emojis. Give actionable advice. Do not use asterisks, markdown, or bullet points. Keep it short and conversational.`;

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;

    // Try to parse a log event from the message
    const logEvent = parseLogMessage(message, farm);
    let logResult: string | null = null;

    if (logEvent) {
      try {
        logResult = await executeLogEvent(logEvent);
      } catch (err) {
        logResult = `Error: ${err instanceof Error ? err.message : 'Failed to log'}`;
      }
    }

    // Build prompt — include log result if one was processed
    const logContext = logResult ? `\n\nA farm event was just recorded: ${logResult}. Confirm this to the user in a friendly way.` : '';
    const fullPrompt = `${systemPrompt}${logContext}\n\nQ: ${message}`;

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 1500 },
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
