const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { requireAdmin } = require('../middleware/auth');
const { retryFailedEmail, resendStudentEmail } = require('../services/emailService');

// All email routes require Admin authorization
router.use(requireAdmin);

/**
 * GET /api/emails/stats - Summary counts of sent, failed, pending
 */
router.get('/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM email_logs').get().count;
    const sent = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'SENT'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'FAILED'").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'PENDING'").get().count;

    res.json({
      success: true,
      stats: {
        total,
        sent,
        failed,
        pending
      }
    });
  } catch (err) {
    console.error('Error fetching email stats:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/emails/logs - Retrieve email logs with filters
 */
router.get('/logs', (req, res) => {
  try {
    const { status, search, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT 
        el.id,
        el.student_id,
        el.recipient_email,
        el.subject,
        el.email_type,
        el.status,
        el.attempt_count,
        el.error_message,
        el.sent_at,
        el.created_at,
        el.updated_at,
        s.name as student_name,
        s.reg_no as student_reg_no,
        s.academic_year as student_academic_year,
        s.semester as student_semester,
        s.section as student_section
      FROM email_logs el
      JOIN students s ON el.student_id = s.id
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'ALL') {
      query += ` AND el.status = ?`;
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (s.name LIKE ? OR s.reg_no LIKE ? OR el.recipient_email LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY el.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const logs = db.prepare(query).all(...params);

    // Also get overall counts
    const total = db.prepare('SELECT COUNT(*) as count FROM email_logs').get().count;
    const sent = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'SENT'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'FAILED'").get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'PENDING'").get().count;

    res.json({
      success: true,
      stats: { total, sent, failed, pending },
      logs
    });
  } catch (err) {
    console.error('Error fetching email logs:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/emails/resend/:id - Resend / retry a specific email log
 */
router.post('/resend/:id', async (req, res) => {
  try {
    const logId = parseInt(req.params.id, 10);
    const result = await retryFailedEmail(logId);
    res.json({
      success: true,
      message: result.message || 'Confirmation email resent successfully!',
      result
    });
  } catch (err) {
    console.error('Error resending email:', err);
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to resend confirmation email.'
    });
  }
});

/**
 * POST /api/emails/send-student/:studentId - Send/Resend confirmation email to a student
 */
router.post('/send-student/:studentId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId, 10);
    const result = await resendStudentEmail(studentId);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || result.error || 'Could not send confirmation email.'
      });
    }

    res.json({
      success: true,
      message: `Confirmation email dispatched to ${result.recipient}!`,
      result
    });
  } catch (err) {
    console.error('Error sending confirmation email to student:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to send confirmation email to student.'
    });
  }
});

/**
 * POST /api/emails/retry-all-failed - Retry all failed email deliveries
 */
router.post('/retry-all-failed', async (req, res) => {
  try {
    const failedLogs = db.prepare("SELECT id FROM email_logs WHERE status = 'FAILED' ORDER BY id ASC LIMIT 50").all();
    let successCount = 0;
    let failCount = 0;

    for (const item of failedLogs) {
      try {
        await retryFailedEmail(item.id);
        successCount++;
      } catch (e) {
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `Processed ${failedLogs.length} failed emails: ${successCount} sent successfully, ${failCount} still failed.`,
      retriedCount: failedLogs.length,
      successCount,
      failCount
    });
  } catch (err) {
    console.error('Error retrying all failed emails:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
