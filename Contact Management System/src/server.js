require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { syncDatabase } = require('./models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect and synchronize SQLite database
    await connectDB();
    await syncDatabase();

    // Start Express HTTP server
    const server = app.listen(PORT, () => {
      console.log(` Contact Management Server running on port ${PORT}`);
      console.log(` Web UI & Dashboard: http://localhost:${PORT}`);
      console.log(` REST API Base URL:  http://localhost:${PORT}/api/contacts`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\n Gracefully shutting down server...');
      server.close(() => {
        console.log(' Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(' Server failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
