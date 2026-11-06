const fs = require('node:fs');
const path = require('node:path');
const { db } = require('../config/db');

function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split and execute statements
  db.exec(schemaSql);
  console.log('✅ Database schema initialized successfully.');
}

if (require.main === module) {
  try {
    initDb();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  }
}

module.exports = initDb;
