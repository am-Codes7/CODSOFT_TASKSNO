const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Contact name cannot be empty.' },
      len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters.' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_contact_email',
      msg: 'A contact with this email address already exists.'
    },
    validate: {
      isEmail: { msg: 'Please provide a valid email address.' },
      notEmpty: { msg: 'Email address cannot be empty.' }
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_contact_phone',
      msg: 'A contact with this phone number already exists.'
    },
    validate: {
      notEmpty: { msg: 'Phone number cannot be empty.' }
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Personal',
    validate: {
      isIn: {
        args: [['Personal', 'Professional', 'Other']],
        msg: 'Category must be either Personal, Professional, or Other.'
      }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  }
}, {
  tableName: 'contacts',
  indexes: [
    { fields: ['name'] },
    { fields: ['email'], unique: true },
    { fields: ['phoneNumber'], unique: true },
    { fields: ['company'] },
    { fields: ['category'] }
  ]
});

module.exports = Contact;
