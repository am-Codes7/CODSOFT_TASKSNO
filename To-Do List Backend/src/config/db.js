const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'tasks.db');
const db = new Database(dbPath);

// Enable WAL mode for high-performance concurrent read/writes
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
const initializeDatabase = () => {
  const schema = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      category TEXT NOT NULL DEFAULT 'General',
      due_date TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
  `;

  db.exec(schema);

  // Seed with sample tasks if the table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  if (countRow.count === 0) {
    const seedTasks = [
      {
        title: 'Design RESTful API Architecture',
        description: 'Set up controllers, routes, models, and validation middleware for the To-Do backend service.',
        status: 'completed',
        priority: 'high',
        category: 'Architecture',
        due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        completed_at: new Date().toISOString()
      },
      {
        title: 'Implement Database Storage & Indexes',
        description: 'Configure SQLite database storage with WAL mode, validation constraints, and query indexes.',
        status: 'completed',
        priority: 'urgent',
        category: 'Backend',
        due_date: new Date().toISOString().split('T')[0],
        completed_at: new Date().toISOString()
      },
      {
        title: 'Document Endpoints with Swagger OpenAPI 3.0',
        description: 'Generate interactive Swagger UI documentation and export Postman collections for client integration.',
        status: 'pending',
        priority: 'high',
        category: 'Documentation',
        due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        completed_at: null
      },
      {
        title: 'Run Automated Integration Tests',
        description: 'Validate CRUD operations, filter parameters, status toggles, and status code edge cases.',
        status: 'pending',
        priority: 'medium',
        category: 'Testing',
        due_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        completed_at: null
      },
      {
        title: 'Build Interactive Dashboard Client',
        description: 'Deliver responsive frontend dashboard providing live metrics, filtering, and real-time task management.',
        status: 'pending',
        priority: 'low',
        category: 'Frontend',
        due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        completed_at: null
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, category, due_date, completed_at, created_at, updated_at)
      VALUES (@title, @description, @status, @priority, @category, @due_date, @completed_at, datetime('now'), datetime('now'))
    `);

    const insertMany = db.transaction((tasks) => {
      for (const task of tasks) {
        insertStmt.run(task);
      }
    });

    insertMany(seedTasks);
  }
};

initializeDatabase();

module.exports = db;
