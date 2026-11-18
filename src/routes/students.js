const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, withTransaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(authenticateToken);

// GET /api/students - Admin view of student dataset with filters
router.get('/', requireAdmin, (req, res) => {
  try {
    const { search, academic_year, semester, section, status } = req.query;

    let sql = `
      SELECT 
        s.*,
        u.username,
        (
          SELECT COUNT(*) 
          FROM selections sel 
          WHERE sel.student_id = s.id AND sel.status = 'CONFIRMED'
        ) as confirmed_selections_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim()) {
      sql += ` AND (s.reg_no LIKE ? OR s.name LIKE ? OR s.email LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (academic_year && academic_year !== 'ALL') {
      sql += ` AND s.academic_year = ?`;
      params.push(parseInt(academic_year, 10));
    }

    if (semester && semester !== 'ALL') {
      sql += ` AND s.semester = ?`;
      params.push(parseInt(semester, 10));
    }

    if (section && section !== 'ALL') {
      sql += ` AND s.section = ?`;
      params.push(section.trim().toUpperCase());
    }

    if (status && status !== 'ALL') {
      sql += ` AND s.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY s.academic_year ASC, s.semester ASC, s.reg_no ASC`;

    const students = db.prepare(sql).all(...params);

    res.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve students: ' + error.message });
  }
});

// GET /api/students/:id - Single student details + selections
router.get('/:id', requireAdmin, (req, res) => {
  try {
    const student = db.prepare(`
      SELECT s.*, u.username
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const selections = db.prepare(`
      SELECT 
        sel.id as selection_id,
        sel.status as selection_status,
        sel.reserved_at,
        sel.cancelled_at,
        sel.cancellation_reason,
        sub.code as subject_code,
        sub.name as subject_name,
        f.name as faculty_name,
        f.faculty_code,
        f.designation
      FROM selections sel
      JOIN subjects sub ON sel.subject_id = sub.id
      JOIN faculty f ON sel.faculty_id = f.id
      WHERE sel.student_id = ?
      ORDER BY sel.reserved_at DESC
    `).all(student.id);

    res.json({
      success: true,
      student: {
        ...student,
        selections
      }
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve student: ' + error.message });
  }
});

// POST /api/students - Add single student
router.post('/', requireAdmin, (req, res) => {
  try {
    const { reg_no, name, academic_year, semester, section, email, phone, password, status } = req.body;

    if (!reg_no || !reg_no.trim()) {
      return res.status(400).json({ success: false, message: 'Registration Number is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Student Name is required.' });
    }
    if (!academic_year || academic_year < 1 || academic_year > 4) {
      return res.status(400).json({ success: false, message: 'Academic Year must be between 1 and 4.' });
    }
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }
    if (!section || !section.trim()) {
      return res.status(400).json({ success: false, message: 'Section is required.' });
    }

    const cleanRegNo = reg_no.trim().toUpperCase();

    // Check duplicate in students or users
    const existingStudent = db.prepare('SELECT id FROM students WHERE UPPER(reg_no) = ?').get(cleanRegNo);
    if (existingStudent) {
      return res.status(400).json({ success: false, message: `Student with Registration Number "${cleanRegNo}" already exists.` });
    }

    const defaultPassword = password && password.trim() ? password.trim() : cleanRegNo;
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);
    const now = new Date().toISOString();
    const studentStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const result = withTransaction(() => {
      // Create user account with STUDENT role
      const insertUser = db.prepare(`
        INSERT INTO users (username, password_hash, role, created_at)
        VALUES (?, ?, 'STUDENT', ?)
      `);
      const userRes = insertUser.run(cleanRegNo, passwordHash, now);
      const userId = userRes.lastInsertRowid;

      // Create student profile
      const insertStudent = db.prepare(`
        INSERT INTO students (
          user_id, reg_no, name, academic_year, semester, section, email, phone, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const studentRes = insertStudent.run(
        userId,
        cleanRegNo,
        name.trim(),
        parseInt(academic_year, 10),
        parseInt(semester, 10),
        section.trim().toUpperCase(),
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        studentStatus,
        now
      );

      return { studentId: studentRes.lastInsertRowid, userId };
    });

    logAudit(
      req.user.id,
      'CREATE_STUDENT',
      'STUDENT',
      result.studentId,
      `Created student: ${name.trim()} (${cleanRegNo}), Year ${academic_year}, Sem ${semester}, Sec ${section.trim()}`,
      req.ip
    );

    const created = db.prepare('SELECT * FROM students WHERE id = ?').get(result.studentId);
    res.status(201).json({
      success: true,
      message: 'Student added successfully.',
      student: created
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ success: false, message: 'Failed to create student: ' + error.message });
  }
});

// POST /api/students/bulk - Bulk add students (array of student objects)
router.post('/bulk', requireAdmin, (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'An array of student records is required.' });
    }

    const inserted = [];
    const errors = [];

    withTransaction(() => {
      for (let i = 0; i < students.length; i++) {
        const item = students[i];
        if (!item.reg_no || !item.name || !item.academic_year || !item.semester || !item.section) {
          errors.push(`Row ${i + 1}: Missing mandatory fields.`);
          continue;
        }

        const cleanRegNo = item.reg_no.trim().toUpperCase();
        const existing = db.prepare('SELECT id FROM students WHERE UPPER(reg_no) = ?').get(cleanRegNo);
        if (existing) {
          errors.push(`Row ${i + 1}: Registration Number "${cleanRegNo}" already exists.`);
          continue;
        }

        const defaultPassword = item.password && item.password.trim() ? item.password.trim() : cleanRegNo;
        const passwordHash = bcrypt.hashSync(defaultPassword, 10);
        const now = new Date().toISOString();

        const userRes = db.prepare(`
          INSERT INTO users (username, password_hash, role, created_at)
          VALUES (?, ?, 'STUDENT', ?)
        `).run(cleanRegNo, passwordHash, now);

        const studentRes = db.prepare(`
          INSERT INTO students (
            user_id, reg_no, name, academic_year, semester, section, email, phone, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        `).run(
          userRes.lastInsertRowid,
          cleanRegNo,
          item.name.trim(),
          parseInt(item.academic_year, 10),
          parseInt(item.semester, 10),
          item.section.trim().toUpperCase(),
          item.email ? item.email.trim() : null,
          item.phone ? item.phone.trim() : null,
          now
        );

        inserted.push({ id: studentRes.lastInsertRowid, reg_no: cleanRegNo, name: item.name });
      }
    });

    logAudit(
      req.user.id,
      'BULK_CREATE_STUDENTS',
      'STUDENT',
      null,
      `Imported ${inserted.length} students in bulk.`,
      req.ip
    );

    res.json({
      success: true,
      message: `Successfully imported ${inserted.length} students.${errors.length > 0 ? ` Encountered ${errors.length} skipped rows.` : ''}`,
      insertedCount: inserted.length,
      errors
    });
  } catch (error) {
    console.error('Error during bulk student import:', error);
    res.status(500).json({ success: false, message: 'Bulk import failed: ' + error.message });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const studentId = req.params.id;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const { reg_no, name, academic_year, semester, section, email, phone, password, status } = req.body;

    if (!reg_no || !reg_no.trim()) {
      return res.status(400).json({ success: false, message: 'Registration Number is required.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Student Name is required.' });
    }
    if (!academic_year || academic_year < 1 || academic_year > 4) {
      return res.status(400).json({ success: false, message: 'Academic Year must be between 1 and 4.' });
    }
    if (!semester || semester < 1 || semester > 8) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 8.' });
    }
    if (!section || !section.trim()) {
      return res.status(400).json({ success: false, message: 'Section is required.' });
    }

    const cleanRegNo = reg_no.trim().toUpperCase();

    // Check duplicate reg_no
    const dup = db.prepare('SELECT id FROM students WHERE UPPER(reg_no) = ? AND id != ?').get(cleanRegNo, studentId);
    if (dup) {
      return res.status(400).json({ success: false, message: `Registration number "${cleanRegNo}" belongs to another student.` });
    }

    const studentStatus = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    withTransaction(() => {
      // Update student table
      db.prepare(`
        UPDATE students SET
          reg_no = ?,
          name = ?,
          academic_year = ?,
          semester = ?,
          section = ?,
          email = ?,
          phone = ?,
          status = ?
        WHERE id = ?
      `).run(
        cleanRegNo,
        name.trim(),
        parseInt(academic_year, 10),
        parseInt(semester, 10),
        section.trim().toUpperCase(),
        email ? email.trim() : null,
        phone ? phone.trim() : null,
        studentStatus,
        studentId
      );

      // Update user table username if changed, or reset password if provided
      if (password && password.trim()) {
        const hash = bcrypt.hashSync(password.trim(), 10);
        db.prepare('UPDATE users SET username = ?, password_hash = ? WHERE id = ?').run(cleanRegNo, hash, student.user_id);
      } else {
        db.prepare('UPDATE users SET username = ? WHERE id = ?').run(cleanRegNo, student.user_id);
      }
    });

    logAudit(
      req.user.id,
      'UPDATE_STUDENT',
      'STUDENT',
      studentId,
      `Updated student: ${name.trim()} (${cleanRegNo})`,
      req.ip
    );

    res.json({
      success: true,
      message: 'Student record updated successfully.',
      student: db.prepare('SELECT * FROM students WHERE id = ?').get(studentId)
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Failed to update student: ' + error.message });
  }
});

// DELETE /api/students/:id - Delete student (blocked if active selections exist)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const studentId = req.params.id;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const confirmedCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM selections 
      WHERE student_id = ? AND status = 'CONFIRMED'
    `).get(studentId).count;

    if (confirmedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete student "${student.name} (${student.reg_no})": There are ${confirmedCount} confirmed course selection(s). Administrator must cancel the selections first.`
      });
    }

    withTransaction(() => {
      db.prepare('DELETE FROM selections WHERE student_id = ?').run(studentId);
      db.prepare('DELETE FROM students WHERE id = ?').run(studentId);
      db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
    });

    logAudit(
      req.user.id,
      'DELETE_STUDENT',
      'STUDENT',
      studentId,
      `Deleted student: ${student.name} (${student.reg_no})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Student "${student.name} (${student.reg_no})" deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Failed to delete student: ' + error.message });
  }
});

module.exports = router;
