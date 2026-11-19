const { db } = require('../src/config/database');
const bcrypt = require('bcryptjs');

console.log('Seeding RGMCET CSE Faculty and III-I Selection data...');

const now = new Date().toISOString();

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
  { code: 'FAC043', name: 'G. Anjani Reddy', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/42.pdf' },
  { code: 'FAC044', name: 'B. Chandana', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/43.pdf' },
  { code: 'FAC045', name: 'G. Ravanika', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/44.pdf' },
  { code: 'FAC046', name: 'G. Tharunya', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/45.pdf' },
  { code: 'FAC047', name: 'B. Teja Manikanteswari', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/46.pdf' },
  { code: 'FAC048', name: 'Thamisetty Sravani', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/47.pdf' },
  { code: 'FAC049', name: 'K. Jayasri', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/48.pdf' },
  { code: 'FAC050', name: 'Yandapalli Suresh Reddy', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/49.pdf' },
  { code: 'FAC051', name: 'B. Sudheshna Devi', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Science & Engineering', profile_image: 'assets/img/teacher/cse/Profiles/50.pdf' },
  { code: 'FAC052', name: 'Ms. K. Lakshmi Rupa', designation: 'Assistant Professor', qualification: 'M.Tech', specialization: 'Computer Networks & Systems', profile_image: 'assets/img/teacher/cse/Profiles/LAKSHMI.pdf' }
];

const insertFaculty = db.prepare(`
  INSERT OR IGNORE INTO faculty (
    faculty_code, name, designation, qualification, specialization,
    email, phone, profile_image, description, status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
`);

for (const f of facultyData) {
  insertFaculty.run(
    f.code,
    f.name,
    f.designation,
    f.qualification,
    f.specialization,
    `${f.code.toLowerCase()}@rgmcet.edu.in`,
    null,
    f.profile_image,
    `${f.designation} in Department of CSE, RGMCET.`,
    now,
    now
  );
}

console.log(`Inserted ${facultyData.length} faculty members.`);

// Insert III-I (Year 3, Semester 5) Subjects: Computer Networks and OOAD
const insertSubject = db.prepare(`
  INSERT OR IGNORE INTO subjects (
    code, name, academic_year, semester, department, credits, status, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
`);

insertSubject.run('CS501', 'Computer Networks', 3, 5, 'Computer Science & Engineering', 3, now);
insertSubject.run('CS502', 'OOAD', 3, 5, 'Computer Science & Engineering', 3, now);

const cnSub = db.prepare('SELECT id FROM subjects WHERE code = ?').get('CS501');
const ooadSub = db.prepare('SELECT id FROM subjects WHERE code = ?').get('CS502');

// Map faculty for Computer Networks:
// 1. S. Tahseen Banu (FAC026) -> "bhanu"
// 2. Ms. K. Lakshmi Rupa (FAC052) -> "rupa"
const facBhanu = db.prepare('SELECT id FROM faculty WHERE faculty_code = ?').get('FAC026');
const facRupa = db.prepare('SELECT id FROM faculty WHERE faculty_code = ?').get('FAC052');

// Map faculty for OOAD:
// 1. Komerollu R. Harinath (FAC021) -> "hari"
// 2. Dr. K. Nageswara Reddy (FAC009) -> "nagarjuna"
// 3. Dr. B. Rama Subbaiah (FAC013) -> "ram"
const facHari = db.prepare('SELECT id FROM faculty WHERE faculty_code = ?').get('FAC021');
const facNagarjuna = db.prepare('SELECT id FROM faculty WHERE faculty_code = ?').get('FAC009');
const facRam = db.prepare('SELECT id FROM faculty WHERE faculty_code = ?').get('FAC013');

const insertMapping = db.prepare(`
  INSERT OR IGNORE INTO faculty_subject_mappings (
    faculty_id, subject_id, academic_year, semester, capacity, status, created_at
  ) VALUES (?, ?, 3, 5, ?, 'ACTIVE', ?)
`);

if (cnSub && facBhanu) insertMapping.run(facBhanu.id, cnSub.id, 60, now);
if (cnSub && facRupa) insertMapping.run(facRupa.id, cnSub.id, 60, now);

if (ooadSub && facHari) insertMapping.run(facHari.id, ooadSub.id, 45, now);
if (ooadSub && facNagarjuna) insertMapping.run(facNagarjuna.id, ooadSub.id, 45, now);
if (ooadSub && facRam) insertMapping.run(facRam.id, ooadSub.id, 45, now);

console.log('Created subjects and faculty-subject mappings for III-I.');

// Map faculty for III-II (Semester 6) subjects (each subject mapped to N faculties):
const insertSem6Mapping = db.prepare(`
  INSERT OR IGNORE INTO faculty_subject_mappings (
    faculty_id, subject_id, academic_year, semester, capacity, status, created_at
  ) VALUES (?, ?, 3, 6, ?, 'ACTIVE', ?)
`);

const sem6Subjects = [
  { code: 'CS601', facCodes: ['FAC001', 'FAC002', 'FAC003'], capacity: 75 },
  { code: 'CS602', facCodes: ['FAC004', 'FAC005', 'FAC006'], capacity: 75 },
  { code: 'CS603', facCodes: ['FAC007', 'FAC008', 'FAC026'], capacity: 75 },
  { code: 'CS604', facCodes: ['FAC010', 'FAC011', 'FAC012'], capacity: 75 },
  { code: 'CS605', facCodes: ['FAC014', 'FAC015', 'FAC016'], capacity: 75 },
  { code: 'CS606', facCodes: ['FAC017', 'FAC018', 'FAC019'], capacity: 75 }
];

for (const item of sem6Subjects) {
  const sub = db.prepare('SELECT id FROM subjects WHERE code = ?').get(item.code);
  if (!sub) continue;
  for (const fCode of item.facCodes) {
    const f = db.prepare('SELECT id FROM faculty WHERE faculty_code = ?').get(fCode);
    if (f) {
      insertSem6Mapping.run(f.id, sub.id, item.capacity, now);
    }
  }
}
console.log('Created faculty-subject mappings for III-II (each subject mapped to N faculties).');

// Create an Active Selection Round for III-I
const insertRound = db.prepare(`
  INSERT OR IGNORE INTO selection_rounds (
    name, academic_year, semester, start_time, end_time, status, created_at
  ) VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
`);

insertRound.run(
  'III-I Faculty Selection Round',
  3,
  5,
  now,
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  now
);

// Create a Demo Student for Year 3, Semester 5 (III-I)
const studentUser = db.prepare('SELECT id FROM users WHERE username = ?').get('22091A0501');
let userId;
if (!studentUser) {
  const hash = bcrypt.hashSync('password123', 10);
  const userRes = db.prepare(`
    INSERT INTO users (username, password_hash, role, created_at)
    VALUES (?, ?, 'STUDENT', ?)
  `).run('22091A0501', hash, now);
  userId = userRes.lastInsertRowid;
  
  db.prepare(`
    INSERT INTO students (
      user_id, reg_no, name, academic_year, semester, section, email, phone, status, created_at
    ) VALUES (?, ?, ?, 3, 5, 'A', 'student@rgmcet.edu.in', '9876543210', 'ACTIVE', ?)
  `).run(userId, '22091A0501', 'Demo Student (III-I)', now);
  console.log('Created Demo Student user: 22091A0501 / password123');
} else {
  console.log('Student user 22091A0501 already exists.');
}

console.log('Seeding completed successfully!');
