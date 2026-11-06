/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  const message = err.message || 'Internal Server Error';
  let statusCode = err.status || err.statusCode || 500;

  // Handle SQLite constraint violations
  if (message.includes('UNIQUE constraint failed')) {
    statusCode = 409;
    const match = message.match(/UNIQUE constraint failed: ([\w.]+)/);
    const field = match ? match[1] : 'field';
    return res.status(statusCode).json({
      success: false,
      message: `Conflict: A record with this unique value (${field}) already exists.`,
      error: 'UniqueConstraintError'
    });
  }

  if (message.includes('FOREIGN KEY constraint failed')) {
    statusCode = 400;
    return res.status(statusCode).json({
      success: false,
      message: 'Referential integrity violation: Referenced foreign key does not exist or has dependent records.',
      error: 'ForeignKeyConstraintError'
    });
  }

  if (message.includes('CHECK constraint failed')) {
    statusCode = 400;
    return res.status(statusCode).json({
      success: false,
      message: `Data violation: ${message}`,
      error: 'CheckConstraintError'
    });
  }

  if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
