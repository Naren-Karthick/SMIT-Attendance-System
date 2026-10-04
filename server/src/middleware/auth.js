const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'smit-smart-attendance-super-secret-key-2026';

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

    // Attach student or faculty specific IDs if applicable
    if (user.role === 'student') {
      const student = db.prepare('SELECT id, register_number, batch_id, section_id, year_level, semester FROM students WHERE user_id = ?').get(user.id);
      if (student) {
        req.user.studentId = student.id;
        req.user.registerNumber = student.register_number;
        req.user.batchId = student.batch_id;
        req.user.sectionId = student.section_id;
        req.user.yearLevel = student.year_level;
        req.user.semester = student.semester;
      }
    } else if (user.role === 'faculty' || user.role === 'hod') {
      const faculty = db.prepare('SELECT id, faculty_id, designation, department, is_hod FROM faculty WHERE user_id = ?').get(user.id);
      if (faculty) {
        req.user.facultyId = faculty.id;
        req.user.facultyCode = faculty.faculty_id;
        req.user.designation = faculty.designation;
        req.user.isHod = faculty.is_hod;
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

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] role.`
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole
};
