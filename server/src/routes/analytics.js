const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getPolicy, getStudentOverallAttendance, calculateAttendanceMetrics } = require('../attendanceEngine');

const router = express.Router();

// 1. Top KPI Dashboard Metrics
router.get('/kpis', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const db = getDb();
  const policy = getPolicy();

  const totalStudents = db.prepare('SELECT count(*) as count FROM students WHERE is_active = 1').get().count;
  const totalFaculty = db.prepare('SELECT count(*) as count FROM faculty WHERE is_active = 1').get().count;

  // Today's classes
  const todayDate = req.query.date || new Date().toISOString().split('T')[0];
  const dateObj = new Date(todayDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dateObj.getDay()] === 'Sunday' || dayNames[dateObj.getDay()] === 'Saturday' ? 'Monday' : dayNames[dateObj.getDay()];

  const totalTimetableSlotsToday = db.prepare(`
    SELECT count(*) as count FROM timetables WHERE day_of_week = ?
  `).get(dayName).count;

  const completedSessionsToday = db.prepare(`
    SELECT count(*) as count FROM attendance_sessions WHERE session_date = ?
  `).get(todayDate).count;

  const attendanceCompletionRate = totalTimetableSlotsToday > 0
    ? Math.round((completedSessionsToday / totalTimetableSlotsToday) * 100)
    : 100;

  // Pending Approvals
  const pendingODs = db.prepare("SELECT count(*) as count FROM od_requests WHERE status = 'PENDING'").get().count;
  const pendingLeaves = db.prepare("SELECT count(*) as count FROM leave_requests WHERE status = 'PENDING'").get().count;

  // Calculate live low-attendance student count (< 75%)
  const students = db.prepare('SELECT id, register_number, full_name, year_level, batch_id FROM students WHERE is_active = 1').all();
  let criticalCount = 0;
  let warningCount = 0;
  let safeCount = 0;

  for (const st of students) {
    const overall = getStudentOverallAttendance(st.id);
    if (overall.statusBadge === 'critical') criticalCount++;
    else if (overall.statusBadge === 'warning') warningCount++;
    else safeCount++;
  }

  res.json({
    totalStudents,
    totalFaculty,
    todayClasses: totalTimetableSlotsToday,
    completedClassesToday: completedSessionsToday,
    attendanceCompletionRate,
    pendingODs,
    pendingLeaves,
    criticalCount,
    warningCount,
    safeCount,
    thresholds: {
      min: policy.min_attendance_pct,
      warning: policy.warning_threshold_pct
    }
  });
});

// 2. Year comparison (2nd vs 3rd vs 4th Year)
router.get('/year-comparison', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const db = getDb();
  const policy = getPolicy();

  const years = [
    { year: 2, semester: 3, label: '2nd Year (3rd Sem)', batchId: 1 },
    { year: 3, semester: 5, label: '3rd Year (5th Sem)', batchId: 2 },
    { year: 4, semester: 7, label: '4th Year (7th Sem)', batchId: 3 }
  ];

  const comparison = years.map(y => {
    const students = db.prepare('SELECT id FROM students WHERE batch_id = ? AND is_active = 1').all(y.batchId);
    let totalPct = 0;
    let safe = 0;
    let warning = 0;
    let critical = 0;

    for (const st of students) {
      const metrics = getStudentOverallAttendance(st.id);
      totalPct += metrics.percentage;
      if (metrics.statusBadge === 'safe') safe++;
      else if (metrics.statusBadge === 'warning') warning++;
      else critical++;
    }

    const avgPct = students.length > 0 ? Number((totalPct / students.length).toFixed(1)) : 0;

    return {
      ...y,
      studentCount: students.length,
      averageAttendance: avgPct,
      safeCount: safe,
      warningCount: warning,
      criticalCount: critical
    };
  });

  res.json({ comparison });
});

// 3. Subject-wise Attendance Performance
router.get('/subject-stats', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const db = getDb();
  const policy = getPolicy();

  const subjects = db.prepare(`
    SELECT s.id, s.code, s.name, s.type, s.year_level, s.semester,
           (SELECT count(*) FROM attendance_sessions WHERE subject_id = s.id) as sessions_held,
           f.full_name as faculty_name
    FROM subjects s
    LEFT JOIN subject_assignments sa ON sa.subject_id = s.id
    LEFT JOIN faculty f ON sa.faculty_id = f.id
    WHERE s.is_active = 1
    ORDER BY s.year_level ASC, s.code ASC
  `).all();

  const results = subjects.map(subj => {
    const records = db.prepare(`
      SELECT ar.status
      FROM attendance_records ar
      JOIN attendance_sessions ses ON ar.session_id = ses.id
      WHERE ses.subject_id = ?
    `).all(subj.id);

    const metrics = calculateAttendanceMetrics(records, policy);

    return {
      id: subj.id,
      code: subj.code,
      name: subj.name,
      type: subj.type,
      yearLevel: subj.year_level,
      semester: subj.semester,
      facultyName: subj.faculty_name || 'TBA',
      sessionsHeld: subj.sessions_held,
      averagePercentage: metrics.percentage,
      presentCount: metrics.present,
      absentCount: metrics.absent,
      odCount: metrics.od,
      statusBadge: metrics.statusBadge
    };
  });

  res.json({ subjects: results });
});

