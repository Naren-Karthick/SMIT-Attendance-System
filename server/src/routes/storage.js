const express = require('express');
const { getStorageStatus, backupDatabaseToVercel, uploadEvidenceToVercel } = require('../storage');
const { getDbPath } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 1. Get Storage & Sync Status
router.get('/status', (req, res) => {
  res.json({
    ...getStorageStatus(),
    serverTime: new Date().toISOString(),
    syncIntervalSec: 30
  });
});

// 2. Trigger Manual Cloud Sync to Vercel Storage
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const dbPath = getDbPath();
    const result = await backupDatabaseToVercel(dbPath);
    res.json({
      message: result.success ? 'Database successfully synced to Vercel Cloud Storage' : 'Database sync skipped or queued',
      result,
      status: getStorageStatus()
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to sync to Vercel storage' });
  }
});

// 3. Upload evidence directly to Vercel Blob
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { base64Data, filename, contentType } = req.body;
    if (!base64Data || !filename) {
      return res.status(400).json({ error: 'Missing base64Data or filename' });
    }

    const buffer = Buffer.from(base64Data.replace(/^data:.*?;base64,/, ''), 'base64');
    const url = await uploadEvidenceToVercel(buffer, filename, contentType);

    if (!url) {
      return res.status(500).json({ error: 'Failed to upload to Vercel Blob storage' });
    }

    res.json({ success: true, url, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
