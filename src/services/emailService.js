const nodemailer = require('nodemailer');
const { db } = require('../config/database');

/**
 * Returns the student's official RGMCET college email address
 * Strictly formatted as: <reg_no>@rgmcet.edu.in in lowercase
 */
function getStudentCollegeEmail(student) {
  if (!student || !student.reg_no) return null;
  return `${student.reg_no.trim().toLowerCase()}@rgmcet.edu.in`;
}

/**
 * Checks whether the student has completed all required course selections
 * (All active core subjects + 1 Professional Elective - I + 1 Professional Elective - II where applicable)
 */
function isStudentSelectionComplete(studentId) {
  const student = db.prepare('SELECT id, academic_year, semester, section FROM students WHERE id = ?').get(studentId);
  if (!student) return false;

  // 1. Active Core Subjects for student's year and semester
  const coreSubjects = db.prepare(`
    SELECT id FROM subjects 
    WHERE academic_year = ? AND semester = ? AND (elective_group IS NULL OR elective_group = 'NONE') AND status = 'ACTIVE'
  `).all(student.academic_year, student.semester);

  // 2. Active Professional Electives
  const oe1Subjects = db.prepare(`
    SELECT id FROM subjects 
    WHERE academic_year = ? AND semester = ? AND elective_group = 'OE1' AND status = 'ACTIVE'
  `).all(student.academic_year, student.semester);

  const oe2Subjects = db.prepare(`
    SELECT id FROM subjects 
    WHERE academic_year = ? AND semester = ? AND elective_group = 'OE2' AND status = 'ACTIVE'
  `).all(student.academic_year, student.semester);

  // 3. Current confirmed selections for student
  const confirmed = db.prepare(`
    SELECT s.id, sub.id as subject_id, sub.elective_group 
    FROM selections s
    JOIN subjects sub ON s.subject_id = sub.id
    WHERE s.student_id = ? AND s.status = 'CONFIRMED'
  `).all(studentId);

  // Check Core completion: every core course must have a confirmed selection
  const confirmedCoreCount = coreSubjects.filter(cs => confirmed.some(c => c.subject_id === cs.id)).length;
  if (confirmedCoreCount < coreSubjects.length) {
    return false;
  }

  // Check OE1 completion if OE1 courses are offered
  if (oe1Subjects.length > 0) {
    const hasOE1 = confirmed.some(c => c.elective_group === 'OE1');
    if (!hasOE1) return false;
  }

  // Check OE2 completion if OE2 courses are offered
  if (oe2Subjects.length > 0) {
    const hasOE2 = confirmed.some(c => c.elective_group === 'OE2');
    if (!hasOE2) return false;
  }

  return true;
}

/**
 * Retrieves the active SMTP configuration from database or environment variables
 */
function getSmtpConfig() {
  const getSetting = (key) => {
    try {
      const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
      return row ? row.value : null;
    } catch (e) {
      return null;
    }
  };

  const dbHost = getSetting('smtp_host');
  const dbPort = getSetting('smtp_port');
  const dbUser = getSetting('smtp_user');
  const dbPass = getSetting('smtp_pass');
  const dbSecure = getSetting('smtp_secure');
  const dbFrom = getSetting('smtp_from');

  const host = dbHost || process.env.SMTP_HOST || '';
  const port = parseInt(dbPort || process.env.SMTP_PORT || '587', 10);
  const user = dbUser || process.env.SMTP_USER || '';
  const pass = dbPass || process.env.SMTP_PASS || '';
  const secure = dbSecure ? dbSecure === 'true' : (process.env.SMTP_SECURE === 'true' || port === 465);
  const from = dbFrom || process.env.SMTP_FROM || '"RGMCET Faculty Selection Portal" <no-reply@rgmcet.edu.in>';

  const isConfigured = Boolean(host && user && pass);

  return {
    isConfigured,
    host,
    port,
    user,
    pass,
    secure,
    from,
    hasPass: Boolean(pass)
  };
}

/**
 * Saves SMTP configuration to the database
 */
