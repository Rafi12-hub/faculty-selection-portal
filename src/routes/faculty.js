const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

// All faculty management routes require ADMIN authentication
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/faculty - List faculty with search, filter, and seat statistics
router.get('/', (req, res) => {
  try {
    const { search, status, designation } = req.query;

    let sql = `
      SELECT 
        f.*,
        COUNT(DISTINCT m.id) as assigned_subjects_count,
        COALESCE(SUM(CASE WHEN m.status = 'ACTIVE' THEN m.capacity ELSE 0 END), 0) as total_capacity,
        COALESCE(
          (SELECT COUNT(*) 
           FROM selections s 
           JOIN faculty_subject_mappings m2 ON s.mapping_id = m2.id
           WHERE m2.faculty_id = f.id AND s.status = 'CONFIRMED'), 0
        ) as total_allocated
      FROM faculty f
      LEFT JOIN faculty_subject_mappings m ON f.id = m.faculty_id
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim()) {
      sql += ` AND (f.name LIKE ? OR f.faculty_code LIKE ? OR f.specialization LIKE ? OR f.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status && status !== 'ALL') {
      sql += ` AND f.status = ?`;
      params.push(status);
    }

    if (designation && designation !== 'ALL') {
      sql += ` AND f.designation = ?`;
      params.push(designation);
    }

    sql += ` GROUP BY f.id ORDER BY f.name ASC`;

    const facultyList = db.prepare(sql).all(...params);

    // Calculate remaining capacity for each faculty
    const enrichedList = facultyList.map(item => ({
      ...item,
      remaining_capacity: Math.max(0, item.total_capacity - item.total_allocated)
    }));

    res.json({ success: true, faculty: enrichedList });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve faculty: ' + error.message });
  }
});

// GET /api/faculty/:id - Single faculty details + assigned subjects breakdown
router.get('/:id', (req, res) => {
  try {
    const faculty = db.prepare('SELECT * FROM faculty WHERE id = ?').get(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    // Get assigned subject mappings with individual seat metrics
    const mappings = db.prepare(`
      SELECT 
        m.id as mapping_id,
        m.academic_year,
        m.semester,
        m.capacity,
        m.status as mapping_status,
        s.id as subject_id,
        s.code as subject_code,
        s.name as subject_name,
        s.department,
        (
          SELECT COUNT(*) 
          FROM selections sel 
          WHERE sel.mapping_id = m.id AND sel.status = 'CONFIRMED'
        ) as allocated_seats
      FROM faculty_subject_mappings m
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.faculty_id = ?
      ORDER BY m.academic_year ASC, m.semester ASC, s.code ASC
    `).all(faculty.id);

    const enrichedMappings = mappings.map(m => ({
      ...m,
      available_seats: Math.max(0, m.capacity - m.allocated_seats)
    }));

    const totalCapacity = enrichedMappings.reduce((sum, m) => sum + m.capacity, 0);
    const totalAllocated = enrichedMappings.reduce((sum, m) => sum + m.allocated_seats, 0);

    res.json({
      success: true,
      faculty: {
        ...faculty,
        total_capacity: totalCapacity,
        total_allocated: totalAllocated,
        remaining_capacity: Math.max(0, totalCapacity - totalAllocated),
        assigned_subjects: enrichedMappings
      }
    });
  } catch (error) {
    console.error('Error fetching faculty details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve faculty details: ' + error.message });
  }
});

