import { Router, type Request, type Response } from 'express';
import FarmerProfile from '../models/FarmerProfile.js';
import { farmerProfileSchema } from '../services/validation.js';

const router = Router();

// GET /api/profile — fetch the single farmer profile document
router.get('/', async (_req: Request, res: Response) => {
  try {
    let profile = await FarmerProfile.findOne();
    if (!profile) {
      profile = await FarmerProfile.create({});
    }
    res.json(profile);
  } catch (err) {
    console.error('GET /api/profile error:', err);
    res.status(500).json({ error: 'Failed to fetch farmer profile' });
  }
});

// PUT /api/profile — replace the entire profile (validated)
router.put('/', async (req: Request, res: Response) => {
  try {
    const parsed = farmerProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid profile data', details: parsed.error.flatten() });
      return;
    }

    let profile = await FarmerProfile.findOne();
    if (!profile) {
      profile = new FarmerProfile();
    }
    Object.assign(profile, parsed.data);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    res.status(500).json({ error: 'Failed to update farmer profile' });
  }
});

export default router;
