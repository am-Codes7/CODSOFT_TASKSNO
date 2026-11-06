const { body, query, param } = require('express-validator');

const validateCreateContact = [
  body('name')
    .trim()
    .notEmpty().withMessage('Contact name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required.')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{5,15}$/)
    .withMessage('Please provide a valid phone number (e.g., +1 555-123-4567, 9876543210).'),

  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 255 }).withMessage('Address cannot exceed 255 characters.'),

  body('company')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters.'),

  body('category')
    .optional()
    .trim()
    .isIn(['Personal', 'Professional', 'Other'])
    .withMessage('Category must be Personal, Professional, or Other.'),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters.')
];

const validateUpdateContact = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid contact ID. Must be a positive integer.'),

  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Contact name cannot be empty.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{5,15}$/)
    .withMessage('Please provide a valid phone number (e.g., +1 555-123-4567, 9876543210).'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 }).withMessage('Address cannot exceed 255 characters.'),

  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Company name cannot exceed 100 characters.'),

  body('category')
    .optional()
    .trim()
    .isIn(['Personal', 'Professional', 'Other'])
    .withMessage('Category must be Personal, Professional, or Other.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters.')
];

const validateIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('Invalid contact ID. Must be a positive integer.')
];

const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page number must be a positive integer starting from 1.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100.')
    .toInt(),

  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'phoneNumber', 'company', 'category', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: name, email, phoneNumber, company, category, createdAt, updatedAt.'),

  query('order')
    .optional()
    .toUpperCase()
    .isIn(['ASC', 'DESC'])
    .withMessage('Order must be either ASC or DESC.')
];

module.exports = {
  validateCreateContact,
  validateUpdateContact,
  validateIdParam,
  validateQueryParams
};
