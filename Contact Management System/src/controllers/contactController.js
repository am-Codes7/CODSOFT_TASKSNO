const { Op } = require('sequelize');
const { Contact } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new contact
 * @route   POST /api/contacts
 * @access  Public
 */
const createContact = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, address, company, category, notes } = req.body;

    // Check for duplicate contact by email or phone number
    const existingContact = await Contact.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { phoneNumber }
        ]
      }
    });

    if (existingContact) {
      const duplicateField = existingContact.email.toLowerCase() === email.toLowerCase() ? 'email address' : 'phone number';
      return errorResponse(
        res,
        `Duplicate contact: A contact with this ${duplicateField} already exists.`,
        [{ field: duplicateField === 'email address' ? 'email' : 'phoneNumber', message: `This ${duplicateField} is already registered.` }],
        409
      );
    }

    const newContact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      address: address ? address.trim() : '',
      company: company ? company.trim() : '',
      category: category || 'Personal',
      notes: notes ? notes.trim() : ''
    });

    return successResponse(res, 'Contact created successfully.', newContact, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get contacts with search, filter, sorting, and pagination
 * @route   GET /api/contacts
 * @access  Public
 */
const getContacts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'createdAt';
    const order = (req.query.order || 'DESC').toUpperCase();

    const searchQuery = req.query.search || req.query.q;
    const categoryFilter = req.query.category;
    const companyFilter = req.query.company;

    // Build query conditions
    const whereConditions = [];

    // Search across name, email, and phoneNumber
    if (searchQuery && searchQuery.trim() !== '') {
      const sanitizedSearch = `%${searchQuery.trim()}%`;
      whereConditions.push({
        [Op.or]: [
          { name: { [Op.like]: sanitizedSearch } },
          { email: { [Op.like]: sanitizedSearch } },
          { phoneNumber: { [Op.like]: sanitizedSearch } }
        ]
      });
    }

    // Category filter
    if (categoryFilter && categoryFilter.trim() !== '') {
      whereConditions.push({ category: categoryFilter.trim() });
    }

    // Company filter
    if (companyFilter && companyFilter.trim() !== '') {
      whereConditions.push({ company: { [Op.like]: `%${companyFilter.trim()}%` } });
    }

    const whereClause = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    const { count, rows: contacts } = await Contact.findAndCountAll({
      where: whereClause,
      order: [[sortBy, order]],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit) || 1;

    const paginationMeta = {
      totalRecords: count,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      appliedFilters: {
        search: searchQuery || null,
        category: categoryFilter || null,
        company: companyFilter || null,
        sortBy,
        order
      }
    };

    return successResponse(res, 'Contacts retrieved successfully.', contacts, 200, paginationMeta);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single contact by ID
 * @route   GET /api/contacts/:id
 * @access  Public
 */
const getContactById = async (req, res, next) => {
  try {
    const contactId = req.params.id;
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      return errorResponse(res, `Contact with ID ${contactId} was not found.`, null, 404);
    }

    return successResponse(res, 'Contact retrieved successfully.', contact, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing contact by ID
 * @route   PUT /api/contacts/:id
 * @access  Public
 */
const updateContact = async (req, res, next) => {
  try {
    const contactId = req.params.id;
    const { name, email, phoneNumber, address, company, category, notes } = req.body;

    const contact = await Contact.findByPk(contactId);
    if (!contact) {
      return errorResponse(res, `Contact with ID ${contactId} was not found.`, null, 404);
    }

    // If updating email or phone, check that it's not already used by another contact
    const duplicateChecks = [];
    if (email && email.toLowerCase() !== contact.email.toLowerCase()) {
      duplicateChecks.push({ email: email.toLowerCase() });
    }
    if (phoneNumber && phoneNumber !== contact.phoneNumber) {
      duplicateChecks.push({ phoneNumber });
    }

    if (duplicateChecks.length > 0) {
      const duplicateContact = await Contact.findOne({
        where: {
          id: { [Op.ne]: contactId },
          [Op.or]: duplicateChecks
        }
      });

      if (duplicateContact) {
        const isEmailDup = email && duplicateContact.email.toLowerCase() === email.toLowerCase();
        const fieldName = isEmailDup ? 'email address' : 'phone number';
        return errorResponse(
          res,
          `Cannot update contact: Another contact is already using this ${fieldName}.`,
          [{ field: isEmailDup ? 'email' : 'phoneNumber', message: `This ${fieldName} is already taken by another contact.` }],
          409
        );
      }
    }

    // Apply updates
    if (name !== undefined) contact.name = name.trim();
    if (email !== undefined) contact.email = email.toLowerCase().trim();
    if (phoneNumber !== undefined) contact.phoneNumber = phoneNumber.trim();
    if (address !== undefined) contact.address = address.trim();
    if (company !== undefined) contact.company = company.trim();
    if (category !== undefined) contact.category = category;
    if (notes !== undefined) contact.notes = notes.trim();

    await contact.save();

    return successResponse(res, 'Contact updated successfully.', contact, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a contact by ID
 * @route   DELETE /api/contacts/:id
 * @access  Public
 */
const deleteContact = async (req, res, next) => {
  try {
    const contactId = req.params.id;
    const contact = await Contact.findByPk(contactId);

    if (!contact) {
      return errorResponse(res, `Contact with ID ${contactId} was not found.`, null, 404);
    }

    await contact.destroy();

    return successResponse(res, `Contact "${contact.name}" deleted successfully.`, { id: contact.id }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get summary statistics of contacts
 * @route   GET /api/contacts/stats
 * @access  Public
 */
const getContactStats = async (req, res, next) => {
  try {
    const total = await Contact.count();
    const personal = await Contact.count({ where: { category: 'Personal' } });
    const professional = await Contact.count({ where: { category: 'Professional' } });
    const other = await Contact.count({ where: { category: 'Other' } });

    const stats = {
      totalContacts: total,
      byCategory: {
        Personal: personal,
        Professional: professional,
        Other: other
      }
    };

    return successResponse(res, 'Contact statistics retrieved successfully.', stats, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats
};
