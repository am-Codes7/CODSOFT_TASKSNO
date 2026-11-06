const { query, get } = require('../config/db');

/**
 * Controller for System Dashboard & Analytics
 */
const dashboardController = {
  getStats(req, res, next) {
    try {
      const studentStats = get(`
        SELECT 
          COUNT(*) as total_students,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_students,
          SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive_students,
          SUM(CASE WHEN status = 'Graduated' THEN 1 ELSE 0 END) as graduated_students,
          SUM(CASE WHEN status = 'Suspended' THEN 1 ELSE 0 END) as suspended_students
        FROM students
      `);

      const courseStats = get(`
        SELECT 
          COUNT(*) as total_courses,
          SUM(credits) as total_credits,
          AVG(max_capacity) as avg_capacity
        FROM courses
      `);

      const enrollmentStats = get(`
        SELECT 
          COUNT(*) as total_enrollments,
          SUM(CASE WHEN status = 'Enrolled' THEN 1 ELSE 0 END) as currently_enrolled,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'Dropped' THEN 1 ELSE 0 END) as dropped
        FROM enrollments
      `);

      const departmentBreakdown = query(`
        SELECT department, COUNT(*) as course_count
        FROM courses
        GROUP BY department
        ORDER BY course_count DESC
      `);

      const recentEnrollments = query(`
        SELECT 
          e.id,
          s.first_name || ' ' || s.last_name as student_name,
          s.student_id as student_code,
          c.course_code,
          c.title as course_title,
          e.semester,
          e.status,
          e.enrollment_date
        FROM enrollments e
        JOIN students s ON e.student_id = s.id
        JOIN courses c ON e.course_id = c.id
        ORDER BY e.enrollment_date DESC
        LIMIT 5
      `);

      return res.status(200).json({
        success: true,
        message: 'System statistics retrieved successfully.',
        data: {
          students: studentStats,
          courses: courseStats,
          enrollments: enrollmentStats,
          departments: departmentBreakdown,
          recent_enrollments: recentEnrollments
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = dashboardController;
