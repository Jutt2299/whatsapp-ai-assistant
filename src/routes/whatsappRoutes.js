const express = require('express');
const router = express.Router();
const https = require('https');
const querystring = require('querystring');
const aiConciergeService = require('../services/aiConciergeService');

/**
 * Send a WhatsApp message asynchronously via Twilio REST API
 * This ensures the bot never hits Twilio's 15-second webhook timeout limit
 */
function sendWhatsAppMessage(to, body) {
  return new Promise((resolve, reject) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.error('[Twilio Outbound Error] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
      return resolve(null);
    }

    const postData = querystring.stringify({
      From: fromNumber,
      To: to,
      Body: body
    });

    const req = https.request({
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`[Twilio Outbound Success] Delivered to ${to}: SID ${parsed.sid}`);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Twilio Outbound Error]', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Production Twilio WhatsApp Webhook
 * Twilio sends incoming WhatsApp messages here as POST with urlencoded form data
 */
router.post('/webhook', async (req, res) => {
  const fromNumber = req.body.From || req.body.from || 'whatsapp:+1000000000';
  const messageBody = req.body.Body || req.body.body || '';
  const profileName = req.body.ProfileName || 'Client';

  console.log(`[Twilio Webhook] Received from ${profileName} (${fromNumber}): "${messageBody}"`);

  // Respond immediately with 200 OK and empty TwiML so Twilio NEVER times out (15s limit)
  res.set('Content-Type', 'text/xml');
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  // Process through AI Concierge and deliver reply asynchronously
  try {
    const result = await aiConciergeService.processMessage({
      sessionId: fromNumber,
      message: messageBody
    });

    if (result && result.reply) {
      await sendWhatsAppMessage(fromNumber, result.reply);
    }
  } catch (err) {
    console.error('[Twilio Webhook Async Error]:', err);
    await sendWhatsAppMessage(
      fromNumber,
      'I apologize, I encountered a temporary issue processing your request. Please try again in a moment.'
    );
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
