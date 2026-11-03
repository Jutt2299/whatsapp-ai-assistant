const express = require('express');
const router = express.Router();
const duffelService = require('../services/duffelService');

// Flight Search via Duffel API
router.post('/flights', async (req, res) => {
  try {
    const { origin = 'MTY', destination = 'MAD', departureDate, party = 'family', cabin = 'premium_economy' } = req.body;
    const results = await duffelService.searchFlights({ origin, destination, departureDate, party, cabin });
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Flight search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hotel Search via Duffel Stays API
router.post('/hotels', async (req, res) => {
  try {
    const { destination = 'Madrid', neighborhood = 'Salamanca', checkInDate, nights = 4, party = 'family' } = req.body;
    const results = await duffelService.searchHotels({ destination, neighborhood, checkInDate, nights, party });
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Hotel search error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Duffel Status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    provider: duffelService.isLiveApiConfigured() ? 'Duffel Live API' : 'Duffel API Engine (v2 Schema Sandbox)',
    supportedRegions: ['USA', 'Mexico', 'Europe'],
    rules: {
      maxResultsCurated: 3,
      requiresExplicitApproval: true
    }
  });
});

module.exports = router;
