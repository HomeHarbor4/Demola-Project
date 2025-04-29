import { Router } from 'express';
import fetch from 'node-fetch';
import { log } from '../vite';

const router = Router();

// Proxy endpoint for Google Places API to avoid CORS issues
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, type } = req.query;
    
    if (!lat || !lng || !type) {
      return res.status(400).json({ error: 'Missing required parameters: lat, lng, type' });
    }
    
    // Google Places API key from environment variables
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }
    
    // Construct URL for Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=${type}&key=${apiKey}`;
    
    log(`Fetching places from: ${url.replace(apiKey, 'API_KEY_HIDDEN')}`, 'places-api');
    
    // Make request to Google Places API
    const response = await fetch(url);
    const data = await response.json();
    
    // Return the data
    res.json(data);
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    res.status(500).json({ error: 'Failed to fetch nearby places' });
  }
});

export default router;