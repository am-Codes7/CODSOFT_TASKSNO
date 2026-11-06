function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: [${req.method}] ${req.originalUrl}`,
    error: 'NotFound'
  });
}

module.exports = notFoundHandler;
