const express = require('express');
const router = express.Router();
const { db, withTransaction } = require('../config/database');
const { authenticateToken, requireAdmin, requireStudent } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');

router.use(authenticateToken);

// GET /api/selections/my - Current student's selections
router.get('/my', requireStudent, (req, res) => {
  try {
    const studentId = req.student.id;
    const selections = db.prepare(`
      SELECT 
        sel.id,
        sel.status,
        sel.reserved_at,
        sel.cancelled_at,
        sel.cancellation_reason,
        sub.id as subject_id,
        sub.code as subject_code,
        sub.name as subject_name,
        sub.credits as subject_credits,
        sub.department as subject_department,
        f.id as faculty_id,
        f.name as faculty_name,
        f.faculty_code,
        f.designation as faculty_designation,
        f.qualification as faculty_qualification,
        f.specialization as faculty_specialization,
        f.profile_image as faculty_profile_image,
        m.id as mapping_id,
        m.capacity
      FROM selections sel
      JOIN subjects sub ON sel.subject_id = sub.id
      JOIN faculty f ON sel.faculty_id = f.id
      JOIN faculty_subject_mappings m ON sel.mapping_id = m.id
      WHERE sel.student_id = ?
      ORDER BY sel.reserved_at DESC
    `).all(studentId);

    res.json({ success: true, selections });
  } catch (error) {
    console.error('Error fetching student selections:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve selections: ' + error.message });
  }
});

// POST /api/selections/reserve - Student reserves a seat (Server-Side Atomic FCFS)
router.post('/reserve', requireStudent, (req, res) => {
  try {
    const { mapping_id } = req.body;
    const student = req.student;

    if (!mapping_id) {
      return res.status(400).json({ success: false, message: 'Mapping ID is required for reservation.' });
    }

    // Execute atomic FCFS reservation inside database transaction
    const reservationResult = withTransaction(() => {
      // 1. Fetch mapping details and lock record
      const mapping = db.prepare(`
        SELECT 
          m.id, m.faculty_id, m.subject_id, m.academic_year, m.semester, m.capacity, m.status as mapping_status,
          f.name as faculty_name, f.faculty_code, f.status as faculty_status,
          s.name as subject_name, s.code as subject_code, s.status as subject_status
        FROM faculty_subject_mappings m
        JOIN faculty f ON m.faculty_id = f.id
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.id = ?
      `).get(mapping_id);

      if (!mapping) {
        throw new Error('Selected faculty-subject mapping does not exist.');
      }

      if (mapping.mapping_status !== 'ACTIVE') {
        throw new Error('This faculty-subject mapping is currently inactive.');
      }

      if (mapping.faculty_status !== 'ACTIVE') {
        throw new Error(`Faculty member ${mapping.faculty_name} is currently inactive.`);
      }

      if (mapping.subject_status !== 'ACTIVE') {
        throw new Error(`Subject ${mapping.subject_code} is currently inactive.`);
      }

      // 2. Strict eligibility check: Academic Year and Semester must match student
      if (mapping.academic_year !== student.academic_year || mapping.semester !== student.semester) {
        throw new Error(`Eligibility mismatch: You belong to Year ${student.academic_year}, Sem ${student.semester}, but this subject is for Year ${mapping.academic_year}, Sem ${mapping.semester}.`);
      }

      // 3. Selection Round Validation
      const activeRound = db.prepare(`
        SELECT id, name, start_time, end_time, status 
        FROM selection_rounds
        WHERE academic_year = ? AND semester = ? AND status = 'ACTIVE'
        ORDER BY created_at DESC
        LIMIT 1
      `).get(student.academic_year, student.semester);

      let roundId = null;
      if (activeRound) {
        const nowMs = Date.now();
        const startMs = new Date(activeRound.start_time).getTime();
        const endMs = new Date(activeRound.end_time).getTime();

        if (nowMs < startMs) {
          throw new Error(`Selection round "${activeRound.name}" has not started yet. Opens at ${new Date(activeRound.start_time).toLocaleString()}.`);
        }
        if (nowMs > endMs) {
          throw new Error(`Selection round "${activeRound.name}" has closed at ${new Date(activeRound.end_time).toLocaleString()}.`);
        }
        roundId = activeRound.id;
      }

      // 4. One selection per subject check: Students can select only ONE faculty member per subject
      const existingSubjectSelection = db.prepare(`
        SELECT s.id, f.name as faculty_name 
        FROM selections s
        JOIN faculty f ON s.faculty_id = f.id
        WHERE s.student_id = ? AND s.subject_id = ? AND s.status = 'CONFIRMED'
      `).get(student.id, mapping.subject_id);

      if (existingSubjectSelection) {
        throw new Error(`You have already selected ${existingSubjectSelection.faculty_name} for this subject (${mapping.subject_code}). Only one faculty member can be selected per subject.`);
      }

      // 5. Strict FCFS Capacity Check: Count active confirmed selections for this mapping
      const currentAllocations = db.prepare(`
        SELECT COUNT(*) as count 
        FROM selections 
        WHERE mapping_id = ? AND status = 'CONFIRMED'
      `).get(mapping.id).count;

      if (currentAllocations >= mapping.capacity) {
        throw new Error(`Seats are full! All ${mapping.capacity} seats for ${mapping.faculty_name} in ${mapping.subject_code} have been taken. Please choose another faculty member.`);
      }

      // 6. Server-side reservation timestamp
      const serverTimestamp = new Date().toISOString();

      // 7. Insert Confirmed Selection
      const insert = db.prepare(`
        INSERT INTO selections (
          student_id, subject_id, faculty_id, mapping_id, selection_round_id, status, reserved_at
        ) VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?)
      `);

      const resInsert = insert.run(
        student.id,
        mapping.subject_id,
        mapping.faculty_id,
        mapping.id,
        roundId,
        serverTimestamp
      );

      const selectionId = resInsert.lastInsertRowid;
      const newRemainingSeats = mapping.capacity - (currentAllocations + 1);

      return {
        selectionId,
        serverTimestamp,
        subjectName: mapping.subject_name,
        subjectCode: mapping.subject_code,
        facultyName: mapping.faculty_name,
        remainingSeats: newRemainingSeats,
        totalCapacity: mapping.capacity,
        roundName: activeRound ? activeRound.name : null
      };
    });

    logAudit(
      req.user.id,
      'STUDENT_RESERVATION_CONFIRMED',
      'SELECTION',
      reservationResult.selectionId,
      `Student ${student.name} (${student.reg_no}) reserved seat for ${reservationResult.facultyName} in ${reservationResult.subjectCode} (${reservationResult.subjectName}) at ${reservationResult.serverTimestamp}`,
      req.ip
    );

    res.status(201).json({
      success: true,
      message: `Seat confirmed successfully for ${reservationResult.facultyName} (${reservationResult.subjectCode})!`,
      selection: reservationResult
    });
  } catch (error) {
    console.error('Reservation failed:', error.message);
    res.status(409).json({
      success: false,
      message: error.message || 'Seat allocation could not be completed.'
    });
  }
});

