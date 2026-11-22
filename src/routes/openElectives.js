const express = require('express');
const router = express.Router();
const { db, withTransaction } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logAudit } = require('../middleware/audit');
const { getFacultyAvailability } = require('../utils/facultyAvailability');

router.use(authenticateToken);

// =========================================================================
// 1. GET /api/open-electives - List electives with subjects & faculty
// =========================================================================
router.get('/', (req, res) => {
  try {
    const isStudent = req.user.role === 'STUDENT';

    // 1. Fetch electives (students only see active)
    let electivesQuery = 'SELECT * FROM open_electives';
    if (isStudent) {
      electivesQuery += ' WHERE is_active = 1';
    }
    electivesQuery += ' ORDER BY id ASC';
    const electives = db.prepare(electivesQuery).all();

    // 2. For each elective, fetch subjects and assigned faculty
    const enrichedElectives = electives.map(elective => {
      let subjectsQuery = 'SELECT * FROM open_elective_subjects WHERE elective_id = ?';
      if (isStudent) {
        subjectsQuery += ' AND is_active = 1';
      }
      subjectsQuery += ' ORDER BY subject_name ASC';
      const subjects = db.prepare(subjectsQuery).all(elective.id);

      const enrichedSubjects = subjects.map(subject => {
        let assignQuery = `
          SELECT 
            fa.id as assignment_id,
            fa.subject_id,
            fa.faculty_id,
            fa.max_capacity,
            fa.is_active,
            f.faculty_code,
            f.name as faculty_name,
            f.designation,
            f.qualification,
            f.specialization,
            f.profile_image,
            (
              SELECT COUNT(*) 
              FROM open_elective_registrations oer 
              WHERE oer.faculty_assignment_id = fa.id AND oer.status = 'CONFIRMED'
            ) as allocated_count
          FROM open_elective_faculty_assignments fa
          JOIN faculty f ON fa.faculty_id = f.id
          WHERE fa.subject_id = ?
        `;
        if (isStudent) {
          assignQuery += ' AND fa.is_active = 1 AND f.status = "ACTIVE"';
        }
        assignQuery += ' ORDER BY f.name ASC';

        const rawAssignments = db.prepare(assignQuery).all(subject.id);

        const enrichedAssignments = rawAssignments.map(fa => {
          const availability = getFacultyAvailability(fa.allocated_count, fa.max_capacity);

          if (isStudent) {
            // Never expose numerical seats or capacity to students
            return {
              assignment_id: fa.assignment_id,
              subject_id: fa.subject_id,
              faculty_id: fa.faculty_id,
              faculty_code: fa.faculty_code,
              faculty_name: fa.faculty_name,
              designation: fa.designation,
              qualification: fa.qualification,
              specialization: fa.specialization,
              profile_image: fa.profile_image,
              is_active: fa.is_active,
              ...availability
            };
          }

          // Admin sees exact counts & metrics
          return {
            ...fa,
            ...availability,
            available_seats: Math.max(0, fa.max_capacity - fa.allocated_count),
            occupancy_rate: fa.max_capacity > 0 ? Math.round((fa.allocated_count / fa.max_capacity) * 100) : 0
          };
        });

        const subjectTotalAllocated = enrichedAssignments.reduce((acc, curr) => acc + (curr.allocated_count || 0), 0);
        const subjectTotalCapacity = enrichedAssignments.reduce((acc, curr) => acc + (curr.max_capacity || 0), 0);

        return {
          ...subject,
          faculty_assignments: enrichedAssignments,
          total_allocated: isStudent ? undefined : subjectTotalAllocated,
          total_capacity: isStudent ? undefined : subjectTotalCapacity
        };
      });

      return {
        ...elective,
        subjects: enrichedSubjects
      };
    });

    res.json({ success: true, electives: enrichedElectives });
  } catch (error) {
    console.error('Error fetching open electives:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve open electives: ' + error.message });
  }
});

