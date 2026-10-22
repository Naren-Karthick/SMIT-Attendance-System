const express = require('express');
const { getDb, getDbPath } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit, sendNotification } = require('../utils/auditLogger');
const { getPolicy } = require('../attendanceEngine');
const { uploadEvidenceToVercel, markDatabaseDirty, backupDatabaseToVercel } = require('../storage');

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

  // Get student's batch to identify Class In-Charge
  const studentInfo = db.prepare('SELECT batch_id, section_id FROM students WHERE id = ?').get(req.user.studentId);
  const classInCharge = studentInfo ? db.prepare(`
    SELECT f.*, u.id as in_charge_user_id
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    WHERE f.class_in_charge_batch_id = ?
    LIMIT 1
  `).get(studentInfo.batch_id) : null;

  db.prepare(`
    INSERT INTO leave_requests (
      request_number, student_id, leave_type, from_date, to_date, reason, remarks,
      document_url, document_name, document_type, document_size, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_CLASS_IN_CHARGE')
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

  // Notify Class In-Charge if assigned, otherwise notify HOD
  if (classInCharge) {
    sendNotification({
      userId: classInCharge.in_charge_user_id,
      title: `Class In-Charge Leave Review: ${req.user.full_name}`,
      message: `${req.user.full_name} (${req.user.registerNumber}) applied for ${leave_type} (${from_date} to ${to_date}). Please review and endorse for HOD approval.`,
      type: 'request',
      linkUrl: '/faculty/class-requests?tab=leave'
    });
  } else {
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
  }

  // Persist snapshot to Vercel Blob storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await backupDatabaseToVercel(getDbPath());
    } catch (e) {
      console.error('[Leave Submission] Cloud backup notice:', e.message);
    }
  }

  res.status(201).json({
    success: true,
    requestId: requestNumber,
    message: `Leave request ${requestNumber} submitted successfully and routed to Class In-Charge for endorsement.`
  });
});

// Student's own leave requests
router.get('/my-requests', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access only.' });
  }

  const db = getDb();
  const requests = db.prepare(`
    SELECT l.*,
           u_hod.full_name as reviewer_name,
           u_ic.full_name as in_charge_reviewer_name
    FROM leave_requests l
    LEFT JOIN users u_hod ON l.reviewed_by = u_hod.id
    LEFT JOIN users u_ic ON l.in_charge_reviewed_by = u_ic.id
    WHERE l.student_id = ?
    ORDER BY l.created_at DESC
  `).all(req.user.studentId);

  res.json({ requests });
});

// All leave requests (HOD / Faculty / Class In-Charge view)
router.get('/all', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const { status, year_level, batch_id, scope, search, page = 1, limit = 50 } = req.query;
  const db = getDb();

  let query = `
    SELECT l.*, s.register_number, s.full_name as student_name, s.year_level, s.semester, s.batch_id,
           b.name as batch_name,
           rev.full_name as reviewer_name,
           ic_rev.full_name as in_charge_reviewer_name
    FROM leave_requests l
    JOIN students s ON l.student_id = s.id
    JOIN batches b ON s.batch_id = b.id
    LEFT JOIN users rev ON l.reviewed_by = rev.id
    LEFT JOIN users ic_rev ON l.in_charge_reviewed_by = ic_rev.id
    WHERE 1=1
  `;
  const params = [];

  // If scope is 'class_in_charge', filter to classes assigned to logged-in faculty
  if (scope === 'class_in_charge' && req.user.role === 'faculty') {
    const fac = db.prepare('SELECT class_in_charge_batch_id FROM faculty WHERE user_id = ?').get(req.user.id);
    if (fac && fac.class_in_charge_batch_id) {
      query += ' AND s.batch_id = ?';
      params.push(fac.class_in_charge_batch_id);
    } else {
      return res.json({ requests: [], isClassInCharge: false });
    }
  }

  if (batch_id) {
    query += ' AND s.batch_id = ?';
    params.push(batch_id);
  }

  if (status && status !== 'ALL') {
    if (status === 'PENDING') {
      // HOD pending queue only shows requests endorsed by Class In-Charge (PENDING_HOD)
      // or legacy PENDING
      query += " AND l.status IN ('PENDING_HOD', 'PENDING')";
    } else {
      query += ' AND l.status = ?';
      params.push(status);
    }
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

  query += " ORDER BY CASE WHEN l.status IN ('PENDING_CLASS_IN_CHARGE', 'PENDING_HOD', 'PENDING') THEN 0 ELSE 1 END, l.created_at DESC";

  const offset = (page - 1) * limit;
  query += ` LIMIT ${parseInt(limit, 10)} OFFSET ${offset}`;

  const requests = db.prepare(query).all(...params);
  res.json({ requests, isClassInCharge: true });
});

// Stage 1: Class In-Charge Review (Approve -> PENDING_HOD / Reject -> REJECTED_BY_IN_CHARGE)
router.post('/:id/in-charge-review', authenticateToken, requireRole('faculty', 'hod'), async (req, res) => {
  const requestId = req.params.id;
  const { action, remarks } = req.body; // action: 'APPROVE', 'REJECT'

  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Valid action (APPROVE, REJECT) required.' });
  }

  const db = getDb();
  const leave = db.prepare(`
    SELECT l.*, s.user_id as student_user_id, s.register_number, s.full_name as student_name, s.batch_id
    FROM leave_requests l
    JOIN students s ON l.student_id = s.id
    WHERE l.id = ? OR l.request_number = ?
  `).get(requestId, requestId);

  if (!leave) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }

  const newStatus = action === 'APPROVE' ? 'PENDING_HOD' : 'REJECTED_BY_IN_CHARGE';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.exec('BEGIN TRANSACTION;');

  try {
    db.prepare(`
      UPDATE leave_requests
      SET status = ?, in_charge_remarks = ?, in_charge_reviewed_by = ?, in_charge_reviewed_at = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newStatus, remarks || null, req.user.id, now, leave.id);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      role: req.user.role,
      action: action === 'APPROVE' ? 'LEAVE_IN_CHARGE_APPROVAL' : 'LEAVE_IN_CHARGE_REJECTION',
      entity: 'leave_request',
      entityId: leave.request_number,
      previousValue: leave.status,
      newValue: newStatus,
      reason: remarks || `Endorsed by Class In-Charge`,
      ipAddress: req.ip
    });

    if (action === 'APPROVE') {
      // Notify HOD
      const hodUser = db.prepare("SELECT id FROM users WHERE role = 'hod' LIMIT 1").get();
      if (hodUser) {
        sendNotification({
          userId: hodUser.id,
          title: `Endorsed Leave Request: ${leave.student_name}`,
          message: `${leave.student_name} (${leave.register_number}) applied for ${leave.leave_type}. Endorsed by Class In-Charge, awaiting your final sign-off.`,
          type: 'request',
          linkUrl: '/hod/approvals?tab=leave'
        });
      }
      // Notify student
      sendNotification({
        userId: leave.student_user_id,
        title: 'Leave Endorsed by Class In-Charge',
        message: `Your leave request (${leave.request_number}) was approved by your Class In-Charge and forwarded to the HOD for final approval.`,
        type: 'request',
        linkUrl: '/student/leave-requests'
      });
    } else {
      // Notify student of rejection
      sendNotification({
        userId: leave.student_user_id,
        title: 'Leave Request Rejected by Class In-Charge',
        message: `Your leave request (${leave.request_number}) was rejected by your Class In-Charge. Reason: ${remarks || 'None'}`,
        type: 'request',
        linkUrl: '/student/leave-requests'
      });
    }

    db.exec('COMMIT;');

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await backupDatabaseToVercel(getDbPath());
      } catch (e) {
        console.error('[Leave In-Charge Review] Cloud backup notice:', e.message);
      }
    }

    res.json({
      success: true,
      status: newStatus,
      message: action === 'APPROVE'
        ? 'Leave request approved and forwarded to HOD for final sign-off.'
        : 'Leave request rejected and marked as REJECTED_BY_IN_CHARGE.'
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: err.message });
  }
});

// Review Leave (HOD Stage 2)
router.post('/:id/review', authenticateToken, requireRole('hod'), async (req, res) => {
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

    // Persist reviewed status to Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await backupDatabaseToVercel(getDbPath());
      } catch (e) {
        console.error('[Leave Review] Cloud backup notice:', e.message);
      }
    }

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
