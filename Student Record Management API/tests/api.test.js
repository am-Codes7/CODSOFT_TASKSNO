process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test_student_records.db';

const { test, before, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const seed = require('../src/database/seed');

describe('Student Record Management API Integration Tests', () => {
  before(() => {
    seed();
  });

  test('GET /api/health should return UP status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'UP');
  });

  describe('Students Endpoints', () => {
    let studentId;

    test('POST /api/students should create a new student', async () => {
      const res = await request(app)
        .post('/api/students')
        .send({
          student_id: 'STU-TEST-001',
          first_name: 'Jonathan',
          last_name: 'Doe',
          email: 'jonathan.doe@university.edu',
          phone: '+1-555-4321',
          gender: 'Male',
          status: 'Active'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.student_id, 'STU-TEST-001');
      studentId = res.body.data.id;
    });

    test('POST /api/students with duplicate email should return 409', async () => {
      const res = await request(app)
        .post('/api/students')
        .send({
          student_id: 'STU-TEST-002',
          first_name: 'Duplicate',
          last_name: 'Test',
          email: 'jonathan.doe@university.edu'
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.error, 'DuplicateEmail');
    });

    test('GET /api/students should list students with pagination', async () => {
      const res = await request(app).get('/api/students?page=1&limit=5');
      assert.equal(res.status, 200);
      assert.equal(res.body.pagination.limit, 5);
      assert.equal(res.body.data.length, 5);
    });

    test('GET /api/students/:id should return student with enrollments', async () => {
      const res = await request(app).get('/api/students/1');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data.enrollments));
    });

    test('PATCH /api/students/:id should update student fields', async () => {
      const res = await request(app)
        .patch(`/api/students/${studentId}`)
        .send({ phone: '+1-555-9999' });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.phone, '+1-555-9999');
    });

    test('DELETE /api/students/:id should delete student', async () => {
      const res = await request(app).delete(`/api/students/${studentId}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  describe('Courses Endpoints', () => {
    let courseId;

    test('POST /api/courses should create a new course', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({
          course_code: 'TEST-101',
          title: 'Automated Testing Principles',
          credits: 3,
          department: 'Computer Science',
          instructor: 'Dr. Test'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.course_code, 'TEST-101');
      courseId = res.body.data.id;
    });

    test('GET /api/courses should return courses with active enrollments count', async () => {
      const res = await request(app).get('/api/courses');
      assert.equal(res.status, 200);
      assert.ok(res.body.data.length > 0);
      assert.notEqual(res.body.data[0].active_enrolled_count, undefined);
    });

    test('DELETE /api/courses/:id with active enrollments should return 409', async () => {
      const res = await request(app).delete('/api/courses/1');
      assert.equal(res.status, 409);
      assert.equal(res.body.error, 'CourseHasActiveEnrollments');
    });

    test('DELETE /api/courses/:id without enrollments should succeed', async () => {
      const res = await request(app).delete(`/api/courses/${courseId}`);
      assert.equal(res.status, 200);
    });
  });

  describe('Enrollments Endpoints', () => {
    let enrollmentId;

    test('POST /api/enrollments should enroll active student', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .send({
          student_id: 3,
          course_id: 2,
          semester: 'Fall 2025'
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.student_id, 3);
      enrollmentId = res.body.data.id;
    });

    test('POST /api/enrollments for inactive/suspended student should fail', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .send({
          student_id: 10, // Suspended student
          course_id: 2,
          semester: 'Fall 2025'
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'InactiveStudentError');
    });

    test('DELETE /api/enrollments/:id should drop enrollment', async () => {
      const res = await request(app).delete(`/api/enrollments/${enrollmentId}`);
      assert.equal(res.status, 200);
    });
  });
});
