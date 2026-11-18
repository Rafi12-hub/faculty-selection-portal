const { db, withTransaction } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/middleware/auth');
const app = require('../src/server');
const http = require('http');

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let adminToken = '';
let student1Token = '';
let student2Token = '';
let student3Token = '';

async function runTests() {
  console.log('--- STARTING FSSP COMPREHENSIVE AUTOMATED TEST SUITE ---');
  await startServer();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` [PASS] ${message}`);
      passed++;
    } else {
      console.error(` [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Initial State Check
    console.log('\n--- 1. Testing Initial State ---');
    const initFacultyCount = db.prepare('SELECT count(*) as count FROM faculty').get().count;
    const initSubjectCount = db.prepare('SELECT count(*) as count FROM subjects').get().count;
    assert(initFacultyCount === 0, 'Initial faculty list is strictly empty');
    assert(initSubjectCount === 0, 'Initial subject list is strictly empty');

    // 2. Role Restriction Check: Exactly ADMIN and STUDENT
    console.log('\n--- 2. Testing Role Restriction (Only ADMIN & STUDENT) ---');
    const invalidRoleRes = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'fac1', password: 'password', role: 'FACULTY' }
    });
    assert(invalidRoleRes.status === 400, 'Rejects login attempt for non-supported role "FACULTY"');

    // 3. Admin Login
    console.log('\n--- 3. Testing Admin Login ---');
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123', role: 'ADMIN' }
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.success, 'Admin logs in successfully with default credentials');
    adminToken = adminLoginRes.data.token;

    // 4. Admin Manually Adds Faculty
    console.log('\n--- 4. Testing Manual Faculty Creation by Admin ---');
    const addFac1 = await request('/api/faculty', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Dr. Ravi Kumar',
        faculty_code: 'FAC101',
        designation: 'Professor',
        qualification: 'Ph.D (IIT Madras)',
        specialization: 'Computer Networks',
        email: 'ravi.kumar@university.edu',
        phone: '+91 9876543210',
        status: 'ACTIVE'
      }
    });
    assert(addFac1.status === 201 && addFac1.data.success, 'Admin creates faculty: Dr. Ravi Kumar (FAC101)');
    const fac1Id = addFac1.data.faculty.id;

    const addFac2 = await request('/api/faculty', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Dr. Priya Sharma',
        faculty_code: 'FAC102',
        designation: 'Associate Professor',
        qualification: 'Ph.D (IISc Bangalore)',
        specialization: 'Artificial Intelligence & Machine Learning',
        email: 'priya.sharma@university.edu',
        status: 'ACTIVE'
      }
    });
    assert(addFac2.status === 201 && addFac2.data.success, 'Admin creates faculty: Dr. Priya Sharma (FAC102)');
    const fac2Id = addFac2.data.faculty.id;

    // Duplicate Faculty Code Check
    const dupFac = await request('/api/faculty', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Duplicate Faculty',
        faculty_code: 'FAC101',
        designation: 'Assistant Professor',
        qualification: 'M.Tech',
        specialization: 'AI'
      }
    });
    assert(dupFac.status === 400, 'Duplicate faculty code FAC101 is strictly rejected');

    // 5. Admin Creates Subjects
    console.log('\n--- 5. Testing Subject Creation by Admin ---');
    const addSub1 = await request('/api/subjects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        code: 'CS501',
        name: 'Computer Networks',
        academic_year: 3,
        semester: 5,
        department: 'Computer Science & Engineering',
        credits: 3
      }
    });
    assert(addSub1.status === 201 && addSub1.data.success, 'Admin creates subject: CS501 - Computer Networks (Year 3, Sem 5)');
    const sub1Id = addSub1.data.subject.id;

    const addSub2 = await request('/api/subjects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        code: 'CS502',
        name: 'Operating Systems',
        academic_year: 3,
        semester: 5,
        department: 'Computer Science & Engineering',
        credits: 3
      }
    });
    assert(addSub2.status === 201 && addSub2.data.success, 'Admin creates subject: CS502 - Operating Systems (Year 3, Sem 5)');
    const sub2Id = addSub2.data.subject.id;

    // 6. Admin Maps Faculty to Subjects with Independent Capacities
    console.log('\n--- 6. Testing Faculty-Subject Mapping & Capacities ---');
    // Map Dr. Ravi Kumar to CS501 with Capacity = 2
    const map1Res = await request('/api/mappings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        faculty_id: fac1Id,
        subject_id: sub1Id,
        academic_year: 3,
        semester: 5,
        capacity: 2
      }
    });
    assert(map1Res.status === 201 && map1Res.data.success, 'Mapped Dr. Ravi Kumar to CS501 with capacity = 2');
    const map1Id = map1Res.data.mapping_id;

    // Map Dr. Priya Sharma to CS501 with Capacity = 1
    const map2Res = await request('/api/mappings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        faculty_id: fac2Id,
        subject_id: sub1Id,
        academic_year: 3,
        semester: 5,
        capacity: 1
      }
    });
    assert(map2Res.status === 201 && map2Res.data.success, 'Mapped Dr. Priya Sharma to CS501 with capacity = 1');
    const map2Id = map2Res.data.mapping_id;

    // Duplicate mapping prevention check
    const dupMap = await request('/api/mappings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        faculty_id: fac1Id,
        subject_id: sub1Id,
        academic_year: 3,
        semester: 5,
        capacity: 10
      }
    });
    assert(dupMap.status === 400, 'Duplicate active mapping for same faculty, subject, year, sem is prevented');

    // 7. Admin Creates Selection Round
    console.log('\n--- 7. Testing Selection Round Creation ---');
    const roundRes = await request('/api/rounds', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Fall 2026 Phase 1',
        academic_year: 3,
        semester: 5,
        start_time: new Date(Date.now() - 3600000).toISOString(),
        end_time: new Date(Date.now() + 86400000).toISOString(),
        status: 'ACTIVE'
      }
    });
    assert(roundRes.status === 201 && roundRes.data.success, 'Created active selection round for Year 3, Sem 5');

    // 8. Admin Manages Student Dataset
    console.log('\n--- 8. Testing Student Dataset Management ---');
    const addStu1 = await request('/api/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        reg_no: '2024CS101',
        name: 'Rahul Sharma',
        academic_year: 3,
        semester: 5,
        section: 'A',
        password: 'password123'
      }
    });
    assert(addStu1.status === 201 && addStu1.data.success, 'Created student: 2024CS101 (Rahul Sharma)');

    const addStu2 = await request('/api/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        reg_no: '2024CS102',
        name: 'Ananya Patel',
        academic_year: 3,
        semester: 5,
        section: 'A',
        password: 'password123'
      }
    });
    assert(addStu2.status === 201 && addStu2.data.success, 'Created student: 2024CS102 (Ananya Patel)');

    const addStu3 = await request('/api/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        reg_no: '2024CS103',
        name: 'Vikram Singh',
        academic_year: 3,
        semester: 5,
        section: 'A',
        password: 'password123'
      }
    });
    assert(addStu3.status === 201 && addStu3.data.success, 'Created student: 2024CS103 (Vikram Singh)');

    // 9. Student Login & Authentication
    console.log('\n--- 9. Testing Student Login & Eligibility Verification ---');
    const stu1Login = await request('/api/auth/login', {
      method: 'POST',
      body: { username: '2024CS101', password: 'password123', role: 'STUDENT' }
    });
    assert(stu1Login.status === 200 && stu1Login.data.success, 'Student 1 (Rahul) logs in successfully');
    student1Token = stu1Login.data.token;
    assert(stu1Login.data.student.academic_year === 3 && stu1Login.data.student.semester === 5, 'Student profile verified with Year 3, Semester 5');

    const stu2Login = await request('/api/auth/login', {
      method: 'POST',
      body: { username: '2024CS102', password: 'password123', role: 'STUDENT' }
    });
    student2Token = stu2Login.data.token;

    const stu3Login = await request('/api/auth/login', {
      method: 'POST',
      body: { username: '2024CS103', password: 'password123', role: 'STUDENT' }
    });
    student3Token = stu3Login.data.token;

    // 10. Student Views Eligible Subjects
    console.log('\n--- 10. Testing Eligible Subject Retrieval ---');
    const eligibleSubs = await request('/api/subjects', {
      headers: { Authorization: `Bearer ${student1Token}` }
    });
    assert(eligibleSubs.status === 200 && eligibleSubs.data.subjects.length === 2, 'Student 1 receives exactly 2 eligible subjects matching Year 3, Sem 5');

    // 11. Atomic FCFS Allocation Test: Student 1 selects Dr. Priya Sharma for CS501 (Capacity = 1)
    console.log('\n--- 11. Testing FCFS Reservation: Student 1 claims Dr. Priya Sharma (Capacity: 1) ---');
    const res1 = await request('/api/selections/reserve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: { mapping_id: map2Id }
    });
    assert(res1.status === 201 && res1.data.success, 'Student 1 successfully reserves seat for Dr. Priya Sharma');
    assert(res1.data.selection.remainingSeats === 0, 'Remaining seats for Dr. Priya Sharma reduced immediately to 0');
    const s1SelectionId = res1.data.selection.selectionId;

    // Student 1 tries to select another faculty for the same subject CS501
    const resDuplicateSubject = await request('/api/selections/reserve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student1Token}` },
      body: { mapping_id: map1Id }
    });
    assert(resDuplicateSubject.status === 409, 'Student 1 blocked from selecting a second faculty for the same subject');

    // 12. Student 2 tries to select Dr. Priya Sharma (Now FULL, Capacity was 1, currently 1 allocation)
    console.log('\n--- 12. Testing Full Capacity Handling: Student 2 attempts to claim full faculty ---');
    const res2Full = await request('/api/selections/reserve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student2Token}` },
      body: { mapping_id: map2Id }
    });
    assert(res2Full.status === 409, 'Student 2 blocked with clear message when seats are full');
    assert(res2Full.data.message.includes('Seats are full'), 'Error message clearly states seats are full');

    // Student 2 instead selects Dr. Ravi Kumar (Capacity = 2)
    const res2Success = await request('/api/selections/reserve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student2Token}` },
      body: { mapping_id: map1Id }
    });
    assert(res2Success.status === 201 && res2Success.data.success, 'Student 2 successfully reserves Dr. Ravi Kumar (1 seat remains)');
    assert(res2Success.data.selection.remainingSeats === 1, 'Remaining seats for Dr. Ravi Kumar is now 1');

    // Student 3 selects Dr. Ravi Kumar (Takes final seat 2 of 2)
    const res3Success = await request('/api/selections/reserve', {
      method: 'POST',
      headers: { Authorization: `Bearer ${student3Token}` },
      body: { mapping_id: map1Id }
    });
    assert(res3Success.status === 201 && res3Success.data.success, 'Student 3 takes final remaining seat for Dr. Ravi Kumar');
    assert(res3Success.data.selection.remainingSeats === 0, 'Dr. Ravi Kumar is now fully booked (0 seats remaining)');

    // 13. Rule: Capacity cannot be reduced below allocated seats
    console.log('\n--- 13. Testing Capacity Lowering Rule ---');
    // Dr. Ravi Kumar currently has 2 allocated seats. Admin attempts to reduce capacity to 1
    const reduceCap = await request(`/api/mappings/${map1Id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { capacity: 1, status: 'ACTIVE' }
    });
    assert(reduceCap.status === 400, 'Admin is strictly prevented from lowering capacity below current allocated seats (2)');

    // 14. Admin Cancellation with Mandatory Reason
    console.log('\n--- 14. Testing Admin Cancellation (Mandatory Reason & Seat Restoration) ---');
    // Without reason -> blocked
    const cancelNoReason = await request(`/api/selections/${s1SelectionId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { reason: '' }
    });
    assert(cancelNoReason.status === 400, 'Cancellation without mandatory reason is rejected');

    // With mandatory reason
    const cancelWithReason = await request(`/api/selections/${s1SelectionId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { reason: 'Academic Section Re-alignment approved by Dean' }
    });
    assert(cancelWithReason.status === 200 && cancelWithReason.data.success, 'Admin successfully cancels selection with mandatory reason');

    // Verify seat for Dr. Priya Sharma is restored back to 1
    const checkMapping = await request('/api/mappings', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const map2Updated = checkMapping.data.mappings.find(m => m.id === map2Id);
    assert(map2Updated.allocated_seats === 0 && map2Updated.available_seats === 1, 'Seat immediately returned to available capacity');

    // 15. Safe Faculty Delete Check (Cannot delete when dependent mappings exist)
    console.log('\n--- 15. Testing Safe Deletion Rules ---');
    const deleteBlockedFac = await request(`/api/faculty/${fac1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deleteBlockedFac.status === 400, 'Deleting faculty with active mappings/selections is blocked');

    // 16. Dashboard Stats Accuracy Check
    console.log('\n--- 16. Testing Dashboard Stats Accuracy ---');
    const statsRes = await request('/api/reports/dashboard-stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const s = statsRes.data.stats;
    assert(s.total_students === 3, 'Total Students count is 3');
    assert(s.total_faculty === 2, 'Total Faculty count is 2');
    assert(s.total_subjects === 2, 'Total Subjects count is 2');
    assert(s.total_mappings === 2, 'Total Mappings count is 2');
    assert(s.confirmed_selections === 2, 'Confirmed selections count is 2');
    assert(s.cancelled_selections === 1, 'Cancelled selections count is 1 (preserved in history)');
    assert(s.total_allocated_seats === 2, 'Total allocated seats count is 2');

    // 17. Audit Logs Verification
    console.log('\n--- 17. Testing Audit Logging ---');
    const auditRes = await request('/api/audit', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(auditRes.status === 200 && auditRes.data.logs.length > 5, 'Comprehensive audit logs captured all events');

  } catch (error) {
    console.error('Unexpected test error:', error);
    failed++;
  } finally {
    await stopServer();
    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================`);
    if (failed > 0) process.exit(1);
  }
}

runTests();
