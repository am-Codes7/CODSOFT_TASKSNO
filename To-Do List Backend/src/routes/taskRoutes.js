const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask,
  validateStatusPayload,
  validateListQueryParams
} = require('../middleware/validate');

/**
 * Task Routes
 */

// Aggregated metrics & dashboard statistics
router.get('/stats/summary', TaskController.getStats);

// Batch delete completed tasks
router.delete('/completed', TaskController.clearCompleted);

// List tasks with filtering, search, and pagination
router.get('/', validateListQueryParams, TaskController.getTasks);

// Create a new task
router.post('/', validateCreateTask, TaskController.createTask);

// Retrieve a single task by ID
router.get('/:id', validateTaskId, TaskController.getTaskById);

// Update task details (Full or Partial)
router.put('/:id', validateTaskId, validateUpdateTask, TaskController.updateTask);
router.patch('/:id', validateTaskId, validateUpdateTask, TaskController.updateTask);

// Mark task as completed or pending / toggle status
router.patch('/:id/status', validateTaskId, validateStatusPayload, TaskController.toggleStatus);

// Delete task by ID
router.delete('/:id', validateTaskId, TaskController.deleteTask);

module.exports = router;
