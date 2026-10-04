const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit, sendNotification } = require('../utils/auditLogger');
const { getPolicy } = require('../attendanceEngine');
const { uploadEvidenceToVercel, markDatabaseDirty } = require('../storage');

const router = express.Router();

// 1. Submit OD Request (Student)
router.post('/apply', authenticateToken, async (req, res) => {
  // Only students can apply for their own OD
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only registered students can apply for OD.' });
  }

  const {
    od_type,
    event_name,
    venue,
    from_date,
    to_date,
    from_period = 1,
    to_period = 7,
    description,
    remarks,
    evidence_base64,
    evidence_name,
    evidence_type,
    evidence_size
  } = req.body;

  if (!od_type || !event_name || !venue || !from_date || !to_date || !description) {
    return res.status(400).json({ error: 'Please provide all mandatory fields (event, venue, dates, description).' });
  }

  const policy = getPolicy();

  // Validate dates
  if (new Date(to_date) < new Date(from_date)) {
    return res.status(400).json({ error: 'To date cannot be earlier than From date.' });
  }

  // Validate evidence file if provided
  if (evidence_base64 && evidence_name) {
    const ext = evidence_name.split('.').pop().toUpperCase();
    const allowed = policy.allowed_evidence_formats.split(',').map(s => s.trim().toUpperCase());
    if (!allowed.includes(ext) && !allowed.includes(ext === 'JPEG' ? 'JPG' : ext)) {
      return res.status(400).json({ error: `File type .${ext} is not allowed. Supported formats: ${policy.allowed_evidence_formats}` });
    }
    if (evidence_size && evidence_size > policy.max_upload_size_mb * 1024 * 1024) {
      return res.status(400).json({ error: `File size exceeds the ${policy.max_upload_size_mb}MB limit.` });
    }
  }

  const db = getDb();

  // Check for duplicate or overlapping pending OD for same dates
  const overlapping = db.prepare(`
    SELECT * FROM od_requests
    WHERE student_id = ? AND status IN ('PENDING', 'APPROVED')
      AND NOT (to_date < ? OR from_date > ?)
  `).get(req.user.studentId, from_date, to_date);

  if (overlapping) {
    return res.status(409).json({
      error: `You already have an active/pending OD request (${overlapping.request_number}) covering these dates.`
    });
  }

  // Generate unique Request Number
  const currentYear = new Date().getFullYear();
  const countRow = db.prepare('SELECT count(*) as count FROM od_requests').get();
  const seqNum = String(countRow.count + 1).padStart(4, '0');
  const requestNumber = `OD-${currentYear}-${seqNum}`;

  // Upload evidence to Vercel Blob storage if provided
  let finalEvidenceUrl = evidence_base64 || null;
  if (evidence_base64) {
    try {
      const buffer = Buffer.from(evidence_base64.replace(/^data:.*?;base64,/, ''), 'base64');
      const blobUrl = await uploadEvidenceToVercel(buffer, evidence_name || 'evidence.jpg', evidence_type || 'image/jpeg');
      if (blobUrl) {
        finalEvidenceUrl = blobUrl;
      }
    } catch (e) {
      console.error('[OD Upload] Vercel Blob upload notice:', e.message);
    }
  }

  db.prepare(`
    INSERT INTO od_requests (
      request_number, student_id, od_type, event_name, venue, from_date, to_date,
      from_period, to_period, description, remarks, evidence_url, evidence_name,
      evidence_type, evidence_size, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(
    requestNumber,
    req.user.studentId,
    od_type,
    event_name,
    venue,
    from_date,
    to_date,
    from_period,
    to_period,
    description,
    remarks || null,
    finalEvidenceUrl,
    evidence_name || null,
    evidence_type || null,
    evidence_size || null
  );

  markDatabaseDirty();

  // Log audit
  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'OD_SUBMISSION',
    entity: 'od_request',
    entityId: requestNumber,
    newValue: `Event: ${event_name} (${from_date} to ${to_date})`,
    reason: description,
    ipAddress: req.ip
  });

  // Notify HOD
  const hodUser = db.prepare("SELECT id FROM users WHERE role = 'hod' LIMIT 1").get();
  if (hodUser) {
    sendNotification({
      userId: hodUser.id,
      title: `New OD Request: ${req.user.full_name}`,
      message: `${req.user.full_name} (${req.user.registerNumber}) applied for OD for "${event_name}".`,
      type: 'request',
      linkUrl: '/hod/approvals?tab=od'
    });
  }

  res.status(201).json({
    success: true,
    requestId: requestNumber,
    message: `OD request ${requestNumber} submitted successfully and sent for HOD review.`
  });
});

// 2. Student's own OD requests
router.get('/my-requests', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access only.' });
  }

  const db = getDb();
  const requests = db.prepare(`
    SELECT r.*, u.full_name as reviewer_name
    FROM od_requests r
    LEFT JOIN users u ON r.reviewed_by = u.id
    WHERE r.student_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.studentId);

  res.json({ requests });
});