// =========================================================================
// 2. GET /api/open-electives/my - Student's current open elective registrations
// =========================================================================
router.get('/my', (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.student) {
      return res.status(403).json({ success: false, message: 'Student access required.' });
    }

    const student = req.student;

    // Fetch student's confirmed registrations
    const registrations = db.prepare(`
      SELECT 
        oer.id as registration_id,
        oer.elective_id,
        oe.code as elective_code,
        oe.name as elective_name,
        oer.subject_id,
        oes.subject_code,
        oes.subject_name,
        oes.description as subject_description,
        oer.faculty_assignment_id,
        oer.faculty_id,
        f.faculty_code,
        f.name as faculty_name,
        f.designation as faculty_designation,
        f.qualification as faculty_qualification,
        f.specialization as faculty_specialization,
        f.profile_image as faculty_profile_image,
        oer.registration_timestamp,
        oer.status
      FROM open_elective_registrations oer
      JOIN open_electives oe ON oer.elective_id = oe.id
      JOIN open_elective_subjects oes ON oer.subject_id = oes.id
      JOIN faculty f ON oer.faculty_id = f.id
      WHERE oer.student_id = ? AND oer.status = 'CONFIRMED'
      ORDER BY oe.id ASC
    `).all(student.id);

    // Calculate progression status
    const allElectives = db.prepare('SELECT id, code, name FROM open_electives WHERE is_active = 1 ORDER BY id ASC').all();
    const registeredElectiveIds = new Set(registrations.map(r => r.elective_id));

    let overallStatus = 'NOT_STARTED';
    let statusLabel = 'Not Started';

    if (registrations.length === 0) {
      overallStatus = 'NOT_STARTED';
      statusLabel = 'Not Started';
    } else if (registrations.length >= allElectives.length && allElectives.length > 0) {
      overallStatus = 'REGISTRATION_COMPLETED';
      statusLabel = 'Registration Completed';
    } else {
      // Check which elective is completed
      const hasOE1 = registrations.some(r => r.elective_code === 'OE-1' || r.elective_name.includes('I'));
      const hasOE2 = registrations.some(r => r.elective_code === 'OE-2' || r.elective_name.includes('II'));
      if (hasOE1 && !hasOE2) {
        overallStatus = 'OE_1_COMPLETED';
        statusLabel = 'Open Elective I Completed';
      } else if (hasOE2 && !hasOE1) {
        overallStatus = 'OE_2_COMPLETED';
        statusLabel = 'Open Elective II Completed';
      } else {
        overallStatus = 'PARTIALLY_COMPLETED';
        statusLabel = `${registrations.length} of ${allElectives.length} Electives Selected`;
      }
    }

    res.json({
      success: true,
      is_eligible: student.academic_year === 3,
      student: {
        id: student.id,
        reg_no: student.reg_no,
        name: student.name,
        academic_year: student.academic_year,
        semester: student.semester,
        section: student.section
      },
      registrations,
      overall_status: overallStatus,
      status_label: statusLabel,
      total_required: allElectives.length,
      total_completed: registrations.length
    });
  } catch (error) {
    console.error('Error fetching student open elective registrations:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve registrations: ' + error.message });
  }
});

