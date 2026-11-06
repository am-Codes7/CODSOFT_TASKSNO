// Automated Test Suite for Contact Management System REST API
process.env.NODE_ENV = 'test';
process.env.DB_STORAGE = ':memory:'; // Use in-memory SQLite database for test isolation

const http = require('http');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');
const { syncDatabase, Contact } = require('../src/models');

let server;
let baseUrl;

// Test Runner Helpers
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);
  return { status: response.status, body: data };
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   Starting Contact Management System API Test Suite');
  console.log('======================================================\n');

  // Setup server and DB
  await syncDatabase(true);
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl} on in-memory SQLite\n`);
      resolve();
    });
  });

  try {
    // TEST 1: API Information endpoint
    console.log('[1] Testing API Meta Endpoint:');
    const infoRes = await request('/api');
    assert(infoRes.status === 200, 'GET /api returns HTTP 200');
    assert(infoRes.body.status === 'online', 'API status reports "online"');

    // TEST 2: Create Contact with valid data
    console.log('\n[2] Testing Contact Creation (POST /api/contacts):');
    const contactData1 = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1 555-010-1234',
      address: '123 Main St, Springfield',
      company: 'Acme Corp',
      category: 'Professional',
      notes: 'Initial contact'
    };
    const createRes1 = await request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData1)
    });
    assert(createRes1.status === 201, 'POST /api/contacts returns HTTP 201 Created');
    assert(createRes1.body.success === true, 'Response payload has success: true');
    assert(createRes1.body.data.name === 'John Doe', 'Contact name matches');
    assert(createRes1.body.data.id === 1, 'Auto-assigned contact ID is 1');

    // TEST 3: Validation Error on missing required fields
    console.log('\n[3] Testing Input Validation (POST /api/contacts):');
    const invalidContact = {
      name: 'J', // too short
      email: 'not-an-email', // invalid email
      phoneNumber: '' // empty phone
    };
    const createInvalidRes = await request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(invalidContact)
    });
    assert(createInvalidRes.status === 400, 'Invalid contact submission returns HTTP 400 Bad Request');
    assert(Array.isArray(createInvalidRes.body.errors), 'Response contains structured validation errors array');
    assert(createInvalidRes.body.errors.some(e => e.field === 'email'), 'Validation error flags invalid email field');

    // TEST 4: Duplicate Contact Prevention
    console.log('\n[4] Testing Duplicate Prevention (POST /api/contacts):');
    const duplicateEmailContact = {
      name: 'John Clone',
      email: 'john.doe@example.com', // same email
      phoneNumber: '+1 555-099-8877'
    };
    const duplicateRes = await request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(duplicateEmailContact)
    });
    assert(duplicateRes.status === 409, 'Duplicate email returns HTTP 409 Conflict');
    assert(duplicateRes.body.message.includes('Duplicate contact'), 'Duplicate error message is clear and descriptive');

    // TEST 5: Create a second contact for search, sort, and pagination tests
    console.log('\n[5] Creating Additional Contacts for Search & Pagination:');
    const contactData2 = {
      name: 'Alice Wonder',
      email: 'alice.w@wonderland.co',
      phoneNumber: '+1 555-020-5678',
      address: '99 Rabbit Hole Way',
      company: 'Wonderland Design',
      category: 'Personal',
      notes: 'Creative director'
    };
    const createRes2 = await request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData2)
    });
    assert(createRes2.status === 201, 'Second contact created successfully');

    const contactData3 = {
      name: 'Bob Smith',
      email: 'bob.smith@techflow.io',
      phoneNumber: '+44 20 7123 4567',
      address: '10 Downing St, London',
      company: 'TechFlow',
      category: 'Professional',
      notes: 'DevOps Lead'
    };
    await request('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData3)
    });

    // TEST 6: Search Contacts
    console.log('\n[6] Testing Search Functionality (GET /api/contacts?search=...):');
    const searchRes = await request('/api/contacts?search=alice');
    assert(searchRes.status === 200, 'Search query returns HTTP 200');
    assert(searchRes.body.data.length === 1, 'Search query returned exactly 1 matching record');
    assert(searchRes.body.data[0].name === 'Alice Wonder', 'Matched correct contact by name');

    const searchPhoneRes = await request('/api/contacts?search=4567');
    assert(searchPhoneRes.status === 200, 'Search by partial phone number returns HTTP 200');
    assert(searchPhoneRes.body.data[0].name === 'Bob Smith', 'Matched contact by phone number');

    // TEST 7: Filtering and Sorting
    console.log('\n[7] Testing Filtering & Sorting:');
    const filterCategoryRes = await request('/api/contacts?category=Personal');
    assert(filterCategoryRes.status === 200, 'Filter by category returns HTTP 200');
    assert(filterCategoryRes.body.data.length === 1 && filterCategoryRes.body.data[0].name === 'Alice Wonder', 'Personal category filter returns Alice');

    const sortRes = await request('/api/contacts?sortBy=name&order=ASC');
    assert(sortRes.status === 200, 'Sorting by name ASC returns HTTP 200');
    assert(sortRes.body.data[0].name === 'Alice Wonder', 'First sorted contact is Alice Wonder');
    assert(sortRes.body.data[1].name === 'Bob Smith', 'Second sorted contact is Bob Smith');
    assert(sortRes.body.data[2].name === 'John Doe', 'Third sorted contact is John Doe');

    // TEST 8: Pagination
    console.log('\n[8] Testing Pagination:');
    const pageRes = await request('/api/contacts?page=1&limit=2');
    assert(pageRes.status === 200, 'Pagination query returns HTTP 200');
    assert(pageRes.body.data.length === 2, 'Page 1 limit 2 returns 2 items');
    assert(pageRes.body.meta.currentPage === 1, 'Meta currentPage is 1');
    assert(pageRes.body.meta.totalPages === 2, 'Meta totalPages is 2');
    assert(pageRes.body.meta.hasNextPage === true, 'Meta hasNextPage is true');

    // TEST 9: Get Contact by ID
    console.log('\n[9] Testing Get Contact by ID (GET /api/contacts/:id):');
    const getSingleRes = await request('/api/contacts/1');
    assert(getSingleRes.status === 200, 'GET /api/contacts/1 returns HTTP 200');
    assert(getSingleRes.body.data.email === 'john.doe@example.com', 'Contact details match expected ID');

    const getNotFoundRes = await request('/api/contacts/999');
    assert(getNotFoundRes.status === 404, 'Non-existent ID returns HTTP 404 Not Found');

    // TEST 10: Update Contact
    console.log('\n[10] Testing Update Contact (PUT /api/contacts/:id):');
    const updateRes = await request('/api/contacts/1', {
      method: 'PUT',
      body: JSON.stringify({ company: 'Acme International', category: 'Professional' })
    });
    assert(updateRes.status === 200, 'PUT /api/contacts/1 returns HTTP 200');
    assert(updateRes.body.data.company === 'Acme International', 'Company updated properly');

    // TEST 11: Update Duplicate Conflict
    console.log('\n[11] Testing Update Duplicate Conflict (PUT /api/contacts/:id):');
    const updateDupRes = await request('/api/contacts/1', {
      method: 'PUT',
      body: JSON.stringify({ email: 'alice.w@wonderland.co' }) // already belongs to Alice
    });
    assert(updateDupRes.status === 409, 'Updating email to existing contact email returns HTTP 409 Conflict');

    // TEST 12: Delete Contact
    console.log('\n[12] Testing Delete Contact (DELETE /api/contacts/:id):');
    const deleteRes = await request('/api/contacts/1', { method: 'DELETE' });
    assert(deleteRes.status === 200, 'DELETE /api/contacts/1 returns HTTP 200');

    const checkDeletedRes = await request('/api/contacts/1');
    assert(checkDeletedRes.status === 404, 'Contact ID 1 is verified removed (404 Not Found)');

    // TEST 13: Statistics Endpoint
    console.log('\n[13] Testing Contact Statistics (GET /api/contacts/stats):');
    const statsRes = await request('/api/contacts/stats');
    assert(statsRes.status === 200, 'GET /api/contacts/stats returns HTTP 200');
    assert(statsRes.body.data.totalContacts === 2, 'Remaining total contacts count is 2');
    assert(statsRes.body.data.byCategory.Personal === 1, 'Personal contacts count is 1');
    assert(statsRes.body.data.byCategory.Professional === 1, 'Professional contacts count is 1');

    console.log('\n======================================================');
    console.log(` Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
    console.log('======================================================\n');

    if (failedTests > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Unhandled test suite error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await sequelize.close();
  }
}

runTestSuite();
