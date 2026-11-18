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

module.exports = router;
