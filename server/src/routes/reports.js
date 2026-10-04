const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getPolicy, getStudentOverallAttendance, calculateAttendanceMetrics } = require('../attendanceEngine');

const router = express.Router();

// Generate Reports
router.get('/generate', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const { type = 'overall', year_level, batch_id, subject_id, from_date, to_date } = req.query;
  const db = getDb();
  const policy = getPolicy();

  if (type === 'student_wise' || type === 'overall') {
    let studentQuery = `
      SELECT s.id, s.register_number, s.full_name, s.year_level, s.semester, b.name as batch_name
      FROM students s
      JOIN batches b ON s.batch_id = b.id
      WHERE s.is_active = 1
    `;
    const params = [];
    if (year_level) {
      studentQuery += ' AND s.year_level = ?';
      params.push(year_level);
    }
    if (batch_id) {
      studentQuery += ' AND s.batch_id = ?';
      params.push(batch_id);
    }
    studentQuery += ' ORDER BY s.year_level ASC, s.register_number ASC';

    const students = db.prepare(studentQuery).all(...params);

    const reportRows = students.map(st => {
      let recordsQuery = `
        SELECT ar.status
        FROM attendance_records ar
        JOIN attendance_sessions ses ON ar.session_id = ses.id
        WHERE ar.student_id = ?
      `;
      const recParams = [st.id];

      if (subject_id) {
        recordsQuery += ' AND ses.subject_id = ?';
        recParams.push(subject_id);
      }
      if (from_date && to_date) {
        recordsQuery += ' AND ses.session_date BETWEEN ? AND ?';
        recParams.push(from_date, to_date);
      }

      const records = db.prepare(recordsQuery).all(...recParams);
      const metrics = calculateAttendanceMetrics(records, policy);

      return {
        registerNumber: st.register_number,
        studentName: st.full_name,
        yearLevel: `${st.year_level}nd/rd/th Year`,
        semester: `Sem ${st.semester}`,
        batch: st.batch_name,
        totalClasses: metrics.totalClassesConducted,
        attended: metrics.attendedHours,
        present: metrics.present,
        od: metrics.od,
        permission: metrics.permission,
        leave: metrics.leave,
        absent: metrics.absent,
        percentage: `${metrics.percentage}%`,
        status: metrics.statusText
      };
    });

    return res.json({
      title: type === 'student_wise' ? 'Student-Wise Attendance Report' : 'Overall Department Attendance Report',
      generatedAt: new Date().toLocaleString(),
      filters: { year_level, batch_id, subject_id, from_date, to_date },
      totalRecords: reportRows.length,
      rows: reportRows
    });
  }

  if (type === 'od') {
    let query = `
      SELECT r.request_number, s.register_number, s.full_name as student_name, s.year_level,
             r.od_type, r.event_name, r.venue, r.from_date, r.to_date, r.status,
             r.hod_remarks, r.created_at
      FROM od_requests r
      JOIN students s ON r.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (year_level) {
      query += ' AND s.year_level = ?';
      params.push(year_level);
    }
    if (from_date && to_date) {
      query += ' AND r.from_date >= ? AND r.to_date <= ?';
      params.push(from_date, to_date);
    }
    query += ' ORDER BY r.created_at DESC';

    const rows = db.prepare(query).all(...params);
    return res.json({
      title: 'Department On-Duty (OD) Report',
      generatedAt: new Date().toLocaleString(),
      totalRecords: rows.length,
      rows
    });
  }

  if (type === 'leave') {
    let query = `
      SELECT l.request_number, s.register_number, s.full_name as student_name, s.year_level,
             l.leave_type, l.reason, l.from_date, l.to_date, l.status,
             l.hod_remarks, l.created_at
      FROM leave_requests l
      JOIN students s ON l.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (year_level) {
      query += ' AND s.year_level = ?';
      params.push(year_level);
    }
    if (from_date && to_date) {
      query += ' AND l.from_date >= ? AND l.to_date <= ?';
      params.push(from_date, to_date);
    }
    query += ' ORDER BY l.created_at DESC';

    const rows = db.prepare(query).all(...params);
    return res.json({
      title: 'Department Leave Management Report',
      generatedAt: new Date().toLocaleString(),
      totalRecords: rows.length,
      rows
    });
  }

  res.status(400).json({ error: 'Invalid report type requested.' });
});

module.exports = router;
