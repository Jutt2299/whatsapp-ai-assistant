const express = require("express");
const router = express.Router();
const financeService = require("../services/financeService");

/**
 * Phase 6 Routes: Financial Analysis & Expense Management
 */

// 1. Phase 6 Status
router.get("/status", (req, res) => {
  res.json({
    success: true,
    phase: "Phase 6 — Financial Analysis & Expense Management",
    features: ["Amex/Card Expense Categorization", "Anomaly Detection", "Budget Tracking", "Monthly Reports", "Spreadsheet Export"]
  });
});

// 2. Get all transactions (with optional filters)
router.get("/transactions", (req, res) => {
  try {
    const { category, card, flag, status } = req.query;
    const txns = financeService.getAllTransactions({ category, card, flag, status });
    res.json({ success: true, count: txns.length, transactions: txns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get spending category breakdown with budget comparison
router.get("/breakdown", (req, res) => {
  try {
    const result = financeService.getCategoryBreakdown();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Detect anomalies & unusual charges
router.get("/anomalies", (req, res) => {
  try {
    const result = financeService.detectAnomalies();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Generate full monthly financial report
router.post("/report", (req, res) => {
  try {
    const { month } = req.body;
    const report = financeService.generateMonthlyReport(month);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Export spreadsheet data
router.get("/export", (req, res) => {
  try {
    const result = financeService.exportToSpreadsheet();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Get all categories + budgets
router.get("/categories", (req, res) => {
  try {
    const categories = financeService.getCategories();
    res.json({ success: true, count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
