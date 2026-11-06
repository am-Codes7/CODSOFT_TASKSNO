const app = require('./app');
const config = require('./config/env');
const initDb = require('./database/initDb');

// Ensure database schema is ready
initDb();

const server = app.listen(config.PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Student Record Management API is running!`);
  console.log(`🌐 Base URL:      http://localhost:${config.PORT}`);
  console.log(`📊 Dashboard UI:  http://localhost:${config.PORT}`);
  console.log(`🩺 Health Check: http://localhost:${config.PORT}/api/health`);
  console.log(`📚 Students API:  http://localhost:${config.PORT}/api/students`);
  console.log(`🎓 Courses API:   http://localhost:${config.PORT}/api/courses`);
  console.log(`📝 Enrollments:   http://localhost:${config.PORT}/api/enrollments`);
  console.log(`📈 Analytics:     http://localhost:${config.PORT}/api/dashboard/stats`);
  console.log('====================================================');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server.');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server.');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});
