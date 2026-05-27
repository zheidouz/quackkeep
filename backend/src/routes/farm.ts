import { Router, type Request, type Response } from 'express';
import FarmState from '../models/FarmState.js';
import { farmStateSchema } from '../services/validation.js';

const router = Router();

// GET /api/farm — fetch the single farm document
router.get('/', async (_req: Request, res: Response) => {
  try {
    let farm = await FarmState.findOne();
    if (!farm) {
      farm = await FarmState.create({});
    }
    res.json(farm);
  } catch (err) {
    console.error('GET /api/farm error:', err);
    res.status(500).json({ error: 'Failed to fetch farm state' });
  }
});

// PUT /api/farm — replace the entire farm state (validated)
router.put('/', async (req: Request, res: Response) => {
  try {
    const parsed = farmStateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid farm data', details: parsed.error.flatten() });
      return;
    }

    let farm = await FarmState.findOne();
    if (!farm) {
      farm = new FarmState();
    }
    // Only assign validated fields — prevents prototype pollution & unknown fields
    const { transactions, ...fields } = parsed.data;
    Object.assign(farm, fields);
    farm.transactions = transactions as any;
    await farm.save();
    res.json(farm);
  } catch (err) {
    console.error('PUT /api/farm error:', err);
    res.status(500).json({ error: 'Failed to update farm state' });
  }
});

// POST /api/farm/reset — reset to defaults
router.post('/reset', async (_req: Request, res: Response) => {
  try {
    await FarmState.deleteMany({});
    const farm = await FarmState.create({});
    res.json(farm);
  } catch (err) {
    console.error('POST /api/farm/reset error:', err);
    res.status(500).json({ error: 'Failed to reset farm state' });
  }
});

export default router;
