const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middlewares/notFoundHandler');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve static frontend assets for interactive API UI and testing
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Routes
app.use('/api', apiRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
