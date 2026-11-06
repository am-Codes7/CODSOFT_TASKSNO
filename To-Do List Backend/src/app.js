const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const taskRoutes = require('./routes/taskRoutes');
const { setupSwagger } = require('./docs/swagger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request logging (suppressed in automated test environments)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve interactive frontend client
app.use(express.static(path.join(__dirname, '../public')));

// Serve raw Postman collection file from project root
app.get('/postman_collection.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../postman_collection.json'));
});

// Setup Swagger API Documentation
setupSwagger(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount Task REST API routes
app.use('/api/tasks', taskRoutes);

// Centralized 404 & error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
