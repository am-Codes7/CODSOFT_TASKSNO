const { query, get, run } = require('../config/db');

/**
 * Controller for Enrollment resource (Students <-> Courses)
 */
const enrollmentController = {
  /**
   * Enroll a student into a course
   * POST /api/enrollments
   */
  createEnrollment(req, res, next) {
    try {
      const {
        student_id,
        course_id,
        semester,
        grade = 'IP',
        status = 'Enrolled'
      } = req.body;

      // 1. Verify student exists
      const student = get('SELECT * FROM students WHERE id = ?', [student_id]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${student_id} not found.`,
          error: 'StudentNotFound'
        });
      }

      // 2. Verify student is Active
      if (student.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: `Cannot enroll student '${student.first_name} ${student.last_name}' because student status is '${student.status}'.`,
          error: 'InactiveStudentError'
        });
      }

      // 3. Verify course exists
      const course = get('SELECT * FROM courses WHERE id = ?', [course_id]);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Course with ID ${course_id} not found.`,
          error: 'CourseNotFound'
        });
      }

      // 4. Verify duplicate enrollment for the same student, course, and semester
      const existingEnrollment = get(
        'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ? AND semester = ?',
        [student_id, course_id, semester]
      );
      if (existingEnrollment) {
        return res.status(409).json({
          success: false,
          message: `Student '${student.first_name} ${student.last_name}' is already enrolled in '${course.course_code}: ${course.title}' for semester '${semester}'.`,
          error: 'DuplicateEnrollmentError',
          existingEnrollment
        });
      }

      // 5. Verify course capacity
      const activeCountResult = get(
        "SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status != 'Dropped'",
        [course_id]
      );
      const activeCount = activeCountResult ? activeCountResult.count : 0;

      if (activeCount >= course.max_capacity) {
        return res.status(409).json({
          success: false,
          message: `Course '${course.course_code}: ${course.title}' has reached maximum enrollment capacity (${course.max_capacity} seats).`,
          error: 'CourseCapacityExceeded'
        });
      }

      // 6. Insert enrollment
      const insertSql = `
        INSERT INTO enrollments (student_id, course_id, semester, grade, status)
        VALUES (?, ?, ?, ?, ?)
      `;
      const result = run(insertSql, [student_id, course_id, semester, grade, status]);

      // 7. Retrieve full enrollment details with joined info
      const fullEnrollment = get(`
        SELECT 
          e.id,
          e.student_id,
          s.student_id as student_code,
          s.first_name,
          s.last_name,
          s.email as student_email,
          e.course_id,
          c.course_code,
          c.title as course_title,
          c.credits,
          c.department,
          e.semester,
          e.enrollment_date,
          e.grade,
          e.status,
          e.created_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.id = ?
      `, [result.lastInsertRowid]);

      return res.status(201).json({
        success: true,
        message: 'Student enrolled successfully.',
        data: fullEnrollment
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all enrollments with search, filtering, sorting, and pagination
   * GET /api/enrollments
   */
  getAllEnrollments(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        student_id,
        course_id,
        semester,
        status,
        grade,
        sortBy = 'enrollment_date',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];

      // Search across student name, student code, course code, course title
      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        conditions.push(`(s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR c.course_code LIKE ? OR c.title LIKE ?)`);
        params.push(term, term, term, term, term);
      }

      // Filter by student
      if (student_id) {
        conditions.push(`e.student_id = ?`);
        params.push(student_id);
      }

      // Filter by course
      if (course_id) {
        conditions.push(`e.course_id = ?`);
        params.push(course_id);
      }

      // Filter by semester
      if (semester) {
        conditions.push(`e.semester = ?`);
        params.push(semester);
      }

      // Filter by status
      if (status) {
        conditions.push(`e.status = ?`);
        params.push(status);
      }

      // Filter by grade
      if (grade) {
        conditions.push(`e.grade = ?`);
        params.push(grade);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total records
      const countSql = `
        SELECT COUNT(*) as total 
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        ${whereClause}
      `;
      const countResult = get(countSql, params);
      const totalRecords = countResult ? countResult.total : 0;
      const totalPages = Math.ceil(totalRecords / limit) || 1;

      // Whitelist sort columns
      const allowedSortColumns = {
        id: 'e.id',
        enrollment_date: 'e.enrollment_date',
        student_id: 'e.student_id',
        course_id: 'e.course_id',
        semester: 'e.semester',
        grade: 'e.grade',
        status: 'e.status',
        created_at: 'e.created_at'
      };
      const sanitizedSortBy = allowedSortColumns[sortBy] || 'e.enrollment_date';
      const sanitizedSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Query data
      const dataSql = `
        SELECT 
          e.id,
          e.student_id,
          s.student_id as student_code,
          s.first_name,
          s.last_name,
          s.email as student_email,
          e.course_id,
          c.course_code,
          c.title as course_title,
          c.credits,
          c.department,
          e.semester,
          e.enrollment_date,
          e.grade,
          e.status,
          e.created_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        ${whereClause}
        ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder}
        LIMIT ? OFFSET ?
      `;
      const enrollments = query(dataSql, [...params, limit, offset]);

      return res.status(200).json({
        success: true,
        message: 'Enrollments retrieved successfully.',
        data: enrollments,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: Number(page),
          limit: Number(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get enrollment by ID
   * GET /api/enrollments/:id
   */
  getEnrollmentById(req, res, next) {
    try {
      const { id } = req.params;

      const enrollment = get(`
        SELECT 
          e.id,
          e.student_id,
          s.student_id as student_code,
          s.first_name,
          s.last_name,
          s.email as student_email,
          e.course_id,
          c.course_code,
          c.title as course_title,
          c.credits,
          c.department,
          c.instructor,
          e.semester,
          e.enrollment_date,
          e.grade,
          e.status,
          e.created_at,
          e.updated_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.id = ?
      `, [id]);

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: `Enrollment with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Enrollment retrieved successfully.',
        data: enrollment
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update enrollment (grade, status, semester)
   * PATCH /api/enrollments/:id
   */
  updateEnrollment(req, res, next) {
    try {
      const { id } = req.params;

      const enrollment = get('SELECT * FROM enrollments WHERE id = ?', [id]);
      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: `Enrollment with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      const allowedFields = ['grade', 'status', 'semester'];
      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(req.body[field]);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update.',
          error: 'BadRequest'
        });
      }

      updates.push(`updated_at = datetime('now')`);
      params.push(id);

      const updateSql = `UPDATE enrollments SET ${updates.join(', ')} WHERE id = ?`;
      run(updateSql, params);

      const updated = get(`
        SELECT 
          e.id,
          e.student_id,
          s.student_id as student_code,
          s.first_name,
          s.last_name,
          e.course_id,
          c.course_code,
          c.title as course_title,
          e.semester,
          e.grade,
          e.status,
          e.updated_at
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.id = ?
      `, [id]);

      return res.status(200).json({
        success: true,
        message: 'Enrollment updated successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete or Drop enrollment
   * DELETE /api/enrollments/:id
   */
  deleteEnrollment(req, res, next) {
    try {
      const { id } = req.params;

      const enrollment = get('SELECT * FROM enrollments WHERE id = ?', [id]);
      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: `Enrollment with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      run('DELETE FROM enrollments WHERE id = ?', [id]);

      return res.status(200).json({
        success: true,
        message: `Enrollment record with ID ${id} deleted successfully.`,
        data: { id: Number(id) }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = enrollmentController;
