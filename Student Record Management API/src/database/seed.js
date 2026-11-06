const { db, run, get } = require('../config/db');
const initDb = require('./initDb');

function seed() {
  initDb();

  console.log('🌱 Seeding database...');

  // Clear existing records in reverse relational order
  db.exec('DELETE FROM enrollments;');
  db.exec('DELETE FROM courses;');
  db.exec('DELETE FROM students;');
  db.exec('DELETE FROM sqlite_sequence;');

  // Insert Students
  const insertStudent = db.prepare(`
    INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, gender, address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const students = [
    ['STU-2024-001', 'Alexander', 'Wright', 'alex.wright@university.edu', '+1-555-0101', '2002-04-12', 'Male', '124 College Ave, Boston, MA', 'Active'],
    ['STU-2024-002', 'Sophia', 'Martinez', 'sophia.m@university.edu', '+1-555-0102', '2001-09-23', 'Female', '458 Beacon St, Boston, MA', 'Active'],
    ['STU-2024-003', 'Liam', 'Chen', 'liam.chen@university.edu', '+1-555-0103', '2003-01-15', 'Male', '789 Commonwealth Ave, Cambridge, MA', 'Active'],
    ['STU-2024-004', 'Emma', 'Johnson', 'emma.j@university.edu', '+1-555-0104', '2002-11-30', 'Female', '321 Massachusetts Ave, Cambridge, MA', 'Active'],
    ['STU-2024-005', 'Noah', 'Patel', 'noah.patel@university.edu', '+1-555-0105', '2000-06-18', 'Male', '56 Huntington Ave, Boston, MA', 'Active'],
    ['STU-2024-006', 'Olivia', 'Davis', 'olivia.davis@university.edu', '+1-555-0106', '2002-08-04', 'Female', '89 Tremont St, Boston, MA', 'Active'],
    ['STU-2024-007', 'Lucas', 'Silva', 'lucas.silva@university.edu', '+1-555-0107', '2003-03-27', 'Male', '210 Boylston St, Boston, MA', 'Inactive'],
    ['STU-2024-008', 'Ava', 'Taylor', 'ava.taylor@university.edu', '+1-555-0108', '2001-12-14', 'Female', '674 Newbury St, Boston, MA', 'Active'],
    ['STU-2024-009', 'Ethan', 'Brown', 'ethan.brown@university.edu', '+1-555-0109', '1999-05-19', 'Male', '15 Cambridgepark Dr, Cambridge, MA', 'Graduated'],
    ['STU-2024-010', 'Mia', 'Wilson', 'mia.wilson@university.edu', '+1-555-0110', '2002-07-08', 'Female', '90 Charles St, Boston, MA', 'Suspended']
  ];

  for (const s of students) {
    insertStudent.run(...s);
  }

  // Insert Courses
  const insertCourse = db.prepare(`
    INSERT INTO courses (course_code, title, description, credits, department, instructor, max_capacity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const courses = [
    ['CS101', 'Introduction to Computer Science', 'Fundamental concepts of programming, algorithms, and computational thinking.', 4, 'Computer Science', 'Dr. Alan Turing', 40],
    ['CS201', 'Data Structures & Algorithms', 'In-depth study of abstract data types, sorting, trees, and algorithm analysis.', 4, 'Computer Science', 'Dr. Donald Knuth', 35],
    ['CS305', 'Database Management Systems', 'Relational data modeling, SQL queries, normalization, transactions, and indexing.', 3, 'Computer Science', 'Dr. Edgar Codd', 30],
    ['DS210', 'Applied Machine Learning', 'Supervised and unsupervised learning, evaluation metrics, and neural architectures.', 4, 'Data Science', 'Dr. Andrew Ng', 30],
    ['MATH150', 'Linear Algebra & Applications', 'Vector spaces, matrices, eigenvalues, determinants, and linear transformations.', 3, 'Mathematics', 'Dr. Gilbert Strang', 45],
    ['CYBER401', 'Network Security & Cryptography', 'Protocols, symmetric/asymmetric cryptography, vulnerability assessment, and defense.', 3, 'Cyber Security', 'Dr. Bruce Schneier', 25],
    ['WEB200', 'Full Stack Web Engineering', 'Modern full-stack architectures, RESTful API design, and modern front-end state management.', 3, 'Information Technology', 'Prof. Tim Berners-Lee', 35],
    ['AI501', 'Natural Language Processing', 'Statistical language modeling, tokenization, transformers, and prompt engineering.', 4, 'Artificial Intelligence', 'Dr. Yann LeCun', 25]
  ];

  for (const c of courses) {
    insertCourse.run(...c);
  }

  // Insert Enrollments
  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (student_id, course_id, semester, grade, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const enrollments = [
    [1, 1, 'Fall 2024', 'A', 'Completed'],
    [1, 2, 'Spring 2025', 'IP', 'Enrolled'],
    [1, 3, 'Spring 2025', 'IP', 'Enrolled'],
    [2, 1, 'Fall 2024', 'A+', 'Completed'],
    [2, 4, 'Spring 2025', 'IP', 'Enrolled'],
    [3, 1, 'Fall 2024', 'B+', 'Completed'],
    [3, 3, 'Spring 2025', 'IP', 'Enrolled'],
    [4, 5, 'Fall 2024', 'A-', 'Completed'],
    [4, 7, 'Spring 2025', 'IP', 'Enrolled'],
    [5, 1, 'Fall 2024', 'B', 'Completed'],
    [5, 2, 'Spring 2025', 'IP', 'Enrolled'],
    [6, 3, 'Spring 2025', 'IP', 'Enrolled'],
    [6, 6, 'Spring 2025', 'IP', 'Enrolled'],
    [8, 7, 'Spring 2025', 'IP', 'Enrolled'],
    [9, 1, 'Fall 2023', 'A', 'Completed'],
    [9, 2, 'Spring 2024', 'A', 'Completed'],
    [9, 3, 'Fall 2024', 'A+', 'Completed']
  ];

  for (const e of enrollments) {
    insertEnrollment.run(...e);
  }

  console.log(`✅ Seeded: ${students.length} students, ${courses.length} courses, and ${enrollments.length} enrollments.`);
}

if (require.main === module) {
  try {
    seed();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed database:', err);
    process.exit(1);
  }
}

module.exports = seed;