// =========================================================================
// 3. POST /api/open-electives/reserve - Atomic FCFS single elective reservation
// =========================================================================
router.post('/reserve', (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.student) {
      return res.status(403).json({ success: false, message: 'Student access required.' });
    }

    const student = req.student;

    // Strict 3rd year check
    if (student.academic_year !== 3) {
      return res.status(403).json({
        success: false,
        message: 'Open Elective Selection is exclusively for 3rd Year B.Tech students.'
      });
    }

    const { elective_id, subject_id, faculty_assignment_id } = req.body;

    if (!elective_id || !subject_id || !faculty_assignment_id) {
      return res.status(400).json({
        success: false,
        message: 'Please select an open elective, subject, and preferred faculty.'
      });
    }

    const result = withTransaction(() => {
      // 1. Verify Elective
      const elective = db.prepare('SELECT * FROM open_electives WHERE id = ?').get(elective_id);
      if (!elective) throw new Error('Selected open elective not found.');
      if (!elective.is_active) throw new Error(`${elective.name} is currently closed for registration.`);

      // 2. Prevent duplicate selection for the same elective
      const existing = db.prepare(`
        SELECT id FROM open_elective_registrations 
        WHERE student_id = ? AND elective_id = ? AND status = 'CONFIRMED'
      `).get(student.id, elective.id);

      if (existing) {
        throw new Error(`You have already confirmed your selection for ${elective.name}. Selections cannot be duplicated.`);
      }

      // 3. Verify Subject
      const subject = db.prepare('SELECT * FROM open_elective_subjects WHERE id = ? AND elective_id = ?').get(subject_id, elective.id);
      if (!subject) throw new Error('Selected subject does not belong to this open elective.');
      if (!subject.is_active) throw new Error(`${subject.subject_name} is currently inactive.`);

      // 4. Verify Faculty Assignment
      const assignment = db.prepare(`
        SELECT fa.*, f.name as faculty_name, f.faculty_code
        FROM open_elective_faculty_assignments fa
        JOIN faculty f ON fa.faculty_id = f.id
        WHERE fa.id = ? AND fa.subject_id = ?
      `).get(faculty_assignment_id, subject.id);

      if (!assignment) throw new Error('Selected faculty assignment not found for this subject.');
      if (!assignment.is_active) throw new Error(`Registration for ${assignment.faculty_name} is currently disabled.`);

      // 5. Atomic Capacity Check
      const currentAllocations = db.prepare(`
        SELECT count(*) as count 
        FROM open_elective_registrations 
        WHERE faculty_assignment_id = ? AND status = 'CONFIRMED'
      `).get(assignment.id).count;

      if (currentAllocations >= assignment.max_capacity) {
        throw new Error(`Faculty capacity has been reached for ${assignment.faculty_name} in ${subject.subject_name}. Please choose another available faculty member.`);
      }

      // 6. Record Registration
      const timestamp = new Date().toISOString();
      const insertResult = db.prepare(`
        INSERT INTO open_elective_registrations 
        (student_id, elective_id, subject_id, faculty_assignment_id, faculty_id, registration_timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
      `).run(student.id, elective.id, subject.id, assignment.id, assignment.faculty_id, timestamp);

      return {
        registration_id: insertResult.lastInsertRowid,
        elective_id: elective.id,
        elective_name: elective.name,
        subject_name: subject.subject_name,
        faculty_name: assignment.faculty_name,
        timestamp
      };
    });

    logAudit(req.user.id, 'OE_SELECTION_RESERVED', 'open_elective_registrations', result.registration_id, `Student ${student.reg_no} reserved ${result.faculty_name} for ${result.elective_name} (${result.subject_name})`, req.ip);

    res.status(201).json({
      success: true,
      message: `Successfully confirmed ${result.faculty_name} for ${result.elective_name}!`,
      selection: result
    });
  } catch (error) {
    const isConflict = error.message.includes('capacity has been reached') || error.message.includes('already confirmed');
    res.status(isConflict ? 409 : 400).json({
      success: false,
      message: error.message
    });
  }
});

