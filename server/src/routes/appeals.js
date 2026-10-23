const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit, sendNotification } = require('../utils/auditLogger');

const router = express.Router();

// 1. Submit an appeal against an attendance record (Student)
router.post('/submit', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can submit attendance appeals.' });
  }

  const { session_id, requested_status, reason, evidence_url, evidence_name } = req.body;
  if (!session_id || !requested_status || !reason) {
    return res.status(400).json({ error: 'Session ID, requested status, and reason are required.' });
  }

  const db = getDb();
  // Fetch existing record
  const record = db.prepare(`
    SELECT ar.status, ses.session_date, ses.period_number, s.code as subject_code
    FROM attendance_records ar
    JOIN attendance_sessions ses ON ar.session_id = ses.id
    JOIN subjects s ON ses.subject_id = s.id
    WHERE ar.session_id = ? AND ar.student_id = ?
  `).get(session_id, req.user.studentId);

  if (!record) {
    return res.status(404).json({ error: 'Attendance record not found for this session.' });
  }

  const countRow = db.prepare('SELECT count(*) as count FROM attendance_appeals').get();
  const appealNumber = `APL-2026-${String(countRow.count + 1).padStart(4, '0')}`;

  const result = db.prepare(`
    INSERT INTO attendance_appeals (
      appeal_number, student_id, session_id, original_status, requested_status,
      reason, evidence_url, evidence_name, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_FACULTY')
  `).run(
    appealNumber, req.user.studentId, session_id, record.status, requested_status,
    reason, evidence_url || null, evidence_name || null
  );

  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'ATTENDANCE_APPEAL_SUBMITTED',
    entity: 'attendance_appeals',
    entityId: String(result.lastInsertRowid),
    previousValue: record.status,
    newValue: requested_status,
    reason: reason,
    ipAddress: req.ip
  });

  res.json({
    success: true,
    appealNumber,
    appealId: result.lastInsertRowid,
    message: 'Attendance appeal successfully registered and forwarded to faculty review.'
  });
});

// 2. List appeals for student or faculty/HOD
router.get('/list', authenticateToken, (req, res) => {
  const db = getDb();
  let query = `
    SELECT aa.*, s.register_number, s.full_name as student_name,
           subj.code as subject_code, subj.name as subject_name,
           ses.session_date, ses.period_number
    FROM attendance_appeals aa
    JOIN students s ON aa.student_id = s.id
    JOIN attendance_sessions ses ON aa.session_id = ses.id
    JOIN subjects subj ON ses.subject_id = subj.id
  `;
  const params = [];

  if (req.user.role === 'student') {
    query += ' WHERE aa.student_id = ?';
    params.push(req.user.studentId);
  }

  query += ' ORDER BY aa.created_at DESC';
  const appeals = db.prepare(query).all(...params);
  res.json({ success: true, count: appeals.length, appeals });
});

// 3. Faculty / HOD Decision (Approve / Reject / Clarify)
router.post('/:id/decide', authenticateToken, requireRole('faculty', 'hod'), (req, res) => {
  const { decision, remarks } = req.body; // 'APPROVE', 'REJECT', 'CLARIFICATION'
  if (!['APPROVE', 'REJECT', 'CLARIFICATION'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decision is required (APPROVE, REJECT, CLARIFICATION).' });
  }

  const db = getDb();
  const appeal = db.prepare('SELECT * FROM attendance_appeals WHERE id = ?').get(req.params.id);
  if (!appeal) return res.status(404).json({ error: 'Appeal not found.' });

  const isHod = req.user.role === 'hod';
  let nextStatus = appeal.status;

  db.exec('BEGIN TRANSACTION;');
  try {
    if (decision === 'APPROVE') {
      nextStatus = 'APPROVED';
      // Atomically update the underlying attendance record
      db.prepare(`
        UPDATE attendance_records
        SET status = ?, remarks = ?, updated_at = datetime('now', 'localtime')
        WHERE session_id = ? AND student_id = ?
      `).run(appeal.requested_status, `Corrected via Appeal ${appeal.appeal_number}`, appeal.session_id, appeal.student_id);

      logAudit({
        userId: req.user.id,
        userName: req.user.full_name,
        role: req.user.role,
        action: 'ATTENDANCE_CORRECTION_APPLIED',
        entity: 'attendance_records',
        entityId: `${appeal.session_id}-${appeal.student_id}`,
        previousValue: appeal.original_status,
        newValue: appeal.requested_status,
        reason: `Approved Appeal: ${remarks || ''}`,
        ipAddress: req.ip
      });
    } else if (decision === 'REJECT') {
      nextStatus = 'REJECTED';
    } else {
      nextStatus = 'CLARIFICATION_REQUESTED';
    }

    db.prepare(`
      UPDATE attendance_appeals
      SET status = ?, faculty_remarks = COALESCE(?, faculty_remarks),
          hod_remarks = COALESCE(?, hod_remarks), decision_by = ?, decision_at = datetime('now', 'localtime'),
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(nextStatus, !isHod ? remarks : null, isHod ? remarks : null, req.user.id, appeal.id);

    db.exec('COMMIT;');
    res.json({ success: true, status: nextStatus, message: `Appeal marked as ${nextStatus}.` });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;