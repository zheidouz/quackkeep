import { Router, type Request, type Response } from 'express';
import FarmerProfile from '../models/FarmerProfile.js';

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

// PUT /api/profile — replace the entire profile
router.put('/', async (req: Request, res: Response) => {
  try {
    let profile = await FarmerProfile.findOne();
    if (!profile) {
      profile = new FarmerProfile();
    }
    Object.assign(profile, req.body);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    res.status(500).json({ error: 'Failed to update farmer profile' });
  }
});

export default router;
