const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit, sendNotification } = require('../utils/auditLogger');
const { getPolicy, getStudentOverallAttendance, getStudentSubjectBreakdown } = require('../attendanceEngine');

const router = express.Router();

// 1. Check if attendance already exists for duplicate protection
router.get('/check-session', authenticateToken, (req, res) => {
  const { batch_id, subject_id, date, period_number } = req.query;

  if (!batch_id || !subject_id || !date || !period_number) {
    return res.status(400).json({ error: 'Missing required query parameters.' });
  }

  const db = getDb();
  const policy = getPolicy();

  const session = db.prepare(`
    SELECT s.*, subj.code as subject_code, subj.name as subject_name,
           f.full_name as faculty_name
    FROM attendance_sessions s
    JOIN subjects subj ON s.subject_id = subj.id
    JOIN faculty f ON s.faculty_id = f.id
    WHERE s.batch_id = ? AND s.subject_id = ? AND s.session_date = ? AND s.period_number = ?
  `).get(batch_id, subject_id, date, period_number);

  if (!session) {
    return res.json({ exists: false });
  }

  // Check if within edit window
  const sessionCreated = new Date(session.created_at);
  const now = new Date();
  const hoursDiff = (now - sessionCreated) / (1000 * 60 * 60);

  const isHod = req.user.role === 'hod';
  const canEdit = isHod || (hoursDiff <= policy.faculty_edit_window_hours);

  // Fetch summary counts for the existing session
  const summary = db.prepare(`
    SELECT
      count(*) as total,
      sum(case when status = 'PRESENT' then 1 else 0 end) as present,
      sum(case when status = 'ABSENT' then 1 else 0 end) as absent,
      sum(case when status = 'OD' then 1 else 0 end) as od,
      sum(case when status = 'PERMISSION' then 1 else 0 end) as permission,
      sum(case when status = 'LEAVE' then 1 else 0 end) as leave
    FROM attendance_records
    WHERE session_id = ?
  `).get(session.id);

  res.json({
    exists: true,
    session,
    summary,
    canEdit,
    editWindowHours: policy.faculty_edit_window_hours,
    message: canEdit
      ? 'Attendance already submitted. You are permitted to edit this session.'
      : 'Attendance already submitted. The editing window has elapsed. Contact HOD for corrections.'
  });
});

