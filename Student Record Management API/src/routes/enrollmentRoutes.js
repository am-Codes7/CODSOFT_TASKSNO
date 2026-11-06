const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const validate = require('../middleware/validate');
const {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentQuerySchema
} = require('../validators/enrollmentValidator');

// GET /api/enrollments - List enrollments with filters, search, sorting, pagination
router.get('/', validate(enrollmentQuerySchema, 'query'), enrollmentController.getAllEnrollments);

// GET /api/enrollments/:id - Get enrollment details
router.get('/:id', enrollmentController.getEnrollmentById);

// POST /api/enrollments - Enroll a student in a course
router.post('/', validate(createEnrollmentSchema, 'body'), enrollmentController.createEnrollment);

// PATCH /api/enrollments/:id - Update grade, status, or semester
router.patch('/:id', validate(updateEnrollmentSchema, 'body'), enrollmentController.updateEnrollment);

// DELETE /api/enrollments/:id - Drop or remove enrollment
router.delete('/:id', enrollmentController.deleteEnrollment);

module.exports = router;