function saveSmtpConfig({ host, port, user, pass, secure, from }) {
  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT INTO system_settings (key, value, updated_at) 
    VALUES (?, ?, ?) 
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `);

  if (host !== undefined) upsert.run('smtp_host', host.trim(), now);
  if (port !== undefined) upsert.run('smtp_port', String(port).trim(), now);
  if (user !== undefined) upsert.run('smtp_user', user.trim(), now);
  if (pass !== undefined && pass !== '') upsert.run('smtp_pass', pass.trim(), now);
  if (secure !== undefined) upsert.run('smtp_secure', String(secure), now);
  if (from !== undefined) upsert.run('smtp_from', from.trim(), now);

  return getSmtpConfig();
}

/**
 * Returns a configured Nodemailer transporter or a safe local simulation transporter
 * when SMTP environment credentials are not configured.
 */
function getTransporter() {
  const config = getSmtpConfig();

  if (config.isConfigured) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Graceful simulation fallback for local development or testing when SMTP is unset
  return {
    isSimulated: true,
    sendMail: async (options) => {
      console.log(`[EmailService:Simulated] (SMTP is not configured in Admin Settings or .env). Email sent to official college mail: ${options.to}`);
      console.log(`[EmailService:Simulated] Subject: ${options.subject}`);
      return {
        messageId: `simulated-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        response: '250 Simulated confirmation email delivered to college inbox (Configure SMTP in Admin Portal to send real emails)'
      };
    }
  };
}

/**
 * Sends a real live test email to verify SMTP configuration
 */
async function sendTestEmail(targetEmail) {
  const config = getSmtpConfig();
  if (!config.isConfigured) {
    throw new Error('SMTP is not configured yet! Please enter your SMTP Host, Username/Email, and App Password in the SMTP Settings dialog and click Save.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const testSubject = 'RGMCET Faculty Selection Portal - Live SMTP Test';
  const testHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #065f46; margin-top: 0;">✓ RGMCET SMTP Connected Successfully!</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        This test confirms that your SMTP mail server (<strong>${config.host}</strong>) is authenticated and actively delivering emails.
      </p>
      <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0; font-size: 13px; color: #475569;">
        <strong>Sender:</strong> ${config.from}<br>
        <strong>Recipient:</strong> ${targetEmail}<br>
        <strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      </div>
      <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
        Students will now receive their official faculty selection confirmation emails at their college email inboxes upon completing their selections.
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: config.from,
    to: targetEmail,
    subject: testSubject,
    html: testHtml
  });

  return {
    success: true,
    message: `Test email sent successfully to ${targetEmail}!`,
    messageId: info.messageId
  };
}

/**
 * Generates a clean, professional, responsive college-themed HTML email template
 */
