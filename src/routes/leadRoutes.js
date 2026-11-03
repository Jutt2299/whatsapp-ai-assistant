const express = require('express');
const router = express.Router();
const leadService = require('../services/leadService');

/**
 * Lead Generation & Custom Spreadsheet Export Routes
 */

router.get('/office-mexico', (req, res) => {
  try {
    const result = leadService.generateOfficeConstructionLeads();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/generate', (req, res) => {
  try {
    const result = leadService.generateOfficeConstructionLeads();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
