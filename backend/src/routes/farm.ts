import { Router, type Request, type Response } from 'express';
import FarmState from '../models/FarmState.js';

const router = Router();

// GET /api/health — health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// PUT /api/farm — replace the entire farm state
router.put('/', async (req: Request, res: Response) => {
  try {
    let farm = await FarmState.findOne();
    if (!farm) {
      farm = new FarmState();
    }
    Object.assign(farm, req.body);
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
