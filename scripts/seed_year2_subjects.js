/**
 * Seed 2nd Year (II-II) Subjects and Initial Faculty Mappings
 */

const { db } = require('../src/config/database');

function seedYear2Subjects(databaseInstance) {
  const d = databaseInstance || db;
  const now = new Date().toISOString();

  console.log('[SeedYear2Subjects] Adding II-II subjects and rounds...');

  const year2Subjects = [
    { code: 'A0010234', name: 'Managerial Economics and Financial Analysis', credits: 2 },
    { code: 'A0019234', name: 'Organizational Behavior', credits: 2 },
    { code: 'A3401234', name: 'Business Environment', credits: 2 },
    { code: 'A0017234', name: 'Probability & Statistics', credits: 3 },
    { code: 'A0509234', name: 'Operating Systems', credits: 3 },
    { code: 'A0507234', name: 'Database Management Systems', credits: 3 },
    { code: 'A0510234', name: 'Software Engineering', credits: 3 },
    { code: 'A0508234', name: 'Full Stack Development – I (SDC)', credits: 2 },
    { code: 'A0577234', name: 'Operating Systems Lab', credits: 1.5 },
    { code: 'A0576234', name: 'Database Management Systems Lab', credits: 1.5 },
    { code: 'A0009234', name: 'Design Thinking & Innovation', credits: 2 }
  ];

  const insertSub = d.prepare(`
    INSERT OR IGNORE INTO subjects (code, name, academic_year, semester, department, credits, created_at)
    VALUES (?, ?, 2, 4, 'Computer Science & Engineering', ?, ?)
  `);

  for (const s of year2Subjects) {
    insertSub.run(s.code, s.name, s.credits, now);
  }

  // Ensure Year 2 Selection Rounds exist for Group 1 and Group 2
  const roundY2G1 = d.prepare("SELECT id FROM selection_rounds WHERE academic_year = 2 AND semester = 4 AND target_group = 'Group 1'").get();
  if (!roundY2G1) {
    d.prepare(`
      INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
      VALUES ('II-II Faculty Selection - Group 1 (501 to 5CT)', 2, 4, 'Group 1', ?, ?, 'DRAFT', ?)
    `).run(now, new Date(Date.now() + 30 * 86400000).toISOString(), now);
  }

  const roundY2G2 = d.prepare("SELECT id FROM selection_rounds WHERE academic_year = 2 AND semester = 4 AND target_group = 'Group 2'").get();
  if (!roundY2G2) {
    d.prepare(`
      INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
      VALUES ('II-II Faculty Selection - Group 2 (5CU to 5JN)', 2, 4, 'Group 2', ?, ?, 'DRAFT', ?)
    `).run(now, new Date(Date.now() + 30 * 86400000).toISOString(), now);
  }

  // Initial Faculty Mapping for Year 2 Core Theory Courses
  const coreY2Codes = ['A0509234', 'A0507234', 'A0510234', 'A0508234', 'A0017234', 'A0010234'];
  const y2Subs = d.prepare(`SELECT id, code FROM subjects WHERE academic_year = 2 AND semester = 4 AND code IN (${coreY2Codes.map(() => '?').join(',')})`).all(...coreY2Codes);
  const facs = d.prepare("SELECT id FROM faculty ORDER BY id LIMIT 30").all();

  const insertMap = d.prepare(`
    INSERT OR IGNORE INTO faculty_subject_mappings (faculty_id, subject_id, academic_year, semester, capacity, target_group, status, created_at)
    VALUES (?, ?, 2, 4, ?, ?, 'ACTIVE', ?)
  `);

  // Map 3 faculties per course for Group 1 (capacity 65) and Group 2 (capacity 65)
  y2Subs.forEach((sub, sIdx) => {
    const f1 = facs[(sIdx * 3 + 12) % facs.length];
    const f2 = facs[(sIdx * 3 + 13) % facs.length];
    const f3 = facs[(sIdx * 3 + 14) % facs.length];

    [f1, f2, f3].forEach(f => {
      if (f) {
        insertMap.run(f.id, sub.id, 65, 'Group 1', now);
        insertMap.run(f.id, sub.id, 65, 'Group 2', now);
      }
    });
  });

  console.log('[SeedYear2Subjects] Completed II-II subjects, rounds, and dynamic mappings setup.');
}

if (require.main === module) {
  seedYear2Subjects(db);
}

module.exports = { seedYear2Subjects };
