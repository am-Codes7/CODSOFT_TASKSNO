-- Student Record Management Database Schema
-- Enables foreign keys
PRAGMA foreign_keys = ON;

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth TEXT,
  gender TEXT CHECK(gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  address TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive', 'Suspended', 'Graduated')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL CHECK(credits >= 1 AND credits <= 6),
  department TEXT NOT NULL,
  instructor TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 30 CHECK(max_capacity >= 1),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Enrollments Table (Many-to-Many join with attributes)
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  semester TEXT NOT NULL,
  enrollment_date TEXT DEFAULT (datetime('now')),
  grade TEXT DEFAULT 'IP' CHECK(grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F', 'IP', 'W')),
  status TEXT DEFAULT 'Enrolled' CHECK(status IN ('Enrolled', 'Completed', 'Dropped')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  CONSTRAINT uq_student_course_semester UNIQUE (student_id, course_id, semester)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(first_name, last_name);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON courses(department);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON enrollments(semester);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
