const express = require('express');
const router = express.Router();
const gmailService = require('../services/gmailService');
const calendarService = require('../services/calendarService');

/**
 * Phase 3 Routes: Personal Automation (3 Gmail Accounts + Google Calendars)
 */

// 1. Get Connected Google Accounts
router.get('/accounts', (req, res) => {
  try {
    const accounts = gmailService.getConnectedAccounts();
    res.json({ success: true, count: accounts.length, accounts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Search / List emails across the 3 accounts
router.get('/emails', async (req, res) => {
  try {
    const { accountId, query, category } = req.query;
    const emails = await gmailService.searchEmails({ accountId, query, category });
    res.json({ success: true, count: emails.length, emails });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Scan all 3 inboxes for travel bookings, PNRs, and e-tickets
router.post('/emails/scan', async (req, res) => {
  try {
    const scanReport = await gmailService.scanForTravelItineraries();
    res.json({ success: true, report: scanReport });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Draft an authorized email
router.post('/emails/draft', async (req, res) => {
  try {
    const { to, subject, body, accountId } = req.body;
    const draft = await gmailService.draftTravelEmail({ to, subject, body, accountId });
    res.json({ success: true, draft });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get Google Calendar Events
router.get('/calendar/events', async (req, res) => {
  try {
    const calendars = calendarService.getCalendars();
    const events = await calendarService.getAllEvents();
    res.json({ success: true, calendars, events });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Check Travel Conflicts
router.post('/calendar/check-conflicts', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const conflictResult = await calendarService.checkTravelConflicts({ 
      startDate: startDate || '2026-10-08', 
      endDate: endDate || '2026-10-13' 
    });
    res.json({ success: true, ...conflictResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Schedule Confirmed Travel Itinerary
router.post('/calendar/schedule', async (req, res) => {
  try {
    const { flightDetails, hotelDetails, calendarId } = req.body;
    const result = await calendarService.scheduleTravelItinerary({ flightDetails, hotelDetails, calendarId });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Phase 3 System Status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    phase: 'Phase 3 — Personal Automation (3 Gmail Accounts + Google Calendars)',
    gmailIntegration: {
      connectedAccountsCount: 3,
      authMethod: gmailService.isLiveOAuthConfigured() ? 'Live Google OAuth 2.0' : 'OAuth 2.0 Ready Sandbox',
      features: ['Confirmation Parsing', 'PNR & E-Ticket Extraction', 'Itinerary Change Detection', 'Authorized Email Drafting']
    },
    calendarIntegration: {
      activeCalendarsCount: 3,
      features: ['Automated Flight/Hotel Scheduling', 'Multi-Account Conflict Detection', 'Buffer Times & Reminders']
    }
  });
});

module.exports = router;
