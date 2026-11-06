const { query, get, run } = require('../config/db');

/**
 * Controller for Course resource
 */
const courseController = {
  /**
   * Create a new course
   * POST /api/courses
   */
  createCourse(req, res, next) {
    try {
      const {
        course_code,
        title,
        description = null,
        credits,
        department,
        instructor,
        max_capacity = 30
      } = req.body;

      // Check unique course_code
      const existing = get('SELECT id FROM courses WHERE course_code = ?', [course_code]);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Course with code '${course_code}' already exists.`,
          error: 'DuplicateCourseCode'
        });
      }

      const sql = `
        INSERT INTO courses (course_code, title, description, credits, department, instructor, max_capacity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const result = run(sql, [course_code, title, description, credits, department, instructor, max_capacity]);

      const newCourse = get('SELECT * FROM courses WHERE id = ?', [result.lastInsertRowid]);

      return res.status(201).json({
        success: true,
        message: 'Course created successfully.',
        data: newCourse
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all courses with search, filtering, sorting, and pagination
   * GET /api/courses
   */
  getAllCourses(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        department,
        credits,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];

      // Search across course_code, title, department, instructor
      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        conditions.push(`(course_code LIKE ? OR title LIKE ? OR department LIKE ? OR instructor LIKE ?)`);
        params.push(term, term, term, term);
      }

      // Filter by department
      if (department) {
        conditions.push(`department = ?`);
        params.push(department);
      }

      // Filter by credits
      if (credits !== undefined) {
        conditions.push(`credits = ?`);
        params.push(credits);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total records
      const countSql = `SELECT COUNT(*) as total FROM courses ${whereClause}`;
      const countResult = get(countSql, params);
      const totalRecords = countResult ? countResult.total : 0;
      const totalPages = Math.ceil(totalRecords / limit) || 1;

      // Whitelist sort columns
      const allowedSortColumns = ['id', 'course_code', 'title', 'credits', 'department', 'instructor', 'max_capacity', 'created_at'];
      const sanitizedSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const sanitizedSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Query data with subquery for active enrollments count
      const dataSql = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status != 'Dropped') as active_enrolled_count
        FROM courses c
        ${whereClause}
        ORDER BY c.${sanitizedSortBy} ${sanitizedSortOrder}
        LIMIT ? OFFSET ?
      `;
      const courses = query(dataSql, [...params, limit, offset]);

      return res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully.',
        data: courses,
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
   * Get course by ID with enrolled students
   * GET /api/courses/:id
   */
  getCourseById(req, res, next) {
    try {
      const { id } = req.params;

      const course = get('SELECT * FROM courses WHERE id = ?', [id]);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Course with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      // Fetch enrolled students
      const studentsSql = `
        SELECT 
          e.id as enrollment_id,
          s.id as student_db_id,
          s.student_id,
          s.first_name,
          s.last_name,
          s.email,
          e.semester,
          e.grade,
          e.status as enrollment_status,
          e.enrollment_date
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        WHERE e.course_id = ?
        ORDER BY e.enrollment_date DESC
      `;
      const enrolledStudents = query(studentsSql, [id]);

      const activeCount = enrolledStudents.filter(e => e.enrollment_status !== 'Dropped').length;
      const availableSeats = Math.max(0, course.max_capacity - activeCount);

      return res.status(200).json({
        success: true,
        message: 'Course retrieved successfully.',
        data: {
          ...course,
          active_enrolled_count: activeCount,
          available_seats: availableSeats,
          students: enrolledStudents
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update course (PUT / PATCH)
   * PUT/PATCH /api/courses/:id
   */
  updateCourse(req, res, next) {
    try {
      const { id } = req.params;

      const course = get('SELECT * FROM courses WHERE id = ?', [id]);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Course with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      // Check unique course_code if updating
      if (req.body.course_code && req.body.course_code !== course.course_code) {
        const existingCode = get('SELECT id FROM courses WHERE course_code = ? AND id != ?', [req.body.course_code, id]);
        if (existingCode) {
          return res.status(409).json({
            success: false,
            message: `Course with code '${req.body.course_code}' already exists.`,
            error: 'DuplicateCourseCode'
          });
        }
      }

      const allowedFields = ['course_code', 'title', 'description', 'credits', 'department', 'instructor', 'max_capacity'];
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

      const updateSql = `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`;
      run(updateSql, params);

      const updatedCourse = get('SELECT * FROM courses WHERE id = ?', [id]);

      return res.status(200).json({
        success: true,
        message: 'Course updated successfully.',
        data: updatedCourse
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete course
   * DELETE /api/courses/:id
   */
  deleteCourse(req, res, next) {
    try {
      const { id } = req.params;

      const course = get('SELECT * FROM courses WHERE id = ?', [id]);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: `Course with ID ${id} not found.`,
          error: 'NotFound'
        });
      }

      // Check if course has active enrollments
      const enrollmentsCount = get(
        "SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status != 'Dropped'",
        [id]
      );

      if (enrollmentsCount && enrollmentsCount.count > 0) {
        return res.status(409).json({
          success: false,
          message: `Cannot delete course '${course.course_code}' because it has ${enrollmentsCount.count} active enrollment(s). Remove or drop student enrollments before deleting.`,
          error: 'CourseHasActiveEnrollments'
        });
      }

      // Delete dropped enrollments if any to satisfy foreign key or delete course
      run('DELETE FROM enrollments WHERE course_id = ?', [id]);
      run('DELETE FROM courses WHERE id = ?', [id]);

      return res.status(200).json({
        success: true,
        message: `Course '${course.course_code}: ${course.title}' deleted successfully.`,
        data: { id: Number(id), course_code: course.course_code }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = courseController;
