const express = require("express");
const router = express.Router();
const vendorService = require("../services/vendorService");

/**
 * Phase 7 Routes: Vendor Communication & Quote Collection
 */

// 1. Phase 7 Status
router.get("/status", (req, res) => {
  res.json({
    success: true,
    phase: "Phase 7 — Vendor Communication & Quote Collection",
    features: [
      "Vendor Contact Directory (Aviation, Chauffeurs, Catering, Legal)",
      "Automated Quote Request / RFP Dispatch",
      "Multi-Vendor Quote Comparison Matrix",
      "Proactive Automated Follow-Ups for Pending Quotes",
      "One-Click Quote Awarding & Transition to Payment Approval"
    ]
  });
});

// 2. Get all vendors in directory
router.get("/directory", (req, res) => {
  try {
    const { category } = req.query;
    const vendors = vendorService.getAllVendors(category);
    res.json({ success: true, count: vendors.length, vendors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get all quote requests & active pipeline
router.get("/requests", (req, res) => {
  try {
    const requests = vendorService.getAllRequests();
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Create new quote request
router.post("/request", (req, res) => {
  try {
    const { title, category, description, budgetUSD, deadline, targetVendorIds } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, error: "Title and description are required" });
    }
    const newReq = vendorService.createQuoteRequest({ title, category, description, budgetUSD, deadline, targetVendorIds });
    res.json({ success: true, request: newReq });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Compare quotes for a request
router.get("/compare/:id", (req, res) => {
  try {
    const comparison = vendorService.compareQuotes(req.params.id);
    res.json({ success: true, comparison });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

// 6. Send proactive follow-up to a vendor
router.post("/followup", (req, res) => {
  try {
    const { requestId, vendorId } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: "requestId is required" });
    }
    const result = vendorService.sendProactiveFollowUp(requestId, vendorId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Award / Select a quote
router.post("/award", (req, res) => {
  try {
    const { requestId, quoteId } = req.body;
    if (!requestId || !quoteId) {
      return res.status(400).json({ success: false, error: "requestId and quoteId are required" });
    }
    const result = vendorService.awardQuote(requestId, quoteId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Pipeline summary stats
router.get("/stats", (req, res) => {
  try {
    const stats = vendorService.getPipelineStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
