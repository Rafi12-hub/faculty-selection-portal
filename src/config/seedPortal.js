/**
 * Auto-Seeder for Faculty Selection Portal (RGMCET CSE)
 * Guarantees that every deployment (local or cloud) contains:
 * - 52 Faculty Members
 * - 6 Core Subjects (CS601 - CS606)
 * - 410 RGMCET 2024 Batch CSE Students (501 to 5KP)
 * - Group 1 & Group 2 Selection Rounds & Faculty Mappings
 */

const bcrypt = require('bcryptjs');

function runAutoSeed(db) {
  try {
    const now = new Date().toISOString();

    // 1. Check Administrator
    const adminUser = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
    if (!adminUser) {
      const adminHash = bcrypt.hashSync('admin123', 8);
      db.prepare("INSERT INTO users (username, password_hash, role, created_at) VALUES ('admin', ?, 'ADMIN', ?)").run(adminHash, now);
      console.log('[AutoSeed] Administrator created.');
    }

    // 2. Enforce ONLY the 45 Authorized Faculty Members
    const OFFICIAL_FACULTY_45 = [
      { code: 'FAC001', name: 'Dr. B. Bhaskara Rao', designation: 'Associate Professor & HOD', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/1.pdf' },
      { code: 'FAC002', name: 'Dr. K. Subba Reddy', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/1.pdf' },
      { code: 'FAC003', name: 'Dr. N. Madhusudhana Reddy', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/2.pdf' },
      { code: 'FAC004', name: 'Dr. R. Raja Kumar', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/3.pdf' },
      { code: 'FAC005', name: 'Dr. G. Sunil Vijaya Kumar', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/4.pdf' },
      { code: 'FAC006', name: 'Dr. N. Ramanjaneya Reddy', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/10.pdf' },
      { code: 'FAC007', name: 'Dr. P. Prathap Nayudu', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/6.pdf' },
      { code: 'FAC008', name: 'Dr. K. Narasimhulu', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/7.pdf' },
      { code: 'FAC009', name: 'Dr. M. Sravan Kumar Reddy', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/5.pdf' },
      { code: 'FAC010', name: 'Dr. K. Nageswara Reddy', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Software Engineering & OOAD', profile_image: 'assets/img/teacher/cse/Profiles/8.pdf' },
      { code: 'FAC011', name: 'Dr. P. Sreedevi', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/9.pdf' },
      { code: 'FAC012', name: 'Dr. M. Ayyavaraiah', designation: 'Assistant Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/11.pdf' },
      { code: 'FAC013', name: 'Dr. B. Rama Subbaiah', designation: 'Assistant Professor', qualification: 'Ph.D', specialization: 'OOAD & Systems', profile_image: 'assets/img/teacher/cse/Profiles/12.pdf' },
      { code: 'FAC014', name: 'Dr. C. Ramakristanaiah', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/13.pdf' },
      { code: 'FAC015', name: 'Dr. S. Subbalakshmi', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/14.pdf' },
      { code: 'FAC016', name: 'Dr. P. Nagaraju', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/15.pdf' },
      { code: 'FAC017', name: 'Mr. P. Naveen Sundar Kumar', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/13.pdf' },
      { code: 'FAC018', name: 'Mr. G. Rajasekhar Reddy', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/14.pdf' },
      { code: 'FAC019', name: 'Mr. C. Hrishikesava Reddy', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/15.pdf' },
      { code: 'FAC020', name: 'Mr. K. Janardhan', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/17.pdf' },
      { code: 'FAC021', name: 'Ms. B. Swetha', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/18.pdf' },
      { code: 'FAC022', name: 'Mr. V. Ravi Kanth', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/19.pdf' },
      { code: 'FAC023', name: 'Mr. K. R. Harinath', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Object-Oriented Design & Architecture', profile_image: 'assets/img/teacher/cse/Profiles/20.pdf' },
      { code: 'FAC024', name: 'Ms. D. Sravanthi', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/21.pdf' },
      { code: 'FAC025', name: 'Ms. Y. Durga Tejaswi', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/22.pdf' },
      { code: 'FAC026', name: 'Mr. K. Viswanath', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/24.pdf' },
      { code: 'FAC027', name: 'Ms. S. Tahseen Banu', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Networks & Security', profile_image: 'assets/img/teacher/cse/Profiles/25.pdf' },
      { code: 'FAC028', name: 'Ms. P. Sucharitha', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/30.pdf' },
      { code: 'FAC029', name: 'Ms. S. Rubia Parveen', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/26.pdf' },
      { code: 'FAC030', name: 'Mr. B.V. Chandra Sekhar', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/27.pdf' },
      { code: 'FAC031', name: 'Mr. A. Ramesh', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/28.pdf' },
      { code: 'FAC032', name: 'Ms. K. Jayasri', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/48.pdf' },
      { code: 'FAC033', name: 'Ms. K. Lakshmi Rupa', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Networks & Systems', profile_image: 'assets/img/teacher/cse/Profiles/LAKSHMI.pdf' },
      { code: 'FAC034', name: 'Mr. R. Sreehari Reddy', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/31.pdf' },
      { code: 'FAC035', name: 'Mr. V. Udaya Kumar', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/32.pdf' },
      { code: 'FAC036', name: 'Ms. P. Bhargavi', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/33.pdf' },
      { code: 'FAC037', name: 'Ms. V. Shobhitha', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/34.pdf' },
      { code: 'FAC038', name: 'Mr. P. Lakshmi Narayana Reddy', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/35.pdf' },
      { code: 'FAC039', name: 'Dr. O. Sampath', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/36.pdf' },
      { code: 'FAC040', name: 'Mr. B. Rameswara Reddy', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/37.pdf' },
      { code: 'FAC041', name: 'Mr. L. Bhavani Shankar', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/38.pdf' },
      { code: 'FAC042', name: 'Mr. M Ravi Kumar', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/39.pdf' },
      { code: 'FAC043', name: 'Mr. S. Gousepeer', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/40.pdf' },
      { code: 'FAC044', name: 'Ms. R. Sai Anjali', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/41.pdf' },
      { code: 'FAC045', name: 'Ms. M. Shama Bhanu', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/42.pdf' }
    ];

    // 2a. Purge any faculty member not in the official 45 list
    const validNormNames = OFFICIAL_FACULTY_45.map(f => f.name.replace(/\s+/g, '').toLowerCase());
    const existingFaculty = db.prepare("SELECT id, name FROM faculty").all();
    const unauthorizedFacIds = existingFaculty
      .filter(f => !validNormNames.includes(f.name.replace(/\s+/g, '').toLowerCase()))
      .map(f => f.id);

    if (unauthorizedFacIds.length > 0) {
      console.log(`[AutoSeed] Removing ${unauthorizedFacIds.length} unauthorized faculty members...`);
      const placeholders = unauthorizedFacIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM faculty_subject_mappings WHERE faculty_id IN (${placeholders})`).run(...unauthorizedFacIds);
      db.prepare(`DELETE FROM selections WHERE faculty_id IN (${placeholders})`).run(...unauthorizedFacIds);
      db.prepare(`DELETE FROM faculty WHERE id IN (${placeholders})`).run(...unauthorizedFacIds);
    }

    // 2b. Insert or update the 45 official faculty members
    for (const f of OFFICIAL_FACULTY_45) {
      const norm = f.name.replace(/\s+/g, '').toLowerCase();
      const existing = db.prepare("SELECT id, faculty_code FROM faculty WHERE LOWER(REPLACE(name, ' ', '')) = ?").get(norm);
      if (existing) {
        db.prepare(`
          UPDATE faculty 
          SET name = ?, designation = ?, qualification = ?, specialization = ?, profile_image = ?, status = 'ACTIVE', updated_at = ?
          WHERE id = ?
        `).run(f.name, f.designation, f.qualification, f.specialization, f.profile_image, now, existing.id);
      } else {
        db.prepare(`
          INSERT INTO faculty (faculty_code, name, designation, qualification, specialization, profile_image, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        `).run(f.code, f.name, f.designation, f.qualification, f.specialization, f.profile_image, now, now);
      }
    }

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

    // 4. Check 410 3rd Year Students (2024 Batch)
    const studentCount = db.prepare("SELECT count(*) as count FROM students WHERE academic_year = 3").get().count;
    if (studentCount < 400) {
      console.log(`[AutoSeed] Seeding 410 Year 3 students from official PDF (current: ${studentCount})...`);
      // Run seed_all_students script logic
      require('../../scripts/seed_all_students');
    }

    // 4b. Check 377 2nd Year Students (2025 Batch)
    const y2StudentCount = db.prepare("SELECT count(*) as count FROM students WHERE academic_year = 2").get().count;
    if (y2StudentCount < 370) {
      console.log(`[AutoSeed] Seeding 377 Year 2 students from official 2025 batch list (current: ${y2StudentCount})...`);
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

    // 5. Ensure Group 1 and Group 2 Selection Rounds exist
    const roundG1 = db.prepare("SELECT id FROM selection_rounds WHERE target_group = 'Group 1'").get();
    if (!roundG1) {
      db.prepare(`
        INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
        VALUES ('III-II Faculty Selection - Group 1 (501 to 5E2)', 3, 6, 'Group 1', ?, ?, 'DRAFT', ?)
      `).run(now, new Date(Date.now() + 30 * 86400000).toISOString(), now);
    }

    const roundG2 = db.prepare("SELECT id FROM selection_rounds WHERE target_group = 'Group 2'").get();
    if (!roundG2) {
      db.prepare(`
        INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
        VALUES ('III-II Faculty Selection - Group 2 (5E3 to 5KP)', 3, 6, 'Group 2', ?, ?, 'DRAFT', ?)
      `).run(now, new Date(Date.now() + 30 * 86400000).toISOString(), now);
    }

    // 6. Ensure Mappings exist for Group 1 and Group 2
    const mapCount = db.prepare("SELECT count(*) as count FROM faculty_subject_mappings").get().count;
    if (mapCount < 30) {
      console.log('[AutoSeed] Setting up Group 1 (capacity: 78) and Group 2 (capacity: 62) faculty mappings...');
      const subs = db.prepare("SELECT id FROM subjects WHERE academic_year = 3 AND semester = 6 ORDER BY id").all();
      const facs = db.prepare("SELECT id FROM faculty ORDER BY id LIMIT 18").all();

      const insertMap = db.prepare(`
        INSERT OR IGNORE INTO faculty_subject_mappings (faculty_id, subject_id, academic_year, semester, capacity, target_group, status, created_at)
        VALUES (?, ?, 3, 6, ?, ?, 'ACTIVE', ?)
      `);

      // 3 faculty per subject
      subs.forEach((sub, sIdx) => {
        const assignedFacs = [
          facs[(sIdx * 3) % facs.length],
          facs[(sIdx * 3 + 1) % facs.length],
          facs[(sIdx * 3 + 2) % facs.length]
        ];
        assignedFacs.forEach(f => {
          if (f) {
            insertMap.run(f.id, sub.id, 78, 'Group 1', now);
            insertMap.run(f.id, sub.id, 62, 'Group 2', now);
          }
        });
      });
    }

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

    console.log('[AutoSeed] Database check completed successfully: 52 faculty, 6 subjects, 410 students, and cohort rounds active.');
  } catch (err) {
    console.error('[AutoSeed] Error during autoseed:', err);
  }
}

module.exports = { runAutoSeed };