// =========================================================================
// 4. POST /api/open-electives/reserve-batch - Atomic multi-elective submission
// =========================================================================
router.post('/reserve-batch', (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.student) {
      return res.status(403).json({ success: false, message: 'Student access required.' });
    }

    const student = req.student;
    if (student.academic_year !== 3) {
      return res.status(403).json({
        success: false,
        message: 'Open Elective Selection is exclusively for 3rd Year B.Tech students.'
      });
    }

    const { selections } = req.body;
    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ success: false, message: 'No elective selections provided.' });
    }

    const results = withTransaction(() => {
      const confirmedList = [];

      for (const sel of selections) {
        const { elective_id, subject_id, faculty_assignment_id } = sel;

        // Check if already registered
        const existing = db.prepare(`
          SELECT id FROM open_elective_registrations 
          WHERE student_id = ? AND elective_id = ? AND status = 'CONFIRMED'
        `).get(student.id, elective_id);

        if (existing) continue; // Already confirmed earlier

        const elective = db.prepare('SELECT * FROM open_electives WHERE id = ?').get(elective_id);
        if (!elective || !elective.is_active) {
          throw new Error(`Open elective ${elective ? elective.name : elective_id} is inactive or invalid.`);
        }

        const subject = db.prepare('SELECT * FROM open_elective_subjects WHERE id = ? AND elective_id = ?').get(subject_id, elective.id);
        if (!subject || !subject.is_active) {
          throw new Error(`Subject is invalid or inactive for ${elective.name}.`);
        }

        const assignment = db.prepare(`
          SELECT fa.*, f.name as faculty_name 
          FROM open_elective_faculty_assignments fa
          JOIN faculty f ON fa.faculty_id = f.id
          WHERE fa.id = ? AND fa.subject_id = ?
        `).get(faculty_assignment_id, subject.id);

        if (!assignment || !assignment.is_active) {
          throw new Error(`Faculty assignment is invalid or disabled for ${subject.subject_name}.`);
        }

        // Capacity check
        const currentCount = db.prepare(`
          SELECT count(*) as count 
          FROM open_elective_registrations 
          WHERE faculty_assignment_id = ? AND status = 'CONFIRMED'
        `).get(assignment.id).count;

        if (currentCount >= assignment.max_capacity) {
          throw new Error(`Faculty capacity has been reached for ${assignment.faculty_name} in ${subject.subject_name}. Please choose another available faculty member.`);
        }

        const timestamp = new Date().toISOString();
        const insertRes = db.prepare(`
          INSERT INTO open_elective_registrations 
          (student_id, elective_id, subject_id, faculty_assignment_id, faculty_id, registration_timestamp, status)
          VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
        `).run(student.id, elective.id, subject.id, assignment.id, assignment.faculty_id, timestamp);

        confirmedList.push({
          registration_id: insertRes.lastInsertRowid,
          elective_name: elective.name,
          subject_name: subject.subject_name,
          faculty_name: assignment.faculty_name
        });
      }

      return confirmedList;
    });

    logAudit(req.user.id, 'OE_BATCH_RESERVED', 'open_elective_registrations', null, `Student ${student.reg_no} confirmed ${results.length} open electives`, req.ip);

    res.status(201).json({
      success: true,
      message: 'All open elective selections confirmed successfully!',
      selections: results
    });
  } catch (error) {
    const isConflict = error.message.includes('capacity has been reached') || error.message.includes('already confirmed');
    res.status(isConflict ? 409 : 400).json({
      success: false,
      message: error.message
    });
  }
});

// =========================================================================
// 5. ADMIN MANAGEMENT ENDPOINTS (requireAdmin)
// =========================================================================

