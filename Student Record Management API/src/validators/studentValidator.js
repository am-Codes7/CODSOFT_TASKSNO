const { z } = require('zod');

const studentBaseSchema = z.object({
  student_id: z.string().min(3).max(20).regex(/^[A-Za-z0-9-]+$/, {
    message: 'student_id must be alphanumeric and may contain hyphens (e.g., STU-2024-001)'
  }),
  first_name: z.string().min(2, 'first_name must be at least 2 characters').max(50),
  last_name: z.string().min(2, 'last_name must be at least 2 characters').max(50),
  email: z.string().email('email must be a valid email address'),
  phone: z.string().max(25).optional().nullable(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_of_birth must be in YYYY-MM-DD format').optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  status: z.enum(['Active', 'Inactive', 'Suspended', 'Graduated']).default('Active')
});

const createStudentSchema = studentBaseSchema;

const updateStudentSchema = studentBaseSchema.partial().refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

const studentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended', 'Graduated']).optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  sortBy: z.enum(['id', 'student_id', 'first_name', 'last_name', 'email', 'status', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc')
});

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema
};
