const express = require('express');
const router = express.Router();
const transactionService = require('../services/transactionService');

/**
 * Phase 4 Routes: Transactions, Approvals & Tokenized Payments
 */

// 1. Get all transactions & bookings
router.get('/', (req, res) => {
  try {
    const transactions = transactionService.getTransactions();
    const paymentMethods = transactionService.getTokenizedPaymentMethods();
    res.json({ success: true, count: transactions.length, transactions, paymentMethods });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get available tokenized payment methods (Vaults)
router.get('/payment-methods', (req, res) => {
  try {
    const paymentMethods = transactionService.getTokenizedPaymentMethods();
    res.json({ success: true, paymentMethods });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create a new booking draft
router.post('/create-draft', (req, res) => {
  try {
    const { flight, hotel, travelParty, paymentMethodId } = req.body;
    const tx = transactionService.createBookingDraft({ flight, hotel, travelParty, paymentMethodId });
    res.json({ success: true, transaction: tx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Explicit user approval & tokenized checkout execution
router.post('/approve', async (req, res) => {
  try {
    const { transactionId, channel = 'Web Dashboard', approvedBy = 'Ahmed Zainul' } = req.body;
    if (!transactionId) {
      return res.status(400).json({ success: false, error: 'transactionId is required for approval.' });
    }

    const result = await transactionService.approveAndExecuteBooking({ transactionId, channel, approvedBy });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Get current pending approval
router.get('/pending', (req, res) => {
  try {
    const transactions = transactionService.getTransactions();
    const pending = transactions.find(t => t.status === 'PENDING_APPROVAL');
    res.json({ success: true, hasPending: Boolean(pending), pendingTransaction: pending || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Phase 4 Status & Security Protocol
router.get('/status', (req, res) => {
  res.json({
    success: true,
    phase: 'Phase 4 — Transactions: Approval Workflow + Secure/Tokenized Payments + Booking',
    rulesEnforced: {
      requireExplicitApproval: true,
      zeroRawCardStorage: true,
      supportedTokenizedVaults: ['Elevate Business Vault', 'Revolut Family Vault'],
      autoPostBookingSync: ['Google Calendar Sync (24h/3h alerts)', 'Gmail Official Confirmation Draft']
    }
  });
});

module.exports = router;
