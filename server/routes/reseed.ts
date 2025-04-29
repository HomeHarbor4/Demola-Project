import express, { Request, Response } from 'express';
import { log } from '../vite';
import { seedDatabase } from '../seedDatabase';

const router = express.Router();

/**
 * @route POST /api/reseed
 * @desc Clear the database and seed with main seed script
 */
// POST /reseed
router.post('/', async (req, res) => {
  console.log(`Received request to reseed database with main seed script.`);
  try {
    await seedDatabase();
    res.status(200).json({ message: 'Database reseeded successfully using main seed script.' });
  } catch (error: any) {
    console.error('Error in /reseed/oulu route:', error);
    res.status(500).json({ message: 'Failed to reseed database', error: error.message || 'Unknown server error' });
  }
});

export default router;