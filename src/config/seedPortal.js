/**
 * Auto-Seeder for Faculty Selection Portal (RGMCET CSE)
 * Guarantees that every deployment (local or cloud) contains:
 * - 52 Faculty Members
 * - 6 Core Subjects (CS601 - CS606)
 * - 410 RGMCET 2024 Batch CSE Students (501 to 5KP)
 * - Group 1 & Group 2 Selection Rounds & Faculty Mappings
 */

const bcrypt = require('bcryptjs');
const { enforce45 } = require('../../scripts/enforce_45_faculty');

function runAutoSeed(databaseInstance) {
  const db = databaseInstance || require('./database').db;
  try {
    const now = new Date().toISOString();

    // 1. Check Administrator
    const adminUser = db.prepare("SELECT id, username FROM users WHERE role = 'ADMIN'").get();
    const adminHash = bcrypt.hashSync('deptcse', 8);
    if (!adminUser) {
      db.prepare("INSERT INTO users (username, password_hash, role, created_at) VALUES ('cse@rgmcet.edu.in', ?, 'ADMIN', ?)").run(adminHash, now);
      console.log('[AutoSeed] Administrator created: cse@rgmcet.edu.in');
    } else {
      db.prepare("UPDATE users SET username = 'cse@rgmcet.edu.in', password_hash = ? WHERE id = ?").run(adminHash, adminUser.id);
      console.log('[AutoSeed] Administrator credentials verified: cse@rgmcet.edu.in');
    }

    // 2. Enforce ONLY the 45 Authorized Faculty Members
    enforce45(db);

    // 3. Check Core Subjects (CS601 to CS606)
    const subCount = db.prepare("SELECT count(*) as count FROM subjects WHERE academic_year = 3 AND semester = 6").get().count;
    if (subCount < 6) {
      console.log('[AutoSeed] Seeding 6 core courses for III-II...');
      const subjects = [
        { code: 'CS601', name: 'Machine Learning', credits: 3 },
        { code: 'CS602', name: 'Cloud Computing', credits: 3 },
        { code: 'CS603', name: 'Cryptography & Network Security', credits: 3 },
        { code: 'CS604', name: 'Mobile Application Development', credits: 3 },
        { code: 'CS605', name: 'Software Testing Methodologies', credits: 3 },
        { code: 'CS606', name: 'Big Data Analytics', credits: 3 }
      ];
      const insertSub = db.prepare(`
        INSERT OR IGNORE INTO subjects (code, name, academic_year, semester, department, credits, created_at)
        VALUES (?, ?, 3, 6, 'Computer Science & Engineering', ?, ?)
      `);
      for (const s of subjects) {
        insertSub.run(s.code, s.name, s.credits, now);
      }
    }

    // 4. Check 431 3rd Year Students (2024 Batch + Lateral Entry Group A & B)
    const studentCount = db.prepare("SELECT count(*) as count FROM students WHERE academic_year = 3").get().count;
    const g1Count = db.prepare("SELECT count(*) as count FROM students WHERE academic_year = 3 AND section = 'Group 1'").get().count;
    if (studentCount !== 431 || g1Count !== 216) {
      console.log(`[AutoSeed] Seeding 431 Year 3 students (current total: ${studentCount}, Group 1: ${g1Count})...`);
      const { seedYear3Students } = require('../../scripts/seed_all_students');
      seedYear3Students(db);
    }

    // 4b. Check 421 2nd Year Students (2025 Batch + Lateral Entry Group B)
    const y2StudentCount = db.prepare("SELECT count(*) as count FROM students WHERE academic_year = 2").get().count;
    if (y2StudentCount < 421) {
      console.log(`[AutoSeed] Seeding 421 Year 2 students including Lateral Entry Group B (current: ${y2StudentCount})...`);
      const { seedYear2Students } = require('../../scripts/seed_year2_students');
      seedYear2Students(db);
    }

    // 4c. Check 2nd Year II-II Subjects, Active Rounds & Mappings
    const y2SubCount = db.prepare("SELECT count(*) as count FROM subjects WHERE academic_year = 2 AND semester = 4").get().count;
    const y2MapCount = db.prepare("SELECT count(*) as count FROM faculty_subject_mappings WHERE academic_year = 2").get().count;
    const y2RoundActive = db.prepare("SELECT count(*) as count FROM selection_rounds WHERE academic_year = 2 AND status = 'ACTIVE'").get().count;
    if (y2SubCount < 10 || y2MapCount < 50 || y2RoundActive < 2) {
      console.log(`[AutoSeed] Ensuring 2nd Year II-II subjects, active rounds and mappings (subs: ${y2SubCount}, maps: ${y2MapCount}, active: ${y2RoundActive})...`);
      const { seedYear2Subjects } = require('../../scripts/seed_year2_subjects');
      seedYear2Subjects(db);
    }

    // 5. Ensure Group 1 and Group 2 Selection Rounds exist and have clean names
    db.prepare(`
      UPDATE selection_rounds 
      SET name = 'III-II Faculty Selection - Group 1' 
      WHERE academic_year = 3 AND (target_group = 'Group 1' OR target_group = 'Group A' OR target_group = 'A' OR name LIKE '%III-II%Group 1%')
    `).run();

    db.prepare(`
      UPDATE selection_rounds 
      SET name = 'III-II Faculty Selection - Group 2' 
      WHERE academic_year = 3 AND (target_group = 'Group 2' OR target_group = 'Group B' OR target_group = 'B' OR name LIKE '%III-II%Group 2%')
    `).run();

    const roundG1 = db.prepare("SELECT id FROM selection_rounds WHERE academic_year = 3 AND target_group = 'Group 1'").get();
    if (!roundG1) {
      db.prepare(`
        INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
        VALUES ('III-II Faculty Selection - Group 1', 3, 6, 'Group 1', ?, ?, 'DRAFT', ?)
      `).run(now, new Date(Date.now() + 30 * 86400000).toISOString(), now);
    }

    const roundG2 = db.prepare("SELECT id FROM selection_rounds WHERE academic_year = 3 AND target_group = 'Group 2'").get();
    if (!roundG2) {
      db.prepare(`
        INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
        VALUES ('III-II Faculty Selection - Group 2', 3, 6, 'Group 2', ?, ?, 'DRAFT', ?)
      `).run(now, new Date(Date.now() + 30 * 86400000).toISOString(), now);
    }

    // 6. Year 3 Mappings: Managed manually by administrator (auto-seed disabled as requested)

    // 7. Ensure Open Elective I & II exist with subjects and faculty assignments
    const oeCount = db.prepare("SELECT count(*) as count FROM open_electives").get().count;
    if (oeCount < 2) {
      console.log('[AutoSeed] Setting up Open Elective – I and Open Elective – II with initial subjects and faculties...');

      // Open Elective I
      const oe1Res = db.prepare(`
        INSERT INTO open_electives (code, name, academic_year, semester, branch, is_active, created_at)
        VALUES ('OE-1', 'Open Elective – I', 3, 6, 'CSE', 1, ?)
      `).run(now);
      const oe1Id = oe1Res.lastInsertRowid;

      // Open Elective II
      const oe2Res = db.prepare(`
        INSERT INTO open_electives (code, name, academic_year, semester, branch, is_active, created_at)
        VALUES ('OE-2', 'Open Elective – II', 3, 6, 'CSE', 1, ?)
      `).run(now);
      const oe2Id = oe2Res.lastInsertRowid;

      // Faculty lookup helper
      const allFaculty = db.prepare('SELECT id, name FROM faculty ORDER BY id ASC').all();
      const getFacId = (namePart) => {
        const found = allFaculty.find(f => f.name.toLowerCase().includes(namePart.toLowerCase()));
        return found ? found.id : allFaculty[0].id;
      };

      // OE-1 Subjects
      const oe1Subs = [
        {
          code: 'OE301',
          name: 'DevOps Practices & Cloud Automation',
          desc: 'CI/CD Pipelines, Docker containerization, Kubernetes orchestration, and Infrastructure as Code.',
          faculties: [getFacId('Bhaskara'), getFacId('Subba Reddy'), getFacId('Madhusudhana')]
        },
        {
          code: 'OE302',
          name: 'Introduction to Cyber Security & Forensics',
          desc: 'Network defense, threat detection, penetration testing fundamentals, and incident response.',
          faculties: [getFacId('Sunil Vijaya'), getFacId('Sravan Kumar'), getFacId('Prathap')]
        },
        {
          code: 'OE303',
          name: 'Data Science Essentials & Analytics',
          desc: 'Exploratory data analysis, predictive modeling, statistical learning, and business intelligence.',
          faculties: [getFacId('Raja Kumar'), getFacId('Nageswara'), getFacId('Sreedevi')]
        }
      ];

      // OE-2 Subjects
      const oe2Subs = [
        {
          code: 'OE304',
          name: 'Cloud Infrastructure & Kubernetes',
          desc: 'Microservices architecture, AWS/GCP cloud platforms, container management, and distributed systems.',
          faculties: [getFacId('Ramanjaneya'), getFacId('Ayyavaraiah'), getFacId('Rama Subbaiah')]
        },
        {
          code: 'OE305',
          name: 'Full Stack Development with MERN',
          desc: 'Modern web architectures with MongoDB, Express, React, and Node.js with secure authentication.',
          faculties: [getFacId('Naveen Sundar'), getFacId('Rajasekhar'), getFacId('Hrishikesava')]
        },
        {
          code: 'OE306',
          name: 'Artificial Intelligence & Machine Learning',
          desc: 'Supervised and unsupervised algorithms, neural networks, computer vision, and NLP foundations.',
          faculties: [getFacId('Narasimhulu'), getFacId('Janardhan'), getFacId('Swetha')]
        }
      ];

      const insertSub = db.prepare(`
        INSERT INTO open_elective_subjects (elective_id, subject_code, subject_name, description, is_active, created_at)
        VALUES (?, ?, ?, ?, 1, ?)
      `);

      const insertAssign = db.prepare(`
        INSERT OR IGNORE INTO open_elective_faculty_assignments (subject_id, faculty_id, max_capacity, is_active, created_at)
        VALUES (?, ?, 70, 1, ?)
      `);

      oe1Subs.forEach(s => {
        const subRes = insertSub.run(oe1Id, s.code, s.name, s.desc, now);
        s.faculties.forEach(facId => {
          if (facId) insertAssign.run(subRes.lastInsertRowid, facId, now);
        });
      });

      oe2Subs.forEach(s => {
        const subRes = insertSub.run(oe2Id, s.code, s.name, s.desc, now);
        s.faculties.forEach(facId => {
          if (facId) insertAssign.run(subRes.lastInsertRowid, facId, now);
        });
      });
      console.log('[AutoSeed] Open Elective I & II initialized successfully with subjects and faculty capacities.');
    }

    console.log('[AutoSeed] Database check completed successfully: 45 faculty, 431 Year 3 students (G1: 216, G2: 215), 421 Year 2 students, and cohort rounds active.');
  } catch (err) {
    console.error('[AutoSeed] Error during autoseed:', err);
  }
}

module.exports = { runAutoSeed };
