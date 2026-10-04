const { getDb } = require('./db');

function getPolicy() {
  const db = getDb();
  let policy = db.prepare('SELECT * FROM attendance_policies LIMIT 1').get();
  if (!policy) {
    policy = {
      min_attendance_pct: 75.0,
      warning_threshold_pct: 85.0,
      od_treatment: 'attended',
      permission_treatment: 'attended',
      leave_treatment: 'excluded',
      faculty_edit_window_hours: 24,
      allowed_evidence_formats: 'PDF,JPG,JPEG,PNG',
      max_upload_size_mb: 5,
      active_academic_year: '2026-2027',
      active_semester: 'Odd'
    };
  }
  return policy;
}

function calculateAttendanceMetrics(records, policy = null) {
  const pol = policy || getPolicy();

  let present = 0;
  let od = 0;
  let permission = 0;
  let leave = 0;
  let absent = 0;

  for (const r of records) {
    const s = r.status ? r.status.toUpperCase() : 'ABSENT';
    if (s === 'PRESENT') present++;
    else if (s === 'OD') od++;
    else if (s === 'PERMISSION') permission++;
    else if (s === 'LEAVE') leave++;
    else if (s === 'ABSENT') absent++;
  }

  // Calculate applicable total hours
  let applicableTotal = present + absent;
  if (pol.od_treatment !== 'excluded') applicableTotal += od;
  if (pol.permission_treatment !== 'excluded') applicableTotal += permission;
  if (pol.leave_treatment !== 'excluded') applicableTotal += leave;

  // Calculate attended hours
  let attendedHours = present;
  if (pol.od_treatment === 'attended') attendedHours += od;
  if (pol.permission_treatment === 'attended') attendedHours += permission;
  if (pol.leave_treatment === 'attended') attendedHours += leave;

  const totalClassesConducted = present + od + permission + leave + absent;
  const percentage = applicableTotal > 0
    ? Number(((attendedHours / applicableTotal) * 100).toFixed(1))
    : 100.0;

  let statusText = 'Safe';
  let statusBadge = 'safe'; // 'safe', 'warning', 'critical'
  if (percentage < pol.min_attendance_pct) {
    statusText = 'Critical';
    statusBadge = 'critical';
  } else if (percentage < pol.warning_threshold_pct) {
    statusText = 'Warning';
    statusBadge = 'warning';
  }

  // Margin calculation
  const minRatio = pol.min_attendance_pct / 100;
  let classesCanMiss = 0;
  let classesNeededToRecover = 0;

  if (percentage >= pol.min_attendance_pct) {
    classesCanMiss = Math.max(0, Math.floor((attendedHours - minRatio * applicableTotal) / minRatio));
  } else {
    classesNeededToRecover = Math.max(0, Math.ceil((minRatio * applicableTotal - attendedHours) / (1 - minRatio)));
  }

  return {
    totalClassesConducted,
    applicableTotal,
    attendedHours,
    present,
    od,
    permission,
    leave,
    absent,
    percentage,
    statusText,
    statusBadge,
    classesCanMiss,
    classesNeededToRecover,
    minThreshold: pol.min_attendance_pct,
    warningThreshold: pol.warning_threshold_pct
  };
}

function getStudentOverallAttendance(studentId) {
  const db = getDb();
  const policy = getPolicy();

  const records = db.prepare(`
    SELECT ar.status, s.code as subject_code, s.name as subject_name, ses.session_date, ses.period_number
    FROM attendance_records ar
    JOIN attendance_sessions ses ON ar.session_id = ses.id
    JOIN subjects s ON ses.subject_id = s.id
    WHERE ar.student_id = ?
  `).all(studentId);

  return calculateAttendanceMetrics(records, policy);
}

function getStudentSubjectBreakdown(studentId) {
  const db = getDb();
  const policy = getPolicy();

  const student = db.prepare('SELECT batch_id FROM students WHERE id = ?').get(studentId);
  if (!student) return [];

  // Get subjects for this student's batch
  const subjects = db.prepare(`
    SELECT DISTINCT s.id, s.code, s.name, s.type, s.credits, s.weekly_hours,
           f.full_name as faculty_name, f.designation as faculty_designation
    FROM subjects s
    LEFT JOIN subject_assignments sa ON sa.subject_id = s.id AND sa.batch_id = ?
    LEFT JOIN faculty f ON sa.faculty_id = f.id
    JOIN batches b ON b.id = ? AND s.year_level = b.year_level AND s.semester = b.semester
    WHERE s.is_active = 1
    ORDER BY s.code ASC
  `).all(student.batch_id, student.batch_id);

  const breakdown = [];

  for (const subj of subjects) {
    const records = db.prepare(`
      SELECT ar.status, ses.session_date, ses.period_number
      FROM attendance_records ar
      JOIN attendance_sessions ses ON ar.session_id = ses.id
      WHERE ar.student_id = ? AND ses.subject_id = ?
    `).all(studentId, subj.id);

    const metrics = calculateAttendanceMetrics(records, policy);
    breakdown.push({
      subjectId: subj.id,
      code: subj.code,
      name: subj.name,
      type: subj.type,
      credits: subj.credits,
      facultyName: subj.faculty_name || 'TBA',
      ...metrics
    });
  }

  return breakdown;
}

module.exports = {
  getPolicy,
  calculateAttendanceMetrics,
  getStudentOverallAttendance,
  getStudentSubjectBreakdown
};
