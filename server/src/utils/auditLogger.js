const { getDb } = require('../db');

function logAudit({
  userId = null,
  userName = 'System',
  role = 'system',
  action,
  entity,
  entityId = null,
  previousValue = null,
  newValue = null,
  reason = null,
  ipAddress = '127.0.0.1'
}) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (
        user_id, user_name, role, action, entity, entity_id,
        previous_value, new_value, reason, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      userName,
      role,
      action,
      entity,
      entityId ? String(entityId) : null,
      previousValue ? (typeof previousValue === 'object' ? JSON.stringify(previousValue) : String(previousValue)) : null,
      newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null,
      reason,
      ipAddress
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

function sendNotification({
  userId,
  title,
  message,
  type = 'system',
  linkUrl = null
}) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, title, message, type, linkUrl);
  } catch (err) {
    console.error('Failed to send notification:', err);
  }
}

module.exports = {
  logAudit,
  sendNotification
};
