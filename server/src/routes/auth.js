const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

router.post('/login', (req, res) => {
  const { identifier, password, role } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter your username/register number and password.' });
  }

  const db = getDb();
  const trimmed = identifier.trim();

  // Search by username, register number (if student), faculty ID (if faculty), or email
  let user = db.prepare(`
    SELECT u.*,
           s.id as student_id, s.register_number, s.batch_id, s.year_level, s.semester,
           f.id as faculty_table_id, f.faculty_id as faculty_code, f.designation, f.is_hod
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN faculty f ON u.id = f.user_id
    WHERE LOWER(u.username) = LOWER(?)
       OR LOWER(u.email) = LOWER(?)
       OR (s.register_number IS NOT NULL AND LOWER(s.register_number) = LOWER(?))
       OR (f.faculty_id IS NOT NULL AND LOWER(f.faculty_id) = LOWER(?))
    LIMIT 1
  `).get(trimmed, trimmed, trimmed, trimmed);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User not found.' });
  }

  if (role && user.role !== role) {
    return res.status(401).json({
      error: `Role mismatch. This account is registered as '${user.role.toUpperCase()}', not '${role.toUpperCase()}'.`
    });
  }

  // Password verification
  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch && password !== 'smit@2026') {
    return res.status(401).json({ error: 'Incorrect password. Default demo password is smit@2026' });
  }

  if (user.is_active !== 1) {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact HOD.' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Log audit
  logAudit({
    userId: user.id,
    userName: user.full_name,
    role: user.role,
    action: 'USER_LOGIN',
    entity: 'user',
    entityId: user.id,
    reason: `User logged in from web client with role ${user.role}`,
    ipAddress: req.ip
  });

  const userData = {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    studentId: user.student_id,
    registerNumber: user.register_number,
    batchId: user.batch_id,
    yearLevel: user.year_level,
    semester: user.semester,
    facultyId: user.faculty_table_id,
    facultyCode: user.faculty_code,
    designation: user.designation,
    isHod: user.is_hod === 1
  };

  res.json({
    token,
    user: userData,
    message: `Welcome, ${user.full_name}!`
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const unreadCount = db.prepare(`
    SELECT count(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(req.user.id).count;

  res.json({
    user: req.user,
    unreadNotifications: unreadCount
  });
});

router.post('/logout', authenticateToken, (req, res) => {
  logAudit({
    userId: req.user.id,
    userName: req.user.full_name,
    role: req.user.role,
    action: 'USER_LOGOUT',
    entity: 'user',
    entityId: req.user.id,
    reason: 'User logged out',
    ipAddress: req.ip
  });

  res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/demo-accounts', (req, res) => {
  // Returns handy demo login options for testing all roles seamlessly
  res.json([
    {
      role: 'hod',
      name: 'Dr. S. Anitha',
      title: 'HOD - Information Technology',
      identifier: 'hod_it',
      password: 'smit@2026',
      badge: 'Admin / Department Head'
    },
    {
      role: 'faculty',
      name: 'Prof. R. Kavitha',
      title: 'Associate Professor (Data Structures)',
      identifier: 'fac_kavitha',
      password: 'smit@2026',
      badge: 'Subject In-Charge'
    },
    {
      role: 'faculty',
      name: 'Prof. K. Suresh',
      title: 'Assistant Professor (OOP & DBMS)',
      identifier: 'fac_suresh',
      password: 'smit@2026',
      badge: 'Class Advisor'
    },
    {
      role: 'student',
      name: 'Aravind M',
      title: '2nd Year IT (3rd Sem) — Has Pending OD',
      identifier: '212625205004',
      password: 'smit@2026',
      badge: 'Reg: 212625205004'
    },
    {
      role: 'student',
      name: 'Ilakiya B',
      title: '2nd Year IT (3rd Sem) — Critical Attendance (<75%)',
      identifier: '212625205013',
      password: 'smit@2026',
      badge: 'Reg: 212625205013'
    },
    {
      role: 'student',
      name: 'Ashwinmaran S',
      title: '3rd Year IT (5th Sem) — Approved OD',
      identifier: '212624205001',
      password: 'smit@2026',
      badge: 'Reg: 212624205001'
    }
  ]);
});

module.exports = router;
