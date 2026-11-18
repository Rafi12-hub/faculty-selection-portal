const { db } = require('../config/database');

function logAudit(userId, action, entity, entityId, details, ipAddress = '127.0.0.1') {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(userId || null, action, entity, entityId || null, detailsStr, ipAddress, now);
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

module.exports = {
  logAudit
};
