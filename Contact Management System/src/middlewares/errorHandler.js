const { errorResponse } = require('../utils/apiResponse');

/**
 * Global Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${err.name}: ${err.message}`);
  }

  // Handle Sequelize Unique Constraint Violation (fallback safety)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'field';
    return errorResponse(
      res,
      `A contact with this ${field} already exists.`,
      err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : null,
      409
    );
  }

  // Handle Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    return errorResponse(
      res,
      'Validation error occurred.',
      err.errors.map(e => ({ field: e.path, message: e.message })),
      400
    );
  }

  // Handle Bad JSON syntax in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Malformed JSON payload provided in request body.', null, 400);
  }

  // Default internal server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(
    res,
    message,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
    statusCode
  );
};

module.exports = errorHandler;