// 2. Prefill student statuses inspecting approved OD, Permission, and Leave (Requirement 15)
router.get('/prefill-status', authenticateToken, (req, res) => {
  const { batch_id, date, period_number } = req.query;

  if (!batch_id || !date || !period_number) {
    return res.status(400).json({ error: 'batch_id, date, and period_number are required.' });
  }

  const db = getDb();
  const period = parseInt(period_number, 10);

  // Get all active students for this batch
  const students = db.prepare(`
    SELECT s.id, s.register_number, s.full_name, s.batch_id, s.year_level, s.semester
    FROM students s
    WHERE s.batch_id = ? AND s.is_active = 1
    ORDER BY s.register_number ASC
  `).all(batch_id);

  // Get all approved ODs covering this date & period
  const approvedODs = db.prepare(`
    SELECT * FROM od_requests
    WHERE status = 'APPROVED'
      AND from_date <= ? AND to_date >= ?
      AND (? BETWEEN from_period AND to_period OR from_period IS NULL)
  `).all(date, date, period);

  const odMap = new Map();
  for (const od of approvedODs) {
    odMap.set(od.student_id, od);
  }

  // Get approved Permissions
  const approvedPerms = db.prepare(`
    SELECT * FROM permission_requests
    WHERE status = 'APPROVED'
      AND permission_date = ? AND period_number = ?
  `).all(date, period);

  const permMap = new Map();
  for (const p of approvedPerms) {
    permMap.set(p.student_id, p);
  }

  // Get approved Leaves
  const approvedLeaves = db.prepare(`
    SELECT * FROM leave_requests
    WHERE status = 'APPROVED'
      AND from_date <= ? AND to_date >= ?
  `).all(date, date);

  const leaveMap = new Map();
  for (const l of approvedLeaves) {
    leaveMap.set(l.student_id, l);
  }

  const prefilledStudents = students.map(student => {
    let prefilledStatus = 'UNMARKED';
    let autoApplied = false;
    let autoReason = null;
    let sourceRequestId = null;
    let sourceRequestType = null;

    if (odMap.has(student.id)) {
      const od = odMap.get(student.id);
      prefilledStatus = 'OD';
      autoApplied = true;
      autoReason = `Approved OD: ${od.event_name}`;
      sourceRequestId = od.id;
      sourceRequestType = 'OD';
    } else if (permMap.has(student.id)) {
      const perm = permMap.get(student.id);
      prefilledStatus = 'PERMISSION';
      autoApplied = true;
      autoReason = `Approved Permission: ${perm.reason}`;
      sourceRequestId = perm.id;
      sourceRequestType = 'PERMISSION';
    } else if (leaveMap.has(student.id)) {
      const leave = leaveMap.get(student.id);
      prefilledStatus = 'LEAVE';
      autoApplied = true;
      autoReason = `Approved Leave: ${leave.leave_type}`;
      sourceRequestId = leave.id;
      sourceRequestType = 'LEAVE';
    }

    return {
      studentId: student.id,
      registerNumber: student.register_number,
      fullName: student.full_name,
      prefilledStatus,
      autoApplied,
      autoReason,
      sourceRequestId,
      sourceRequestType
    };
  });

  res.json({
    date,
    periodNumber: period,
    totalStudents: students.length,
    autoOdCount: prefilledStudents.filter(s => s.prefilledStatus === 'OD').length,
    autoPermCount: prefilledStudents.filter(s => s.prefilledStatus === 'PERMISSION').length,
    autoLeaveCount: prefilledStudents.filter(s => s.prefilledStatus === 'LEAVE').length,
    students: prefilledStudents
  });
});