function generateConfirmationEmailHtml(student, selections, collegeEmail) {
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
                All required course and faculty choices have been completed, officially locked, and allocated under First-Come, First-Served (FCFS) rules.
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
                    <td style="padding: 5px 0; color: #64748b;">Official College Email:</td>
                    <td style="padding: 5px 0; font-weight: bold; font-family: monospace; color: #047857;">${collegeEmail}</td>
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
                  <tr>
                    <td style="padding: 5px 0; color: #64748b;">Registration Status:</td>
                    <td style="padding: 5px 0; font-weight: 800; color: #059669;">REGISTRATION COMPLETED (100%)</td>
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
                <span style="font-size: 12px; font-weight: 600; color: #2563eb;">${selections.length} Courses Completed</span>
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
                This is an automated system confirmation sent exclusively to your official RGMCET student email address. Please do not reply directly to this email.
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
 * Sends or logs the faculty selection confirmation email for a given student.
 * Condition: Only sent when the student has completed their selection (or when an admin explicitly resends).
 * Address: Sent exclusively to the student's official college email address (<reg_no>@rgmcet.edu.in).
 * @param {number} studentId
 * @param {boolean} isResend - When true, bypasses duplicate check and completion check for explicit admin resend
 */
async function sendSelectionConfirmationEmail(studentId, isResend = false) {
  try {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      console.warn(`[EmailService] Student ID ${studentId} not found.`);
      return { success: false, message: 'Student record not found.' };
    }

    // 1. Strictly enforce official college email: <reg_no>@rgmcet.edu.in
    const collegeEmail = getStudentCollegeEmail(student);
    if (!collegeEmail) {
      console.warn(`[EmailService] Student ${student.id} has no valid registration number for college email.`);
      return { success: false, message: 'Student has no valid registration number.' };
    }

    // 2. Completion Check: Send confirmation ONLY when the student has completed his selection
    const isComplete = isStudentSelectionComplete(student.id);
    if (!isResend && !isComplete) {
      console.log(`[EmailService] Student ${student.reg_no} has not completed all course selections yet. Deferring confirmation email until complete.`);
      return { 
        success: false, 
        message: 'Selection not yet completed. Confirmation email will be automatically dispatched once all required courses and electives are confirmed.',
        pendingCompletion: true 
      };
    }

    // 3. Fetch all confirmed selections with allocated faculties for this student
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
      return { success: false, message: 'No confirmed faculty selections found to email.' };
    }

    // 4. Duplicate Prevention: Check if email was already sent for this complete selection
    if (!isResend) {
      const recentSent = db.prepare(`
        SELECT id, sent_at FROM email_logs 
        WHERE student_id = ? AND email_type = 'SELECTION_CONFIRMATION' AND status = 'SENT'
        ORDER BY id DESC LIMIT 1
      `).get(student.id);

      if (recentSent && recentSent.sent_at) {
        const latestSelTime = new Date(selections[selections.length - 1].reserved_at).getTime();
        const sentTime = new Date(recentSent.sent_at).getTime();
        if (sentTime >= latestSelTime - 5000) {
          console.log(`[EmailService] Duplicate confirmation email skipped for student ${student.reg_no} (already sent).`);
          return { success: true, message: 'Duplicate confirmation email prevented; already sent to college email.', logId: recentSent.id, skipped: true };
        }
      }
    }

    const emailSubject = `RGMCET Faculty Selection Confirmation - ${student.reg_no}`;
    const nowIso = new Date().toISOString();

    // 5. Log as PENDING targeting college email
    const insertLog = db.prepare(`
      INSERT INTO email_logs (student_id, recipient_email, subject, email_type, status, attempt_count, created_at, updated_at)
      VALUES (?, ?, ?, 'SELECTION_CONFIRMATION', 'PENDING', 1, ?, ?)
    `).run(student.id, collegeEmail, emailSubject, nowIso, nowIso);

    const logId = insertLog.lastInsertRowid;

    // 6. Generate HTML Content with confirmed faculty table
    const htmlContent = generateConfirmationEmailHtml(student, selections, collegeEmail);
    const transporter = getTransporter();

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"RGMCET Faculty Selection Portal" <no-reply@rgmcet.edu.in>',
        to: collegeEmail,
        subject: emailSubject,
        html: htmlContent
      });

      const sentIso = new Date().toISOString();
      db.prepare(`
        UPDATE email_logs 
        SET status = 'SENT', sent_at = ?, updated_at = ? 
        WHERE id = ?
      `).run(sentIso, sentIso, logId);

      console.log(`[EmailService] Confirmation email successfully sent to college email ${collegeEmail} (${student.reg_no}) with ${selections.length} confirmed courses.`);
      return { success: true, logId, status: 'SENT', recipient: collegeEmail, completedCourses: selections.length };
    } catch (sendErr) {
      const failIso = new Date().toISOString();
      db.prepare(`
        UPDATE email_logs 
        SET status = 'FAILED', error_message = ?, updated_at = ? 
        WHERE id = ?
      `).run(sendErr.message || 'SMTP delivery failure', failIso, logId);

      console.error(`[EmailService] Delivery failed to college email ${collegeEmail}:`, sendErr.message);
      // Return failed status safely without undoing selections
      return { success: false, logId, status: 'FAILED', error: sendErr.message, recipient: collegeEmail };
    }
  } catch (err) {
    console.error('[EmailService] Unexpected error in sendSelectionConfirmationEmail:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Retries sending an email for a previously failed or pending email log
 * Always delivers exclusively to the student's official college email
 * @param {number} logId
 */
async function retryFailedEmail(logId) {
  const log = db.prepare('SELECT * FROM email_logs WHERE id = ?').get(logId);
  if (!log) {
    throw new Error(`Email log ID ${logId} not found.`);
  }

  // Prevent duplicate if already marked as SENT
  if (log.status === 'SENT') {
    return { success: true, message: 'Email has already been delivered to college mail. Duplicate delivery prevented.', log };
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(log.student_id);
  if (!student) {
    throw new Error('Student associated with this email log was not found.');
  }

  const collegeEmail = getStudentCollegeEmail(student);

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
    throw new Error('No confirmed faculty selections found for this student to email.');
  }

  const htmlContent = generateConfirmationEmailHtml(student, selections, collegeEmail);
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"RGMCET Faculty Selection Portal" <no-reply@rgmcet.edu.in>',
      to: collegeEmail,
      subject: log.subject,
      html: htmlContent
    });

    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE email_logs 
      SET recipient_email = ?, status = 'SENT', sent_at = ?, attempt_count = attempt_count + 1, error_message = NULL, updated_at = ? 
      WHERE id = ?
    `).run(collegeEmail, nowIso, nowIso, log.id);

    return { success: true, message: `Email delivered successfully to college email ${collegeEmail} on attempt ${log.attempt_count + 1}!` };
  } catch (err) {
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE email_logs 
      SET recipient_email = ?, status = 'FAILED', attempt_count = attempt_count + 1, error_message = ?, updated_at = ? 
      WHERE id = ?
    `).run(collegeEmail, err.message || 'SMTP delivery failure', nowIso, log.id);

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
  generateConfirmationEmailHtml,
  isStudentSelectionComplete,
  getStudentCollegeEmail,
  getSmtpConfig,
  saveSmtpConfig,
  sendTestEmail
};
