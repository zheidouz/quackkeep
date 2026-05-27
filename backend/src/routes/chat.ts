import { Router, type Request, type Response } from 'express';
import FarmState from '../models/FarmState.js';
import FarmerProfile from '../models/FarmerProfile.js';
import { parseLogMessage, computeLogEvent } from '../services/logProcessor.js';
import type { FarmStateData } from '../services/logProcessor.js';

const router = Router();

// ── Rate limiting (simple in-memory, per-IP) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;        // max requests
const RATE_WINDOW_MS = 60_000; // per 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Analytics helper (no stale cache — always fresh) ──
function getAnalytics(farm: FarmStateData & { transactions: { type: string; amount: number }[] }) {
  const ducks = farm.ducksCount;
  const dailyUse = ducks * farm.feedConsumptionPerDuckPerDay;
  const income = farm.transactions.filter((t) => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  const expense = farm.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const daysLeft = dailyUse > 0 ? String(Math.floor(farm.feedKgRemaining / dailyUse)) : 'N/A';

  return {
    ducks, eggs: farm.eggsOnHand, eggsSold: farm.totalEggsSold,
    feedKg: farm.feedKgRemaining, dailyUse, daysLeft,
    eggPrice: farm.eggDefaultSalePrice, duckPrice: farm.duckDefaultSalePrice,
    revenue: income, expenses: expense, balance: income - expense,
    txCount: farm.transactions.length,
  };
}

/**
 * Check if a message is purely a farm log (no question, no request for advice).
 * Used to skip the DeepSeek API call and save credits.
 */
function isPureLogOnly(message: string): boolean {
  const lower = message.toLowerCase();
  const questionIndicators = [
    /\?/, /how/, /what/, /why/, /when/, /where/, /should/, /can\s/i,
    /tips?/, /advice/, /help/, /suggest/, /recommend/, /paano/, /bakit/,
    /ano/, /saan/, /kailan/, /sino/, /tips?/, /payo/, /tulong/,
  ];
  return !questionIndicators.some((p) => p.test(lower));
}

/**
 * POST /api/chat — sends a message to DeepSeek API with farm context.
 * Also parses log events from the message and executes them before the AI call.
 * Body: { message: string }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // ── Rate limit check ──
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }

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

    // ── Parse & execute log event (if message contains one) ──
    const logEvent = parseLogMessage(message);
    let logResult: string | null = null;

    if (logEvent) {
      const { result, error } = computeLogEvent(logEvent, farm.toObject() as FarmStateData);
      if (error) {
        logResult = `Error: ${error}`;
      } else {
        // Apply state changes
        if (result.stateChanges) {
          Object.assign(farm, result.stateChanges);
        }
        if (result.transaction) {
          farm.transactions.unshift(result.transaction as any);
        }
        await farm.save();
        logResult = result.message;
      }
    }

    // ── Short-circuit: pure log message, skip AI call ──
    if (logResult && !logResult.startsWith('Error') && isPureLogOnly(message)) {
      res.json({
        reply: `✅ Naitala ko na! ${logResult}. 🦆`,
        farmChanged: true,
      });
      return;
    }

    // ── Build AI prompt ──
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!API_KEY) {
      // If no AI key but we had a log result, still return it
      if (logResult && !logResult.startsWith('Error')) {
        res.json({ reply: `✅ ${logResult}`, farmChanged: true });
        return;
      }
      res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured on the server.' });
      return;
    }

    const a = getAnalytics(farm);
    const profile = await FarmerProfile.findOne();

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
      `You are Cookie AI, helping ${personal}.` +
      `${breed}${since}${goal}${custom}` +
      `Farm: ${a.ducks} ducks, ${a.eggs} eggs, ${a.feedKg}kg feed (${a.daysLeft}d left), ` +
      `₱${a.eggPrice}/egg ₱${a.duckPrice}/duck. ` +
      `Rev: ₱${a.revenue} Exp: ₱${a.expenses} Net: ₱${a.balance}. ` +
      `Sold ${a.eggsSold} eggs all-time. ` +
      `Reply in Tagalog. Be friendly, use emojis. Give actionable advice. Do not use asterisks, markdown, or bullet points. Keep it short and conversational.`;

    const logContext = logResult && !logResult.startsWith('Error')
      ? `\n\nA farm event was just recorded: ${logResult}. Confirm this to the user in a friendly way.`
      : '';

    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${logContext}\n\nQ: ${message}` },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error('DeepSeek API error:', deepseekRes.status, errText);
      // Fallback: if log was processed, return a simple confirmation
      if (logResult && !logResult.startsWith('Error')) {
        res.json({ reply: `✅ ${logResult} (AI is temporarily unavailable)`, farmChanged: true });
        return;
      }
      res.status(502).json({ error: `DeepSeek API returned ${deepseekRes.status}` });
      return;
    }

    const data = await deepseekRes.json() as { choices?: { message?: { content?: string } }[] };
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({ reply, farmChanged: !!logResult });
  } catch (err) {
    console.error('POST /api/chat error:', err);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