// Admin-only endpoints below
router.use(requireAdmin);

// GET /api/selections/live - Live selections feed for admin
router.get('/live', (req, res) => {
  try {
    const { subject_id, faculty_id, status, search } = req.query;

    let sql = `
      SELECT 
        sel.id,
        sel.status,
        sel.reserved_at,
        sel.cancelled_at,
        sel.cancellation_reason,
        stu.id as student_id,
        stu.reg_no as student_reg_no,
        stu.name as student_name,
        stu.academic_year as student_academic_year,
        stu.semester as student_semester,
        stu.section as student_section,
        sub.id as subject_id,
        sub.code as subject_code,
        sub.name as subject_name,
        f.id as faculty_id,
        f.name as faculty_name,
        f.faculty_code,
        f.designation as faculty_designation,
        m.id as mapping_id,
        m.capacity as mapping_capacity,
        admin_u.username as cancelled_by_user
      FROM selections sel
      JOIN students stu ON sel.student_id = stu.id
      JOIN subjects sub ON sel.subject_id = sub.id
      JOIN faculty f ON sel.faculty_id = f.id
      JOIN faculty_subject_mappings m ON sel.mapping_id = m.id
      LEFT JOIN users admin_u ON sel.cancelled_by = admin_u.id
      WHERE 1=1
    `;

    const params = [];

    if (subject_id && subject_id !== 'ALL') {
      sql += ` AND sel.subject_id = ?`;
      params.push(parseInt(subject_id, 10));
    }

    if (faculty_id && faculty_id !== 'ALL') {
      sql += ` AND sel.faculty_id = ?`;
      params.push(parseInt(faculty_id, 10));
    }

    if (status && status !== 'ALL') {
      sql += ` AND sel.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      sql += ` AND (stu.reg_no LIKE ? OR stu.name LIKE ? OR f.name LIKE ? OR sub.name LIKE ? OR sub.code LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY sel.reserved_at DESC`;

    const selections = db.prepare(sql).all(...params);

    res.json({ success: true, selections });
  } catch (error) {
    console.error('Error fetching live selections:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve selections: ' + error.message });
  }
});

// POST /api/selections/:id/cancel - Admin cancels confirmed selection (Reason is MANDATORY)
router.post('/:id/cancel', (req, res) => {
  try {
    const selectionId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory cancellation reason must be provided by the administrator.'
      });
    }

    const cancelResult = withTransaction(() => {
      const selection = db.prepare(`
        SELECT 
          sel.id, sel.status, sel.student_id, sel.subject_id, sel.faculty_id, sel.mapping_id,
          stu.reg_no, stu.name as student_name,
          f.name as faculty_name,
          sub.code as subject_code, sub.name as subject_name
        FROM selections sel
        JOIN students stu ON sel.student_id = stu.id
        JOIN faculty f ON sel.faculty_id = f.id
        JOIN subjects sub ON sel.subject_id = sub.id
        WHERE sel.id = ?
      `).get(selectionId);

      if (!selection) {
        throw new Error('Selection record not found.');
      }

      if (selection.status === 'CANCELLED') {
        throw new Error('This selection has already been cancelled.');
      }

      const now = new Date().toISOString();

      db.prepare(`
        UPDATE selections SET
          status = 'CANCELLED',
          cancelled_at = ?,
          cancelled_by = ?,
          cancellation_reason = ?
        WHERE id = ?
      `).run(now, req.user.id, reason.trim(), selectionId);

      return {
        ...selection,
        cancelled_at: now,
        cancellation_reason: reason.trim()
      };
    });

    logAudit(
      req.user.id,
      'ADMIN_CANCEL_SELECTION',
      'SELECTION',
      selectionId,
      `Administrator cancelled selection #${selectionId} for Student ${cancelResult.student_name} (${cancelResult.reg_no}), Faculty ${cancelResult.facultyName}, Subject ${cancelResult.subject_code}. Reason: "${reason.trim()}"`,
      req.ip
    );

    res.json({
      success: true,
      message: `Selection cancelled successfully. Seat has been restored to available capacity.`,
      selection: cancelResult
    });
  } catch (error) {
    console.error('Error cancelling selection:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