// 3. Submit attendance with duplicate check, atomic transactions, and audit
router.post('/submit', authenticateToken, requireRole('faculty', 'hod'), (req, res) => {
  const {
    batch_id,
    section_id,
    subject_id,
    faculty_id,
    session_date,
    period_number,
    start_time,
    end_time,
    room,
    topic,
    records // [{ student_id, status, auto_applied, source_request_type, source_request_id, remarks }]
  } = req.body;

  if (!batch_id || !subject_id || !session_date || !period_number || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Incomplete attendance submission data.' });
  }

  const db = getDb();
  const policy = getPolicy();
  const effectiveFacultyId = faculty_id || req.user.facultyId || 1;

  // Check duplicate
  const existingSession = db.prepare(`
    SELECT * FROM attendance_sessions
    WHERE batch_id = ? AND subject_id = ? AND session_date = ? AND period_number = ?
  `).get(batch_id, subject_id, session_date, period_number);

  let sessionId = null;
  let isUpdate = false;

  if (existingSession) {
    // Check edit authorization
    const sessionCreated = new Date(existingSession.created_at);
    const now = new Date();
    const hoursDiff = (now - sessionCreated) / (1000 * 60 * 60);

    const isHod = req.user.role === 'hod';
    if (!isHod && hoursDiff > policy.faculty_edit_window_hours) {
      return res.status(409).json({
        error: `Attendance already submitted. The edit window (${policy.faculty_edit_window_hours} hours) has closed. Please contact HOD.`
      });
    }

    sessionId = existingSession.id;
    isUpdate = true;
  }

  db.exec('BEGIN TRANSACTION;');

  try {
    if (isUpdate) {
      db.prepare(`
        UPDATE attendance_sessions
        SET topic = ?, start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
            room = COALESCE(?, room), status = 'edited', updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(topic || 'Revised Session', start_time, end_time, room, sessionId);

      // Upsert records
      const upsertRecord = db.prepare(`
        INSERT INTO attendance_records (
          session_id, student_id, status, auto_applied, source_request_type,
          source_request_id, remarks, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        ON CONFLICT(session_id, student_id) DO UPDATE SET
          status = excluded.status,
          auto_applied = excluded.auto_applied,
          source_request_type = excluded.source_request_type,
          source_request_id = excluded.source_request_id,
          remarks = excluded.remarks,
          updated_at = datetime('now', 'localtime')
      `);

      for (const r of records) {
        upsertRecord.run(
          sessionId,
          r.student_id,
          r.status,
          r.auto_applied ? 1 : 0,
          r.source_request_type || null,
          r.source_request_id || null,
          r.remarks || null
        );
      }
    } else {
      const insSession = db.prepare(`
        INSERT INTO attendance_sessions (
          batch_id, section_id, subject_id, faculty_id, session_date, period_number,
          start_time, end_time, room, topic, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)
      `);

      const sesRes = insSession.run(
        batch_id,
        section_id || 1,
        subject_id,
        effectiveFacultyId,
        session_date,
        period_number,
        start_time || '08:45',
        end_time || '09:40',
        room || 'IT-301',
        topic || 'Regular Lecture',
        req.user.id
      );
      sessionId = Number(sesRes.lastInsertRowid);

      const insRecord = db.prepare(`
        INSERT INTO attendance_records (
          session_id, student_id, status, auto_applied, source_request_type,
          source_request_id, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const r of records) {
        insRecord.run(
          sessionId,
          r.student_id,
          r.status,
          r.auto_applied ? 1 : 0,
          r.source_request_type || null,
          r.source_request_id || null,
          r.remarks || null
        );
      }
    }

    // Log to Audit Log
    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      role: req.user.role,
      action: isUpdate ? 'ATTENDANCE_MODIFIED' : 'ATTENDANCE_SUBMITTED',
      entity: 'attendance_session',
      entityId: sessionId,
      previousValue: isUpdate ? 'PREVIOUS_STATE' : null,
      newValue: `Date: ${session_date}, Period: ${period_number}, Students: ${records.length}`,
      reason: isUpdate ? 'Faculty / HOD revised attendance record' : 'Regular period attendance marked',
      ipAddress: req.ip
    });

    db.exec('COMMIT;');

    res.json({
      success: true,
      sessionId,
      isUpdate,
      message: isUpdate
        ? 'Attendance updated successfully.'
        : 'Attendance submitted successfully.'
    });
  } catch (error) {
    db.exec('ROLLBACK;');
    console.error('Error submitting attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance: ' + error.message });
  }
});

