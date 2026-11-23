const nodemailer = require('nodemailer');
const { db } = require('../config/database');

/**
 * Returns a configured Nodemailer transporter or a safe local simulation transporter
 * when SMTP environment credentials are not configured.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && (user || pass)) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Graceful simulation fallback for local development or testing when SMTP is unset
  return {
    sendMail: async (options) => {
      console.log(`[EmailService:Simulated] Email sent to: ${options.to}`);
      console.log(`[EmailService:Simulated] Subject: ${options.subject}`);
      return {
        messageId: `simulated-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        response: '250 Simulated confirmation email delivered successfully'
      };
    }
  };
}

/**
 * Generates a clean, professional, responsive college-themed HTML email template
 */
function generateConfirmationEmailHtml(student, selections) {
  const formattedDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const rowsHtml = selections.map((s, idx) => {
    let categoryBadge = 'Core Curriculum';
    let badgeBg = '#f1f5f9';
    let badgeColor = '#475569';

    if (s.elective_group === 'OE1') {
      categoryBadge = 'Professional Elective – I';
      badgeBg = '#f3e8ff';
      badgeColor = '#7e22ce';
    } else if (s.elective_group === 'OE2') {
      categoryBadge = 'Professional Elective – II';
      badgeBg = '#e0e7ff';
      badgeColor = '#4338ca';
    }

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 12px 14px; text-align: center; font-size: 13px; font-weight: bold; color: #64748b;">
          ${idx + 1}
        </td>
        <td style="padding: 12px 14px;">
          <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${s.subject_name}</div>
          <div style="font-family: monospace; font-size: 11px; color: #2563eb; margin-top: 2px;">
            ${s.subject_code} &bull; ${s.credits || 3} Credits
          </div>
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background-color: ${badgeBg}; color: ${badgeColor};">
            ${categoryBadge}
          </span>
        </td>
        <td style="padding: 12px 14px;">
          <div style="font-size: 13px; font-weight: bold; color: #1e293b;">${s.faculty_name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${s.faculty_designation || 'Department Faculty'}
          </div>
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; background-color: #dcfce7; color: #166534; border: 1px solid #86efac;">
            ALLOCATED
          </span>
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faculty Selection Successfully Confirmed - RGMCET</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 650px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- College Branding Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #091e42 0%, #0f172a 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
              <div style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; color: #93c5fd; margin-bottom: 6px;">
                Rajeev Gandhi Memorial College of Engineering &amp; Technology
              </div>
              <div style="font-size: 9px; letter-spacing: 0.5px; color: #cbd5e1; margin-bottom: 12px;">
                (AUTONOMOUS) &bull; Approved by AICTE &bull; Accredited by NBA &amp; NAAC with 'A+' Grade
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #e2e8f0; text-transform: uppercase; letter-spacing: 1px;">
                Department of Computer Science and Engineering
              </div>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="background-color: #ecfdf5; border-bottom: 2px solid #a7f3d0; padding: 20px 24px; text-align: center;">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background-color: #10b981; color: #ffffff; font-size: 22px; font-weight: bold; margin-bottom: 10px;">
                &#10003;
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #065f46; letter-spacing: -0.5px;">
                Faculty Selection Successfully Confirmed
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #047857; font-weight: 500;">
                Your course faculty preferences have been officially locked and seat capacity reserved under First-Come, First-Served (FCFS) rules.
              </p>
            </td>
          </tr>

          <!-- Student Information Details -->
          <tr>
            <td style="padding: 24px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px;">
                <div style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                  Candidate Details &amp; Timestamp
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 5px 0; color: #64748b; width: 35%;">Student Name:</td>
                    <td style="padding: 5px 0; font-weight: bold; color: #0f172a;">${student.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #64748b;">Registration / Roll No:</td>
                    <td style="padding: 5px 0; font-weight: bold; font-family: monospace; color: #2563eb; font-size: 14px;">${student.reg_no}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #64748b;">Registered Email:</td>
                    <td style="padding: 5px 0; color: #0f172a;">${student.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #64748b;">Academic Cohort:</td>
                    <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">
                      Year ${student.academic_year} &bull; Semester ${student.semester} &bull; ${student.section === 'Group 1' ? 'Group 1 (Group A: 501–5E2)' : (student.section === 'Group 2' ? 'Group 2 (Group B: 5E3–5KP)' : student.section)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #64748b;">Confirmation Time:</td>
                    <td style="padding: 5px 0; font-weight: 600; color: #047857;">${formattedDate}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Allocated Courses Table -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span>Confirmed Subjects &amp; Allocated Faculty</span>
                <span style="font-size: 12px; font-weight: 600; color: #2563eb;">${selections.length} Courses Selected</span>
              </div>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #0f172a; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                    <th style="padding: 10px 12px; text-align: center; width: 35px;">#</th>
                    <th style="padding: 10px 14px; text-align: left;">Subject / Course</th>
                    <th style="padding: 10px 12px; text-align: center; width: 120px;">Category</th>
                    <th style="padding: 10px 14px; text-align: left;">Allocated Faculty</th>
                    <th style="padding: 10px 12px; text-align: center; width: 90px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Important Note for Students -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px 18px;">
                <div style="font-size: 12px; font-weight: 800; color: #92400e; margin-bottom: 4px;">
                  &#9888; Important Student Notice
                </div>
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #78350f;">
                  Please keep this confirmation email for your official records and academic verification. Your faculty seat reservation is permanent and cannot be modified or reallocated except by administrative order.
                </p>
              </div>
            </td>
          </tr>

          <!-- Official Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; color: #64748b; font-size: 11px; line-height: 1.6;">
              <div style="font-weight: 700; color: #475569; margin-bottom: 4px;">
                Rajeev Gandhi Memorial College of Engineering and Technology (Autonomous)
              </div>
              <div>Nandyal - 518501, Kurnool Dist., Andhra Pradesh, India</div>
              <div style="margin-top: 8px; color: #94a3b8; font-size: 10px;">
                This is an automated system confirmation from the RGMCET Faculty-Student Selection Portal (FSSP). Please do not reply directly to this email.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends or logs the faculty selection confirmation email for a given student
 * @param {number} studentId
 * @param {boolean} isResend - When true, bypasses duplicate check for explicit admin resend
 */
async function sendSelectionConfirmationEmail(studentId, isResend = false) {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      console.warn(`[EmailService] Student ${studentId} not found.`);
      return { success: false, message: 'Student record not found.' };
    }

    if (!student.email) {
      console.warn(`[EmailService] Student ${student.reg_no} has no registered email address.`);
      return { success: false, message: 'Student has no registered email address.' };
    }

    // 1. Fetch all confirmed selections for this student
    const selections = db.prepare(`
      SELECT 
        s.id as selection_id,
        s.reserved_at,
        sub.id as subject_id,
        sub.name as subject_name,
        sub.code as subject_code,
        sub.elective_group,
        sub.credits,
        f.id as faculty_id,
        f.name as faculty_name,
        f.faculty_code,
        f.designation as faculty_designation
      FROM selections s
      JOIN subjects sub ON s.subject_id = sub.id
      JOIN faculty f ON s.faculty_id = f.id
      WHERE s.student_id = ? AND s.status = 'CONFIRMED'
      ORDER BY s.id ASC
    `).all(student.id);

    if (selections.length === 0) {
      return { success: false, message: 'No confirmed selections found to email.' };
    }

    // 2. Duplicate Prevention: Check if email was already sent for this student recently
    if (!isResend) {
      const recentSent = db.prepare(`
        SELECT id, sent_at FROM email_logs 
        WHERE student_id = ? AND email_type = 'SELECTION_CONFIRMATION' AND status = 'SENT'
        ORDER BY id DESC LIMIT 1
      `).get(student.id);

      if (recentSent && recentSent.sent_at) {
        const latestSelTime = new Date(selections[selections.length - 1].reserved_at).getTime();
        const sentTime = new Date(recentSent.sent_at).getTime();
        // If an email was already successfully sent at or after the latest selection, prevent duplicate!
        if (sentTime >= latestSelTime - 5000) {
          console.log(`[EmailService] Duplicate confirmation email skipped for student ${student.reg_no}.`);
          return { success: true, message: 'Duplicate confirmation email prevented; already sent.', logId: recentSent.id, skipped: true };
        }
      }
    }

    const emailSubject = `RGMCET Faculty Selection Confirmation - ${student.reg_no}`;
    const nowIso = new Date().toISOString();

    // 3. Log as PENDING
    const insertLog = db.prepare(`
      INSERT INTO email_logs (student_id, recipient_email, subject, email_type, status, attempt_count, created_at, updated_at)
      VALUES (?, ?, ?, 'SELECTION_CONFIRMATION', 'PENDING', 1, ?, ?)
    `).run(student.id, student.email, emailSubject, nowIso, nowIso);

    const logId = insertLog.lastInsertRowid;

    // 4. Generate HTML Content
    const htmlContent = generateConfirmationEmailHtml(student, selections);
    const transporter = getTransporter();

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"RGMCET Faculty Selection Portal" <no-reply@rgmcet.edu.in>',
        to: student.email,
        subject: emailSubject,
        html: htmlContent
      });

      const sentIso = new Date().toISOString();
      db.prepare(`
        UPDATE email_logs 
        SET status = 'SENT', sent_at = ?, updated_at = ? 
        WHERE id = ?
      `).run(sentIso, sentIso, logId);

      console.log(`[EmailService] Confirmation email successfully sent to ${student.email} (${student.reg_no}).`);
      return { success: true, logId, status: 'SENT', recipient: student.email };
    } catch (sendErr) {
      const failIso = new Date().toISOString();
      db.prepare(`
        UPDATE email_logs 
        SET status = 'FAILED', error_message = ?, updated_at = ? 
        WHERE id = ?
      `).run(sendErr.message || 'SMTP delivery failure', failIso, logId);

      console.error(`[EmailService] Delivery failed to ${student.email}:`, sendErr.message);
      // Return failed status safely without undoing selections
      return { success: false, logId, status: 'FAILED', error: sendErr.message };
    }
  } catch (err) {
    console.error('[EmailService] Unexpected error in sendSelectionConfirmationEmail:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Retries sending an email for a previously failed or pending email log
 * @param {number} logId
 */
async function retryFailedEmail(logId) {
  const log = db.prepare('SELECT * FROM email_logs WHERE id = ?').get(logId);
  if (!log) {
    throw new Error(`Email log ID ${logId} not found.`);
  }

  // Prevent duplicate if already marked as SENT
  if (log.status === 'SENT') {
    return { success: true, message: 'Email has already been sent successfully. Duplicate delivery prevented.', log };
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(log.student_id);
  if (!student) {
    throw new Error('Student associated with this email log was not found.');
  }

  const selections = db.prepare(`
    SELECT 
      s.id as selection_id,
      s.reserved_at,
      sub.id as subject_id,
      sub.name as subject_name,
      sub.code as subject_code,
      sub.elective_group,
      sub.credits,
      f.id as faculty_id,
      f.name as faculty_name,
      f.faculty_code,
      f.designation as faculty_designation
    FROM selections s
    JOIN subjects sub ON s.subject_id = sub.id
    JOIN faculty f ON s.faculty_id = f.id
    WHERE s.student_id = ? AND s.status = 'CONFIRMED'
    ORDER BY s.id ASC
  `).all(student.id);

  if (selections.length === 0) {
    throw new Error('No confirmed selections found for this student to email.');
  }

  const htmlContent = generateConfirmationEmailHtml(student, selections);
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"RGMCET Faculty Selection Portal" <no-reply@rgmcet.edu.in>',
      to: student.email,
      subject: log.subject,
      html: htmlContent
    });

    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE email_logs 
      SET status = 'SENT', sent_at = ?, attempt_count = attempt_count + 1, error_message = NULL, updated_at = ? 
      WHERE id = ?
    `).run(nowIso, nowIso, log.id);

    return { success: true, message: `Email delivered successfully to ${student.email} on attempt ${log.attempt_count + 1}!` };
  } catch (err) {
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE email_logs 
      SET status = 'FAILED', attempt_count = attempt_count + 1, error_message = ?, updated_at = ? 
      WHERE id = ?
    `).run(err.message || 'SMTP delivery failure', nowIso, log.id);

    throw new Error(`Email retry failed: ${err.message}`);
  }
}

/**
 * Resends a fresh confirmation email for a student based on their current confirmed selections
 * @param {number} studentId
 */
async function resendStudentEmail(studentId) {
  return await sendSelectionConfirmationEmail(studentId, true);
}

module.exports = {
  sendSelectionConfirmationEmail,
  retryFailedEmail,
  resendStudentEmail,
  generateConfirmationEmailHtml
};
