const express = require('express');
const { getDb } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// List user notifications
router.get('/', authenticateToken, (req, res) => {
  const { filter = 'all' } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [req.user.id];

  if (filter === 'unread') {
    query += ' AND is_read = 0';
  } else if (filter !== 'all') {
    query += ' AND type = ?';
    params.push(filter);
  }

  query += ' ORDER BY created_at DESC LIMIT 50';

  const notifications = db.prepare(query).all(...params);
  const unreadCount = db.prepare('SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

  res.json({
    notifications,
    unreadCount
  });
});

// Mark single notification read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const notifId = req.params.id;
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notifId, req.user.id);
  res.json({ success: true });
});

// Mark all read
router.post('/mark-all-read', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = router;
