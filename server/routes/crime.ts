import { Router, Request, Response } from 'express';
import { db } from '../db';
import { crime_data } from '@shared/schema';
import { and, eq, ilike, sql } from 'drizzle-orm';

const router = Router();

/**
 * @route GET /api/crime-rate
 * @desc Get crime rate data for a specific city
 */
router.get('/crime-rate', async (req: Request, res: Response) => {
  try {
    const { city } = req.query;

    if (!city || typeof city !== 'string') {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    // Get the last 12 months of data for the city
    const last12Months = await db
      .select({
        month: crime_data.month,
        totalCrimes: sql<number>`sum(${crime_data.crime_count})`,
      })
      .from(crime_data)
      .where(
        and(
          ilike(crime_data.municipality_name, `%${city}%`),
          sql`${crime_data.month} >= date_trunc('month', CURRENT_DATE - INTERVAL '12 months')::text`
        )
      )
      .groupBy(crime_data.month)
      .orderBy(crime_data.month);

    // Calculate total crimes and number of months
    const totalCrimes = last12Months.reduce((sum, month) => sum + month.totalCrimes, 0);
    const months = last12Months.length;

    res.json({
      city,
      totalCrimes,
      months,
      monthlyData: last12Months,
    });
  } catch (error) {
    console.error('Error fetching crime rate data:', error);
    res.status(500).json({ error: 'Failed to fetch crime rate data' });
  }
});

export default router; 