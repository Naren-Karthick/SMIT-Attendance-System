const express = require('express');
const { verifyEvidenceToken } = require('../utils/signedEvidence');
const { getDb } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Download/view evidence with signed token (Protected, Expiring)
router.get('/download/:token', (req, res) => {
  const { token } = req.params;
  const verification = verifyEvidenceToken(token);
  if (!verification.valid) {
    return res.status(403).json({ error: verification.error });
  }

  const db = getDb();
  // Check in od_requests or leave_requests
  const od = db.prepare('SELECT evidence_url, evidence_name, evidence_type FROM od_requests WHERE id = ? OR request_number = ?').get(verification.fileId, verification.fileId);
  if (od && od.evidence_url) {
    return res.json({ success: true, fileName: od.evidence_name, mimeType: od.evidence_type, url: od.evidence_url });
  }
  const leave = db.prepare('SELECT document_url, document_name, document_type FROM leave_requests WHERE id = ? OR request_number = ?').get(verification.fileId, verification.fileId);
  if (leave && leave.document_url) {
    return res.json({ success: true, fileName: leave.document_name, mimeType: leave.document_type, url: leave.document_url });
  }
  return res.status(404).json({ error: 'Evidence file not found or has been purged.' });
});

module.exports = router;