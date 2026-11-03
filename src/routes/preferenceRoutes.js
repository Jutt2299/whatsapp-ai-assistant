const express = require('express');
const router = express.Router();
const preferenceService = require('../services/preferenceService');

// Get all traveler & family preferences
router.get('/', (req, res) => {
  const prefs = preferenceService.getAllPreferences();
  res.json({ success: true, preferences: prefs });
});

// Update primary traveler
router.put('/primary', (req, res) => {
  const updated = preferenceService.updatePrimaryPreferences(req.body);
  res.json({ success: true, primaryTraveler: updated });
});

// Add family member
router.post('/family', (req, res) => {
  const newMember = preferenceService.addFamilyMember(req.body);
  res.json({ success: true, familyMember: newMember });
});

// Get formatted concierge memory context block
router.get('/context', (req, res) => {
  const context = preferenceService.getConciergeMemoryContext();
  res.json({ success: true, context });
});

module.exports = router;
