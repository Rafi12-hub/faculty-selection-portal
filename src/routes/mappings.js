const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(authenticateToken);

// GET /api/mappings - List faculty-subject mappings
router.get('/', (req, res) => {
  try {
    const { faculty_id, subject_id, academic_year, semester, status } = req.query;

    let sql = `
      SELECT 
        m.id,
        m.faculty_id,
        m.subject_id,
        m.academic_year,
        m.semester,
        m.capacity,
        m.status,
        m.created_at,
        f.name as faculty_name,
        f.faculty_code,
        f.designation as faculty_designation,
        f.qualification as faculty_qualification,
        f.specialization as faculty_specialization,
        f.status as faculty_status,
        s.code as subject_code,
        s.name as subject_name,
        s.department as subject_department,
        (
          SELECT COUNT(*) 
          FROM selections sel 
          WHERE sel.mapping_id = m.id AND sel.status = 'CONFIRMED'
        ) as allocated_seats
      FROM faculty_subject_mappings m
      JOIN faculty f ON m.faculty_id = f.id
      JOIN subjects s ON m.subject_id = s.id
      WHERE 1=1
    `;

    const params = [];

    if (req.user.role === 'STUDENT') {
      sql += ` AND m.academic_year = ? AND m.semester = ? AND m.status = 'ACTIVE' AND f.status = 'ACTIVE' AND s.status = 'ACTIVE'`;
      params.push(req.student.academic_year, req.student.semester);
    } else {
      if (faculty_id && faculty_id !== 'ALL') {
        sql += ` AND m.faculty_id = ?`;
        params.push(parseInt(faculty_id, 10));
      }
      if (subject_id && subject_id !== 'ALL') {
        sql += ` AND m.subject_id = ?`;
        params.push(parseInt(subject_id, 10));
      }
      if (academic_year && academic_year !== 'ALL') {
        sql += ` AND m.academic_year = ?`;
        params.push(parseInt(academic_year, 10));
      }
      if (semester && semester !== 'ALL') {
        sql += ` AND m.semester = ?`;
        params.push(parseInt(semester, 10));
      }
      if (status && status !== 'ALL') {
        sql += ` AND m.status = ?`;
        params.push(status);
      }
    }

    sql += ` ORDER BY m.academic_year ASC, m.semester ASC, s.code ASC, f.name ASC`;

    const mappings = db.prepare(sql).all(...params);

    const enriched = mappings.map(m => ({
      ...m,
      available_seats: Math.max(0, m.capacity - m.allocated_seats),
      occupancy_rate: m.capacity > 0 ? Math.round((m.allocated_seats / m.capacity) * 100) : 0
    }));

    res.json({ success: true, mappings: enriched });
  } catch (error) {
    console.error('Error fetching mappings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve mappings: ' + error.message });
  }
});

// Admin-only endpoints below
router.use(requireAdmin);

// POST /api/mappings - Create faculty-subject mapping
router.post('/', (req, res) => {
  try {
    const { faculty_id, subject_id, academic_year, semester, capacity, status } = req.body;

    if (!faculty_id) {
      return res.status(400).json({ success: false, message: 'Faculty member selection is required.' });
    }
    if (!subject_id) {
      return res.status(400).json({ success: false, message: 'Subject selection is required.' });
    }
    if (!academic_year || academic_year < 1 || academic_year > 4) {
      return res.status(400).json({ success: false, message: 'Academic Year must be between 1 and 4.' });
    }
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }
    if (capacity === undefined || capacity === null || parseInt(capacity, 10) < 0) {
      return res.status(400).json({ success: false, message: 'Seat capacity must be a non-negative number.' });
    }

    const faculty = db.prepare('SELECT * FROM faculty WHERE id = ?').get(faculty_id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Selected faculty member not found.' });
    }

    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subject_id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Selected subject not found.' });
    }

    // Check for duplicate active mapping for the same faculty, subject, academic year, and semester
    const existing = db.prepare(`
      SELECT id FROM faculty_subject_mappings 
      WHERE faculty_id = ? AND subject_id = ? AND academic_year = ? AND semester = ?
    `).get(faculty_id, subject_id, parseInt(academic_year, 10), parseInt(semester, 10));

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A mapping already exists for ${faculty.name} teaching ${subject.code} (${subject.name}) in Year ${academic_year}, Semester ${semester}.`
      });
    }

    const now = new Date().toISOString();
    const mapStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const maxCapacity = parseInt(capacity, 10);

    const insert = db.prepare(`
      INSERT INTO faculty_subject_mappings (
        faculty_id, subject_id, academic_year, semester, capacity, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      faculty_id,
      subject_id,
      parseInt(academic_year, 10),
      parseInt(semester, 10),
      maxCapacity,
      mapStatus,
      now
    );

    const newId = result.lastInsertRowid;

    logAudit(
      req.user.id,
      'CREATE_MAPPING',
      'MAPPING',
      newId,
      `Assigned ${faculty.name} to ${subject.code} (${subject.name}) for Year ${academic_year}, Sem ${semester} with capacity ${maxCapacity}`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Faculty-Subject mapping created successfully.',
      mapping_id: newId
    });
  } catch (error) {
    console.error('Error creating mapping:', error);
    res.status(500).json({ success: false, message: 'Failed to create mapping: ' + error.message });
  }
});

