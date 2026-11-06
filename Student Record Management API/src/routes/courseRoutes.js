const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const validate = require('../middleware/validate');
const {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema
} = require('../validators/courseValidator');

// GET /api/courses - List courses with search, filters, sorting, pagination
router.get('/', validate(courseQuerySchema, 'query'), courseController.getAllCourses);

// GET /api/courses/:id - Get course details with enrolled students
router.get('/:id', courseController.getCourseById);

// POST /api/courses - Create new course
router.post('/', validate(createCourseSchema, 'body'), courseController.createCourse);

// PUT /api/courses/:id - Full update
router.put('/:id', validate(createCourseSchema, 'body'), courseController.updateCourse);

// PATCH /api/courses/:id - Partial update
router.patch('/:id', validate(updateCourseSchema, 'body'), courseController.updateCourse);

// DELETE /api/courses/:id - Delete course
router.delete('/:id', courseController.deleteCourse);

module.exports = router;
