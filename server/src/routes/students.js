const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const { getPolicy, getStudentOverallAttendance, getStudentSubjectBreakdown, calculateAttendanceMetrics } = require('../attendanceEngine');

const router = express.Router();

// 1. List students with live calculated attendance metrics
router.get('/', authenticateToken, (req, res) => {
  const { year_level, batch_id, search, status_filter, page = 1, limit = 50 } = req.query;
  const db = getDb();
  const policy = getPolicy();

  let query = `
    SELECT s.*, b.name as batch_name, sec.name as section_name, u.email as user_email
    FROM students s
    JOIN batches b ON s.batch_id = b.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (year_level) {
    query += ' AND s.year_level = ?';
    params.push(year_level);
  }
  if (batch_id) {
    query += ' AND s.batch_id = ?';
    params.push(batch_id);
  }
  if (search) {
    query += ' AND (s.register_number LIKE ? OR s.full_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s);
  }

  query += ' ORDER BY s.year_level ASC, s.register_number ASC';

  const allMatching = db.prepare(query).all(...params);

  // Compute live attendance for all matching students
  const enriched = allMatching.map(st => {
    const overall = getStudentOverallAttendance(st.id);
    return {
      ...st,
      attendance: overall
    };
  });

  // Filter by status if requested (safe, warning, critical)
  let filtered = enriched;
  if (status_filter && status_filter !== 'all') {
    filtered = enriched.filter(st => st.attendance.statusBadge === status_filter);
  }

  // Pagination
  const total = filtered.length;
  const pageNum = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);
  const startIndex = (pageNum - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  res.json({
    total,
    page: pageNum,
    pageSize,
    students: paginated,
    thresholds: {
      min: policy.min_attendance_pct,
      warning: policy.warning_threshold_pct
    }
  });
});

// 2. Detailed student profile (used by student themselves or HOD/faculty)
router.get('/:id', authenticateToken, (req, res) => {
  const studentId = req.params.id;
  const db = getDb();

  // RBAC: If student, prevent access to another student's profile!
  if (req.user.role === 'student' && String(req.user.studentId) !== String(studentId)) {
    return res.status(403).json({ error: 'Access denied. You can only view your own student profile.' });
  }

  const student = db.prepare(`
    SELECT s.*, b.name as batch_name, b.regulation, sec.name as section_name,
           u.email as user_email, u.phone as user_phone,
           m.full_name as mentor_name, m.email as mentor_email
    FROM students s
    JOIN batches b ON s.batch_id = b.id
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN faculty m ON s.mentor_faculty_id = m.id
    WHERE s.id = ?
  `).get(studentId);

  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // Overall attendance
  const overall = getStudentOverallAttendance(student.id);

  // Subject-wise breakdown
  const subjects = getStudentSubjectBreakdown(student.id);

  // Date-wise attendance timeline (last 40 sessions)
  const timeline = db.prepare(`
    SELECT ar.status, ar.remarks, ar.auto_applied, ar.source_request_type,
           ses.session_date, ses.period_number, ses.room, ses.topic,
           subj.code as subject_code, subj.name as subject_name,
           f.full_name as faculty_name
    FROM attendance_records ar
    JOIN attendance_sessions ses ON ar.session_id = ses.id
    JOIN subjects subj ON ses.subject_id = subj.id
    JOIN faculty f ON ses.faculty_id = f.id
    WHERE ar.student_id = ?
    ORDER BY ses.session_date DESC, ses.period_number DESC
    LIMIT 60
  `).all(student.id);

  // Recent OD / Leave requests
  const recentODs = db.prepare(`
    SELECT * FROM od_requests WHERE student_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(student.id);

  const recentLeaves = db.prepare(`
    SELECT * FROM leave_requests WHERE student_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(student.id);

  res.json({
    student,
    overall,
    subjects,
    timeline,
    recentRequests: {
      ods: recentODs,
      leaves: recentLeaves
    }
  });
});

// 3. Add student (HOD)
router.post('/', authenticateToken, requireRole('hod'), (req, res) => {
  const { register_number, full_name, batch_id, section_id, year_level, semester, email, phone } = req.body;

  if (!register_number || !full_name || !batch_id || !year_level || !semester) {
    return res.status(400).json({ error: 'Missing required student fields.' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM students WHERE register_number = ?').get(register_number.trim());
  if (existing) {
    return res.status(409).json({ error: 'Student with this register number already exists.' });
  }

  db.exec('BEGIN TRANSACTION;');

  try {
    const salt = bcrypt.genSaltSync(8);
    const passHash = bcrypt.hashSync('smit@2026', salt);
    const userEmail = email || `${register_number.trim()}@smit.edu.in`;

    const uRes = db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, email, phone)
      VALUES (?, ?, 'student', ?, ?, ?)
    `).run(register_number.trim(), passHash, full_name.trim(), userEmail, phone || null);

    const sRes = db.prepare(`
      INSERT INTO students (user_id, register_number, full_name, batch_id, section_id, year_level, semester, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uRes.lastInsertRowid, register_number.trim(), full_name.trim(), batch_id, section_id || 1, year_level, semester, userEmail, phone || null);

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      role: req.user.role,
      action: 'STUDENT_CREATED',
      entity: 'student',
      entityId: register_number.trim(),
      newValue: full_name.trim(),
      reason: 'Student enrolled by HOD',
      ipAddress: req.ip
    });

    db.exec('COMMIT;');

    res.status(201).json({
      success: true,
      studentId: Number(sRes.lastInsertRowid),
      message: `Student ${full_name} (${register_number}) added successfully.`
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: err.message });
  }
});

// 4. Edit student (HOD)
router.put('/:id', authenticateToken, requireRole('hod'), (req, res) => {
  const studentId = req.params.id;
  const { full_name, email, phone, year_level, semester, batch_id } = req.body;

  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  db.exec('BEGIN TRANSACTION;');

  try {
    db.prepare(`
      UPDATE students
      SET full_name = COALESCE(?, full_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          year_level = COALESCE(?, year_level),
          semester = COALESCE(?, semester),
          batch_id = COALESCE(?, batch_id)
      WHERE id = ?
    `).run(full_name, email, phone, year_level, semester, batch_id, studentId);

    if (full_name || email || phone) {
      db.prepare(`
        UPDATE users
        SET full_name = COALESCE(?, full_name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone)
        WHERE id = ?
      `).run(full_name, email, phone, student.user_id);
    }

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      role: req.user.role,
      action: 'STUDENT_UPDATED',
      entity: 'student',
      entityId: student.register_number,
      newValue: JSON.stringify(req.body),
      reason: 'Student record updated by HOD',
      ipAddress: req.ip
    });

    db.exec('COMMIT;');

    res.json({ success: true, message: 'Student record updated successfully.' });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: err.message });
  }
});

// 5. Toggle student status
router.patch('/:id/toggle-status', authenticateToken, requireRole('hod'), (req, res) => {
  const studentId = req.params.id;
  const db = getDb();
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const newStatus = student.is_active === 1 ? 0 : 1;
  db.prepare('UPDATE students SET is_active = ? WHERE id = ?').run(newStatus, studentId);
  db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, student.user_id);

  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: newStatus === 1 ? 'STUDENT_ACTIVATED' : 'STUDENT_DEACTIVATED',
    entity: 'student',
    entityId: student.register_number,
    previousValue: student.is_active,
    newValue: newStatus,
    reason: `Student status set to ${newStatus === 1 ? 'Active' : 'Inactive'}`,
    ipAddress: req.ip
  });

  res.json({
    success: true,
    isActive: newStatus === 1,
    message: `Student account ${newStatus === 1 ? 'activated' : 'deactivated'}.`
  });
});

module.exports = router;