// POST /api/faculty - Add new faculty member
router.post('/', (req, res) => {
  try {
    const {
      name,
      faculty_code,
      designation,
      qualification,
      specialization,
      email,
      phone,
      profile_image,
      description,
      status
    } = req.body;

    // Strict validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Faculty Name is required.' });
    }
    if (!faculty_code || !faculty_code.trim()) {
      return res.status(400).json({ success: false, message: 'Faculty Code is required.' });
    }
    if (!designation || !designation.trim()) {
      return res.status(400).json({ success: false, message: 'Designation is required.' });
    }
    if (!qualification || !qualification.trim()) {
      return res.status(400).json({ success: false, message: 'Qualification is required.' });
    }
    if (!specialization || !specialization.trim()) {
      return res.status(400).json({ success: false, message: 'Specialization is required.' });
    }

    const cleanCode = faculty_code.trim().toUpperCase();

    // Check code uniqueness
    const existing = db.prepare('SELECT id FROM faculty WHERE UPPER(faculty_code) = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: `Faculty Code "${cleanCode}" is already in use by another faculty member.` });
    }

    const now = new Date().toISOString();
    const facultyStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const insertStmt = db.prepare(`
      INSERT INTO faculty (
        faculty_code, name, designation, qualification, specialization,
        email, phone, profile_image, description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      cleanCode,
      name.trim(),
      designation.trim(),
      qualification.trim(),
      specialization.trim(),
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      profile_image ? profile_image.trim() : null,
      description ? description.trim() : null,
      facultyStatus,
      now,
      now
    );

    const newFacultyId = result.lastInsertRowid;

    logAudit(
      req.user.id,
      'CREATE_FACULTY',
      'FACULTY',
      newFacultyId,
      `Added faculty member: ${name.trim()} (${cleanCode}, ${designation.trim()})`,
      req.ip
    );

    const created = db.prepare('SELECT * FROM faculty WHERE id = ?').get(newFacultyId);
    res.status(201).json({
      success: true,
      message: 'Faculty member created successfully.',
      faculty: created
    });
  } catch (error) {
    console.error('Error adding faculty:', error);
    res.status(500).json({ success: false, message: 'Failed to create faculty: ' + error.message });
  }
});

// PUT /api/faculty/:id - Edit existing faculty details
router.put('/:id', (req, res) => {
  try {
    const facultyId = req.params.id;
    const existing = db.prepare('SELECT * FROM faculty WHERE id = ?').get(facultyId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    const {
      name,
      faculty_code,
      designation,
      qualification,
      specialization,
      email,
      phone,
      profile_image,
      description,
      status
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Faculty Name is required.' });
    }
    if (!faculty_code || !faculty_code.trim()) {
      return res.status(400).json({ success: false, message: 'Faculty Code is required.' });
    }
    if (!designation || !designation.trim()) {
      return res.status(400).json({ success: false, message: 'Designation is required.' });
    }
    if (!qualification || !qualification.trim()) {
      return res.status(400).json({ success: false, message: 'Qualification is required.' });
    }
    if (!specialization || !specialization.trim()) {
      return res.status(400).json({ success: false, message: 'Specialization is required.' });
    }

    const cleanCode = faculty_code.trim().toUpperCase();

    // Check code uniqueness for other faculty
    const duplicate = db.prepare('SELECT id FROM faculty WHERE UPPER(faculty_code) = ? AND id != ?').get(cleanCode, facultyId);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Faculty Code "${cleanCode}" is already in use by another faculty member.` });
    }

    const now = new Date().toISOString();
    const facultyStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const updateStmt = db.prepare(`
      UPDATE faculty SET
        faculty_code = ?,
        name = ?,
        designation = ?,
        qualification = ?,
        specialization = ?,
        email = ?,
        phone = ?,
        profile_image = ?,
        description = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `);

    updateStmt.run(
      cleanCode,
      name.trim(),
      designation.trim(),
      qualification.trim(),
      specialization.trim(),
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      profile_image ? profile_image.trim() : null,
      description ? description.trim() : null,
      facultyStatus,
      now,
      facultyId
    );

    logAudit(
      req.user.id,
      'UPDATE_FACULTY',
      'FACULTY',
      facultyId,
      `Updated faculty: ${name.trim()} (${cleanCode})`,
      req.ip
    );

    const updated = db.prepare('SELECT * FROM faculty WHERE id = ?').get(facultyId);
    res.json({
      success: true,
      message: 'Faculty details updated successfully.',
      faculty: updated
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({ success: false, message: 'Failed to update faculty: ' + error.message });
  }
});

// PATCH /api/faculty/:id/status - Activate or deactivate faculty
router.patch('/:id/status', (req, res) => {
  try {
    const facultyId = req.params.id;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either ACTIVE or INACTIVE.' });
    }

    const existing = db.prepare('SELECT * FROM faculty WHERE id = ?').get(facultyId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE faculty SET status = ?, updated_at = ? WHERE id = ?').run(status, now, facultyId);

    logAudit(
      req.user.id,
      'STATUS_FACULTY',
      'FACULTY',
      facultyId,
      `Changed faculty status to ${status} for ${existing.name} (${existing.faculty_code})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Faculty status updated to ${status}.`,
      status
    });
  } catch (error) {
    console.error('Error updating faculty status:', error);
    res.status(500).json({ success: false, message: 'Failed to change faculty status: ' + error.message });
  }
});

// DELETE /api/faculty/:id - Delete faculty ONLY when no active selections or dependent mappings exist
router.delete('/:id', (req, res) => {
  try {
    const facultyId = req.params.id;
    const faculty = db.prepare('SELECT * FROM faculty WHERE id = ?').get(facultyId);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found.' });
    }

    // 1. Check for dependent mappings
    const mappingCount = db.prepare('SELECT COUNT(*) as count FROM faculty_subject_mappings WHERE faculty_id = ?').get(facultyId).count;
    if (mappingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete faculty member "${faculty.name}": There are ${mappingCount} active subject mapping(s) assigned to them. Remove or reassign these mappings first.`
      });
    }

    // 2. Check for active or historical student selections
    const selectionCount = db.prepare('SELECT COUNT(*) as count FROM selections WHERE faculty_id = ?').get(facultyId).count;
    if (selectionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete faculty member "${faculty.name}": There are ${selectionCount} student selection record(s) linked to this faculty member.`
      });
    }

    db.prepare('DELETE FROM faculty WHERE id = ?').run(facultyId);

    logAudit(
      req.user.id,
      'DELETE_FACULTY',
      'FACULTY',
      facultyId,
      `Deleted faculty member: ${faculty.name} (${faculty.faculty_code})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Faculty member "${faculty.name}" has been deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({ success: false, message: 'Failed to delete faculty: ' + error.message });
  }
});

module.exports = router;