// POST /api/open-electives/electives - Create Elective
router.post('/electives', requireAdmin, (req, res) => {
  try {
    const { code, name, academic_year = 3, semester = 6, branch = 'CSE' } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Elective code and name are required.' });
    }

    const now = new Date().toISOString();
    const insertRes = db.prepare(`
      INSERT INTO open_electives (code, name, academic_year, semester, branch, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(code.trim().toUpperCase(), name.trim(), parseInt(academic_year, 10), parseInt(semester, 10), branch.trim(), now);

    logAudit(req.user.id, 'CREATE_OPEN_ELECTIVE', 'open_electives', insertRes.lastInsertRowid, `Created ${name} (${code})`, req.ip);

    res.status(201).json({ success: true, message: `Created open elective ${name}`, id: insertRes.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/open-electives/electives/:id - Update Elective
router.put('/electives/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const elective = db.prepare('SELECT * FROM open_electives WHERE id = ?').get(id);
    if (!elective) return res.status(404).json({ success: false, message: 'Elective not found.' });

    const newName = name !== undefined ? name.trim() : elective.name;
    const newActive = is_active !== undefined ? (is_active ? 1 : 0) : elective.is_active;

    db.prepare('UPDATE open_electives SET name = ?, is_active = ? WHERE id = ?').run(newName, newActive, id);
    logAudit(req.user.id, 'UPDATE_OPEN_ELECTIVE', 'open_electives', id, `Updated elective ${id}: active=${newActive}`, req.ip);

    res.json({ success: true, message: 'Elective updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/open-electives/subjects - Create Subject under Elective
router.post('/subjects', requireAdmin, (req, res) => {
  try {
    const { elective_id, subject_code, subject_name, description } = req.body;
    if (!elective_id || !subject_name) {
      return res.status(400).json({ success: false, message: 'Elective ID and Subject Name are required.' });
    }

    const now = new Date().toISOString();
    const insertRes = db.prepare(`
      INSERT INTO open_elective_subjects (elective_id, subject_code, subject_name, description, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(elective_id, (subject_code || '').trim().toUpperCase(), subject_name.trim(), (description || '').trim(), now);

    logAudit(req.user.id, 'CREATE_OE_SUBJECT', 'open_elective_subjects', insertRes.lastInsertRowid, `Added subject ${subject_name} to elective ${elective_id}`, req.ip);

    res.status(201).json({ success: true, message: `Created subject ${subject_name}`, id: insertRes.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/open-electives/subjects/:id - Update Subject
router.put('/subjects/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { subject_name, subject_code, description, is_active } = req.body;

    const sub = db.prepare('SELECT * FROM open_elective_subjects WHERE id = ?').get(id);
    if (!sub) return res.status(404).json({ success: false, message: 'Subject not found.' });

    const newName = subject_name !== undefined ? subject_name.trim() : sub.subject_name;
    const newCode = subject_code !== undefined ? subject_code.trim().toUpperCase() : sub.subject_code;
    const newDesc = description !== undefined ? description.trim() : sub.description;
    const newActive = is_active !== undefined ? (is_active ? 1 : 0) : sub.is_active;

    db.prepare(`
      UPDATE open_elective_subjects 
      SET subject_name = ?, subject_code = ?, description = ?, is_active = ? 
      WHERE id = ?
    `).run(newName, newCode, newDesc, newActive, id);

    logAudit(req.user.id, 'UPDATE_OE_SUBJECT', 'open_elective_subjects', id, `Updated subject ${id}`, req.ip);

    res.json({ success: true, message: 'Subject updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/open-electives/subjects/:id - Delete Subject safely
router.delete('/subjects/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    // Safety check: existing student registrations
    const regCount = db.prepare(`
      SELECT count(*) as count 
      FROM open_elective_registrations 
      WHERE subject_id = ? AND status = 'CONFIRMED'
    `).get(id).count;

    if (regCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this subject because ${regCount} student(s) have already registered for it. Please deactivate the subject instead, or cancel the student registrations first.`
      });
    }

    db.prepare('DELETE FROM open_elective_subjects WHERE id = ?').run(id);
    logAudit(req.user.id, 'DELETE_OE_SUBJECT', 'open_elective_subjects', id, `Deleted open elective subject ${id}`, req.ip);

    res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/open-electives/assignments - Assign Faculty to Subject
router.post('/assignments', requireAdmin, (req, res) => {
  try {
    const { subject_id, faculty_id, max_capacity = 65 } = req.body;
    if (!subject_id || !faculty_id) {
      return res.status(400).json({ success: false, message: 'Subject ID and Faculty ID are required.' });
    }

    const now = new Date().toISOString();
    const insertRes = db.prepare(`
      INSERT INTO open_elective_faculty_assignments (subject_id, faculty_id, max_capacity, is_active, created_at)
      VALUES (?, ?, ?, 1, ?)
    `).run(subject_id, faculty_id, parseInt(max_capacity, 10), now);

    logAudit(req.user.id, 'CREATE_OE_ASSIGNMENT', 'open_elective_faculty_assignments', insertRes.lastInsertRowid, `Assigned faculty ${faculty_id} to subject ${subject_id} with capacity ${max_capacity}`, req.ip);

    res.status(201).json({ success: true, message: 'Faculty assigned successfully.', id: insertRes.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'This faculty member is already assigned to this subject.' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/open-electives/assignments/:id - Update Assignment Capacity or Status
router.put('/assignments/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { max_capacity, is_active } = req.body;

    const assign = db.prepare('SELECT * FROM open_elective_faculty_assignments WHERE id = ?').get(id);
    if (!assign) return res.status(404).json({ success: false, message: 'Faculty assignment not found.' });

    // Check allocated count if reducing capacity
    if (max_capacity !== undefined) {
      const allocatedCount = db.prepare(`
        SELECT count(*) as count 
        FROM open_elective_registrations 
        WHERE faculty_assignment_id = ? AND status = 'CONFIRMED'
      `).get(id).count;

      if (parseInt(max_capacity, 10) < allocatedCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot lower capacity to ${max_capacity} because ${allocatedCount} seat(s) are already allocated to students.`
        });
      }
    }

    const newCap = max_capacity !== undefined ? parseInt(max_capacity, 10) : assign.max_capacity;
    const newActive = is_active !== undefined ? (is_active ? 1 : 0) : assign.is_active;

    db.prepare('UPDATE open_elective_faculty_assignments SET max_capacity = ?, is_active = ? WHERE id = ?').run(newCap, newActive, id);
    logAudit(req.user.id, 'UPDATE_OE_ASSIGNMENT', 'open_elective_faculty_assignments', id, `Updated assignment ${id}: capacity=${newCap}, active=${newActive}`, req.ip);

    res.json({ success: true, message: 'Faculty assignment updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/open-electives/assignments/:id - Remove Faculty Assignment
router.delete('/assignments/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;

    const regCount = db.prepare(`
      SELECT count(*) as count 
      FROM open_elective_registrations 
      WHERE faculty_assignment_id = ? AND status = 'CONFIRMED'
    `).get(id).count;

    if (regCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove this faculty because ${regCount} student(s) have selected them. Please deactivate this assignment or reassign students first.`
      });
    }

    db.prepare('DELETE FROM open_elective_faculty_assignments WHERE id = ?').run(id);
    logAudit(req.user.id, 'DELETE_OE_ASSIGNMENT', 'open_elective_faculty_assignments', id, `Deleted assignment ${id}`, req.ip);

    res.json({ success: true, message: 'Faculty assignment removed successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/open-electives/reports - Comprehensive Admin Monitoring & Reports
router.get('/reports', requireAdmin, (req, res) => {
  try {
    const { elective_id, subject_id, faculty_id, status_filter, search } = req.query;

    // 1. All 3rd year students summary
    const all3rdYearStudents = db.prepare(`
      SELECT id, reg_no, name, section, status 
      FROM students 
      WHERE academic_year = 3 AND status = 'ACTIVE'
      ORDER BY reg_no ASC
    `).all();

    const total3rdYear = all3rdYearStudents.length;

    // 2. Registrations query with filters
    let sql = `
      SELECT 
        oer.id as registration_id,
        oer.student_id,
        s.reg_no,
        s.name as student_name,
        s.section as student_section,
        oer.elective_id,
        oe.code as elective_code,
        oe.name as elective_name,
        oer.subject_id,
        oes.subject_code,
        oes.subject_name,
        oer.faculty_id,
        f.faculty_code,
        f.name as faculty_name,
        f.designation as faculty_designation,
        oer.registration_timestamp,
        oer.status
      FROM open_elective_registrations oer
      JOIN students s ON oer.student_id = s.id
      JOIN open_electives oe ON oer.elective_id = oe.id
      JOIN open_elective_subjects oes ON oer.subject_id = oes.id
      JOIN faculty f ON oer.faculty_id = f.id
      WHERE oer.status = 'CONFIRMED'
    `;
    const params = [];

    if (elective_id && elective_id !== 'ALL') {
      sql += ' AND oer.elective_id = ?';
      params.push(parseInt(elective_id, 10));
    }
    if (subject_id && subject_id !== 'ALL') {
      sql += ' AND oer.subject_id = ?';
      params.push(parseInt(subject_id, 10));
    }
    if (faculty_id && faculty_id !== 'ALL') {
      sql += ' AND oer.faculty_id = ?';
      params.push(parseInt(faculty_id, 10));
    }
    if (search && search.trim()) {
      sql += ' AND (s.reg_no LIKE ? OR s.name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY oer.registration_timestamp DESC';
    const registrations = db.prepare(sql).all(...params);

    // 3. Subject-wise allocation breakdown
    const subjectAllocations = db.prepare(`
      SELECT 
        oe.name as elective_name,
        oes.id as subject_id,
        oes.subject_code,
        oes.subject_name,
        COUNT(oer.id) as allocated_count
      FROM open_elective_subjects oes
      JOIN open_electives oe ON oes.elective_id = oe.id
      LEFT JOIN open_elective_registrations oer ON oer.subject_id = oes.id AND oer.status = 'CONFIRMED'
      GROUP BY oes.id
      ORDER BY oe.id ASC, oes.subject_name ASC
    `).all();

    // 4. Faculty-wise allocation breakdown
    const facultyAllocations = db.prepare(`
      SELECT 
        oe.name as elective_name,
        oes.subject_name,
        f.faculty_code,
        f.name as faculty_name,
        fa.max_capacity,
        COUNT(oer.id) as allocated_count,
        MAX(0, fa.max_capacity - COUNT(oer.id)) as available_seats
      FROM open_elective_faculty_assignments fa
      JOIN open_elective_subjects oes ON fa.subject_id = oes.id
      JOIN open_electives oe ON oes.elective_id = oe.id
      JOIN faculty f ON fa.faculty_id = f.id
      LEFT JOIN open_elective_registrations oer ON oer.faculty_assignment_id = fa.id AND oer.status = 'CONFIRMED'
      GROUP BY fa.id
      ORDER BY oe.id ASC, oes.subject_name ASC, f.name ASC
    `).all();

    // 5. Completion metric per student
    const studentRegistrationCounts = db.prepare(`
      SELECT student_id, COUNT(*) as count 
      FROM open_elective_registrations 
      WHERE status = 'CONFIRMED' 
      GROUP BY student_id
    `).all();
    const countMap = new Map(studentRegistrationCounts.map(r => [r.student_id, r.count]));

    const totalActiveElectives = db.prepare('SELECT count(*) as count FROM open_electives WHERE is_active = 1').get().count;

    const completedStudents = all3rdYearStudents.filter(s => (countMap.get(s.id) || 0) >= totalActiveElectives);
    const partiallyCompletedStudents = all3rdYearStudents.filter(s => {
      const c = countMap.get(s.id) || 0;
      return c > 0 && c < totalActiveElectives;
    });
    const notStartedStudents = all3rdYearStudents.filter(s => (countMap.get(s.id) || 0) === 0);

    res.json({
      success: true,
      stats: {
        total_3rd_year: total3rdYear,
        completed_count: completedStudents.length,
        partially_completed_count: partiallyCompletedStudents.length,
        not_started_count: notStartedStudents.length,
        total_active_electives: totalActiveElectives,
        total_registrations: registrations.length
      },
      registrations,
      subject_allocations: subjectAllocations,
      faculty_allocations: facultyAllocations,
      incomplete_students: notStartedStudents.concat(partiallyCompletedStudents).map(s => ({
        ...s,
        completed_count: countMap.get(s.id) || 0,
        required_count: totalActiveElectives
      }))
    });
  } catch (error) {
    console.error('Error generating open elective reports:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report: ' + error.message });
  }
});

// POST /api/open-electives/registrations/:id/cancel - Admin cancels elective registration
router.post('/registrations/:id/cancel', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by administrator' } = req.body;

    const reg = db.prepare(`
      SELECT oer.*, s.reg_no, s.name as student_name, oe.name as elective_name
      FROM open_elective_registrations oer
      JOIN students s ON oer.student_id = s.id
      JOIN open_electives oe ON oer.elective_id = oe.id
      WHERE oer.id = ?
    `).get(id);

    if (!reg) return res.status(404).json({ success: false, message: 'Registration record not found.' });

    db.prepare('DELETE FROM open_elective_registrations WHERE id = ?').run(id);

    logAudit(req.user.id, 'CANCEL_OE_REGISTRATION', 'open_elective_registrations', id, `Cancelled ${reg.elective_name} for student ${reg.reg_no} (${reg.student_name}). Reason: ${reason}`, req.ip);

    res.json({ success: true, message: `Successfully cancelled ${reg.elective_name} registration for ${reg.student_name} (${reg.reg_no}).` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
