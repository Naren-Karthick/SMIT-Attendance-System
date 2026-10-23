const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { evaluateStudentRisk } = require('../riskEngine');
const { logAudit, sendNotification } = require('../utils/auditLogger');

const router = express.Router();

// Get mentor intervention inbox
router.get('/inbox', authenticateToken, requireRole('faculty', 'mentor', 'hod'), (req, res) => {
  const db = getDb();
  const facultyId = req.user.facultyId || 1;
  const isHod = req.user.role === 'hod';

  let query = `
    SELECT mi.*, s.register_number, s.full_name as student_name,
           b.name as batch_name, f.full_name as mentor_name
    FROM mentor_interventions mi
    JOIN students s ON mi.student_id = s.id
    JOIN batches b ON s.batch_id = b.id
    JOIN faculty f ON mi.mentor_faculty_id = f.id
  `;
  const params = [];
  if (!isHod) {
    query += ' WHERE mi.mentor_faculty_id = ?';
    params.push(facultyId);
  }
  query += ' ORDER BY mi.created_at DESC';

  const interventions = db.prepare(query).all(...params);
  res.json({ success: true, count: interventions.length, interventions });
});

// Create/record an intervention
router.post('/create', authenticateToken, requireRole('faculty', 'mentor', 'hod'), (req, res) => {
  const { student_id, risk_level, reason_code, counseling_notes, action_plan, follow_up_date } = req.body;
  if (!student_id || !counseling_notes || !action_plan) {
    return res.status(400).json({ error: 'Student ID, counseling notes, and action plan are required.' });
  }

  const db = getDb();
  const student = db.prepare('SELECT s.*, u.id as student_user_id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?').get(student_id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const mentorId = req.user.facultyId || student.mentor_faculty_id || 1;
  const risk = evaluateStudentRisk(student_id);

  const result = db.prepare(`
    INSERT INTO mentor_interventions (
      student_id, mentor_faculty_id, risk_level, reason_code,
      trigger_attendance_pct, counseling_notes, action_plan, follow_up_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
  `).run(
    student_id, mentorId, risk_level || risk.riskLevel, reason_code || 'ACADEMIC_ATTENDANCE',
    risk.overallPercentage, counseling_notes, action_plan, follow_up_date
  );

  sendNotification({
    userId: student.student_user_id,
    title: 'Mentor Support Plan Assigned',
    message: 'Your mentor has scheduled a student-support follow-up for attendance recovery.',
    type: 'alert',
    linkUrl: 'student-dashboard'
  });

  res.json({ success: true, interventionId: result.lastInsertRowid, message: 'Intervention successfully recorded.' });
});

// Student acknowledgment
router.post('/:id/acknowledge', authenticateToken, (req, res) => {
  const { remarks } = req.body;
  const db = getDb();
  const item = db.prepare('SELECT * FROM mentor_interventions WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Intervention not found.' });

  db.prepare(`
    UPDATE mentor_interventions
    SET student_acknowledged = 1, student_remarks = ?, status = 'IN_PROGRESS', updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(remarks || 'Acknowledged by student.', req.params.id);

  res.json({ success: true, message: 'Support plan acknowledged.' });
});

module.exports = router;