// PUT /api/mappings/:id - Update mapping capacity or status
router.put('/:id', (req, res) => {
  try {
    const mappingId = req.params.id;
    const mapping = db.prepare(`
      SELECT m.*, f.name as faculty_name, s.name as subject_name, s.code as subject_code
      FROM faculty_subject_mappings m
      JOIN faculty f ON m.faculty_id = f.id
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.id = ?
    `).get(mappingId);

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping record not found.' });
    }

    const { capacity, status } = req.body;

    if (capacity === undefined || capacity === null || parseInt(capacity, 10) < 0) {
      return res.status(400).json({ success: false, message: 'Seat capacity must be a non-negative number.' });
    }

    const newCapacity = parseInt(capacity, 10);

    // CRITICAL REQUIREMENT: Never allow capacity to be reduced below the number of currently allocated seats!
    const allocated = db.prepare(`
      SELECT COUNT(*) as count 
      FROM selections 
      WHERE mapping_id = ? AND status = 'CONFIRMED'
    `).get(mappingId).count;

    if (newCapacity < allocated) {
      return res.status(400).json({
        success: false,
        message: `Capacity cannot be reduced to ${newCapacity}. There are already ${allocated} confirmed student selections for this mapping. Capacity must be at least ${allocated}.`
      });
    }

    const mapStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    db.prepare(`
      UPDATE faculty_subject_mappings 
      SET capacity = ?, status = ?
      WHERE id = ?
    `).run(newCapacity, mapStatus, mappingId);

    logAudit(
      req.user.id,
      'UPDATE_MAPPING',
      'MAPPING',
      mappingId,
      `Updated mapping for ${mapping.faculty_name} (${mapping.subject_code}): capacity changed from ${mapping.capacity} to ${newCapacity}, status: ${mapStatus}`,
      req.ip
    );

    res.json({
      success: true,
      message: 'Mapping updated successfully.'
    });
  } catch (error) {
    console.error('Error updating mapping:', error);
    res.status(500).json({ success: false, message: 'Failed to update mapping: ' + error.message });
  }
});

// DELETE /api/mappings/:id - Delete mapping only when no confirmed student selections exist
router.delete('/:id', (req, res) => {
  try {
    const mappingId = req.params.id;
    const mapping = db.prepare(`
      SELECT m.*, f.name as faculty_name, s.name as subject_name, s.code as subject_code
      FROM faculty_subject_mappings m
      JOIN faculty f ON m.faculty_id = f.id
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.id = ?
    `).get(mappingId);

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found.' });
    }

    const allocatedCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM selections 
      WHERE mapping_id = ? AND status = 'CONFIRMED'
    `).get(mappingId).count;

    if (allocatedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete mapping for ${mapping.faculty_name} - ${mapping.subject_code}: There are ${allocatedCount} confirmed student selection(s). You must cancel or reassign these selections before deleting this mapping.`
      });
    }

    db.prepare('DELETE FROM faculty_subject_mappings WHERE id = ?').run(mappingId);

    logAudit(
      req.user.id,
      'DELETE_MAPPING',
      'MAPPING',
      mappingId,
      `Deleted mapping: ${mapping.faculty_name} teaching ${mapping.subject_code}`,
      req.ip
    );

    res.json({
      success: true,
      message: `Mapping for ${mapping.faculty_name} - ${mapping.subject_code} deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting mapping:', error);
    res.status(500).json({ success: false, message: 'Failed to delete mapping: ' + error.message });
  }
});

module.exports = router;
