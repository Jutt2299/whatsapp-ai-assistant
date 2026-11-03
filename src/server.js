require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const whatsappRoutes = require('./routes/whatsappRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const chatRoutes = require('./routes/chatRoutes');
const travelRoutes = require('./routes/travelRoutes');
const automationRoutes = require('./routes/automationRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const driveRoutes = require('./routes/driveRoutes');
const financeRoutes = require('./routes/financeRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const leadRoutes = require('./routes/leadRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Required for Twilio WhatsApp Webhooks

// Serve static frontend dashboard & simulator
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/leads', leadRoutes);

// System Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    phase: 'Phases 1–7 Active (AI Concierge + WhatsApp + Duffel Travel + 3 Gmails/Calendars + Tokenized Booking + Drive & Invoices + Financial Analysis + Vendor Quotes & RFPs)',
    timestamp: new Date(),
    aiProvider: process.env.AI_PROVIDER || 'built-in'
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 AI Executive Concierge (Phases 1–7) is LIVE!`);
  console.log(`📍 Web Simulator & Dashboard: http://localhost:${PORT}`);
  console.log(`📱 Twilio WhatsApp Webhook:    http://localhost:${PORT}/api/whatsapp/webhook`);
  console.log(`⚙️  Active AI Engine:          ${process.env.OPENAI_API_KEY ? 'OpenAI GPT-4o' : (process.env.GEMINI_API_KEY ? 'Google Gemini' : 'Built-in Concierge Engine')}`);
  console.log(`======================================================\n`);
});
[]