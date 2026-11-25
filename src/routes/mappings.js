const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { getFacultyAvailability } = require('../utils/facultyAvailability');

router.use(authenticateToken);

// GET /api/mappings - List faculty-subject mappings
router.get('/', (req, res) => {
  try {
    const { faculty_id, subject_id, academic_year, semester, status, target_group } = req.query;

    let sql = `
      SELECT 
        m.id,
        m.faculty_id,
        m.subject_id,
        m.academic_year,
        m.semester,
        m.capacity,
        m.target_group,
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
      sql += ` AND m.academic_year = ? AND m.semester = ? AND (m.target_group = ? OR m.target_group = 'ALL' OR m.target_group IS NULL) AND m.status = 'ACTIVE' AND f.status = 'ACTIVE' AND s.status = 'ACTIVE'`;
      params.push(req.student.academic_year, req.student.semester, req.student.section);
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
      if (target_group && target_group !== 'ALL') {
        sql += ` AND m.target_group = ?`;
        params.push(target_group);
      }
    }

    sql += ` ORDER BY m.academic_year ASC, m.semester ASC, s.code ASC, CAST(SUBSTR(f.faculty_code, 4) AS INTEGER) ASC, f.faculty_code ASC`;

    const mappings = db.prepare(sql).all(...params);

    const enriched = mappings.map(m => {
      const availability = getFacultyAvailability(m.allocated_seats, m.capacity);
      if (req.user.role === 'STUDENT') {
        const {
          capacity,
          allocated_seats,
          ...studentMapping
        } = m;
        return { ...studentMapping, ...availability };
      }

      return {
        ...m,
        ...availability,
        available_seats: Math.max(0, m.capacity - m.allocated_seats)
      };
    });

    res.json({ success: true, mappings: enriched });
  } catch (error) {
    console.error('Error fetching mappings:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve mappings: ' + error.message });
  }
});

// Admin-only endpoints below
router.use(requireAdmin);

// POST /api/mappings - Create faculty-subject mapping (supports 1 faculty or N faculties)
router.post('/', (req, res) => {
  try {
    const { faculty_id, faculty_ids, subject_id, academic_year, semester, capacity, status, faculty_capacities, target_group } = req.body;

    if (!subject_id) {
      return res.status(400).json({ success: false, message: 'Subject selection is required.' });
    }
    if (!academic_year || academic_year < 1 || academic_year > 4) {
      return res.status(400).json({ success: false, message: 'Academic Year must be between 1 and 4.' });
    }
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }

    const targetGrp = target_group || 'ALL';

    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subject_id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Selected subject not found.' });
    }

    // Determine target faculty list: supports single faculty_id or array faculty_ids
    let targetFacultyList = [];
    if (Array.isArray(faculty_ids) && faculty_ids.length > 0) {
      targetFacultyList = faculty_ids;
    } else if (Array.isArray(faculty_id) && faculty_id.length > 0) {
      targetFacultyList = faculty_id;
    } else if (faculty_id) {
      targetFacultyList = [faculty_id];
    } else {
      return res.status(400).json({ success: false, message: 'At least one faculty member must be selected.' });
    }

    const defaultCapacity = (capacity !== undefined && capacity !== null) ? parseInt(capacity, 10) : 60;
    if (defaultCapacity < 0) {
      return res.status(400).json({ success: false, message: 'Seat capacity must be non-negative.' });
    }

    const now = new Date().toISOString();
    const mapStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const checkStmt = db.prepare(`
      SELECT id FROM faculty_subject_mappings 
      WHERE faculty_id = ? AND subject_id = ? AND academic_year = ? AND semester = ? AND target_group = ?
    `);

    const insertStmt = db.prepare(`
      INSERT INTO faculty_subject_mappings (
        faculty_id, subject_id, academic_year, semester, capacity, target_group, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const facultyQuery = db.prepare('SELECT id, name, faculty_code FROM faculty WHERE id = ?');

    const created = [];
    const skipped = [];

    db.exec('BEGIN TRANSACTION');
    try {
      for (const fId of targetFacultyList) {
        const facId = parseInt(fId, 10);
        const fac = facultyQuery.get(facId);
        if (!fac) continue;

        const existing = checkStmt.get(facId, subject_id, parseInt(academic_year, 10), parseInt(semester, 10), targetGrp);
        if (existing) {
          skipped.push(fac.name);
          continue;
        }

        const facCap = (faculty_capacities && faculty_capacities[facId] !== undefined)
          ? parseInt(faculty_capacities[facId], 10)
          : defaultCapacity;

        const resRun = insertStmt.run(
          facId,
          subject_id,
          parseInt(academic_year, 10),
          parseInt(semester, 10),
          facCap,
          targetGrp,
          mapStatus,
          now
        );

        created.push({ id: resRun.lastInsertRowid, faculty_name: fac.name, capacity: facCap, target_group: targetGrp });

        logAudit(
          req.user.id,
          'CREATE_MAPPING',
          'MAPPING',
          resRun.lastInsertRowid,
          `Assigned ${fac.name} to ${subject.code} (${subject.name}) for Year ${academic_year}, Sem ${semester} with capacity ${facCap}`,
          req.ip
        );
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    if (created.length === 0 && skipped.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Selected faculty member(s) already mapped to ${subject.code}: ${skipped.join(', ')}`
      });
    }

    let message = `Successfully mapped ${created.length} faculty member(s) to ${subject.code} (${subject.name}).`;
    if (skipped.length > 0) {
      message += ` (${skipped.length} already mapped: ${skipped.join(', ')})`;
    }

    res.status(201).json({
      success: true,
      message,
      created_count: created.length,
      mappings: created,
      skipped_count: skipped.length
    });
  } catch (error) {
    console.error('Error creating mapping(s):', error);
    res.status(500).json({ success: false, message: 'Failed to create mapping(s): ' + error.message });
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

    const { capacity, status, target_group } = req.body;

    if (capacity === undefined || capacity === null || parseInt(capacity, 10) < 0) {
      return res.status(400).json({ success: false, message: 'Seat capacity must be a non-negative number.' });
    }

    const newCapacity = parseInt(capacity, 10);
    const targetGrp = target_group || mapping.target_group || 'ALL';

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
      SET capacity = ?, status = ?, target_group = ?
      WHERE id = ?
    `).run(newCapacity, mapStatus, targetGrp, mappingId);

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
