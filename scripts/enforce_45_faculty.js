const { db } = require('../src/config/database');

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

function enforce45(d = db) {
  d.exec('PRAGMA foreign_keys = OFF;');

  const now = new Date().toISOString();
  // Clear codes temporarily to prevent UNIQUE collision
  d.prepare("UPDATE faculty SET faculty_code = 'TMP_' || id").run();

  const normKey = (s) => s.replace(/^(dr|mr|ms|mrs)\.?\s+/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const allExisting = d.prepare('SELECT id, name FROM faculty').all();
  const availableExisting = [...allExisting];
  const keptIds = [];

  for (const f of OFFICIAL_FACULTY_45) {
    const targetKey = normKey(f.name);
    
    // Find exact match first, then fallback to partial
    let matchIdx = availableExisting.findIndex(item => normKey(item.name) === targetKey);
    if (matchIdx === -1) {
      matchIdx = availableExisting.findIndex(item => {
        const k = normKey(item.name);
        return k.includes(targetKey) || targetKey.includes(k);
      });
    }

    if (matchIdx !== -1) {
      const match = availableExisting.splice(matchIdx, 1)[0];
      keptIds.push(match.id);
      d.prepare(`
        UPDATE faculty 
        SET faculty_code = ?, name = ?, designation = ?, qualification = ?, specialization = ?, profile_image = ?, status = 'ACTIVE', updated_at = ?
        WHERE id = ?
      `).run(f.code, f.name, f.designation, f.qualification, f.specialization, f.profile_image, now, match.id);
    } else {
      const ins = d.prepare(`
        INSERT INTO faculty (faculty_code, name, designation, qualification, specialization, profile_image, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
      `).run(f.code, f.name, f.designation, f.qualification, f.specialization, f.profile_image, now, now);
      keptIds.push(Number(ins.lastInsertRowid));
    }
  }

  // Delete all faculty not in keptIds
  const allCurrent = d.prepare('SELECT id FROM faculty').all();
  const removeIds = allCurrent.filter(item => !keptIds.includes(item.id)).map(item => item.id);

  if (removeIds.length > 0) {
    const ph = removeIds.map(() => '?').join(',');
    d.prepare(`DELETE FROM faculty_subject_mappings WHERE faculty_id IN (${ph})`).run(...removeIds);
    d.prepare(`DELETE FROM selections WHERE faculty_id IN (${ph})`).run(...removeIds);
    d.prepare(`DELETE FROM faculty WHERE id IN (${ph})`).run(...removeIds);
  }

  d.exec('PRAGMA foreign_keys = ON;');
  const finalCount = d.prepare('SELECT count(*) as count FROM faculty').get().count;
  console.log('[Enforce45] Successfully enforced exactly ' + finalCount + ' faculty members.');
  return finalCount;
}

if (require.main === module) {
  enforce45();
}

module.exports = { OFFICIAL_FACULTY_45, enforce45 };
