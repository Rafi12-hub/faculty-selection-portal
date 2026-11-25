const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'fssp.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode, foreign keys, and busy timeout for high-concurrency FCFS
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');
db.exec('PRAGMA synchronous = NORMAL;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'STUDENT')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reg_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      academic_year INTEGER NOT NULL CHECK(academic_year BETWEEN 1 AND 4),
      semester INTEGER NOT NULL CHECK(semester BETWEEN 1 AND 8),
      section TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      qualification TEXT NOT NULL,
      specialization TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      profile_image TEXT,
      description TEXT,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      academic_year INTEGER NOT NULL CHECK(academic_year BETWEEN 1 AND 4),
      semester INTEGER NOT NULL CHECK(semester BETWEEN 1 AND 8),
      department TEXT DEFAULT 'Computer Science & Engineering',
      credits INTEGER DEFAULT 3,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS selection_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      academic_year INTEGER NOT NULL CHECK(academic_year BETWEEN 1 AND 4),
      semester INTEGER NOT NULL CHECK(semester BETWEEN 1 AND 8),
      target_group TEXT DEFAULT 'ALL',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faculty_subject_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
      academic_year INTEGER NOT NULL CHECK(academic_year BETWEEN 1 AND 4),
      semester INTEGER NOT NULL CHECK(semester BETWEEN 1 AND 8),
      capacity INTEGER NOT NULL CHECK(capacity >= 0),
      target_group TEXT DEFAULT 'ALL',
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL,
      UNIQUE(faculty_id, subject_id, academic_year, semester, target_group)
    );

    CREATE TABLE IF NOT EXISTS selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
      subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
      faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
      mapping_id INTEGER NOT NULL REFERENCES faculty_subject_mappings(id) ON DELETE RESTRICT,
      selection_round_id INTEGER REFERENCES selection_rounds(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'CONFIRMED' CHECK(status IN ('CONFIRMED', 'CANCELLED')),
      reserved_at TEXT NOT NULL,
      cancelled_at TEXT,
      cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      cancellation_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_selections_mapping_status ON selections(mapping_id, status);
    CREATE INDEX IF NOT EXISTS idx_selections_student ON selections(student_id, status);
    CREATE INDEX IF NOT EXISTS idx_mappings_subject_sem ON faculty_subject_mappings(subject_id, academic_year, semester, status);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

    -- Open Elective Selection Tables for 3rd Year Students
    CREATE TABLE IF NOT EXISTS open_electives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      academic_year INTEGER DEFAULT 3 CHECK(academic_year BETWEEN 1 AND 4),
      semester INTEGER DEFAULT 6,
      branch TEXT DEFAULT 'CSE',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS open_elective_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      elective_id INTEGER NOT NULL REFERENCES open_electives(id) ON DELETE CASCADE,
      subject_code TEXT,
      subject_name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS open_elective_faculty_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL REFERENCES open_elective_subjects(id) ON DELETE CASCADE,
      faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
      max_capacity INTEGER NOT NULL DEFAULT 65 CHECK(max_capacity >= 0),
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      UNIQUE(subject_id, faculty_id)
    );

    CREATE TABLE IF NOT EXISTS open_elective_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
      elective_id INTEGER NOT NULL REFERENCES open_electives(id) ON DELETE RESTRICT,
      subject_id INTEGER NOT NULL REFERENCES open_elective_subjects(id) ON DELETE RESTRICT,
      faculty_assignment_id INTEGER NOT NULL REFERENCES open_elective_faculty_assignments(id) ON DELETE RESTRICT,
      faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
      registration_timestamp TEXT NOT NULL,
      status TEXT DEFAULT 'CONFIRMED' CHECK(status IN ('CONFIRMED', 'CANCELLED')),
      UNIQUE(student_id, elective_id)
    );

    CREATE INDEX IF NOT EXISTS idx_oe_reg_assignment ON open_elective_registrations(faculty_assignment_id, status);
    CREATE INDEX IF NOT EXISTS idx_oe_reg_student ON open_elective_registrations(student_id, elective_id, status);
    CREATE INDEX IF NOT EXISTS idx_oe_subjects_elective ON open_elective_subjects(elective_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_oe_faculty_subject ON open_elective_faculty_assignments(subject_id, is_active);

    -- Automatic Email Notifications & Audit Trail
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      email_type TEXT NOT NULL DEFAULT 'SELECTION_CONFIRMATION',
      status TEXT NOT NULL CHECK(status IN ('SENT', 'FAILED', 'PENDING')),
      attempt_count INTEGER NOT NULL DEFAULT 1,
      error_message TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_email_logs_student ON email_logs(student_id, status);
    CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
    CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  // Migration: Add elective_group and parent_subject_id to subjects table
  try {
    db.prepare("ALTER TABLE subjects ADD COLUMN elective_group TEXT DEFAULT NULL").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE subjects ADD COLUMN parent_subject_id INTEGER REFERENCES subjects(id)").run();
  } catch (e) {}

  // Ensure Open Elective subjects exist directly in the subjects table
  const seedOESubjects = [
    // Open Elective – I
    { code: 'OE301', name: 'DevOps Practices & Cloud Automation', elective_group: 'OE1', academic_year: 3, semester: 6 },
    { code: 'OE302', name: 'Introduction to Cyber Security & Forensics', elective_group: 'OE1', academic_year: 3, semester: 6 },
    { code: 'OE303', name: 'Data Science Essentials & Analytics', elective_group: 'OE1', academic_year: 3, semester: 6 },
    // Open Elective – II
    { code: 'OE304', name: 'Cloud Infrastructure & Kubernetes', elective_group: 'OE2', academic_year: 3, semester: 6 },
    { code: 'OE305', name: 'Full Stack Development with MERN', elective_group: 'OE2', academic_year: 3, semester: 6 },
    { code: 'OE306', name: 'Artificial Intelligence & Machine Learning', elective_group: 'OE2', academic_year: 3, semester: 6 }
  ];

  const nowTime = new Date().toISOString();
  const insertSubStmt = db.prepare(`
    INSERT INTO subjects (code, name, academic_year, semester, department, credits, status, elective_group, created_at)
    VALUES (?, ?, ?, ?, 'Computer Science & Engineering', 3, 'ACTIVE', ?, ?)
  `);
  const updateSubElectiveStmt = db.prepare(`
    UPDATE subjects SET elective_group = ? WHERE code = ?
  `);

  for (const s of seedOESubjects) {
    const existing = db.prepare('SELECT id, elective_group FROM subjects WHERE code = ?').get(s.code);
    if (!existing) {
      insertSubStmt.run(s.code, s.name, s.academic_year, s.semester, s.elective_group, nowTime);
    } else if (existing.elective_group !== s.elective_group) {
      updateSubElectiveStmt.run(s.elective_group, s.code);
    }
  }

  // Ensure mappings exist separately for Group 1 (Group A) and Group 2 (Group B)
  const oeFacultyPairs = [
    { code: 'OE301', facCodes: ['FAC001', 'FAC002', 'FAC003'] },
    { code: 'OE302', facCodes: ['FAC005', 'FAC006', 'FAC007'] },
    { code: 'OE303', facCodes: ['FAC004', 'FAC009', 'FAC010'] },
    { code: 'OE304', facCodes: ['FAC011', 'FAC012', 'FAC013'] },
    { code: 'OE305', facCodes: ['FAC014', 'FAC015', 'FAC016'] },
    { code: 'OE306', facCodes: ['FAC008', 'FAC018', 'FAC019'] }
  ];

  const insertMappingStmt = db.prepare(`
    INSERT OR IGNORE INTO faculty_subject_mappings (
      faculty_id, subject_id, academic_year, semester, capacity, target_group, status, created_at
    ) VALUES (?, ?, 3, 6, ?, ?, 'ACTIVE', ?)
  `);

  const groups = [
    { name: 'Group 1', capacity: 78 },
    { name: 'Group 2', capacity: 62 }
  ];

  for (const item of oeFacultyPairs) {
    const sub = db.prepare('SELECT id FROM subjects WHERE code = ?').get(item.code);
    if (!sub) continue;
    for (const fCode of item.facCodes) {
      const f = db.prepare('SELECT id FROM faculty WHERE faculty_code = ?').get(fCode);
      if (!f) continue;
      for (const grp of groups) {
        insertMappingStmt.run(f.id, sub.id, grp.capacity, grp.name, nowTime);
      }
    }
  }

  // Ensure legacy placeholder subjects CS604 and CS605 are deactivated in favor of OE subjects
  try {
    db.prepare("UPDATE subjects SET status = 'INACTIVE' WHERE code IN ('CS604', 'CS605')").run();
  } catch (e) {}

  // Ensure default administrator account exists
  const adminCheck = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('ADMIN');
  if (!adminCheck) {
    const passwordHash = bcrypt.hashSync('deptcse', 10);
    const now = new Date().toISOString();
    const insertAdmin = db.prepare('INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)');
    const result = insertAdmin.run('cse@rgmcet.edu.in', passwordHash, 'ADMIN', now);
    
    // Log creation in audit logs
    const logStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    logStmt.run(result.lastInsertRowid, 'SYSTEM_INIT', 'SYSTEM', null, 'Initial administrator account created (username: cse@rgmcet.edu.in)', '127.0.0.1', now);
    console.log('Default administrator account created with username: cse@rgmcet.edu.in');
  }
}

// Transaction wrapper for atomic operations
function withTransaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

initDatabase();

module.exports = {
  db,
  withTransaction
};
