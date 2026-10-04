const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

const PERIOD_CONFIG = [
  { period: 1, start: '08:45', end: '09:40', label: 'Period 1' },
  { period: 2, start: '09:40', end: '10:35', label: 'Period 2' },
  { period: 'break1', label: 'Tea Break', start: '10:35', end: '10:50', isBreak: true },
  { period: 3, start: '10:50', end: '11:45', label: 'Period 3' },
  { period: 4, start: '11:45', end: '12:40', label: 'Period 4' },
  { period: 'lunch', label: 'Lunch Break', start: '12:40', end: '13:25', isBreak: true },
  { period: 5, start: '13:25', end: '14:15', label: 'Period 5' },
  { period: 6, start: '14:15', end: '15:05', label: 'Period 6' },
  { period: 7, start: '15:05', end: '16:00', label: 'Period 7' }
];

// 1. Get timetable grid
router.get('/', authenticateToken, (req, res) => {
  const { batch_id, faculty_id } = req.query;
  const db = getDb();

  // If student, default to their batch
  let targetBatchId = batch_id;
  if (req.user.role === 'student' && !targetBatchId) {
    targetBatchId = req.user.batchId || 1;
  }

  let query = `
    SELECT t.*, s.code as subject_code, s.name as subject_name, s.type as subject_type,
           f.full_name as faculty_name, f.faculty_id as faculty_code,
           b.name as batch_name, b.year_level, b.semester
    FROM timetables t
    JOIN subjects s ON t.subject_id = s.id
    JOIN faculty f ON t.faculty_id = f.id
    JOIN batches b ON t.batch_id = b.id
    WHERE 1=1
  `;
  const params = [];

  if (targetBatchId) {
    query += ' AND t.batch_id = ?';
    params.push(targetBatchId);
  }
  if (faculty_id) {
    query += ' AND t.faculty_id = ?';
    params.push(faculty_id);
  }

  query += ' ORDER BY t.day_of_week, t.period_number ASC';

  const rawEntries = db.prepare(query).all(...params);

  // Organize by Day -> Period
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const grid = {};

  for (const day of days) {
    grid[day] = {};
    for (let p = 1; p <= 7; p++) {
      grid[day][p] = null;
    }
  }

  for (const entry of rawEntries) {
    if (grid[entry.day_of_week]) {
      grid[entry.day_of_week][entry.period_number] = entry;
    }
  }

  res.json({
    periods: PERIOD_CONFIG,
    days,
    grid,
    entries: rawEntries
  });
});

// 2. Add or Update timetable entry (HOD)
router.post('/entry', authenticateToken, requireRole('hod'), (req, res) => {
  const { batch_id, day_of_week, period_number, start_time, end_time, subject_id, faculty_id, room } = req.body;

  if (!batch_id || !day_of_week || !period_number || !subject_id || !faculty_id) {
    return res.status(400).json({ error: 'Missing required timetable slot fields.' });
  }

  const db = getDb();

  // Find standard period times if not given
  const stdPeriod = PERIOD_CONFIG.find(p => p.period === parseInt(period_number, 10));
  const sTime = start_time || (stdPeriod ? stdPeriod.start : '08:45');
  const eTime = end_time || (stdPeriod ? stdPeriod.end : '09:40');

  db.prepare(`
    INSERT INTO timetables (
      batch_id, section_id, day_of_week, period_number, start_time, end_time,
      subject_id, faculty_id, room
    ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(batch_id, day_of_week, period_number) DO UPDATE SET
      subject_id = excluded.subject_id,
      faculty_id = excluded.faculty_id,
      room = excluded.room,
      start_time = excluded.start_time,
      end_time = excluded.end_time
  `).run(batch_id, day_of_week, period_number, sTime, eTime, subject_id, faculty_id, room || 'IT-301');

  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'TIMETABLE_ENTRY_UPDATED',
    entity: 'timetable',
    entityId: `${batch_id}_${day_of_week}_${period_number}`,
    newValue: `Day: ${day_of_week}, Period: ${period_number}, Subj: ${subject_id}, Faculty: ${faculty_id}`,
    reason: 'Timetable schedule slot modified by HOD',
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Timetable slot configured successfully.' });
});

// 3. Delete timetable entry (HOD)
router.delete('/entry/:id', authenticateToken, requireRole('hod'), (req, res) => {
  const entryId = req.params.id;
  const db = getDb();

  const entry = db.prepare('SELECT * FROM timetables WHERE id = ?').get(entryId);
  if (!entry) {
    return res.status(404).json({ error: 'Timetable entry not found.' });
  }

  db.prepare('DELETE FROM timetables WHERE id = ?').run(entryId);

  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'TIMETABLE_ENTRY_DELETED',
    entity: 'timetable',
    entityId: entryId,
    previousValue: JSON.stringify(entry),
    reason: 'Timetable slot removed by HOD',
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Timetable slot removed.' });
});

module.exports = router;
