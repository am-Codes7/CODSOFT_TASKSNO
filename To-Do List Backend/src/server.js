require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TaskPulse REST API Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`📄 Raw OpenAPI Spec: http://localhost:${PORT}/api-docs.json`);
  console.log(`📊 Health Endpoint: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

module.exports = server;
