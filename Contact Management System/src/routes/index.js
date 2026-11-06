const express = require('express');
const router = express.Router();
const contactRoutes = require('./contactRoutes');

// Root API Health and Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Contact Management System REST API',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      contacts: '/api/contacts',
      contactById: '/api/contacts/:id',
      contactStats: '/api/contacts/stats',
      search: '/api/contacts?search=query',
      pagination: '/api/contacts?page=1&limit=10&sortBy=name&order=ASC'
    }
  });
});

// Contacts Resource Routes
router.use('/contacts', contactRoutes);

module.exports = router;
