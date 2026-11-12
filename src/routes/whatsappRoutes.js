const express = require('express');
const router = express.Router();
const https = require('https');
const querystring = require('querystring');
const aiConciergeService = require('../services/aiConciergeService');

/**
 * Send a single WhatsApp message via Twilio REST API
 */
function sendSingleWhatsAppMessage(to, bodyChunk) {
  return new Promise((resolve) => {
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
      Body: bodyChunk
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
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Twilio Outbound Success] Delivered to ${to}: SID ${parsed.sid}`);
          } else {
            console.error(`[Twilio Outbound Error ${parsed.code}] ${parsed.message}`);
          }
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Twilio Outbound Network Error]', err);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send a WhatsApp message asynchronously via Twilio REST API
 * Automatically splits messages exceeding WhatsApp's 1600 character limit (Twilio Error 21617)
 */
async function sendWhatsAppMessage(to, body) {
  if (!body) return;

  const MAX_CHUNK_SIZE = 1500;
  if (body.length <= MAX_CHUNK_SIZE) {
    return await sendSingleWhatsAppMessage(to, body);
  }

  // Split into paragraphs / smart chunks
  const chunks = [];
  let remaining = body;

  while (remaining.length > 0) {
    if (remaining.length <= MAX_CHUNK_SIZE) {
      chunks.push(remaining);
      break;
    }

    // Try finding the last newline before MAX_CHUNK_SIZE
    let splitIdx = remaining.lastIndexOf('\n', MAX_CHUNK_SIZE);
    if (splitIdx === -1 || splitIdx < 800) {
      // Try finding the last period / sentence end
      splitIdx = remaining.lastIndexOf('. ', MAX_CHUNK_SIZE);
      if (splitIdx !== -1) splitIdx += 1;
    }
    if (splitIdx === -1 || splitIdx < 500) {
      splitIdx = MAX_CHUNK_SIZE;
    }

    chunks.push(remaining.substring(0, splitIdx).trim());
    remaining = remaining.substring(splitIdx).trim();
  }

  console.log(`[Twilio Chunking] Splitting message of ${body.length} chars into ${chunks.length} parts for ${to}`);
  for (let i = 0; i < chunks.length; i++) {
    await sendSingleWhatsAppMessage(to, chunks[i]);
    // Small pause between chunks so they arrive in exact order
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }
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
