const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// 1. List all faculty with workload & subject counts
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const faculty = db.prepare(`
    SELECT f.*, u.username,
           (SELECT count(DISTINCT subject_id) FROM subject_assignments WHERE faculty_id = f.id) as assigned_subjects_count,
           (SELECT count(*) FROM timetables WHERE faculty_id = f.id) as weekly_periods_count,
           (SELECT count(*) FROM attendance_sessions WHERE faculty_id = f.id) as total_sessions_taken
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    ORDER BY f.is_hod DESC, f.full_name ASC
  `).all();

  // For each faculty, get list of assigned subjects
  const enriched = faculty.map(f => {
    const subjects = db.prepare(`
      SELECT DISTINCT s.code, s.name, s.type, b.name as batch_name, b.year_level
      FROM subject_assignments sa
      JOIN subjects s ON sa.subject_id = s.id
      JOIN batches b ON sa.batch_id = b.id
      WHERE sa.faculty_id = ?
    `).all(f.id);

    return {
      ...f,
      assignedSubjects: subjects
    };
  });

  res.json({ faculty: enriched });
});

// 2. Faculty Dashboard today's schedule, classes, and OD alerts (Requirement 13)
router.get('/:id/dashboard', authenticateToken, (req, res) => {
  const facultyId = req.params.id;
  const db = getDb();

  const fac = db.prepare('SELECT * FROM faculty WHERE id = ?').get(facultyId);
  if (!fac) {
    return res.status(404).json({ error: 'Faculty not found.' });
  }

  // Determine current day of week (or accept simulated query date)
  const reqDate = req.query.date || new Date().toISOString().split('T')[0];
  const dateObj = new Date(reqDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = dayNames[dateObj.getDay()] === 'Sunday' || dayNames[dateObj.getDay()] === 'Saturday'
    ? 'Monday' // fallback to Monday for weekend demo preview
    : dayNames[dateObj.getDay()];

  // Today's classes from timetable for this faculty
  const classes = db.prepare(`
    SELECT t.*, s.code as subject_code, s.name as subject_name, s.type as subject_type,
           b.id as batch_id, b.name as batch_name, b.year_level, b.semester
    FROM timetables t
    JOIN subjects s ON t.subject_id = s.id
    JOIN batches b ON t.batch_id = b.id
    WHERE t.faculty_id = ? AND t.day_of_week = ?
    ORDER BY t.period_number ASC
  `).all(facultyId, dayOfWeek);

  // Check if attendance already recorded today for each class
  const enrichedClasses = classes.map(c => {
    const existingSession = db.prepare(`
      SELECT id, status, created_at FROM attendance_sessions
      WHERE batch_id = ? AND subject_id = ? AND session_date = ? AND period_number = ?
    `).get(c.batch_id, c.subject_id, reqDate, c.period_number);

    let status = 'upcoming'; // 'upcoming', 'current', 'completed'
    if (existingSession) {
      status = 'completed';
    }

    // Check count of approved ODs for this class
    const odCount = db.prepare(`
      SELECT count(DISTINCT od.id) as count
      FROM od_requests od
      JOIN students st ON od.student_id = st.id
      WHERE st.batch_id = ? AND od.status = 'APPROVED'
        AND od.from_date <= ? AND od.to_date >= ?
        AND (? BETWEEN od.from_period AND od.to_period OR od.from_period IS NULL)
    `).get(c.batch_id, reqDate, reqDate, c.period_number).count;

    return {
      ...c,
      status,
      sessionId: existingSession ? existingSession.id : null,
      approvedOdCount: odCount
    };
  });

  const totalClassesToday = enrichedClasses.length;
  const completedToday = enrichedClasses.filter(c => c.status === 'completed').length;
  const pendingToday = totalClassesToday - completedToday;

  // Aggregate OD alerts for today
  const totalOdAlerts = enrichedClasses.reduce((acc, c) => acc + c.approvedOdCount, 0);

  res.json({
    faculty: fac,
    todayDate: reqDate,
    dayOfWeek,
    totalClassesToday,
    completedToday,
    pendingToday,
    totalOdAlerts,
    classes: enrichedClasses
  });
});

// 3. Add faculty (HOD)
router.post('/', authenticateToken, requireRole('hod'), (req, res) => {
  const { faculty_id, full_name, designation, email, phone, room_no } = req.body;

  if (!faculty_id || !full_name || !designation || !email) {
    return res.status(400).json({ error: 'Missing required faculty fields.' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM faculty WHERE faculty_id = ?').get(faculty_id.trim());
  if (existing) {
    return res.status(409).json({ error: 'Faculty with this ID already exists.' });
  }

  db.exec('BEGIN TRANSACTION;');

  try {
    const salt = bcrypt.genSaltSync(8);
    const passHash = bcrypt.hashSync('smit@2026', salt);
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const uRes = db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, email, phone)
      VALUES (?, ?, 'faculty', ?, ?, ?)
    `).run(username, passHash, full_name.trim(), email.trim(), phone || null);

    const fRes = db.prepare(`
      INSERT INTO faculty (user_id, faculty_id, full_name, designation, email, phone, room_no, is_hod)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(uRes.lastInsertRowid, faculty_id.trim(), full_name.trim(), designation.trim(), email.trim(), phone || null, room_no || 'IT-Staff');

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      role: req.user.role,
      action: 'FACULTY_CREATED',
      entity: 'faculty',
      entityId: faculty_id.trim(),
      newValue: full_name.trim(),
      reason: 'Faculty member created by HOD',
      ipAddress: req.ip
    });

    db.exec('COMMIT;');

    res.status(201).json({
      success: true,
      facultyId: Number(fRes.lastInsertRowid),
      message: `Faculty member ${full_name} added successfully.`
    });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: err.message });
  }
});

// 4. Update faculty (HOD)
router.put('/:id', authenticateToken, requireRole('hod'), (req, res) => {
  const facId = req.params.id;
  const { full_name, designation, email, phone, room_no } = req.body;

  const db = getDb();
  const fac = db.prepare('SELECT * FROM faculty WHERE id = ?').get(facId);
  if (!fac) {
    return res.status(404).json({ error: 'Faculty not found.' });
  }

  db.exec('BEGIN TRANSACTION;');

  try {
    db.prepare(`
      UPDATE faculty
      SET full_name = COALESCE(?, full_name),
          designation = COALESCE(?, designation),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          room_no = COALESCE(?, room_no)
      WHERE id = ?
    `).run(full_name, designation, email, phone, room_no, facId);

    if (full_name || email || phone) {
      db.prepare(`
        UPDATE users
        SET full_name = COALESCE(?, full_name),
            email = COALESCE(?, email),
            phone = COALESCE(?, phone)
        WHERE id = ?
      `).run(full_name, email, phone, fac.user_id);
    }

    logAudit({
      userId: req.user.id,
      userName: req.user.full_name,
      role: req.user.role,
      action: 'FACULTY_UPDATED',
      entity: 'faculty',
      entityId: fac.faculty_id,
      newValue: JSON.stringify(req.body),
      reason: 'Faculty details updated by HOD',
      ipAddress: req.ip
    });

    db.exec('COMMIT;');

    res.json({ success: true, message: 'Faculty details updated successfully.' });
  } catch (err) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
