const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DB_STORAGE || './data/contacts.sqlite';

let storageConfig;
if (dbPath === ':memory:') {
  storageConfig = ':memory:';
} else {
  const resolvedDbPath = path.resolve(process.cwd(), dbPath);
  const dbDir = path.dirname(resolvedDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  storageConfig = resolvedDbPath;
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storageConfig,
  logging: process.env.NODE_ENV === 'test' ? false : (msg) => {
    if (process.env.DEBUG_SQL === 'true') {
      console.log(`[SQL] ${msg}`);
    }
  },
  define: {
    timestamps: true,
    underscored: false
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'test') {
      console.log(' SQLite database connected successfully.');
    }
  } catch (error) {
    console.error(' Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB
};
