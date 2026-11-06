const path = require('node:path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '../../data/student_records.db')
};
