const express = require('express');
const router = express.Router();
const aiConciergeService = require('../services/aiConciergeService');

// Interactive chat endpoint for the web dashboard / simulator
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId = 'web-simulator-user', languageOverride } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const result = await aiConciergeService.processMessage({
      sessionId,
      message,
      languageOverride
    });

    res.json({
      success: true,
      reply: result.reply,
      language: result.language,
      sessionId: result.sessionId,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear conversation history
router.post('/reset', (req, res) => {
  const { sessionId = 'web-simulator-user' } = req.body;
  aiConciergeService.clearSession(sessionId);
  res.json({ success: true, message: 'Session history cleared' });
});

module.exports = router;
