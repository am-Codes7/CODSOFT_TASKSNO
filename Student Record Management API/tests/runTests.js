process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test_student_records.db';

const fs = require('node:fs');
const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/config/db');
const seed = require('../src/database/seed');

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function runTestSuite() {
  console.log(`${colors.bold}${colors.magenta}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   STUDENT RECORD MANAGEMENT API — AUTOMATED TEST SUITE EXECUTION       ${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}========================================================================${colors.reset}\n`);

  // Ensure clean test database
  console.log(`${colors.dim}🔄 Resetting and seeding test database...${colors.reset}`);
  seed();
  console.log(`${colors.green}✔ Database ready for testing.${colors.reset}\n`);

  let passed = 0;
  let failed = 0;
  const results = [];

  async function testCase(id, name, method, url, payload, expectedStatus, assertions) {
    const start = performance.now();
    let req;

    if (method === 'GET') {
      req = request(app).get(url);
    } else if (method === 'POST') {
      req = request(app).post(url).send(payload);
    } else if (method === 'PUT') {
      req = request(app).put(url).send(payload);
    } else if (method === 'PATCH') {
      req = request(app).patch(url).send(payload);
    } else if (method === 'DELETE') {
      req = request(app).delete(url);
    }

    const res = await req;
    const duration = Math.round(performance.now() - start);

    let isSuccess = res.status === expectedStatus;
    let assertionError = null;

    if (isSuccess && assertions) {
      try {
        assertions(res.body);
      } catch (err) {
        isSuccess = false;
        assertionError = err.message;
      }
    }

    if (isSuccess) {
      passed++;
      console.log(
        `  ${colors.green}✔ PASS${colors.reset} [${id}] ${colors.bold}${method.padEnd(6)}${colors.reset} ${url.padEnd(35)} ` +
        `Status: ${colors.green}${res.status}${colors.reset} (${duration}ms)`
      );
      console.log(`         ${colors.dim}↳ ${name}${colors.reset}`);
    } else {
      failed++;
      console.log(
        `  ${colors.red}✖ FAIL${colors.reset} [${id}] ${colors.bold}${method.padEnd(6)}${colors.reset} ${url.padEnd(35)} ` +
        `Expected ${expectedStatus}, Got: ${colors.red}${res.status}${colors.reset} (${duration}ms)`
      );
      console.log(`         ${colors.red}↳ ${name} - ${assertionError || JSON.stringify(res.body)}${colors.reset}`);
    }

    results.push({
      id,
      name,
      method,
      url,
      status: res.status,
      expectedStatus,
      duration,
      passed: isSuccess,
      body: res.body
    });

    return res;
  }

  // --- SUITE 1: SYSTEM HEALTH ---
  console.log(`\n${colors.bold}${colors.yellow}▶ SUITE 1: System Health & Info${colors.reset}`);
  await testCase('TC01', 'Health check returns UP status and uptime', 'GET', '/api/health', null, 200, (b) => {
    if (b.status !== 'UP') throw new Error(`Expected status UP, got ${b.status}`);
  });

  // --- SUITE 2: STUDENTS API (CRUD, SEARCH, FILTER, SORT, PAGINATION) ---
  console.log(`\n${colors.bold}${colors.yellow}▶ SUITE 2: Student Record Management & Validations${colors.reset}`);

  let createdStudentId = null;

  await testCase('TC02', 'Create student with complete valid data', 'POST', '/api/students', {
    student_id: 'STU-2024-888',
    first_name: 'Gabriel',
    last_name: 'Vance',
    email: 'gabriel.vance@university.edu',
    phone: '+1-555-8888',
    date_of_birth: '2002-05-18',
    gender: 'Male',
    address: '777 Tech Square, Cambridge, MA',
    status: 'Active'
  }, 201, (b) => {
    if (!b.data || !b.data.id) throw new Error('Missing student ID');
    createdStudentId = b.data.id;
  });

  await testCase('TC03', 'Reject student with invalid email format and short name', 'POST', '/api/students', {
    student_id: 'STU-FAIL',
    first_name: 'J',
    last_name: 'D',
    email: 'invalid-email-address'
  }, 400, (b) => {
    if (!b.errors || b.errors.length < 2) throw new Error('Expected validation errors for fields');
  });

  await testCase('TC04', 'Reject duplicate student_id (Unique Constraint)', 'POST', '/api/students', {
    student_id: 'STU-2024-888',
    first_name: 'Another',
    last_name: 'Student',
    email: 'another.unique@university.edu'
  }, 409, (b) => {
    if (!b.message.includes('already exists')) throw new Error('Expected duplicate error');
  });

  await testCase('TC05', 'Reject duplicate email (Unique Constraint)', 'POST', '/api/students', {
    student_id: 'STU-NEW-999',
    first_name: 'Copy',
    last_name: 'Student',
    email: 'gabriel.vance@university.edu'
  }, 409);

  await testCase('TC06', 'List students with pagination (page=1, limit=5)', 'GET', '/api/students?page=1&limit=5', null, 200, (b) => {
    if (b.data.length !== 5) throw new Error(`Expected 5 records, got ${b.data.length}`);
    if (b.pagination.totalRecords < 10) throw new Error('Expected totalRecords >= 10');
  });

  await testCase('TC07', 'Search students by query term (Alexander)', 'GET', '/api/students?search=Alexander', null, 200, (b) => {
    if (b.data.length === 0 || b.data[0].first_name !== 'Alexander') throw new Error('Search failed to find Alexander');
  });

  await testCase('TC08', 'Filter students by status=Active and gender=Female', 'GET', '/api/students?status=Active&gender=Female', null, 200, (b) => {
    const nonMatches = b.data.filter(s => s.status !== 'Active' || s.gender !== 'Female');
    if (nonMatches.length > 0) throw new Error('Filter returned non-matching records');
  });

  await testCase('TC09', 'Sort students by last_name in ascending order', 'GET', '/api/students?sortBy=last_name&sortOrder=asc', null, 200, (b) => {
    for (let i = 0; i < b.data.length - 1; i++) {
      if (b.data[i].last_name.localeCompare(b.data[i + 1].last_name) > 0) {
        throw new Error('Records are not sorted in ascending order');
      }
    }
  });

  await testCase('TC10', 'Get student details by ID with enrolled courses join', 'GET', '/api/students/1', null, 200, (b) => {
    if (!b.data.enrollments || b.data.enrollments.length === 0) throw new Error('Expected joined enrollments array');
  });

  await testCase('TC11', 'Return 404 for non-existent student ID', 'GET', '/api/students/99999', null, 404);

  await testCase('TC12', 'Update student details (phone, status) via PATCH', 'PATCH', `/api/students/${createdStudentId}`, {
    phone: '+1-555-9999',
    status: 'Inactive'
  }, 200, (b) => {
    if (b.data.phone !== '+1-555-9999' || b.data.status !== 'Inactive') throw new Error('Field update mismatch');
  });

  await testCase('TC13', 'Delete student record and cascade enrollments', 'DELETE', `/api/students/${createdStudentId}`, null, 200, (b) => {
    if (!b.success) throw new Error('Delete did not return success');
  });

  // --- SUITE 3: COURSES API ---
  console.log(`\n${colors.bold}${colors.yellow}▶ SUITE 3: Course Catalog Management & Validations${colors.reset}`);

  let createdCourseId = null;

  await testCase('TC14', 'Create course with valid parameters', 'POST', '/api/courses', {
    course_code: 'SE401',
    title: 'Software Architecture & System Design',
    description: 'Microservices, DDD, high availability patterns, and event-driven architecture.',
    credits: 4,
    department: 'Computer Science',
    instructor: 'Dr. Martin Fowler',
    max_capacity: 30
  }, 201, (b) => {
    createdCourseId = b.data.id;
  });

  await testCase('TC15', 'Reject course with invalid credits (exceeds max of 6)', 'POST', '/api/courses', {
    course_code: 'FAIL-101',
    title: 'Invalid Course',
    credits: 10,
    department: 'Computer Science',
    instructor: 'Nobody'
  }, 400);

  await testCase('TC16', 'Reject duplicate course_code (Unique Constraint)', 'POST', '/api/courses', {
    course_code: 'SE401',
    title: 'Duplicate Code Course',
    credits: 3,
    department: 'Computer Science',
    instructor: 'Someone Else'
  }, 409);

  await testCase('TC17', 'List courses with active enrollment count calculation', 'GET', '/api/courses', null, 200, (b) => {
    if (b.data.length === 0 || b.data[0].active_enrolled_count === undefined) {
      throw new Error('Missing active_enrolled_count');
    }
  });

  await testCase('TC18', 'Filter courses by department', 'GET', '/api/courses?department=Computer%20Science', null, 200, (b) => {
    const nonMatches = b.data.filter(c => c.department !== 'Computer Science');
    if (nonMatches.length > 0) throw new Error('Filter returned courses from other departments');
  });

  await testCase('TC19', 'Get course by ID with roster and seat availability', 'GET', '/api/courses/1', null, 200, (b) => {
    if (b.data.available_seats === undefined || !Array.isArray(b.data.students)) {
      throw new Error('Missing roster or available seats');
    }
  });

  await testCase('TC20', 'Update course details (max_capacity, instructor)', 'PATCH', `/api/courses/${createdCourseId}`, {
    instructor: 'Prof. Eric Evans',
    max_capacity: 50
  }, 200, (b) => {
    if (b.data.max_capacity !== 50 || b.data.instructor !== 'Prof. Eric Evans') throw new Error('Course update mismatch');
  });

  await testCase('TC21', 'Reject deleting course with active enrolled students (Integrity Protection)', 'DELETE', '/api/courses/1', null, 409, (b) => {
    if (!b.message.includes('active enrollment')) throw new Error('Expected active enrollment rejection');
  });

  // --- SUITE 4: ENROLLMENTS API & BUSINESS CONSTRAINTS ---
  console.log(`\n${colors.bold}${colors.yellow}▶ SUITE 4: Enrollment Operations & Relational Integrity${colors.reset}`);

  let createdEnrollmentId = null;

  await testCase('TC22', 'Enroll active student in course with available seats', 'POST', '/api/enrollments', {
    student_id: 2,
    course_id: createdCourseId,
    semester: 'Fall 2025',
    grade: 'IP',
    status: 'Enrolled'
  }, 201, (b) => {
    if (!b.data || !b.data.id) throw new Error('Enrollment failed');
    createdEnrollmentId = b.data.id;
  });

  await testCase('TC23', 'Reject duplicate enrollment (Same student + course + semester)', 'POST', '/api/enrollments', {
    student_id: 2,
    course_id: createdCourseId,
    semester: 'Fall 2025'
  }, 409, (b) => {
    if (!b.message.includes('already enrolled')) throw new Error('Expected duplicate enrollment error');
  });

  await testCase('TC24', 'Reject enrollment of suspended student (ID: 10, Mia Wilson)', 'POST', '/api/enrollments', {
    student_id: 10,
    course_id: createdCourseId,
    semester: 'Fall 2025'
  }, 400, (b) => {
    if (!b.message.includes('Suspended')) throw new Error('Expected suspended student error');
  });

  await testCase('TC25', 'Reject enrollment when student does not exist (ID: 99999)', 'POST', '/api/enrollments', {
    student_id: 99999,
    course_id: createdCourseId,
    semester: 'Fall 2025'
  }, 404);

  await testCase('TC26', 'Reject enrollment when course does not exist (ID: 99999)', 'POST', '/api/enrollments', {
    student_id: 1,
    course_id: 99999,
    semester: 'Fall 2025'
  }, 404);

  await testCase('TC27', 'List enrollments with student and course joins', 'GET', '/api/enrollments', null, 200, (b) => {
    if (b.data.length === 0 || !b.data[0].student_code || !b.data[0].course_code) {
      throw new Error('Enrollments list missing joined student or course info');
    }
  });

  await testCase('TC28', 'Filter enrollments by semester and status', 'GET', '/api/enrollments?semester=Fall%202024&status=Completed', null, 200, (b) => {
    const nonMatches = b.data.filter(e => e.semester !== 'Fall 2024' || e.status !== 'Completed');
    if (nonMatches.length > 0) throw new Error('Filter returned non-matching enrollments');
  });

  await testCase('TC29', 'Update enrollment grade and status (PATCH)', 'PATCH', `/api/enrollments/${createdEnrollmentId}`, {
    grade: 'A',
    status: 'Completed'
  }, 200, (b) => {
    if (b.data.grade !== 'A' || b.data.status !== 'Completed') throw new Error('Enrollment update failed');
  });

  await testCase('TC30', 'Delete/Drop enrollment record', 'DELETE', `/api/enrollments/${createdEnrollmentId}`, null, 200);

  // Clean up createdCourseId
  await testCase('TC31', 'Delete course now that active enrollment was dropped', 'DELETE', `/api/courses/${createdCourseId}`, null, 200);

  // --- SUITE 5: DASHBOARD & 404 ---
  console.log(`\n${colors.bold}${colors.yellow}▶ SUITE 5: Analytics Dashboard & Catch-all Routing${colors.reset}`);

  await testCase('TC32', 'Fetch dashboard aggregate metrics and departmental distribution', 'GET', '/api/dashboard/stats', null, 200, (b) => {
    if (!b.data.students || !b.data.courses || !b.data.enrollments) throw new Error('Missing stats categories');
  });

  await testCase('TC33', 'Catch-all 404 handler for undefined API routes', 'GET', '/api/unknown-endpoint-xyz', null, 404, (b) => {
    if (!b.error || b.error !== 'NotFound') throw new Error('Expected structured 404 error response');
  });

  // SUMMARY
  console.log(`\n${colors.bold}${colors.magenta}========================================================================${colors.reset}`);
  console.log(`${colors.bold}TEST SUITE SUMMARY:${colors.reset}`);
  console.log(`  Total Test Cases: ${passed + failed}`);
  console.log(`  ${colors.green}Passed:           ${passed}${colors.reset}`);
  console.log(`  ${failed === 0 ? colors.green : colors.red}Failed:           ${failed}${colors.reset}`);
  console.log(`  Success Rate:     ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log(`${colors.bold}${colors.magenta}========================================================================${colors.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
