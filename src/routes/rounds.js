const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(authenticateToken);

// GET /api/rounds - List rounds
router.get('/', (req, res) => {
  try {
    let sql = `SELECT * FROM selection_rounds WHERE 1=1`;
    const params = [];

    if (req.user.role === 'STUDENT') {
      sql += ` AND academic_year = ? AND semester = ? AND (target_group = ? OR target_group = 'ALL' OR target_group IS NULL)`;
      params.push(req.student.academic_year, req.student.semester, req.student.section);
    } else {
      const { status, academic_year, semester, target_group } = req.query;
      if (status && status !== 'ALL') {
        sql += ` AND status = ?`;
        params.push(status);
      }
      if (academic_year && academic_year !== 'ALL') {
        sql += ` AND academic_year = ?`;
        params.push(parseInt(academic_year, 10));
      }
      if (semester && semester !== 'ALL') {
        sql += ` AND semester = ?`;
        params.push(parseInt(semester, 10));
      }
      if (target_group && target_group !== 'ALL') {
        sql += ` AND target_group = ?`;
        params.push(target_group);
      }
    }

    sql += ` ORDER BY CASE WHEN status = 'ACTIVE' THEN 0 WHEN status = 'PAUSED' THEN 1 ELSE 2 END, created_at DESC`;
    const rounds = db.prepare(sql).all(...params);

    // Calculate selection count for each round
    const enriched = rounds.map(r => {
      const count = db.prepare("SELECT COUNT(*) as count FROM selections WHERE selection_round_id = ? AND status = 'CONFIRMED'").get(r.id).count;
      return { ...r, total_confirmed_selections: count };
    });

    res.json({ success: true, rounds: enriched });
  } catch (error) {
    console.error('Error fetching rounds:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve selection rounds: ' + error.message });
  }
});

// Admin-only endpoints below
router.use(requireAdmin);

// POST /api/rounds - Create selection round
router.post('/', (req, res) => {
  try {
    const { name, academic_year, semester, start_time, end_time, status, target_group } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Round Name is required.' });
    }
    if (!academic_year || academic_year < 1 || academic_year > 4) {
      return res.status(400).json({ success: false, message: 'Academic Year must be between 1 and 4.' });
    }
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }
    if (!start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Start Time and End Time are required.' });
    }

    const roundStatus = status || 'ACTIVE';
    const targetGrp = target_group || 'ALL';
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      parseInt(academic_year, 10),
      parseInt(semester, 10),
      targetGrp,
      new Date(start_time).toISOString(),
      new Date(end_time).toISOString(),
      roundStatus,
      now
    );

    const newId = result.lastInsertRowid;

    logAudit(
      req.user.id,
      'CREATE_ROUND',
      'ROUND',
      newId,
      `Created selection round: "${name.trim()}" for Year ${academic_year}, Sem ${semester} [Group: ${targetGrp}, Status: ${roundStatus}]`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Selection round created successfully.',
      round: db.prepare('SELECT * FROM selection_rounds WHERE id = ?').get(newId)
    });
  } catch (error) {
    console.error('Error creating round:', error);
    res.status(500).json({ success: false, message: 'Failed to create selection round: ' + error.message });
  }
});

// PUT /api/rounds/:id - Update round
router.put('/:id', (req, res) => {
  try {
    const roundId = req.params.id;
    const existing = db.prepare('SELECT * FROM selection_rounds WHERE id = ?').get(roundId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Selection round not found.' });
    }

    const { name, academic_year, semester, start_time, end_time, status, target_group } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Round Name is required.' });
    }

    const roundStatus = status || existing.status;
    const targetGrp = target_group || existing.target_group || 'ALL';

    db.prepare(`
      UPDATE selection_rounds SET
        name = ?,
        academic_year = ?,
        semester = ?,
        target_group = ?,
        start_time = ?,
        end_time = ?,
        status = ?
      WHERE id = ?
    `).run(
      name.trim(),
      parseInt(academic_year, 10),
      parseInt(semester, 10),
      targetGrp,
      new Date(start_time).toISOString(),
      new Date(end_time).toISOString(),
      roundStatus,
      roundId
    );

    logAudit(
      req.user.id,
      'UPDATE_ROUND',
      'ROUND',
      roundId,
      `Updated round: "${name.trim()}" [Status: ${roundStatus}]`,
      req.ip
    );

    res.json({
      success: true,
      message: 'Selection round updated successfully.',
      round: db.prepare('SELECT * FROM selection_rounds WHERE id = ?').get(roundId)
    });
  } catch (error) {
    console.error('Error updating round:', error);
    res.status(500).json({ success: false, message: 'Failed to update selection round: ' + error.message });
  }
});

// PATCH /api/rounds/:id/status - Quick toggle status from Live Selection module (START / PAUSE / CLOSE)
router.patch('/:id/status', (req, res) => {
  try {
    const roundId = req.params.id;
    const { status } = req.body;
    if (!['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be DRAFT, ACTIVE, PAUSED, or CLOSED.' });
    }

    const round = db.prepare('SELECT * FROM selection_rounds WHERE id = ?').get(roundId);
    if (!round) {
      return res.status(404).json({ success: false, message: 'Selection round not found.' });
    }

    const now = new Date().toISOString();
    let startTime = round.start_time;
    let endTime = round.end_time;

    // If starting live now, ensure start_time is now and end_time is in future (e.g. 30 days)
    if (status === 'ACTIVE') {
      startTime = now;
      const nowMs = Date.now();
      const endMs = new Date(endTime).getTime();
      if (endMs <= nowMs) {
        endTime = new Date(nowMs + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    db.prepare(`
      UPDATE selection_rounds 
      SET status = ?, start_time = ?, end_time = ?
      WHERE id = ?
    `).run(status, startTime, endTime, roundId);

    logAudit(
      req.user.id,
      'TOGGLE_ROUND_STATUS',
      'ROUND',
      roundId,
      `Live selection round "${round.name}" toggled to ${status} by admin`,
      req.ip
    );

    res.json({
      success: true,
      message: `Live selection round "${round.name}" is now ${status}.`,
      round: db.prepare('SELECT * FROM selection_rounds WHERE id = ?').get(roundId)
    });
  } catch (err) {
    console.error('Error toggling round status:', err);
    res.status(500).json({ success: false, message: 'Failed to update round status: ' + err.message });
  }
});

// DELETE /api/rounds/:id
router.delete('/:id', (req, res) => {
  try {
    const roundId = req.params.id;
    const existing = db.prepare('SELECT * FROM selection_rounds WHERE id = ?').get(roundId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Selection round not found.' });
    }

    const selCount = db.prepare('SELECT COUNT(*) as count FROM selections WHERE selection_round_id = ?').get(roundId).count;
    if (selCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete selection round "${existing.name}": There are ${selCount} student selections tied to it.`
      });
    }

    db.prepare('DELETE FROM selection_rounds WHERE id = ?').run(roundId);

    logAudit(
      req.user.id,
      'DELETE_ROUND',
      'ROUND',
      roundId,
      `Deleted selection round: "${existing.name}"`,
      req.ip
    );

    res.json({ success: true, message: 'Selection round deleted successfully.' });
  } catch (error) {
    console.error('Error deleting round:', error);
    res.status(500).json({ success: false, message: 'Failed to delete selection round: ' + error.message });
  }
});

module.exports = router;
