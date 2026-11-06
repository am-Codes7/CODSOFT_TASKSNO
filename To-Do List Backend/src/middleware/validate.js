/**
 * Input validation middleware for Task REST APIs
 */

const ALLOWED_STATUSES = ['pending', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Validate URL param :id
 */
const validateTaskId = (req, res, next) => {
  const { id } = req.params;
  const numId = Number(id);

  if (!Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Task ID',
      details: [{ field: 'id', message: 'Task ID must be a positive integer.' }]
    });
  }

  req.taskId = numId;
  next();
};

/**
 * Helper to validate date string
 */
const isValidDateString = (dateStr) => {
  if (!dateStr) return true;
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
};

/**
 * Validate body for task creation
 */
const validateCreateTask = (req, res, next) => {
  const errors = [];
  const { title, description, status, priority, category, due_date } = req.body || {};

  // Title validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required and must be a non-empty string.' });
  } else if (title.trim().length > 200) {
    errors.push({ field: 'title', message: 'Title cannot exceed 200 characters.' });
  }

  // Description validation
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string.' });
    } else if (description.length > 2000) {
      errors.push({ field: 'description', message: 'Description cannot exceed 2000 characters.' });
    }
  }

  // Status validation
  if (status !== undefined) {
    if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status.toLowerCase())) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`
      });
    }
  }

  // Priority validation
  if (priority !== undefined) {
    if (typeof priority !== 'string' || !ALLOWED_PRIORITIES.includes(priority.toLowerCase())) {
      errors.push({
        field: 'priority',
        message: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}.`
      });
    }
  }

  // Category validation
  if (category !== undefined && category !== null) {
    if (typeof category !== 'string') {
      errors.push({ field: 'category', message: 'Category must be a string.' });
    } else if (category.trim().length > 50) {
      errors.push({ field: 'category', message: 'Category cannot exceed 50 characters.' });
    }
  }

  // Due date validation
  if (due_date !== undefined && due_date !== null && String(due_date).trim() !== '') {
    if (!isValidDateString(due_date)) {
      errors.push({ field: 'due_date', message: 'due_date must be a valid date string (e.g. YYYY-MM-DD or ISO 8601).' });
    }
  } else {
    req.body.due_date = null;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }

  next();
};

/**
 * Validate body for task update
 */
const validateUpdateTask = (req, res, next) => {
  const errors = [];
  const body = req.body || {};
  const allowedKeys = ['title', 'description', 'status', 'priority', 'category', 'due_date'];
  const providedKeys = Object.keys(body).filter((key) => allowedKeys.includes(key));

  if (providedKeys.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Empty Update Payload',
      details: [{ message: 'At least one field must be provided to update (title, description, status, priority, category, due_date).' }]
    });
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title cannot be empty.' });
    } else if (body.title.trim().length > 200) {
      errors.push({ field: 'title', message: 'Title cannot exceed 200 characters.' });
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string.' });
    } else if (body.description.length > 2000) {
      errors.push({ field: 'description', message: 'Description cannot exceed 2000 characters.' });
    }
  }

  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !ALLOWED_STATUSES.includes(body.status.toLowerCase())) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`
      });
    }
  }

  if (body.priority !== undefined) {
    if (typeof body.priority !== 'string' || !ALLOWED_PRIORITIES.includes(body.priority.toLowerCase())) {
      errors.push({
        field: 'priority',
        message: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}.`
      });
    }
  }

  if (body.category !== undefined && body.category !== null) {
    if (typeof body.category !== 'string' || body.category.trim().length === 0) {
      errors.push({ field: 'category', message: 'Category must be a non-empty string.' });
    } else if (body.category.trim().length > 50) {
      errors.push({ field: 'category', message: 'Category cannot exceed 50 characters.' });
    }
  }

  if (body.due_date !== undefined && body.due_date !== null && String(body.due_date).trim() !== '') {
    if (!isValidDateString(body.due_date)) {
      errors.push({ field: 'due_date', message: 'due_date must be a valid date string or null.' });
    }
  } else if (body.due_date !== undefined) {
    req.body.due_date = null;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }

  next();
};

/**
 * Validate status update payload
 */
const validateStatusPayload = (req, res, next) => {
  const { status, completed } = req.body || {};

  if (status !== undefined) {
    if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        details: [{ field: 'status', message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.` }]
      });
    }
    req.normalizedStatus = status.toLowerCase();
  } else if (completed !== undefined) {
    req.normalizedStatus = completed ? 'completed' : 'pending';
  } else {
    // No explicit body, will toggle automatically
    req.normalizedStatus = null;
  }

  next();
};

/**
 * Validate query parameters for listing tasks
 */
const validateListQueryParams = (req, res, next) => {
  const errors = [];
  const { status, priority, page, limit, sortBy, order } = req.query;

  if (status && status !== 'all' && !ALLOWED_STATUSES.includes(status.toLowerCase())) {
    errors.push({ field: 'status', message: `Query status filter must be 'all', 'pending', or 'completed'.` });
  }

  if (priority && priority !== 'all' && !ALLOWED_PRIORITIES.includes(priority.toLowerCase())) {
    errors.push({ field: 'priority', message: `Query priority filter must be 'all', 'low', 'medium', 'high', or 'urgent'.` });
  }

  if (page !== undefined) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum <= 0) {
      errors.push({ field: 'page', message: 'Page must be a positive integer.' });
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be an integer between 1 and 100.' });
    }
  }

  if (order && !['asc', 'desc'].includes(order.toLowerCase())) {
    errors.push({ field: 'order', message: `Order must be 'asc' or 'desc'.` });
  }

  const allowedSortKeys = ['created_at', 'due_date', 'priority', 'title', 'status', 'updated_at', 'category'];
  if (sortBy && !allowedSortKeys.includes(sortBy)) {
    errors.push({ field: 'sortBy', message: `sortBy must be one of: ${allowedSortKeys.join(', ')}.` });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Query Parameters',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask,
  validateStatusPayload,
  validateListQueryParams
};
