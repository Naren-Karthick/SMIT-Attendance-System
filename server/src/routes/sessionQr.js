const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
const QR_SECRET = process.env.JWT_SECRET || 'smit-smart-attendance-super-secret-key-2026';

// Map of active tokens to prevent replay: token -> { batchId, subjectId, sessionId, expiresAt }
const activeQrTokens = new Map();

// 1. Generate short-lived (30s) signed dynamic QR token for a classroom session (Faculty)
router.post('/generate-token', authenticateToken, requireRole('faculty', 'hod'), (req, res) => {
  const { batch_id, subject_id, period_number, session_date } = req.body;
  if (!batch_id || !subject_id || !period_number || !session_date) {
    return res.status(400).json({ error: 'batch_id, subject_id, period_number, and session_date are required.' });
  }

  const now = Date.now();
  const expiresAt = now + 30 * 1000; // 30 seconds rolling window
  const nonce = crypto.randomBytes(8).toString('hex');

  const payload = `${batch_id}:${subject_id}:${period_number}:${session_date}:${expiresAt}:${nonce}`;
  const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');

  const token = Buffer.from(JSON.stringify({
    b: batch_id,
    s: subject_id,
    p: period_number,
    d: session_date,
    exp: expiresAt,
    n: nonce,
    sig: signature
  })).toString('base64url');

  // Store in memory for replay validation
  activeQrTokens.set(token, {
    batchId: batch_id,
    subjectId: subject_id,
    periodNumber: period_number,
    sessionDate: session_date,
    facultyId: req.user.facultyId || 1,
    expiresAt
  });

  // Clean expired tokens
  for (const [t, data] of activeQrTokens.entries()) {
    if (Date.now() > data.expiresAt) activeQrTokens.delete(t);
  }

  res.json({
    success: true,
    token,
    expiresAt,
    ttlSeconds: 30
  });
});

// 2. Student self-check-in by scanning the active dynamic QR
router.post('/checkin', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can check in via QR.' });
  }

  const { token, client_timestamp } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'QR Token is required.' });
  }

  const tokenData = activeQrTokens.get(token);
  if (!tokenData) {
    return res.status(400).json({ error: 'QR Code has expired or is invalid. Please scan the newly refreshed QR.' });
  }

  if (Date.now() > tokenData.expiresAt) {
    activeQrTokens.delete(token);
    return res.status(400).json({ error: 'QR Code has expired. Please scan the active code on the faculty screen.' });
  }

  const db = getDb();
  // Verify student is enrolled in this batch
  const student = db.prepare('SELECT id, batch_id, full_name, register_number FROM students WHERE user_id = ?').get(req.user.id);
  if (!student || student.batch_id !== tokenData.batchId) {
    return res.status(403).json({ error: 'You are not enrolled in this section/class.' });
  }

  // Find or create session
  let session = db.prepare(`
    SELECT id FROM attendance_sessions
    WHERE batch_id = ? AND subject_id = ? AND session_date = ? AND period_number = ?
  `).get(tokenData.batchId, tokenData.subjectId, tokenData.sessionDate, tokenData.periodNumber);

  db.exec('BEGIN TRANSACTION;');
  try {
    let sessionId;
    if (!session) {
      const insSession = db.prepare(`
        INSERT INTO attendance_sessions (
          batch_id, subject_id, faculty_id, session_date, period_number,
          topic, status, created_by
        ) VALUES (?, ?, ?, ?, ?, 'Dynamic QR Session', 'submitted', ?)
      `).run(tokenData.batchId, tokenData.subjectId, tokenData.facultyId, tokenData.sessionDate, tokenData.periodNumber, req.user.id);
      sessionId = insSession.lastInsertRowid;
    } else {
      sessionId = session.id;
    }

    // Check if already checked in
    const existing = db.prepare('SELECT id, status FROM attendance_records WHERE session_id = ? AND student_id = ?').get(sessionId, student.id);
    if (existing && existing.status === 'PRESENT') {
      db.exec('ROLLBACK;');
      return res.json({ success: true, message: 'You are already marked PRESENT for this session.' });
    }

    db.prepare(`
      INSERT INTO attendance_records (
        session_id, student_id, status, remarks, updated_at
      ) VALUES (?, ?, 'PRESENT', 'Self check-in via Dynamic QR', datetime('now', 'localtime'))
      ON CONFLICT(session_id, student_id) DO UPDATE SET
        status = 'PRESENT',
        remarks = 'Self check-in via Dynamic QR',
        updated_at = datetime('now', 'localtime')
    `).run(sessionId, student.id);

    db.exec('COMMIT;');
    res.json({
      success: true,
      studentName: student.full_name,
      registerNumber: student.register_number,
      message: 'Attendance verified and marked PRESENT successfully!'
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;