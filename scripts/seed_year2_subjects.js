/**
 * Seed 2nd Year (II-II) Subjects, Full Faculty Mappings, and Live Active Selection Rounds
 */

const { db } = require('../src/config/database');

function seedYear2Subjects(databaseInstance) {
  const d = databaseInstance || db;
  const now = new Date().toISOString();

  console.log('[SeedYear2Subjects] Adding II-II subjects and active rounds...');

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

  // Ensure Year 2 Selection Rounds exist for Group 1 and Group 2 and are marked ACTIVE
  const roundY2G1 = d.prepare("SELECT id FROM selection_rounds WHERE academic_year = 2 AND semester = 4 AND target_group = 'Group 1'").get();
  if (!roundY2G1) {
    d.prepare(`
      INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
      VALUES ('II-II Faculty Selection - Group 1 (501 to 5CT)', 2, 4, 'Group 1', ?, ?, 'ACTIVE', ?)
    `).run(now, new Date(Date.now() + 30 * 86400000).toISOString(), now);
  } else {
    d.prepare("UPDATE selection_rounds SET status = 'ACTIVE', start_time = ? WHERE id = ?").run(now, roundY2G1.id);
  }

  const roundY2G2 = d.prepare("SELECT id FROM selection_rounds WHERE academic_year = 2 AND semester = 4 AND target_group = 'Group 2'").get();
  if (!roundY2G2) {
    d.prepare(`
      INSERT INTO selection_rounds (name, academic_year, semester, target_group, start_time, end_time, status, created_at)
      VALUES ('II-II Faculty Selection - Group 2 (5CU to 5JN)', 2, 4, 'Group 2', ?, ?, 'ACTIVE', ?)
    `).run(now, new Date(Date.now() + 30 * 86400000).toISOString(), now);
  } else {
    d.prepare("UPDATE selection_rounds SET status = 'ACTIVE', start_time = ? WHERE id = ?").run(now, roundY2G2.id);
  }

  // Also make sure Year 3 rounds are ACTIVE for testing
  d.prepare("UPDATE selection_rounds SET status = 'ACTIVE' WHERE academic_year = 3 AND target_group IN ('Group 1', 'Group 2')").run();

  // Faculty Mappings for ALL Year 2 Subjects (3 faculties per course per group, capacity 65 each)
  const y2Subs = d.prepare("SELECT id, code, name FROM subjects WHERE academic_year = 2 AND semester = 4 ORDER BY id").all();
  const facs = d.prepare("SELECT id FROM faculty ORDER BY id").all();

  const insertMap = d.prepare(`
    INSERT OR IGNORE INTO faculty_subject_mappings (faculty_id, subject_id, academic_year, semester, capacity, target_group, status, created_at)
    VALUES (?, ?, 2, 4, 65, ?, 'ACTIVE', ?)
  `);

  let added = 0;
  y2Subs.forEach((sub, sIdx) => {
    // Pick 3 faculty uniquely cycling through the list
    const offset = (sIdx * 3) % facs.length;
    const f1 = facs[offset];
    const f2 = facs[(offset + 1) % facs.length];
    const f3 = facs[(offset + 2) % facs.length];

    ['Group 1', 'Group 2'].forEach(group => {
      [f1, f2, f3].forEach(f => {
        if (f) {
          const res = insertMap.run(f.id, sub.id, group, now);
          if (res.changes > 0) added += res.changes;
        }
      });
    });
  });

  console.log(`[SeedYear2Subjects] Added ${added} new faculty mappings for Year 2 courses.`);
  console.log('[SeedYear2Subjects] Completed II-II subjects, rounds (ACTIVE), and full mappings setup.');
}

if (require.main === module) {
  seedYear2Subjects(db);
}

module.exports = { seedYear2Subjects };
