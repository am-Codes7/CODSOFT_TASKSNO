const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./env');

// Ensure database directory exists
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite connection
const db = new DatabaseSync(config.DB_PATH);

// Enable foreign keys and WAL mode for reliability and concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Execute a query returning all rows
 * @param {string} sql 
 * @param {Array} params 
 * @returns {Array<object>}
 */
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Execute a query returning the first matching row
 * @param {string} sql 
 * @param {Array} params 
 * @returns {object|null}
 */
function get(sql, params = []) {
  const stmt = db.prepare(sql);
  const row = stmt.get(...params);
  return row || null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE statement
 * @param {string} sql 
 * @param {Array} params 
 * @returns {{ changes: number, lastInsertRowid: number }}
 */
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * Execute statements in a transaction
 * @param {Function} callback 
 * @returns {*}
 */
function transaction(callback) {
  db.exec('BEGIN TRANSACTION;');
  try {
    const result = callback();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

module.exports = {
  db,
  query,
  get,
  run,
  transaction
};
