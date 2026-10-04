const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const { getPolicy } = require('../attendanceEngine');

const router = express.Router();

// Get settings
router.get('/', authenticateToken, (req, res) => {
  const policy = getPolicy();
  res.json({ settings: policy });
});

// Update settings (HOD only)
router.put('/', authenticateToken, requireRole('hod'), (req, res) => {
  const {
    min_attendance_pct,
    warning_threshold_pct,
    od_treatment,
    permission_treatment,
    leave_treatment,
    faculty_edit_window_hours,
    allowed_evidence_formats,
    max_upload_size_mb,
    active_academic_year,
    active_semester
  } = req.body;

  const db = getDb();
  const oldPolicy = getPolicy();

  db.prepare(`
    UPDATE attendance_policies
    SET min_attendance_pct = COALESCE(?, min_attendance_pct),
        warning_threshold_pct = COALESCE(?, warning_threshold_pct),
        od_treatment = COALESCE(?, od_treatment),
        permission_treatment = COALESCE(?, permission_treatment),
        leave_treatment = COALESCE(?, leave_treatment),
        faculty_edit_window_hours = COALESCE(?, faculty_edit_window_hours),
        allowed_evidence_formats = COALESCE(?, allowed_evidence_formats),
        max_upload_size_mb = COALESCE(?, max_upload_size_mb),
        active_academic_year = COALESCE(?, active_academic_year),
        active_semester = COALESCE(?, active_semester)
    WHERE id = 1
  `).run(
    min_attendance_pct !== undefined ? parseFloat(min_attendance_pct) : null,
    warning_threshold_pct !== undefined ? parseFloat(warning_threshold_pct) : null,
    od_treatment,
    permission_treatment,
    leave_treatment,
    faculty_edit_window_hours !== undefined ? parseInt(faculty_edit_window_hours, 10) : null,
    allowed_evidence_formats,
    max_upload_size_mb !== undefined ? parseInt(max_upload_size_mb, 10) : null,
    active_academic_year,
    active_semester
  );

  const updatedPolicy = getPolicy();

  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'POLICY_CONFIG_UPDATED',
    entity: 'attendance_policies',
    entityId: '1',
    previousValue: JSON.stringify(oldPolicy),
    newValue: JSON.stringify(updatedPolicy),
    reason: 'Department attendance & request policies updated by HOD',
    ipAddress: req.ip
  });

  res.json({
    success: true,
    settings: updatedPolicy,
    message: 'Department attendance policies updated successfully.'
  });
});

module.exports = router;
