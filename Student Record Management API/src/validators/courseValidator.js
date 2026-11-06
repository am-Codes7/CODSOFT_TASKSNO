const { z } = require('zod');

const courseBaseSchema = z.object({
  course_code: z.string().min(2).max(15).regex(/^[A-Za-z0-9-]+$/, {
    message: 'course_code must be alphanumeric and may contain hyphens (e.g., CS101, MATH-200)'
  }),
  title: z.string().min(3, 'title must be at least 3 characters').max(100),
  description: z.string().max(1000).optional().nullable(),
  credits: z.coerce.number().int().min(1, 'credits must be at least 1').max(6, 'credits cannot exceed 6'),
  department: z.string().min(2, 'department must be at least 2 characters').max(60),
  instructor: z.string().min(2, 'instructor name must be at least 2 characters').max(60),
  max_capacity: z.coerce.number().int().min(1, 'max_capacity must be at least 1').default(30)
});

const createCourseSchema = courseBaseSchema;

const updateCourseSchema = courseBaseSchema.partial().refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

const courseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  department: z.string().optional(),
  credits: z.coerce.number().int().optional(),
  sortBy: z.enum(['id', 'course_code', 'title', 'credits', 'department', 'instructor', 'max_capacity', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc')
});

module.exports = {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema
};
