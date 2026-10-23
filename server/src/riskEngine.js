const { getDb } = require('./db');
const { getStudentOverallAttendance, getStudentSubjectBreakdown, getPolicy } = require('./attendanceEngine');

/**
 * Calculate explainable risk factors for a student with human-readable rationale
 */
function evaluateStudentRisk(studentId) {
  const db = getDb();
  const policy = getPolicy();
  const overall = getStudentOverallAttendance(studentId);
  const subjects = getStudentSubjectBreakdown(studentId);

  const riskReasons = [];
  let riskLevel = 'LOW'; // LOW, MODERATE, HIGH, CRITICAL
  let score = 0;

  // 1. Overall threshold analysis
  if (overall.percentage < policy.min_attendance_pct) {
    riskLevel = 'CRITICAL';
    score += 50;
    riskReasons.push(`Overall attendance is ${overall.percentage}%, which is below the required ${policy.min_attendance_pct}% threshold. Student needs to attend ${overall.classesNeededToRecover} consecutive classes to recover.`);
  } else if (overall.percentage < policy.warning_threshold_pct) {
    if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
    score += 25;
    riskReasons.push(`Overall attendance is in the warning band at ${overall.percentage}% (buffer: only ${overall.classesCanMiss} class(es) can be missed before falling below ${policy.min_attendance_pct}%).`);
  }

  // 2. Subject-wise critical analysis
  const failingSubjects = subjects.filter(s => s.percentage < policy.min_attendance_pct);
  if (failingSubjects.length > 0) {
    score += failingSubjects.length * 15;
    if (riskLevel !== 'CRITICAL') riskLevel = failingSubjects.length >= 2 ? 'HIGH' : 'MODERATE';
    const names = failingSubjects.map(s => `${s.name} (${s.percentage}%)`).join(', ');
    riskReasons.push(`Deficit in ${failingSubjects.length} subject(s): ${names}.`);
  }

  // 3. Consecutive recent absences check (last 10 sessions)
  const recentRecords = db.prepare(`
    SELECT ar.status, ses.session_date, ses.period_number, s.code as subject_code
    FROM attendance_records ar
    JOIN attendance_sessions ses ON ar.session_id = ses.id
    JOIN subjects s ON ses.subject_id = s.id
    WHERE ar.student_id = ?
    ORDER BY ses.session_date DESC, ses.period_number DESC
    LIMIT 10
  `).all(studentId);

  let streak = 0;
  for (const r of recentRecords) {
    if (r.status === 'ABSENT') streak++;
    else break;
  }

  if (streak >= 3) {
    score += 20;
    if (riskLevel === 'LOW') riskLevel = 'MODERATE';
    riskReasons.push(`Active unexcused absence streak: missed the last ${streak} scheduled class sessions.`);
  }

  // 4. Period 1 or Period 7 habituality (skipping first/last classes)
  const edgeMisses = db.prepare(`
    SELECT count(*) as count
    FROM attendance_records ar
    JOIN attendance_sessions ses ON ar.session_id = ses.id
    WHERE ar.student_id = ? AND ar.status = 'ABSENT' AND ses.period_number IN (1, 7)
  `).get(studentId).count;

  if (edgeMisses >= 3) {
    score += 10;
    riskReasons.push(`Pattern of missing edge periods: ${edgeMisses} absences recorded in Period 1 (morning arrival) or Period 7 (early departure).`);
  }

  if (riskReasons.length === 0) {
    riskReasons.push(`Attendance record is compliant with regulation ${policy.policy_code || 'R2021'}. Attendance above ${policy.warning_threshold_pct}%.`);
  }

  return {
    studentId,
    riskLevel,
    riskScore: Math.min(100, score),
    overallPercentage: overall.percentage,
    classesNeededToRecover: overall.classesNeededToRecover,
    classesCanMiss: overall.classesCanMiss,
    failingSubjectCount: failingSubjects.length,
    explanations: riskReasons,
    policyVersion: 'R2021-v1.0'
  };
}

/**
 * Timetable-Aware Recovery Simulation
 * Projects recovery timeline across multiple target thresholds (75%, 80%, 85%)
 */
function simulateRecoveryPlan(studentId, targetPercentages = [75, 80, 85]) {
  const overall = getStudentOverallAttendance(studentId);
  const { attendedHours, applicableTotal } = overall;

  const targets = targetPercentages.map(target => {
    const ratio = target / 100;
    let classesNeeded = 0;
    let currentCanMiss = 0;
    if (overall.percentage >= target) {
      currentCanMiss = Math.max(0, Math.floor((attendedHours - ratio * applicableTotal) / ratio));
    } else {
      classesNeeded = Math.max(0, Math.ceil((ratio * applicableTotal - attendedHours) / (1 - ratio)));
    }
    return {
      targetPercentage: target,
      classesNeededToReach: classesNeeded,
      bufferClassesCanMiss: currentCanMiss,
      achievable: true,
      projectedDaysNeeded: Math.ceil(classesNeeded / 4) // avg 4 periods/day
    };
  });

  return {
    studentId,
    currentPercentage: overall.percentage,
    attendedHours,
    applicableTotal,
    targets,
    calculatedAt: new Date().toISOString()
  };
}

module.exports = {
  evaluateStudentRisk,
  simulateRecoveryPlan
};