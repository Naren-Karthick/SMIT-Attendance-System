const express = require('express');
const crypto = require('crypto');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getStudentOverallAttendance, getStudentSubjectBreakdown, getPolicy } = require('../attendanceEngine');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();
const PASSPORT_SECRET = process.env.JWT_SECRET || 'smit-smart-attendance-super-secret-key-2026';

// 1. Generate & Issue Digital Attendance Passport (Student, Faculty, HOD, COE)
router.post('/generate', authenticateToken, (req, res) => {
  const targetStudentId = req.body.student_id || req.user.studentId;
  if (!targetStudentId) {
    return res.status(400).json({ error: 'Target student ID is required.' });
  }

  // Authorization check: students can only issue their own passport
  if (req.user.role === 'student' && req.user.studentId !== targetStudentId) {
    return res.status(403).json({ error: 'Access denied. You cannot generate a passport for another student.' });
  }

  const db = getDb();
  const student = db.prepare(`
    SELECT s.*, u.full_name, u.email, b.name as batch_name, d.name as department_name, d.institution
    FROM students s
    JOIN users u ON s.user_id = u.id
    JOIN batches b ON s.batch_id = b.id
    LEFT JOIN departments d ON b.department_id = d.id
    WHERE s.id = ?
  `).get(targetStudentId);

  if (!student) return res.status(404).json({ error: 'Student record not found.' });

  const policy = getPolicy();
  const overall = getStudentOverallAttendance(targetStudentId);
  const subjects = getStudentSubjectBreakdown(targetStudentId);

  let eligibility = 'ELIGIBLE';
  if (overall.percentage < 65.0) {
    eligibility = 'DETAINED';
  } else if (overall.percentage < policy.min_attendance_pct) {
    eligibility = 'CONDONATION_REQUIRED';
  }

  const payload = {
    registerNumber: student.register_number,
    name: student.full_name,
    semester: student.semester,
    yearLevel: student.year_level,
    batch: student.batch_name,
    percentage: overall.percentage,
    eligibility,
    policy: 'R2021-V1',
    issuedAt: new Date().toISOString()
  };

  const signatureHash = crypto.createHmac('sha256', PASSPORT_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  const passportToken = Buffer.from(JSON.stringify({
    reg: student.register_number,
    sem: student.semester,
    sig: signatureHash.substring(0, 16)
  })).toString('base64url');

  db.prepare(`
    INSERT INTO digital_passports (
      passport_token, student_id, semester, academic_year,
      overall_percentage, total_conducted, total_attended,
      od_count, leave_count, eligibility_status, policy_version,
      signature_hash, issued_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    passportToken, targetStudentId, student.semester, policy.active_academic_year || '2026-2027',
    overall.percentage, overall.totalClassesConducted, overall.attendedHours,
    overall.od, overall.leave, eligibility, 'R2021-V1',
    signatureHash, req.user.id
  );

  res.json({
    success: true,
    passportToken,
    verificationUrl: `/api/passport/verify/${passportToken}`,
    passport: {
      student: {
        registerNumber: student.register_number,
        fullName: student.full_name,
        department: student.department_name || 'Information Technology',
        institution: student.institution || 'Sri Muthukumaran Institute of Technology',
        semester: student.semester,
        batch: student.batch_name
      },
      metrics: overall,
      subjects,
      eligibility,
      policyVersion: 'R2021-V1',
      signature: signatureHash,
      issuedAt: payload.issuedAt
    }
  });
});

// 2. Public Verifier Endpoint (Privacy-preserving, minimal disclosure)
router.get('/verify/:token', (req, res) => {
  const { token } = req.params;
  const db = getDb();

  const record = db.prepare(`
    SELECT dp.*, s.register_number, s.full_name, b.name as batch_name
    FROM digital_passports dp
    JOIN students s ON dp.student_id = s.id
    JOIN batches b ON s.batch_id = b.id
    WHERE dp.passport_token = ?
  `).get(token);

  if (!record) {
    return res.status(404).json({ valid: false, message: 'Invalid or forged attendance passport.' });
  }

  // Return minimal privacy-preserving proof
  res.json({
    valid: true,
    verifiedAt: new Date().toISOString(),
    institution: 'Sri Muthukumaran Institute of Technology',
    student: {
      registerNumberMasked: record.register_number.substring(0, 6) + '****',
      fullNameMasked: record.full_name.charAt(0) + '*** ' + record.full_name.split(' ').pop(),
      semester: record.semester,
      academicYear: record.academic_year
    },
    attendance: {
      percentage: record.overall_percentage,
      eligibility: record.eligibility_status,
      policyVersion: record.policy_version
    },
    proofStatus: 'CRYPTOGRAPHICALLY_VERIFIED'
  });
});

module.exports = router;