// 3. All OD requests (HOD / Faculty view)
router.get('/all', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const { status, year_level, search, page = 1, limit = 50 } = req.query;
  const db = getDb();

  let query = `
    SELECT r.*, s.register_number, s.full_name as student_name, s.year_level, s.semester,
           b.name as batch_name, rev.full_name as reviewer_name
    FROM od_requests r
    JOIN students s ON r.student_id = s.id
    JOIN batches b ON s.batch_id = b.id
    LEFT JOIN users rev ON r.reviewed_by = rev.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ' AND r.status = ?';
    params.push(status);
  }
  if (year_level) {
    query += ' AND s.year_level = ?';
    params.push(year_level);
  }
  if (search) {
    query += ' AND (s.register_number LIKE ? OR s.full_name LIKE ? OR r.event_name LIKE ? OR r.request_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += " ORDER BY CASE WHEN r.status = 'PENDING' THEN 0 ELSE 1 END, r.created_at DESC";

  const offset = (page - 1) * limit;
  query += ` LIMIT ${parseInt(limit, 10)} OFFSET ${offset}`;

  const requests = db.prepare(query).all(...params);
  res.json({ requests });
});

// 4. HOD Review (Approve / Reject / Clarify) with automatic attendance reconciliation!
router.post('/:id/review', authenticateToken, requireRole('hod'), (req, res) => {
  const requestId = req.params.id;
  const { action, hod_remarks } = req.body; // action: 'APPROVE', 'REJECT', 'CLARIFY'

  if (!action || !['APPROVE', 'REJECT', 'CLARIFY'].includes(action)) {
    return res.status(400).json({ error: 'Valid review action (APPROVE, REJECT, CLARIFY) required.' });
  }

  const db = getDb();
  const od = db.prepare(`
    SELECT r.*, s.user_id as student_user_id, s.register_number, s.full_name as student_name
    FROM od_requests r
    JOIN students s ON r.student_id = s.id
    WHERE r.id = ? OR r.request_number = ?
  `).get(requestId, requestId);

  if (!od) {
    return res.status(404).json({ error: 'OD request not found.' });
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'CLARIFICATION_REQUESTED');
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.exec('BEGIN TRANSACTION;');

  try {
    // 1. Update request status
    db.prepare(`
      UPDATE od_requests
      SET status = ?, hod_remarks = ?, reviewed_by = ?, reviewed_at = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(newStatus, hod_remarks || null, req.user.id, now, od.id);

    let updatedAttendanceCount = 0;

    // 2. If APPROVED: Reconcile past attendance records covering this date range
    if (newStatus === 'APPROVED') {
      // Find all attendance sessions conducted between from_date and to_date
      const matchingSessions = db.prepare(`
        SELECT ses.id as session_id, ses.session_date, ses.period_number, subj.code as subject_code
        FROM attendance_sessions ses
        JOIN subjects subj ON ses.subject_id = subj.id
        WHERE ses.session_date >= ? AND ses.session_date <= ?
          AND (? BETWEEN ses.period_number AND ? OR ? IS NULL)
      `).all(od.from_date, od.to_date, od.from_period, od.to_period, od.from_period);

      for (const ses of matchingSessions) {
        // Check student's record in this session
        const rec = db.prepare(`
          SELECT * FROM attendance_records
          WHERE session_id = ? AND student_id = ?
        `).get(ses.session_id, od.student_id);

        if (rec) {
          // If student was marked ABSENT or UNMARKED, convert to OD
          if (rec.status === 'ABSENT' || rec.status === 'UNMARKED') {
            db.prepare(`
              UPDATE attendance_records
              SET status = 'OD', auto_applied = 1, source_request_type = 'OD',
                  source_request_id = ?, remarks = ?, updated_at = datetime('now', 'localtime')
              WHERE session_id = ? AND student_id = ?
            `).run(od.id, `Auto-updated on OD approval: ${od.request_number}`, ses.session_id, od.student_id);

            updatedAttendanceCount++;

            // Audit record update
            logAudit({
              userId: req.user.id,
              userName: req.user.full_name,
              role: req.user.role,
              action: 'ATTENDANCE_AUTO_UPDATE_ON_OD_APPROVAL',
              entity: 'attendance_record',
              entityId: `${ses.session_id}_${od.student_id}`,
              previousValue: rec.status,
              newValue: 'OD',
              reason: `OD Request ${od.request_number} approved by HOD`,
              ipAddress: req.ip
            });
          }
        }
      }
    }

    // 3. Log audit
    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      role: req.user.role,
      action: action === 'APPROVE' ? 'OD_APPROVAL' : 'OD_REJECTION',
      entity: 'od_request',
      entityId: od.request_number,
      previousValue: od.status,
      newValue: newStatus,
      reason: hod_remarks || `OD ${action.toLowerCase()}d by HOD`,
      ipAddress: req.ip
    });

    // 4. Send notification to student
    sendNotification({
      userId: od.student_user_id,
      title: `OD Request ${newStatus === 'APPROVED' ? 'Approved!' : (newStatus === 'REJECTED' ? 'Rejected' : 'Clarification Needed')}`,
      message: newStatus === 'APPROVED'
        ? `Your OD request (${od.request_number}) for ${od.event_name} has been approved.${updatedAttendanceCount > 0 ? ` ${updatedAttendanceCount} class attendance record(s) updated to OD.` : ''}`
        : `Your OD request (${od.request_number}) was ${newStatus.toLowerCase()}. Remarks: ${hod_remarks || 'None'}`,
      type: 'request',
      linkUrl: '/student/od-requests'
    });

    db.exec('COMMIT;');

    res.json({
      success: true,
      status: newStatus,
      updatedAttendanceSessions: updatedAttendanceCount,
      message: newStatus === 'APPROVED'
        ? `OD approved successfully.${updatedAttendanceCount > 0 ? ` ${updatedAttendanceCount} relevant attendance record(s) updated to OD.` : ''}`
        : `OD marked as ${newStatus}.`
    });
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('Error reviewing OD:', error);
    res.status(500).json({ error: 'Failed to process OD review: ' + error.message });
  }
});

module.exports = router;