// 4. View Attendance Sessions history
router.get('/sessions', authenticateToken, (req, res) => {
  const { batch_id, subject_id, faculty_id, date, from_date, to_date, page = 1, limit = 20 } = req.query;
  const db = getDb();

  let query = `
    SELECT s.*, subj.code as subject_code, subj.name as subject_name,
           f.full_name as faculty_name, b.name as batch_name, b.year_level, b.semester,
           (SELECT count(*) FROM attendance_records WHERE session_id = s.id) as total_students,
           (SELECT count(*) FROM attendance_records WHERE session_id = s.id AND status = 'PRESENT') as present_count,
           (SELECT count(*) FROM attendance_records WHERE session_id = s.id AND status = 'ABSENT') as absent_count,
           (SELECT count(*) FROM attendance_records WHERE session_id = s.id AND status = 'OD') as od_count,
           (SELECT count(*) FROM attendance_records WHERE session_id = s.id AND status = 'PERMISSION') as permission_count,
           (SELECT count(*) FROM attendance_records WHERE session_id = s.id AND status = 'LEAVE') as leave_count
    FROM attendance_sessions s
    JOIN subjects subj ON s.subject_id = subj.id
    JOIN faculty f ON s.faculty_id = f.id
    JOIN batches b ON s.batch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (batch_id) {
    query += ' AND s.batch_id = ?';
    params.push(batch_id);
  }
  if (subject_id) {
    query += ' AND s.subject_id = ?';
    params.push(subject_id);
  }
  if (faculty_id) {
    query += ' AND s.faculty_id = ?';
    params.push(faculty_id);
  }
  if (date) {
    query += ' AND s.session_date = ?';
    params.push(date);
  }
  if (from_date && to_date) {
    query += ' AND s.session_date BETWEEN ? AND ?';
    params.push(from_date, to_date);
  }

  // If user is faculty and not HOD, filter to their classes unless requested otherwise
  if (req.user.role === 'faculty' && !faculty_id && !req.user.isHod) {
    query += ' AND s.faculty_id = ?';
    params.push(req.user.facultyId);
  }

  query += ' ORDER BY s.session_date DESC, s.period_number DESC';

  const offset = (page - 1) * limit;
  query += ` LIMIT ${parseInt(limit, 10)} OFFSET ${offset}`;

  const sessions = db.prepare(query).all(...params);
  res.json({ sessions });
});

// 5. Get Session details with student records
router.get('/session/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const sessionId = req.params.id;

  const session = db.prepare(`
    SELECT s.*, subj.code as subject_code, subj.name as subject_name,
           f.full_name as faculty_name, b.name as batch_name, b.year_level, b.semester
    FROM attendance_sessions s
    JOIN subjects subj ON s.subject_id = subj.id
    JOIN faculty f ON s.faculty_id = f.id
    JOIN batches b ON s.batch_id = b.id
    WHERE s.id = ?
  `).get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Attendance session not found.' });
  }

  const records = db.prepare(`
    SELECT ar.*, st.register_number, st.full_name as student_name
    FROM attendance_records ar
    JOIN students st ON ar.student_id = st.id
    WHERE ar.session_id = ?
    ORDER BY st.register_number ASC
  `).all(sessionId);

  res.json({ session, records });
});

// 6. Attendance Correction by HOD with mandatory reason & audit log (Requirement 30)
router.post('/correct', authenticateToken, requireRole('hod'), (req, res) => {
  const { session_id, student_id, new_status, reason } = req.body;

  if (!session_id || !student_id || !new_status || !reason || !reason.trim()) {
    return res.status(400).json({ error: 'Please provide session_id, student_id, new_status, and an explicit reason for correction.' });
  }

  const db = getDb();

  const record = db.prepare(`
    SELECT ar.*, st.register_number, st.full_name, st.user_id,
           s.session_date, s.period_number, subj.code as subject_code
    FROM attendance_records ar
    JOIN students st ON ar.student_id = st.id
    JOIN attendance_sessions s ON ar.session_id = s.id
    JOIN subjects subj ON s.subject_id = subj.id
    WHERE ar.session_id = ? AND ar.student_id = ?
  `).get(session_id, student_id);

  if (!record) {
    return res.status(404).json({ error: 'Attendance record not found.' });
  }

  const oldStatus = record.status;

  db.prepare(`
    UPDATE attendance_records
    SET status = ?, remarks = ?, updated_at = datetime('now', 'localtime')
    WHERE session_id = ? AND student_id = ?
  `).run(new_status, `HOD Correction: ${reason.trim()}`, session_id, student_id);

  // Log in Immutable Audit Log
  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'ATTENDANCE_CORRECTION',
    entity: 'attendance_record',
    entityId: `${session_id}_${student_id}`,
    previousValue: oldStatus,
    newValue: new_status,
    reason: reason.trim(),
    ipAddress: req.ip
  });

  // Notify student
  sendNotification({
    userId: record.user_id,
    title: 'Attendance Corrected by HOD',
    message: `Your attendance for ${record.subject_code} on ${record.session_date} (Period ${record.period_number}) was revised from ${oldStatus} to ${new_status}. Reason: ${reason.trim()}`,
    type: 'attendance',
    linkUrl: '/student/attendance'
  });

  res.json({
    success: true,
    previousStatus: oldStatus,
    newStatus: new_status,
    message: `Attendance corrected from ${oldStatus} to ${new_status}. Audit log recorded.`
  });
});

module.exports = router;
