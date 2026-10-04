const express = require('express');
const { getDb } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get Immutable Audit Logs (HOD only)
router.get('/', authenticateToken, requireRole('hod'), (req, res) => {
  const { action, role, search, page = 1, limit = 50 } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }
  if (search) {
    query += ' AND (user_name LIKE ? OR action LIKE ? OR entity LIKE ? OR entity_id LIKE ? OR reason LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  query += ' ORDER BY created_at DESC';

  const offset = (page - 1) * limit;
  query += ` LIMIT ${parseInt(limit, 10)} OFFSET ${offset}`;

  const logs = db.prepare(query).all(...params);
  const totalCount = db.prepare('SELECT count(*) as count FROM audit_logs').get().count;

  res.json({
    total: totalCount,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    logs
  });
});

module.exports = router;
