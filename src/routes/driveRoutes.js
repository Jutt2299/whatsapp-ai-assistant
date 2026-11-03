const express = require("express");
const router = express.Router();
const driveService = require("../services/driveService");

/**
 * Phase 5 Routes: Google Drive Automation + Invoice Management
 */

// 1. Get Drive Status & Connected Account Info
router.get("/status", (req, res) => {
  res.json({ success: true, phase: "Phase 5 — Google Drive Automation + Invoice Workflow", ...driveService.getDriveStatus() });
});

// 2. Get all folders (Drive tree)
router.get("/folders", (req, res) => {
  try {
    const folders = driveService.getFolders();
    res.json({ success: true, count: folders.length, folders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get all files (optionally filter by folderId or tag)
router.get("/files", (req, res) => {
  try {
    const { folderId, tag } = req.query;
    const files = driveService.getFiles(folderId, tag);
    res.json({ success: true, count: files.length, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Search files by keyword
router.get("/files/search", (req, res) => {
  try {
    const { q } = req.query;
    const files = driveService.searchFiles(q);
    res.json({ success: true, count: files.length, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Upload & auto-organize a file
router.post("/files/upload", (req, res) => {
  try {
    const { originalName, mimeType, category, metadata } = req.body;
    const result = driveService.uploadAndOrganize({ originalName, mimeType, category, metadata });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Rename a file using structured naming
router.post("/files/:fileId/rename", (req, res) => {
  try {
    const result = driveService.renameFile(req.params.fileId, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Share a file via email or WhatsApp
router.post("/files/:fileId/share", (req, res) => {
  try {
    const result = driveService.shareFile(req.params.fileId, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Get all invoices (optionally filter by payment status)
router.get("/invoices", (req, res) => {
  try {
    const { status } = req.query;
    const invoices = driveService.getInvoices(status);
    const requests = driveService.getInvoiceRequests();
    res.json({ success: true, invoiceCount: invoices.length, requestCount: requests.length, invoices, requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Request an invoice from a vendor
router.post("/invoices/request", (req, res) => {
  try {
    const { vendor, contactEmail, description, expectedAmount, currency, dueBy } = req.body;
    const result = driveService.requestInvoice({ vendor, contactEmail, description, expectedAmount, currency, dueBy });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Follow up on a pending invoice request
router.post("/invoices/request/:requestId/followup", (req, res) => {
  try {
    const result = driveService.followUpInvoice(req.params.requestId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Mark invoice as received and auto-organize into Drive
router.post("/invoices/request/:requestId/receive", (req, res) => {
  try {
    const result = driveService.receiveAndOrganizeInvoice(req.params.requestId, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Generate Monthly Invoice Summary for Accountant
router.post("/invoices/summary", (req, res) => {
  try {
    const { month } = req.body;
    const result = driveService.generateMonthlySummary(month);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
