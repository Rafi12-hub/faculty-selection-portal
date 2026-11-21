const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { getFacultyAvailability } = require('../utils/facultyAvailability');

router.use(authenticateToken);

// GET /api/subjects - List subjects (accessible by admin and student)
router.get('/', (req, res) => {
  try {
    const { search, academic_year, semester, status } = req.query;

    let sql = `
      SELECT 
        s.*,
        COUNT(DISTINCT m.id) as assigned_faculty_count,
        COALESCE(SUM(CASE WHEN m.status = 'ACTIVE' THEN m.capacity ELSE 0 END), 0) as total_capacity,
        COALESCE(
          (SELECT COUNT(*) 
           FROM selections sel 
           WHERE sel.subject_id = s.id AND sel.status = 'CONFIRMED'), 0
        ) as total_allocated
      FROM subjects s
      LEFT JOIN faculty_subject_mappings m ON s.id = m.subject_id
      WHERE 1=1
    `;

    const params = [];

    // If user is STUDENT, restrict strictly to their eligible academic_year and semester
    if (req.user.role === 'STUDENT') {
      sql += ` AND s.academic_year = ? AND s.semester = ? AND s.status = 'ACTIVE'`;
      params.push(req.student.academic_year, req.student.semester);
    } else {
      // Admin filters
      if (academic_year && academic_year !== 'ALL') {
        sql += ` AND s.academic_year = ?`;
        params.push(parseInt(academic_year, 10));
      }
      if (semester && semester !== 'ALL') {
        sql += ` AND s.semester = ?`;
        params.push(parseInt(semester, 10));
      }
      if (status && status !== 'ALL') {
        sql += ` AND s.status = ?`;
        params.push(status);
      }
    }

    if (search && search.trim()) {
      sql += ` AND (s.code LIKE ? OR s.name LIKE ? OR s.department LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` GROUP BY s.id ORDER BY s.academic_year ASC, s.semester ASC, s.code ASC`;

    const subjects = db.prepare(sql).all(...params);

    const enriched = subjects.map(s => {
      if (req.user.role === 'STUDENT') {
        const {
          total_capacity,
          total_allocated,
          ...studentSubject
        } = s;
        return studentSubject;
      }

      return {
        ...s,
        remaining_seats: Math.max(0, s.total_capacity - s.total_allocated)
      };
    });

    res.json({ success: true, subjects: enriched });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve subjects: ' + error.message });
  }
});

// GET /api/subjects/:id - Get single subject details
router.get('/:id', (req, res) => {
  try {
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    // Student role restriction check
    if (req.user.role === 'STUDENT') {
      if (subject.academic_year !== req.student.academic_year || subject.semester !== req.student.semester) {
        return res.status(403).json({ success: false, message: 'Access denied. This subject does not belong to your academic year or semester.' });
      }
    }

    // Get assigned faculty mappings
    const mappings = db.prepare(`
      SELECT 
        m.id as mapping_id,
        m.capacity,
        m.status as mapping_status,
        f.id as faculty_id,
        f.faculty_code,
        f.name as faculty_name,
        f.designation,
        f.qualification,
        f.specialization,
        f.profile_image,
        f.description,
        f.status as faculty_status,
        (
          SELECT COUNT(*) 
          FROM selections sel 
          WHERE sel.mapping_id = m.id AND sel.status = 'CONFIRMED'
        ) as allocated_seats
      FROM faculty_subject_mappings m
      JOIN faculty f ON m.faculty_id = f.id
      WHERE m.subject_id = ? AND m.academic_year = ? AND m.semester = ?
      ${req.user.role === 'STUDENT' ? "AND m.status = 'ACTIVE' AND f.status = 'ACTIVE'" : ""}
      ORDER BY f.name ASC
    `).all(subject.id, subject.academic_year, subject.semester);

    const enrichedMappings = mappings.map(m => {
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

    res.json({
      success: true,
      subject: {
        ...subject,
        faculty_mappings: enrichedMappings
      }
    });
  } catch (error) {
    console.error('Error fetching subject details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve subject details: ' + error.message });
  }
});

// Admin-only management endpoints below
router.post('/', requireAdmin, (req, res) => {
  try {
    const { code, name, academic_year, semester, department, credits, status } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Subject Code is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject Name is required.' });
    }
    if (!academic_year || academic_year < 1 || academic_year > 4) {
      return res.status(400).json({ success: false, message: 'Academic Year must be between 1 and 4.' });
    }
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM subjects WHERE UPPER(code) = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: `Subject Code "${cleanCode}" already exists.` });
    }

    const now = new Date().toISOString();
    const subStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const insert = db.prepare(`
      INSERT INTO subjects (code, name, academic_year, semester, department, credits, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      cleanCode,
      name.trim(),
      parseInt(academic_year, 10),
      parseInt(semester, 10),
      department ? department.trim() : 'Computer Science & Engineering',
      credits ? parseInt(credits, 10) : 3,
      subStatus,
      now
    );

    const newId = result.lastInsertRowid;

    logAudit(
      req.user.id,
      'CREATE_SUBJECT',
      'SUBJECT',
      newId,
      `Created subject: ${cleanCode} - ${name.trim()} (Year ${academic_year}, Sem ${semester})`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      subject: db.prepare('SELECT * FROM subjects WHERE id = ?').get(newId)
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ success: false, message: 'Failed to create subject: ' + error.message });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  try {
    const subjectId = req.params.id;
    const existing = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const { code, name, academic_year, semester, department, credits, status } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Subject Code is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject Name is required.' });
    }
    if (!academic_year || academic_year < 1 || academic_year > 4) {
      return res.status(400).json({ success: false, message: 'Academic Year must be between 1 and 4.' });
    }
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const duplicate = db.prepare('SELECT id FROM subjects WHERE UPPER(code) = ? AND id != ?').get(cleanCode, subjectId);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Subject Code "${cleanCode}" is already in use by another subject.` });
    }

    const subStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const update = db.prepare(`
      UPDATE subjects SET
        code = ?,
        name = ?,
        academic_year = ?,
        semester = ?,
        department = ?,
        credits = ?,
        status = ?
      WHERE id = ?
    `);

    update.run(
      cleanCode,
      name.trim(),
      parseInt(academic_year, 10),
      parseInt(semester, 10),
      department ? department.trim() : 'Computer Science & Engineering',
      credits ? parseInt(credits, 10) : 3,
      subStatus,
      subjectId
    );

    logAudit(
      req.user.id,
      'UPDATE_SUBJECT',
      'SUBJECT',
      subjectId,
      `Updated subject ${cleanCode} - ${name.trim()}`,
      req.ip
    );

    res.json({
      success: true,
      message: 'Subject updated successfully.',
      subject: db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId)
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ success: false, message: 'Failed to update subject: ' + error.message });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const subjectId = req.params.id;
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    const mappingCount = db.prepare('SELECT COUNT(*) as count FROM faculty_subject_mappings WHERE subject_id = ?').get(subjectId).count;
    if (mappingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject "${subject.code}": It has ${mappingCount} faculty mapping(s) linked to it. Remove mappings first.`
      });
    }

    const selectionCount = db.prepare('SELECT COUNT(*) as count FROM selections WHERE subject_id = ?').get(subjectId).count;
    if (selectionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject "${subject.code}": It has ${selectionCount} student selection record(s) linked to it.`
      });
    }

    db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);

    logAudit(
      req.user.id,
      'DELETE_SUBJECT',
      'SUBJECT',
      subjectId,
      `Deleted subject: ${subject.code} - ${subject.name}`,
      req.ip
    );

    res.json({
      success: true,
      message: `Subject "${subject.code} - ${subject.name}" deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subject: ' + error.message });
  }
});

module.exports = router;
