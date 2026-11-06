/**
 * Standardized API Response Utilities
 */

const successResponse = (res, message, data = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta })
  };
  return res.status(statusCode).json(response);
};

const errorResponse = (res, message, errors = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    ...(errors !== null && { errors })
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
