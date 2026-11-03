const express = require('express');
const router = express.Router();
const aiConciergeService = require('../services/aiConciergeService');

/**
 * Production Twilio WhatsApp Webhook
 * Twilio sends incoming WhatsApp messages here as POST with urlencoded form data
 */
router.post('/webhook', async (req, res) => {
  try {
    const fromNumber = req.body.From || req.body.from || 'whatsapp:+1000000000';
    const messageBody = req.body.Body || req.body.body || '';
    const profileName = req.body.ProfileName || 'Ahmed';

    console.log(`[Twilio Webhook] Received from ${profileName} (${fromNumber}): "${messageBody}"`);

    // Process through the AI Concierge Engine
    const result = await aiConciergeService.processMessage({
      sessionId: fromNumber,
      message: messageBody
    });

    // Return TwiML XML format so Twilio sends the WhatsApp reply automatically
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${escapeXml(result.reply)}</Message>
</Response>`;

    res.set('Content-Type', 'text/xml');
    return res.status(200).send(twimlResponse);
  } catch (err) {
    console.error('[Twilio Webhook Error]:', err);
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>I apologize, I encountered a temporary issue processing your travel request. Please try again.</Message>
</Response>`;
    res.set('Content-Type', 'text/xml');
    return res.status(200).send(fallbackTwiml);
  }
});

/**
 * Webhook status callback endpoint for Twilio delivery receipts
 */
router.post('/status', (req, res) => {
  const messageSid = req.body.MessageSid;
  const status = req.body.MessageStatus;
  console.log(`[Twilio Status] Message ${messageSid}: ${status}`);
  res.status(200).json({ received: true });
});

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

module.exports = router;
