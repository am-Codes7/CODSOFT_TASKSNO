const { errorResponse } = require('../utils/apiResponse');

const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    `Resource not found: Cannot ${req.method} ${req.originalUrl}`,
    null,
    404
  );
};

module.exports = notFoundHandler;
