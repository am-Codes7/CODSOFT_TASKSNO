process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Ephemeral port for isolated testing

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');

let server;
let baseUrl;

// Helper to make HTTP requests using native fetch
async function api(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    body: data
  };
}

describe('TaskPulse REST API Test Suite', () => {
  before(() => {
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test('1. Health Check - GET /health returns 200 OK', async () => {
    const res = await api('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.ok(res.body.timestamp);
  });

  test('2. Swagger Spec - GET /api-docs.json returns valid OpenAPI spec', async () => {
    const res = await api('/api-docs.json');
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, '3.0.3');
    assert.ok(res.body.paths['/api/tasks']);
  });

  test('3. Task Retrieval - GET /api/tasks returns 200 with task list', async () => {
    const res = await api('/api/tasks');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.pagination);
  });

  let createdTaskId;

  test('4. Task Creation - POST /api/tasks with valid data returns 201 Created', async () => {
    const payload = {
      title: 'Automated CI Test Task',
      description: 'Testing end-to-end task creation flow',
      priority: 'high',
      category: 'DevOps',
      due_date: '2026-11-15'
    };

    const res = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.title, payload.title);
    assert.equal(res.body.data.priority, 'high');
    assert.equal(res.body.data.status, 'pending');
    assert.ok(res.body.data.id);
    createdTaskId = res.body.data.id;
  });

  test('5. Task Validation - POST /api/tasks with missing title returns 400 Bad Request', async () => {
    const payload = {
      description: 'No title provided',
      priority: 'urgent'
    };

    const res = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error, 'Validation Error');
    assert.ok(Array.isArray(res.body.details));
    assert.equal(res.body.details[0].field, 'title');
  });

  test('6. Task Validation - POST /api/tasks with invalid priority returns 400 Bad Request', async () => {
    const payload = {
      title: 'Invalid Priority Task',
      priority: 'super-urgent'
    };

    const res = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.details.some(d => d.field === 'priority'));
  });

  test('7. Task By ID - GET /api/tasks/:id returns 200 OK for existing task', async () => {
    const res = await api(`/api/tasks/${createdTaskId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, createdTaskId);
  });

  test('8. Task By ID - GET /api/tasks/:id returns 404 for non-existent task', async () => {
    const res = await api('/api/tasks/999999');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  test('9. Task By ID - GET /api/tasks/:id returns 400 for invalid ID format', async () => {
    const res = await api('/api/tasks/not-a-number');
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('10. Task Update - PUT /api/tasks/:id updates fields and returns 200 OK', async () => {
    const updatePayload = {
      title: 'Automated CI Test Task (Updated)',
      priority: 'urgent'
    };

    const res = await api(`/api/tasks/${createdTaskId}`, {
      method: 'PUT',
      body: JSON.stringify(updatePayload)
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.title, updatePayload.title);
    assert.equal(res.body.data.priority, 'urgent');
  });

  test('11. Status Toggle - PATCH /api/tasks/:id/status toggles status to completed', async () => {
    const res = await api(`/api/tasks/${createdTaskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' })
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'completed');
    assert.ok(res.body.data.completed_at);
  });

  test('12. Filtering - GET /api/tasks?status=completed filters tasks accurately', async () => {
    const res = await api('/api/tasks?status=completed');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.every(t => t.status === 'completed'));
  });

  test('13. Filtering - GET /api/tasks?status=pending filters tasks accurately', async () => {
    const res = await api('/api/tasks?status=pending');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.every(t => t.status === 'pending'));
  });

  test('14. Search - GET /api/tasks?search=Automated returns matching results', async () => {
    const res = await api('/api/tasks?search=Automated');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.some(t => t.id === createdTaskId));
  });

  test('15. Statistics - GET /api/tasks/stats/summary returns aggregated metrics', async () => {
    const res = await api('/api/tasks/stats/summary');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.data.total === 'number');
    assert.ok(typeof res.body.data.completed === 'number');
    assert.ok(typeof res.body.data.pending === 'number');
    assert.ok(res.body.data.byPriority);
    assert.ok(Array.isArray(res.body.data.byCategory));
  });

  test('16. Task Deletion - DELETE /api/tasks/:id returns 200 OK', async () => {
    const res = await api(`/api/tasks/${createdTaskId}`, {
      method: 'DELETE'
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify task is really deleted
    const verifyRes = await api(`/api/tasks/${createdTaskId}`);
    assert.equal(verifyRes.status, 404);
  });

  test('17. Deletion 404 - DELETE /api/tasks/:id for non-existent returns 404', async () => {
    const res = await api('/api/tasks/999999', {
      method: 'DELETE'
    });
    assert.equal(res.status, 404);
  });

  test('18. Batch Deletion - DELETE /api/tasks/completed clears completed tasks', async () => {
    const res = await api('/api/tasks/completed', {
      method: 'DELETE'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.deletedCount === 'number');
  });

  test('19. Route Not Found - GET /api/unknown-endpoint returns 404', async () => {
    const res = await api('/api/unknown-endpoint');
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'Route Not Found');
  });
});
