const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { validateEnv } = require('../config');

const config = validateEnv();
const JWT_SECRET = config.jwtSecret;

/**
 * Standard Role Hierarchy:
 * sysadmin > institution_admin > coe > principal > hod > mentor > faculty > student | parent
 */
const ROLE_PERMISSIONS = {
  student: ['attendance:view_own', 'od:apply', 'leave:apply', 'appeal:submit', 'passport:view_own'],
  parent: ['attendance:view_child', 'notifications:view', 'passport:view_child'],
  faculty: [
    'attendance:view_own', 'attendance:mark', 'attendance:history',
    'od:view_class', 'leave:view_class', 'reports:view'
  ],
  mentor: [
    'attendance:view_own', 'attendance:mark', 'attendance:history',
    'intervention:manage', 'intervention:log', 'od:review_stage1', 'leave:review_stage1',
    'appeal:review', 'reports:view'
  ],
  hod: [
    'attendance:view_all', 'attendance:mark', 'attendance:edit_any',
    'intervention:view_dept', 'od:approve_final', 'leave:approve_final',
    'appeal:approve_final', 'timetable:manage', 'subjects:manage', 'faculty:manage',
    'students:manage', 'analytics:view', 'reports:export', 'audit:view'
  ],
  principal: [
    'attendance:view_all', 'analytics:view_institution', 'reports:export_institution',
    'od:view_institution', 'leave:view_institution', 'audit:view'
  ],
  coe: [
    'attendance:view_all', 'eligibility:generate', 'passport:issue', 'passport:verify',
    'reports:export_coe', 'appeal:review_coe'
  ],
  institution_admin: [
    'institution:manage', 'users:manage', 'policies:manage', 'departments:manage',
    'academic_calendar:manage', 'audit:view'
  ],
  sysadmin: ['*']
};

function hasPermission(role, permission) {
  if (role === 'sysadmin') return true;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please sign in again.' });
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT u.id, u.username, u.role, u.full_name, u.email, u.phone, u.avatar_url, u.is_active
      FROM users u
      WHERE u.id = ?
    `).get(decoded.userId);

    if (!user || user.is_active !== 1) {
      return res.status(403).json({ error: 'User account not found or deactivated.' });
    }

    req.user = user;

    // Attach student, faculty or mentor details
    if (user.role === 'student') {
      const student = db.prepare('SELECT id, register_number, batch_id, section_id, year_level, semester, mentor_faculty_id FROM students WHERE user_id = ?').get(user.id);
      if (student) {
        req.user.studentId = student.id;
        req.user.registerNumber = student.register_number;
        req.user.batchId = student.batch_id;
        req.user.sectionId = student.section_id;
        req.user.yearLevel = student.year_level;
        req.user.semester = student.semester;
        req.user.mentorFacultyId = student.mentor_faculty_id;
      }
    } else if (['faculty', 'mentor', 'hod', 'principal'].includes(user.role)) {
      const faculty = db.prepare('SELECT id, faculty_id, designation, department, is_hod, class_in_charge_batch_id FROM faculty WHERE user_id = ?').get(user.id);
      if (faculty) {
        req.user.facultyId = faculty.id;
        req.user.facultyCode = faculty.faculty_id;
        req.user.designation = faculty.designation;
        req.user.isHod = faculty.is_hod;
        req.user.classInChargeBatchId = faculty.class_in_charge_batch_id;
      }
    }

    next();
  });
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // sysadmin bypasses all role checks
    if (req.user.role === 'sysadmin') {
      return next();
    }

    // Support role aliases (e.g. mentor is also a faculty)
    const effectiveRoles = [req.user.role];
    if (req.user.role === 'mentor') effectiveRoles.push('faculty');
    if (req.user.role === 'hod') {
      effectiveRoles.push('faculty');
      effectiveRoles.push('mentor');
    }

    const hasMatch = allowedRoles.some(r => effectiveRoles.includes(r));
    if (!hasMatch) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] role.`
      });
    }

    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (hasPermission(req.user.role, permission)) {
      return next();
    }

    return res.status(403).json({
      error: `Access denied. Permission '${permission}' is required.`
    });
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole,
  requirePermission,
  hasPermission,
  ROLE_PERMISSIONS
};
