const { sequelize } = require('../config/database');
const Contact = require('./Contact');

const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(` Database schema synchronized${force ? ' (forced re-creation)' : ''}.`);
  } catch (error) {
    console.error(' Failed to sync database schema:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  Contact,
  syncDatabase
};
