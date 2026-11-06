const { query, get, run } = require('../config/db');

/**
 * Controller for Student resource
 */
const studentController = {
  /**
   * Create a new student
   * POST /api/students
   */
  createStudent(req, res, next) {
    try {
      const {
        student_id,
        first_name,
        last_name,
        email,
        phone = null,
        date_of_birth = null,
        gender = null,
        address = null,
        status = 'Active'
      } = req.body;

      // Check unique student_id
      const existingId = get('SELECT id FROM students WHERE student_id = ?', [student_id]);
      if (existingId) {
        return res.status(409).json({
          success: false,
          message: `Student with ID '${student_id}' already exists.`,
          error: 'DuplicateStudentId'
        });
      }

      // Check unique email
      const existingEmail = get('SELECT id FROM students WHERE email = ?', [email]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: `Student with email '${email}' already exists.`,
          error: 'DuplicateEmail'
        });
      }

      const sql = `
        INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, gender, address, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const result = run(sql, [student_id, first_name, last_name, email, phone, date_of_birth, gender, address, status]);

      const newStudent = get('SELECT * FROM students WHERE id = ?', [result.lastInsertRowid]);

      return res.status(201).json({
        success: true,
        message: 'Student record created successfully.',
        data: newStudent
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all students with search, filtering, sorting, and pagination
   * GET /api/students
   */
  getAllStudents(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        gender,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];

      // Search across first_name, last_name, email, student_id
      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        conditions.push(`(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR student_id LIKE ?)`);
        params.push(term, term, term, term);
      }

      // Filters
      if (status) {
        conditions.push(`status = ?`);
        params.push(status);
      }

      if (gender) {
        conditions.push(`gender = ?`);
        params.push(gender);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total records for pagination metadata
      const countSql = `SELECT COUNT(*) as total FROM students ${whereClause}`;
      const countResult = get(countSql, params);
      const totalRecords = countResult ? countResult.total : 0;
      const totalPages = Math.ceil(totalRecords / limit) || 1;

      // Whitelist sorting column
      const allowedSortColumns = ['id', 'student_id', 'first_name', 'last_name', 'email', 'status', 'created_at'];
      const sanitizedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const sanitizedSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Query data
      const dataSql = `
        SELECT * FROM students
        ${whereClause}
        ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder}
        LIMIT ? OFFSET ?
      `;
      const students = query(dataSql, [...params, limit, offset]);

      return res.status(200).json({
        success: true,
        message: 'Students retrieved successfully.',
        data: students,
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
   * Get student by ID with joined enrollment and course information
   * GET /api/students/:id
   */
  getStudentById(req, res, next) {
    try {
      const { id } = req.params;

      const student = get('SELECT * FROM students WHERE id = ?', [id]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      // Fetch enrolled courses
      const enrollmentsSql = `
        SELECT 
          e.id as enrollment_id,
          e.course_id,
          c.course_code,
          c.title as course_title,
          c.credits,
          c.department,
          c.instructor,
          e.semester,
          e.enrollment_date,
          e.grade,
          e.status as enrollment_status
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ?
        ORDER BY e.enrollment_date DESC
      `;
      const enrollments = query(enrollmentsSql, [id]);

      return res.status(200).json({
        success: true,
        message: 'Student retrieved successfully.',
        data: {
          ...student,
          enrollments_count: enrollments.length,
          enrollments
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update student (supports PUT / PATCH)
   * PUT/PATCH /api/students/:id
   */
  updateStudent(req, res, next) {
    try {
      const { id } = req.params;

      const student = get('SELECT * FROM students WHERE id = ?', [id]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      // Check unique student_id if changing
      if (req.body.student_id && req.body.student_id !== student.student_id) {
        const existingId = get('SELECT id FROM students WHERE student_id = ? AND id != ?', [req.body.student_id, id]);
        if (existingId) {
          return res.status(409).json({
            success: false,
            message: `Student with ID '${req.body.student_id}' already exists.`,
            error: 'DuplicateStudentId'
          });
        }
      }

      // Check unique email if changing
      if (req.body.email && req.body.email !== student.email) {
        const existingEmail = get('SELECT id FROM students WHERE email = ? AND id != ?', [req.body.email, id]);
        if (existingEmail) {
          return res.status(409).json({
            success: false,
            message: `Student with email '${req.body.email}' already exists.`,
            error: 'DuplicateEmail'
          });
        }
      }

      const allowedFields = ['student_id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'address', 'status'];
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

      const updateSql = `UPDATE students SET ${updates.join(', ')} WHERE id = ?`;
      run(updateSql, params);

      const updatedStudent = get('SELECT * FROM students WHERE id = ?', [id]);

      return res.status(200).json({
        success: true,
        message: 'Student record updated successfully.',
        data: updatedStudent
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete student
   * DELETE /api/students/:id
   */
  deleteStudent(req, res, next) {
    try {
      const { id } = req.params;

      const student = get('SELECT * FROM students WHERE id = ?', [id]);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      // Delete student (enrollments cascade automatically)
      run('DELETE FROM students WHERE id = ?', [id]);

      return res.status(200).json({
        success: true,
        message: `Student '${student.first_name} ${student.last_name}' (ID: ${student.student_id}) and related enrollments deleted successfully.`,
        data: { id: Number(id), student_id: student.student_id }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = studentController;
