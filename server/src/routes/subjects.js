const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// List subjects
router.get('/', authenticateToken, (req, res) => {
  const { year_level, semester } = req.query;
  const db = getDb();

  let query = 'SELECT s.* FROM subjects s WHERE s.is_active = 1';
  const params = [];

  if (year_level) {
    query += ' AND s.year_level = ?';
    params.push(year_level);
  }
  if (semester) {
    query += ' AND s.semester = ?';
    params.push(semester);
  }

  query += ' ORDER BY s.year_level ASC, s.code ASC';

  const subjects = db.prepare(query).all(...params);

  // Enrich with assigned faculty
  const enriched = subjects.map(s => {
    const assignments = db.prepare(`
      SELECT sa.id as assignment_id, sa.batch_id, b.name as batch_name,
             f.id as faculty_id, f.full_name as faculty_name, f.designation
      FROM subject_assignments sa
      JOIN faculty f ON sa.faculty_id = f.id
      JOIN batches b ON sa.batch_id = b.id
      WHERE sa.subject_id = ?
    `).all(s.id);

    return {
      ...s,
      assignments,
      primaryFaculty: assignments.length > 0 ? assignments[0].faculty_name : 'Unassigned'
    };
  });

  res.json({ subjects: enriched });
});

// Add subject (HOD)
router.post('/', authenticateToken, requireRole('hod'), (req, res) => {
  const { code, name, type, credits, weekly_hours, year_level, semester } = req.body;

  if (!code || !name || !type || !year_level || !semester) {
    return res.status(400).json({ error: 'Missing required subject details.' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM subjects WHERE code = ?').get(code.trim().toUpperCase());
  if (existing) {
    return res.status(409).json({ error: `Subject code ${code} already exists.` });
  }

  const resIns = db.prepare(`
    INSERT INTO subjects (code, name, type, credits, weekly_hours, year_level, semester, department_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    code.trim().toUpperCase(),
    name.trim(),
    type.toLowerCase(),
    parseInt(credits, 10) || 3,
    parseInt(weekly_hours, 10) || 4,
    parseInt(year_level, 10),
    parseInt(semester, 10)
  );

  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'SUBJECT_CREATED',
    entity: 'subject',
    entityId: code.trim().toUpperCase(),
    newValue: name.trim(),
    reason: 'New subject added by HOD',
    ipAddress: req.ip
  });

  res.status(201).json({
    success: true,
    subjectId: Number(resIns.lastInsertRowid),
    message: `Subject ${code} - ${name} added successfully.`
  });
});

// Edit subject (HOD)
router.put('/:id', authenticateToken, requireRole('hod'), (req, res) => {
  const subjectId = req.params.id;
  const { name, type, credits, weekly_hours } = req.body;

  const db = getDb();
  const subj = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
  if (!subj) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  db.prepare(`
    UPDATE subjects
    SET name = COALESCE(?, name),
        type = COALESCE(?, type),
        credits = COALESCE(?, credits),
        weekly_hours = COALESCE(?, weekly_hours)
    WHERE id = ?
  `).run(name, type, credits, weekly_hours, subjectId);

  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'SUBJECT_UPDATED',
    entity: 'subject',
    entityId: subj.code,
    newValue: JSON.stringify(req.body),
    reason: 'Subject updated by HOD',
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Subject updated successfully.' });
});

// List Subject Assignments
router.get('/assignments', authenticateToken, (req, res) => {
  const db = getDb();
  const assignments = db.prepare(`
    SELECT sa.*, s.code as subject_code, s.name as subject_name, s.type as subject_type,
           f.full_name as faculty_name, f.designation, f.faculty_id as faculty_code,
           b.name as batch_name, b.year_level, b.semester
    FROM subject_assignments sa
    JOIN subjects s ON sa.subject_id = s.id
    JOIN faculty f ON sa.faculty_id = f.id
    JOIN batches b ON sa.batch_id = b.id
    ORDER BY b.year_level ASC, s.code ASC
  `).all();

  res.json({ assignments });
});

// Assign Faculty to Subject & Batch (HOD)
router.post('/assignments', authenticateToken, requireRole('hod'), (req, res) => {
  const { subject_id, faculty_id, batch_id } = req.body;

  if (!subject_id || !faculty_id || !batch_id) {
    return res.status(400).json({ error: 'subject_id, faculty_id, and batch_id are required.' });
  }

  const db = getDb();

  // Upsert assignment
  db.prepare(`
    INSERT INTO subject_assignments (subject_id, faculty_id, batch_id, section_id, academic_year_id)
    VALUES (?, ?, ?, 1, 1)
    ON CONFLICT(subject_id, faculty_id, batch_id, section_id) DO NOTHING
  `).run(subject_id, faculty_id, batch_id);

  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'FACULTY_SUBJECT_ASSIGNED',
    entity: 'subject_assignment',
    entityId: `${subject_id}_${faculty_id}_${batch_id}`,
    newValue: `Assigned faculty #${faculty_id} to subject #${subject_id} for batch #${batch_id}`,
    reason: 'Subject assignment configured by HOD',
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Faculty assigned to subject successfully.' });
});

module.exports = router;
