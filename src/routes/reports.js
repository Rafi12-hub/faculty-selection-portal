const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/reports/dashboard-stats
router.get('/dashboard-stats', (req, res) => {
  try {
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const totalFaculty = db.prepare('SELECT COUNT(*) as count FROM faculty').get().count;
    const totalSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;
    const totalMappings = db.prepare('SELECT COUNT(*) as count FROM faculty_subject_mappings').get().count;

    const capacitySum = db.prepare(`
      SELECT COALESCE(SUM(capacity), 0) as total 
      FROM faculty_subject_mappings 
      WHERE status = 'ACTIVE'
    `).get().total;

    const confirmedSelections = db.prepare(`
      SELECT COUNT(*) as count 
      FROM selections 
      WHERE status = 'CONFIRMED'
    `).get().count;

    const cancelledSelections = db.prepare(`
      SELECT COUNT(*) as count 
      FROM selections 
      WHERE status = 'CANCELLED'
    `).get().count;

    const totalAllocatedSeats = confirmedSelections;
    const totalAvailableSeats = Math.max(0, capacitySum - totalAllocatedSeats);

    // Active round summary
    const activeRound = db.prepare(`
      SELECT * FROM selection_rounds 
      WHERE status = 'ACTIVE' 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get();

    res.json({
      success: true,
      stats: {
        total_students: totalStudents,
        total_faculty: totalFaculty,
        total_subjects: totalSubjects,
        total_mappings: totalMappings,
        total_available_seats: totalAvailableSeats,
        total_allocated_seats: totalAllocatedSeats,
        total_capacity: capacitySum,
        confirmed_selections: confirmedSelections,
        cancelled_selections: cancelledSelections
      },
      activeRound: activeRound || null
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve stats: ' + error.message });
  }
});

// GET /api/reports/faculty-allocations
router.get('/faculty-allocations', (req, res) => {
  try {
    const allocations = db.prepare(`
      SELECT 
        f.id as faculty_id,
        f.faculty_code,
        f.name as faculty_name,
        f.designation,
        f.specialization,
        s.id as subject_id,
        s.code as subject_code,
        s.name as subject_name,
        m.id as mapping_id,
        m.academic_year,
        m.semester,
        m.capacity,
        m.status as mapping_status,
        (
          SELECT COUNT(*) 
          FROM selections sel 
          WHERE sel.mapping_id = m.id AND sel.status = 'CONFIRMED'
        ) as allocated_seats
      FROM faculty_subject_mappings m
      JOIN faculty f ON m.faculty_id = f.id
      JOIN subjects s ON m.subject_id = s.id
      ORDER BY f.name ASC, m.academic_year ASC, m.semester ASC
    `).all();

    const enriched = allocations.map(a => ({
      ...a,
      available_seats: Math.max(0, a.capacity - a.allocated_seats),
      occupancy_pct: a.capacity > 0 ? Math.round((a.allocated_seats / a.capacity) * 100) : 0
    }));

    res.json({ success: true, allocations: enriched });
  } catch (error) {
    console.error('Error fetching faculty allocations report:', error);
    res.status(500).json({ success: false, message: 'Report generation failed: ' + error.message });
  }
});

// GET /api/reports/subject-demand
router.get('/subject-demand', (req, res) => {
  try {
    const subjects = db.prepare(`
      SELECT 
        s.id,
        s.code,
        s.name,
        s.academic_year,
        s.semester,
        COUNT(DISTINCT m.faculty_id) as faculty_count,
        COALESCE(SUM(m.capacity), 0) as total_capacity,
        (
          SELECT COUNT(*) 
          FROM selections sel 
          WHERE sel.subject_id = s.id AND sel.status = 'CONFIRMED'
        ) as total_allocated,
        (
          SELECT COUNT(*) 
          FROM students stu 
          WHERE stu.academic_year = s.academic_year AND stu.semester = s.semester AND stu.status = 'ACTIVE'
        ) as eligible_students
      FROM subjects s
      LEFT JOIN faculty_subject_mappings m ON s.id = m.subject_id
      GROUP BY s.id
      ORDER BY s.academic_year ASC, s.semester ASC, s.code ASC
    `).all();

    const enriched = subjects.map(s => ({
      ...s,
      remaining_capacity: Math.max(0, s.total_capacity - s.total_allocated),
      fill_rate: s.total_capacity > 0 ? Math.round((s.total_allocated / s.total_capacity) * 100) : 0
    }));

    res.json({ success: true, subjects: enriched });
  } catch (error) {
    console.error('Error fetching subject demand report:', error);
    res.status(500).json({ success: false, message: 'Report generation failed: ' + error.message });
  }
});

// CSV Escape Helper
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// GET /api/reports/export-selections-excel - Download complete student selections in Excel format
router.get('/export-selections-excel', (req, res) => {
  try {
    const { academic_year, target_group } = req.query;

    let sql = `
      SELECT 
        sel.id as selection_id,
        stu.reg_no,
        stu.name as student_name,
        stu.academic_year,
        stu.semester,
        stu.section as cohort_group,
        sub.code as subject_code,
        sub.name as subject_name,
        f.faculty_code,
        f.name as faculty_name,
        f.designation as faculty_designation,
        sel.reserved_at,
        sel.status
      FROM selections sel
      JOIN students stu ON sel.student_id = stu.id
      JOIN subjects sub ON sel.subject_id = sub.id
      JOIN faculty f ON sel.faculty_id = f.id
      WHERE 1=1
    `;

    const params = [];
    if (academic_year && academic_year !== 'ALL') {
      sql += ` AND stu.academic_year = ?`;
      params.push(parseInt(academic_year, 10));
    }
    if (target_group && target_group !== 'ALL') {
      sql += ` AND stu.section = ?`;
      params.push(target_group);
    }

    sql += ` ORDER BY stu.academic_year ASC, stu.section ASC, stu.reg_no ASC, sub.code ASC`;

    const records = db.prepare(sql).all(...params);

    const headers = [
      'Sl. No',
      'Registration Number',
      'Student Name',
      'Academic Year',
      'Semester',
      'Cohort Group',
      'Subject Code',
      'Subject Name',
      'Faculty Code',
      'Assigned Faculty Name',
      'Designation',
      'Allocation Timestamp',
      'Selection Status'
    ];

    let csvContent = '\uFEFF' + headers.join(',') + '\r\n';

    records.forEach((r, idx) => {
      const row = [
        idx + 1,
        escapeCSV(r.reg_no),
        escapeCSV(r.student_name),
        escapeCSV(`Year ${r.academic_year}`),
        escapeCSV(`Sem ${r.semester}`),
        escapeCSV(r.cohort_group),
        escapeCSV(r.subject_code),
        escapeCSV(r.subject_name),
        escapeCSV(r.faculty_code),
        escapeCSV(r.faculty_name),
        escapeCSV(r.faculty_designation),
        escapeCSV(new Date(r.reserved_at).toLocaleString()),
        escapeCSV(r.status)
      ];
      csvContent += row.join(',') + '\r\n';
    });

    const filename = `RGMCET_Faculty_Selections_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error generating selections Excel export:', err);
    res.status(500).send('Export failed: ' + err.message);
  }
});

// GET /api/reports/export-faculty-summary-excel - Download faculty seat allocations in Excel format
router.get('/export-faculty-summary-excel', (req, res) => {
  try {
    const { academic_year } = req.query;

    let sql = `
      SELECT 
        f.faculty_code,
        f.name as faculty_name,
        f.designation,
        sub.code as subject_code,
        sub.name as subject_name,
        m.academic_year,
        m.semester,
        m.target_group,
        m.capacity,
        (
          SELECT COUNT(*) 
          FROM selections sel 
          WHERE sel.mapping_id = m.id AND sel.status = 'CONFIRMED'
        ) as allocated_seats
      FROM faculty_subject_mappings m
      JOIN faculty f ON m.faculty_id = f.id
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE 1=1
    `;

    const params = [];
    if (academic_year && academic_year !== 'ALL') {
      sql += ` AND m.academic_year = ?`;
      params.push(parseInt(academic_year, 10));
    }

    sql += ` ORDER BY m.academic_year ASC, m.semester ASC, sub.code ASC, f.name ASC`;

    const records = db.prepare(sql).all(...params);

    const headers = [
      'Sl. No',
      'Faculty Code',
      'Faculty Name',
      'Designation',
      'Subject Code',
      'Subject Name',
      'Year',
      'Semester',
      'Target Cohort',
      'Total Capacity',
      'Allocated Seats',
      'Remaining Seats',
      'Occupancy %'
    ];

    let csvContent = '\uFEFF' + headers.join(',') + '\r\n';

    records.forEach((r, idx) => {
      const remaining = Math.max(0, r.capacity - r.allocated_seats);
      const occupancy = r.capacity > 0 ? Math.round((r.allocated_seats / r.capacity) * 100) : 0;
      const row = [
        idx + 1,
        escapeCSV(r.faculty_code),
        escapeCSV(r.faculty_name),
        escapeCSV(r.designation),
        escapeCSV(r.subject_code),
        escapeCSV(r.subject_name),
        escapeCSV(`Year ${r.academic_year}`),
        escapeCSV(`Sem ${r.semester}`),
        escapeCSV(r.target_group),
        r.capacity,
        r.allocated_seats,
        remaining,
        `${occupancy}%`
      ];
      csvContent += row.join(',') + '\r\n';
    });

    const filename = `RGMCET_Faculty_Capacity_Summary_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error generating faculty summary Excel export:', err);
    res.status(500).send('Export failed: ' + err.message);
  }
});

// GET /api/reports/export-students-excel - Download student list in Excel format
router.get('/export-students-excel', (req, res) => {
  try {
    const { academic_year, section } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.reg_no,
        s.name,
        s.academic_year,
        s.semester,
        s.section,
        s.email,
        s.status,
        (
          SELECT COUNT(*)
          FROM selections sel
          WHERE sel.student_id = s.id AND sel.status = 'CONFIRMED'
        ) as confirmed_choices
      FROM students s
      WHERE 1=1
    `;

    const params = [];
    if (academic_year && academic_year !== 'ALL') {
      sql += ` AND s.academic_year = ?`;
      params.push(parseInt(academic_year, 10));
    }
    if (section && section !== 'ALL') {
      sql += ` AND s.section = ?`;
      params.push(section);
    }

    sql += ` ORDER BY s.academic_year ASC, s.section ASC, s.reg_no ASC`;

    const records = db.prepare(sql).all(...params);

    const headers = [
      'Sl. No',
      'Registration Number',
      'Student Name',
      'Academic Year',
      'Semester',
      'Cohort Group',
      'College Email',
      'Account Status',
      'Confirmed Selections'
    ];

    let csvContent = '\uFEFF' + headers.join(',') + '\r\n';

    records.forEach((r, idx) => {
      const row = [
        idx + 1,
        escapeCSV(r.reg_no),
        escapeCSV(r.name),
        escapeCSV(`Year ${r.academic_year}`),
        escapeCSV(`Sem ${r.semester}`),
        escapeCSV(r.section),
        escapeCSV(r.email),
        escapeCSV(r.status),
        r.confirmed_choices
      ];
      csvContent += row.join(',') + '\r\n';
    });

    const filename = `RGMCET_Registered_Students_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error generating students Excel export:', err);
    res.status(500).send('Export failed: ' + err.message);
  }
});

module.exports = router;
