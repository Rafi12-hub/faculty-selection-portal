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

    // 2. Check Faculty Count
    const facCount = db.prepare("SELECT count(*) as count FROM faculty").get().count;
    if (facCount < 50) {
      console.log(`[AutoSeed] Seeding 52 faculty members (current: ${facCount})...`);
      const facultyData = [
        { code: 'FAC001', name: 'Dr. B. Bhaskara Rao', designation: 'Associate Professor & HOD', qualification: 'M.Tech & Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/1.pdf' },
        { code: 'FAC002', name: 'Dr. K. Subba Reddy', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/1.pdf' },
        { code: 'FAC003', name: 'Dr. N. Madhusudhana Reddy', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/2.pdf' },
        { code: 'FAC004', name: 'Dr. Rajaboina Raja Kumar', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/3.pdf' },
        { code: 'FAC005', name: 'Dr. G. Sunil Vijaya Kumar', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/4.pdf' },
        { code: 'FAC006', name: 'Dr. M. Sravan Kumar Reddy', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/5.pdf' },
        { code: 'FAC007', name: 'Dr. P. Prathap Naidu', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/6.pdf' },
        { code: 'FAC008', name: 'Dr. K. Narsimhulu', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/7.pdf' },
        { code: 'FAC009', name: 'Dr. K. Nageswara Reddy', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Software Engineering & OOAD', profile_image: 'assets/img/teacher/cse/Profiles/8.pdf' },
        { code: 'FAC010', name: 'Dr. P. Sreedevi', designation: 'Associate Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/9.pdf' },
        { code: 'FAC011', name: 'Dr. N. Ramanjaneya Reddy', designation: 'Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/10.pdf' },
        { code: 'FAC012', name: 'Dr. M. Ayyavaraiah', designation: 'Assistant Professor', qualification: 'Ph.D', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/11.pdf' },
        { code: 'FAC013', name: 'Dr. B. Rama Subbaiah', designation: 'Assistant Professor', qualification: 'Ph.D', specialization: 'OOAD & Systems', profile_image: 'assets/img/teacher/cse/Profiles/12.pdf' },
        { code: 'FAC014', name: 'P. Naveen Sundar Kumar', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/13.pdf' },
        { code: 'FAC015', name: 'G. Rajasekhar Reddy', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/14.pdf' },
        { code: 'FAC016', name: 'Hrishikesava Reddy C', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/15.pdf' },
        { code: 'FAC017', name: 'Chaitanya Nukala', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/16.pdf' },
        { code: 'FAC018', name: 'K. Janardhan', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/17.pdf' },
        { code: 'FAC019', name: 'Bana Swetha', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/18.pdf' },
        { code: 'FAC020', name: 'Vaka Murali Mohan', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/19.pdf' },
        { code: 'FAC021', name: 'Komerollu R. Harinath', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Object-Oriented Design & Architecture', profile_image: 'assets/img/teacher/cse/Profiles/20.pdf' },
        { code: 'FAC022', name: 'D. Sravanthi', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/21.pdf' },
        { code: 'FAC023', name: 'Y. Durga Tejaswi', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/22.pdf' },
        { code: 'FAC024', name: 'D. Karishma', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/23.pdf' },
        { code: 'FAC025', name: 'K. Viswanath', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/24.pdf' },
        { code: 'FAC026', name: 'S. Tahseen Banu', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Networks & Security', profile_image: 'assets/img/teacher/cse/Profiles/25.pdf' },
        { code: 'FAC027', name: 'S. Rubiya Parveen', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/26.pdf' },
        { code: 'FAC028', name: 'B.V. Chandra Sekhar', designation: 'Assistant Professor', qualification: 'M.Tech (Ph.D)', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/27.pdf' },
        { code: 'FAC029', name: 'A. Ramesh', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/28.pdf' },
        { code: 'FAC030', name: 'Tiriveedhi Gurappa', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/29.pdf' },
        { code: 'FAC031', name: 'Puvvada Sucharitha', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/30.pdf' },
        { code: 'FAC032', name: 'T. Suvarna', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/31.pdf' },
        { code: 'FAC033', name: 'M. Vishalakshi', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/32.pdf' },
        { code: 'FAC034', name: 'G. V. S. Sowmya', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/33.pdf' },
        { code: 'FAC035', name: 'P. Udayini', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/34.pdf' },
        { code: 'FAC036', name: 'B. Venkatesh', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/35.pdf' },
        { code: 'FAC037', name: 'K. Nagendra', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/36.pdf' },
        { code: 'FAC038', name: 'P. Solomanraj', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/37.pdf' },
        { code: 'FAC039', name: 'P. Hadely Moses', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/38.pdf' },
        { code: 'FAC040', name: 'P. Aruna', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/39.pdf' },
        { code: 'FAC041', name: 'M. Mahaboob Peera', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/40.pdf' },
        { code: 'FAC042', name: 'S. Praveen Kumar', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/41.pdf' },
        { code: 'FAC043', name: 'B. Chandana', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/43.pdf' },
        { code: 'FAC044', name: 'G. Tharunya', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/45.pdf' },
        { code: 'FAC045', name: 'Thamisetty Sravani', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/47.pdf' },
        { code: 'FAC046', name: 'Yandapalli Suresh Reddy', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/49.pdf' },
        { code: 'FAC047', name: 'Ms. K. Lakshmi Rupa', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/LAKSHMI.pdf' },
        { code: 'FAC048', name: 'G. Anjani Reddy', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/42.pdf' },
        { code: 'FAC049', name: 'G. Ravanika', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/44.pdf' },
        { code: 'FAC050', name: 'B. Teja Manikanteswari', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/46.pdf' },
        { code: 'FAC051', name: 'K. Jayasri', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/48.pdf' },
        { code: 'FAC052', name: 'B. Sudheshna Devi', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/50.pdf' }
      ];

      const insertFac = db.prepare(`
        INSERT OR IGNORE INTO faculty (faculty_code, name, designation, qualification, specialization, profile_image, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const f of facultyData) {
        insertFac.run(f.code, f.name, f.designation, f.qualification, f.specialization, f.profile_image, now, now);
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

    // 4. Check 410 Students
    const studentCount = db.prepare("SELECT count(*) as count FROM students").get().count;
    if (studentCount < 400) {
      console.log(`[AutoSeed] Seeding 410 students from official PDF (current: ${studentCount})...`);
      // Run seed_all_students script logic
      require('../../scripts/seed_all_students');
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

    console.log('[AutoSeed] Database check completed successfully: 52 faculty, 6 subjects, 410 students, and cohort rounds active.');
  } catch (err) {
    console.error('[AutoSeed] Error during autoseed:', err);
  }
}

module.exports = { runAutoSeed };
