const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit, sendNotification } = require('../utils/auditLogger');
const { getPolicy } = require('../attendanceEngine');
const { uploadEvidenceToVercel, markDatabaseDirty } = require('../storage');

const router = express.Router();

// Apply Leave (Student)
router.post('/apply', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can apply for leave.' });
  }

  const {
    leave_type,
    from_date,
    to_date,
    reason,
    remarks,
    document_base64,
    document_name,
    document_type,
    document_size
  } = req.body;

  if (!leave_type || !from_date || !to_date || !reason) {
    return res.status(400).json({ error: 'Please provide leave type, date range, and reason.' });
  }

  if (new Date(to_date) < new Date(from_date)) {
    return res.status(400).json({ error: 'To date cannot be earlier than From date.' });
  }

  const db = getDb();
  const currentYear = new Date().getFullYear();
  const countRow = db.prepare('SELECT count(*) as count FROM leave_requests').get();
  const seqNum = String(countRow.count + 1).padStart(4, '0');
  const requestNumber = `LV-${currentYear}-${seqNum}`;

  // Upload document to Vercel Blob storage if provided
  let finalDocUrl = document_base64 || null;
  if (document_base64) {
    try {
      const buffer = Buffer.from(document_base64.replace(/^data:.*?;base64,/, ''), 'base64');
      const blobUrl = await uploadEvidenceToVercel(buffer, document_name || 'leave_document.jpg', document_type || 'image/jpeg');
      if (blobUrl) {
        finalDocUrl = blobUrl;
      }
    } catch (e) {
      console.error('[Leave Upload] Vercel Blob upload notice:', e.message);
    }
  }

  db.prepare(`
    INSERT INTO leave_requests (
      request_number, student_id, leave_type, from_date, to_date, reason, remarks,
      document_url, document_name, document_type, document_size, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(
    requestNumber,
    req.user.studentId,
    leave_type,
    from_date,
    to_date,
    reason,
    remarks || null,
    finalDocUrl,
    document_name || null,
    document_type || null,
    document_size || null
  );

  markDatabaseDirty();

  // Log audit
  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'LEAVE_SUBMISSION',
    entity: 'leave_request',
    entityId: requestNumber,
    newValue: `${leave_type} (${from_date} to ${to_date})`,
    reason,
    ipAddress: req.ip
  });

  // Notify HOD
  const hodUser = db.prepare("SELECT id FROM users WHERE role = 'hod' LIMIT 1").get();
  if (hodUser) {
    sendNotification({
      userId: hodUser.id,
      title: `New Leave Request: ${req.user.full_name}`,
      message: `${req.user.full_name} (${req.user.registerNumber}) applied for ${leave_type} (${from_date} to ${to_date}).`,
      type: 'request',
      linkUrl: '/hod/approvals?tab=leave'
    });
  }

  res.status(201).json({
    success: true,
    requestId: requestNumber,
    message: `Leave request ${requestNumber} submitted successfully.`
  });
});

// Student's own leave requests
router.get('/my-requests', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access only.' });
  }

  const db = getDb();
  const requests = db.prepare(`
    SELECT l.*, u.full_name as reviewer_name
    FROM leave_requests l
    LEFT JOIN users u ON l.reviewed_by = u.id
    WHERE l.student_id = ?
    ORDER BY l.created_at DESC
  `).all(req.user.studentId);

  res.json({ requests });
});

// All leave requests (HOD / Faculty view)
router.get('/all', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const { status, year_level, search, page = 1, limit = 50 } = req.query;
  const db = getDb();

  let query = `
    SELECT l.*, s.register_number, s.full_name as student_name, s.year_level, s.semester,
           b.name as batch_name, rev.full_name as reviewer_name
    FROM leave_requests l
    JOIN students s ON l.student_id = s.id
    JOIN batches b ON s.batch_id = b.id
    LEFT JOIN users rev ON l.reviewed_by = rev.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ' AND l.status = ?';
    params.push(status);
  }
  if (year_level) {
    query += ' AND s.year_level = ?';
    params.push(year_level);
  }
  if (search) {
    query += ' AND (s.register_number LIKE ? OR s.full_name LIKE ? OR l.reason LIKE ? OR l.request_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += " ORDER BY CASE WHEN l.status = 'PENDING' THEN 0 ELSE 1 END, l.created_at DESC";

  const offset = (page - 1) * limit;
  query += ` LIMIT ${parseInt(limit, 10)} OFFSET ${offset}`;

  const requests = db.prepare(query).all(...params);
  res.json({ requests });
});

