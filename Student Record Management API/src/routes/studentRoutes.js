const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const validate = require('../middleware/validate');
const {
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema
} = require('../validators/studentValidator');

// GET /api/students - List students with search, filters, sorting, pagination
router.get('/', validate(studentQuerySchema, 'query'), studentController.getAllStudents);

// GET /api/students/:id - Get student details by ID with enrollments
router.get('/:id', studentController.getStudentById);

// POST /api/students - Create new student
router.post('/', validate(createStudentSchema, 'body'), studentController.createStudent);

// PUT /api/students/:id - Full update
router.put('/:id', validate(createStudentSchema, 'body'), studentController.updateStudent);

// PATCH /api/students/:id - Partial update
router.patch('/:id', validate(updateStudentSchema, 'body'), studentController.updateStudent);

// DELETE /api/students/:id - Delete student
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
