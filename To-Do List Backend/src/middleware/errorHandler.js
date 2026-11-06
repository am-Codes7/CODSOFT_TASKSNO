/**
 * Centralized error handling middleware
 */

// 404 Not Found Handler for unmatched routes
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};

// Global Error Handler for unexpected exceptions
const errorHandler = (err, req, res, next) => {
  console.error('[Error Logger]', err);

  // Handle JSON parse errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON',
      message: 'The request body contains invalid JSON syntax.'
    });
  }

  // SQLite constraint errors
  if (err.code && err.code.startsWith('SQLITE_CONSTRAINT')) {
    return res.status(400).json({
      success: false,
      error: 'Database Constraint Violation',
      message: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.'
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
