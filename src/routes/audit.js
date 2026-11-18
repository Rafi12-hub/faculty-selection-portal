const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/audit - Query audit logs
router.get('/', (req, res) => {
  try {
    const { action, entity, search, limit = 100 } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.action,
        a.entity,
        a.entity_id,
        a.details,
        a.ip_address,
        a.timestamp,
        u.username as operator_username,
        u.role as operator_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (action && action !== 'ALL') {
      sql += ` AND a.action = ?`;
      params.push(action);
    }

    if (entity && entity !== 'ALL') {
      sql += ` AND a.entity = ?`;
      params.push(entity);
    }

    if (search && search.trim()) {
      sql += ` AND (a.details LIKE ? OR a.action LIKE ? OR u.username LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY a.id DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const logs = db.prepare(sql).all(...params);

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs: ' + error.message });
  }
});

module.exports = router;