// 4. Low Attendance Students List
router.get('/low-attendance-students', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const db = getDb();
  const policy = getPolicy();

  const students = db.prepare(`
    SELECT s.id, s.register_number, s.full_name, s.year_level, s.semester, s.email, s.phone,
           b.name as batch_name
    FROM students s
    JOIN batches b ON s.batch_id = b.id
    WHERE s.is_active = 1
    ORDER BY s.year_level ASC, s.register_number ASC
  `).all();

  const lowStudents = [];

  for (const st of students) {
    const metrics = getStudentOverallAttendance(st.id);
    if (metrics.percentage < policy.warning_threshold_pct) {
      // Find which subjects they are at risk in
      const subjectRecords = db.prepare(`
        SELECT DISTINCT ses.subject_id, subj.code, subj.name
        FROM attendance_sessions ses
        JOIN subjects subj ON ses.subject_id = subj.id
        WHERE ses.batch_id = ?
      `).all(st.year_level === 2 ? 1 : (st.year_level === 3 ? 2 : 3));

      const atRiskSubjects = [];
      for (const sb of subjectRecords) {
        const recs = db.prepare(`
          SELECT ar.status FROM attendance_records ar
          JOIN attendance_sessions ses ON ar.session_id = ses.id
          WHERE ar.student_id = ? AND ses.subject_id = ?
        `).all(st.id, sb.subject_id);

        const subMetrics = calculateAttendanceMetrics(recs, policy);
        if (subMetrics.percentage < policy.min_attendance_pct) {
          atRiskSubjects.push(`${sb.code} (${subMetrics.percentage}%)`);
        }
      }

      lowStudents.push({
        id: st.id,
        registerNumber: st.register_number,
        fullName: st.full_name,
        yearLevel: st.year_level,
        semester: st.semester,
        batchName: st.batch_name,
        email: st.email,
        phone: st.phone,
        percentage: metrics.percentage,
        statusText: metrics.statusText,
        statusBadge: metrics.statusBadge,
        classesNeededToRecover: metrics.classesNeededToRecover,
        atRiskSubjects
      });
    }
  }

  // Sort lowest percentage first
  lowStudents.sort((a, b) => a.percentage - b.percentage);

  res.json({
    totalAtRisk: lowStudents.length,
    criticalCount: lowStudents.filter(s => s.statusBadge === 'critical').length,
    warningCount: lowStudents.filter(s => s.statusBadge === 'warning').length,
    students: lowStudents
  });
});

// 5. Daily Attendance Trends
router.get('/trends', authenticateToken, requireRole('hod', 'faculty'), (req, res) => {
  const db = getDb();
  const policy = getPolicy();

  // Get past distinct session dates
  const dates = db.prepare(`
    SELECT DISTINCT session_date
    FROM attendance_sessions
    ORDER BY session_date ASC
    LIMIT 15
  `).all();

  const dailyTrend = dates.map(d => {
    const records = db.prepare(`
      SELECT ar.status
      FROM attendance_records ar
      JOIN attendance_sessions ses ON ar.session_id = ses.id
      WHERE ses.session_date = ?
    `).all(d.session_date);

    const metrics = calculateAttendanceMetrics(records, policy);
    return {
      date: d.session_date,
      percentage: metrics.percentage,
      present: metrics.present,
      absent: metrics.absent,
      od: metrics.od,
      total: records.length
    };
  });

  // OD Volume by Type
  const odCategories = db.prepare(`
    SELECT od_type, count(*) as count,
           sum(case when status = 'APPROVED' then 1 else 0 end) as approved_count
    FROM od_requests
    GROUP BY od_type
  `).all();

  // Leave Volume by Type
  const leaveCategories = db.prepare(`
    SELECT leave_type, count(*) as count,
           sum(case when status = 'APPROVED' then 1 else 0 end) as approved_count
    FROM leave_requests
    GROUP BY leave_type
  `).all();

  res.json({
    dailyTrend,
    odCategories,
    leaveCategories
  });
});

module.exports = router;