// Review Leave (HOD)
router.post('/:id/review', authenticateToken, requireRole('hod'), (req, res) => {
  const requestId = req.params.id;
  const { action, hod_remarks } = req.body;

  if (!action || !['APPROVE', 'REJECT', 'CLARIFY'].includes(action)) {
    return res.status(400).json({ error: 'Valid action (APPROVE, REJECT, CLARIFY) required.' });
  }

  const db = getDb();
  const leave = db.prepare(`
    SELECT l.*, s.user_id as student_user_id, s.register_number, s.full_name as student_name
    FROM leave_requests l
    JOIN students s ON l.student_id = s.id
    WHERE l.id = ? OR l.request_number = ?
  `).get(requestId, requestId);

  if (!leave) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'CLARIFICATION_REQUESTED');
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.exec('BEGIN TRANSACTION;');

  try {
    db.prepare(`
      UPDATE leave_requests
      SET status = ?, hod_remarks = ?, reviewed_by = ?, reviewed_at = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newStatus, hod_remarks || null, req.user.id, now, leave.id);

    let updatedAttendanceCount = 0;

    if (newStatus === 'APPROVED') {
      // Find matching attendance sessions in date range
      const matchingSessions = db.prepare(`
        SELECT id, session_date, period_number FROM attendance_sessions
        WHERE session_date >= ? AND session_date <= ?
      `).all(leave.from_date, leave.to_date);

      for (const ses of matchingSessions) {
        const rec = db.prepare(`
          SELECT * FROM attendance_records
          WHERE session_id = ? AND student_id = ?
        `).get(ses.id, leave.student_id);

        if (rec && (rec.status === 'ABSENT' || rec.status === 'UNMARKED')) {
          db.prepare(`
            UPDATE attendance_records
            SET status = 'LEAVE', auto_applied = 1, source_request_type = 'LEAVE',
                source_request_id = ?, remarks = ?, updated_at = datetime('now', 'localtime')
            WHERE session_id = ? AND student_id = ?
          `).run(leave.id, `Auto-updated on Leave approval: ${leave.request_number}`, ses.id, leave.student_id);
          updatedAttendanceCount++;
        }
      }
    }

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      role: req.user.role,
      action: action === 'APPROVE' ? 'LEAVE_APPROVAL' : 'LEAVE_REJECTION',
      entity: 'leave_request',
      entityId: leave.request_number,
      previousValue: leave.status,
      newValue: newStatus,
      reason: hod_remarks || `Leave ${action.toLowerCase()}d by HOD`,
      ipAddress: req.ip
    });

    sendNotification({
      userId: leave.student_user_id,
      title: `Leave Request ${newStatus === 'APPROVED' ? 'Approved' : (newStatus === 'REJECTED' ? 'Rejected' : 'Clarification Requested')}`,
      message: newStatus === 'APPROVED'
        ? `Your leave request (${leave.request_number}) has been approved.${updatedAttendanceCount > 0 ? ` ${updatedAttendanceCount} session(s) updated to LEAVE.` : ''}`
        : `Your leave request (${leave.request_number}) was ${newStatus.toLowerCase()}. Remarks: ${hod_remarks || 'None'}`,
      type: 'request',
      linkUrl: '/student/leave-requests'
    });

    db.exec('COMMIT;');

    res.json({
      success: true,
      status: newStatus,
      updatedAttendanceSessions: updatedAttendanceCount,
      message: newStatus === 'APPROVED' ? 'Leave approved successfully.' : `Leave marked as ${newStatus}.`
    });
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('Error reviewing leave:', error);
    res.status(500).json({ error: 'Failed to process leave review: ' + error.message });
  }
});

module.exports = router;
