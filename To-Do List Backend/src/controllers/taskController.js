const TaskModel = require('../models/taskModel');

/**
 * Task Controller - Handles business logic and HTTP responses
 */
class TaskController {
  /**
   * @route   GET /api/tasks
   * @desc    Retrieve all tasks with filtering, search, and pagination
   * @access  Public
   */
  static async getTasks(req, res, next) {
    try {
      const {
        status,
        search,
        priority,
        category,
        sortBy,
        order,
        page,
        limit
      } = req.query;

      const result = TaskModel.findAll({
        status,
        search,
        priority,
        category,
        sortBy,
        order,
        page,
        limit
      });

      res.status(200).json({
        success: true,
        count: result.tasks.length,
        pagination: result.pagination,
        data: result.tasks
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/tasks/:id
   * @desc    Retrieve a single task by ID
   * @access  Public
   */
  static async getTaskById(req, res, next) {
    try {
      const task = TaskModel.findById(req.taskId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task Not Found',
          message: `No task exists with ID ${req.taskId}.`
        });
      }

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/tasks
   * @desc    Create a new task
   * @access  Public
   */
  static async createTask(req, res, next) {
    try {
      const {
        title,
        description,
        status,
        priority,
        category,
        due_date
      } = req.body;

      const newTask = TaskModel.create({
        title,
        description,
        status,
        priority,
        category,
        due_date
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: newTask
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/tasks/:id or PATCH /api/tasks/:id
   * @desc    Update task details
   * @access  Public
   */
  static async updateTask(req, res, next) {
    try {
      const updatedTask = TaskModel.update(req.taskId, req.body);
      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          error: 'Task Not Found',
          message: `No task exists with ID ${req.taskId} to update.`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task updated successfully.',
        data: updatedTask
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PATCH /api/tasks/:id/status
   * @desc    Mark task as completed or pending / toggle status
   * @access  Public
   */
  static async toggleStatus(req, res, next) {
    try {
      const task = TaskModel.toggleStatus(req.taskId, req.normalizedStatus);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task Not Found',
          message: `No task exists with ID ${req.taskId}.`
        });
      }

      res.status(200).json({
        success: true,
        message: `Task status marked as ${task.status}.`,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/tasks/:id
   * @desc    Delete a task by ID
   * @access  Public
   */
  static async deleteTask(req, res, next) {
    try {
      const deleted = TaskModel.delete(req.taskId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Task Not Found',
          message: `No task exists with ID ${req.taskId} to delete.`
        });
      }

      res.status(200).json({
        success: true,
        message: `Task ${req.taskId} has been deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/tasks/completed
   * @desc    Batch clear all completed tasks
   * @access  Public
   */
  static async clearCompleted(req, res, next) {
    try {
      const deletedCount = TaskModel.clearCompleted();
      res.status(200).json({
        success: true,
        message: `Successfully cleared ${deletedCount} completed tasks.`,
        deletedCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/tasks/stats/summary
   * @desc    Retrieve aggregated task statistics
   * @access  Public
   */
  static async getStats(req, res, next) {
    try {
      const stats = TaskModel.getStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TaskController;
