const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const validate = require('../middlewares/validationHandler');
const {
  validateCreateContact,
  validateUpdateContact,
  validateIdParam,
  validateQueryParams
} = require('../validators/contactValidator');

// Contact routes
router.route('/')
  .post(validateCreateContact, validate, contactController.createContact)
  .get(validateQueryParams, validate, contactController.getContacts);

// Aggregated stats endpoint (defined before :id to prevent collision)
router.get('/stats', contactController.getContactStats);

router.route('/:id')
  .get(validateIdParam, validate, contactController.getContactById)
  .put(validateUpdateContact, validate, contactController.updateContact)
  .delete(validateIdParam, validate, contactController.deleteContact);

module.exports = router;
