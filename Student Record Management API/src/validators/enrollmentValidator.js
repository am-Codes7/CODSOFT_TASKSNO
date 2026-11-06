const { z } = require('zod');

const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F', 'IP', 'W'];
const validStatuses = ['Enrolled', 'Completed', 'Dropped'];

const createEnrollmentSchema = z.object({
  student_id: z.coerce.number().int().positive('student_id must be a valid positive integer ID'),
  course_id: z.coerce.number().int().positive('course_id must be a valid positive integer ID'),
  semester: z.string().min(4, 'semester name must be at least 4 characters').max(30),
  grade: z.enum(validGrades).default('IP'),
  status: z.enum(validStatuses).default('Enrolled')
});

const updateEnrollmentSchema = z.object({
  grade: z.enum(validGrades).optional(),
  status: z.enum(validStatuses).optional(),
  semester: z.string().min(4).max(30).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field (grade, status, or semester) must be provided for update'
});

const enrollmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  student_id: z.coerce.number().int().positive().optional(),
  course_id: z.coerce.number().int().positive().optional(),
  semester: z.string().optional(),
  status: z.enum(validStatuses).optional(),
  grade: z.enum(validGrades).optional(),
  sortBy: z.enum(['id', 'enrollment_date', 'student_id', 'course_id', 'semester', 'grade', 'status', 'created_at']).default('enrollment_date'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc')
});

module.exports = {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentQuerySchema
};
