const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'To-Do List REST API Service',
    version: '1.0.0',
    description: `A robust RESTful API backend service for task management featuring SQLite database storage, dynamic searching & filtering, priority tiers, category categorization, due dates, and comprehensive status tracking.`,
    contact: {
      name: 'API Support'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  tags: [
    {
      name: 'Tasks',
      description: 'Core task CRUD operations, status management, search & filtering'
    },
    {
      name: 'Statistics',
      description: 'Aggregated analytics and task completion metrics'
    }
  ],
  paths: {
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Retrieve tasks with filtering, search & pagination',
        description: 'Fetch tasks filtered by completion status, priority, category, or search term with customizable sorting.',
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter by task status',
            required: false,
            schema: {
              type: 'string',
              enum: ['all', 'pending', 'completed'],
              default: 'all'
            }
          },
          {
            name: 'priority',
            in: 'query',
            description: 'Filter by priority level',
            required: false,
            schema: {
              type: 'string',
              enum: ['all', 'low', 'medium', 'high', 'urgent']
            }
          },
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category name (e.g. Backend, Documentation, Personal)',
            required: false,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search keyword matching title or description',
            required: false,
            schema: {
              type: 'string'
            }
          },
          {
            name: 'sortBy',
            in: 'query',
            description: 'Field to sort tasks by',
            required: false,
            schema: {
              type: 'string',
              enum: ['created_at', 'due_date', 'priority', 'title', 'status', 'updated_at'],
              default: 'created_at'
            }
          },
          {
            name: 'order',
            in: 'query',
            description: 'Sort ordering direction',
            required: false,
            schema: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc'
            }
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of tasks per page',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successfully retrieved tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 5 },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', example: 5 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 50 },
                        totalPages: { type: 'integer', example: 1 }
                      }
                    },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid query parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task',
        description: 'Creates a new task in the database with validated payload.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskInput' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task created successfully.' },
                    data: { $ref: '#/components/schemas/Task' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation failed or missing required fields',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          }
        }
      }
    },
    '/api/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get task by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Numeric ID of the task',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Task details found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Task' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid ID format',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '404': {
            description: 'Task with specified ID not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Tasks'],
        summary: 'Full update of a task',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Numeric ID of the task',
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Task updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task updated successfully.' },
                    data: { $ref: '#/components/schemas/Task' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error in update fields',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '404': {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Partial update of a task',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Numeric ID of the task',
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Task updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task updated successfully.' },
                    data: { $ref: '#/components/schemas/Task' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '404': {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete task by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Numeric ID of the task',
            schema: { type: 'integer' }
          }
        ],
        responses: {
          '200': {
            description: 'Task deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task 1 has been deleted successfully.' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/tasks/{id}/status': {
      patch: {
        tags: ['Tasks'],
        summary: 'Mark task as completed or pending (or toggle)',
        description: 'Update completion status of a task. If body is omitted, toggles between pending and completed.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Numeric ID of the task',
            schema: { type: 'integer' }
          }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending', 'completed'],
                    example: 'completed'
                  },
                  completed: {
                    type: 'boolean',
                    example: true
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Task status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task status marked as completed.' },
                    data: { $ref: '#/components/schemas/Task' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid status value',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' }
              }
            }
          },
          '404': {
            description: 'Task not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/tasks/completed': {
      delete: {
        tags: ['Tasks'],
        summary: 'Batch clear all completed tasks',
        responses: {
          '200': {
            description: 'Completed tasks purged successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Successfully cleared 2 completed tasks.' },
                    deletedCount: { type: 'integer', example: 2 }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/tasks/stats/summary': {
      get: {
        tags: ['Statistics'],
        summary: 'Retrieve aggregated task metrics',
        description: 'Returns total counts, pending/completed metrics, overdue count, completion rate, and breakdowns by priority & category.',
        responses: {
          '200': {
            description: 'Aggregated statistics calculated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/TaskStats' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          title: { type: 'string', example: 'Design RESTful API Architecture' },
          description: { type: 'string', example: 'Set up controllers, routes, models, and validation middleware.' },
          status: { type: 'string', enum: ['pending', 'completed'], example: 'pending' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], example: 'high' },
          category: { type: 'string', example: 'Architecture' },
          due_date: { type: 'string', format: 'date', example: '2026-10-25' },
          completed_at: { type: 'string', format: 'date-time', nullable: true, example: null },
          created_at: { type: 'string', format: 'date-time', example: '2026-10-21 14:00:00' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-10-21 14:30:00' }
        }
      },
      TaskInput: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Write unit tests' },
          description: { type: 'string', example: 'Cover all edge cases for API responses' },
          status: { type: 'string', enum: ['pending', 'completed'], default: 'pending' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
          category: { type: 'string', default: 'General', example: 'Quality Assurance' },
          due_date: { type: 'string', format: 'date', example: '2026-10-28' }
        }
      },
      TaskUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Refactor Task Service' },
          description: { type: 'string', example: 'Updated task description' },
          status: { type: 'string', enum: ['pending', 'completed'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          category: { type: 'string', example: 'Refactoring' },
          due_date: { type: 'string', format: 'date', example: '2026-11-01' }
        }
      },
      TaskStats: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 5 },
          completed: { type: 'integer', example: 2 },
          pending: { type: 'integer', example: 3 },
          overdue: { type: 'integer', example: 0 },
          completionRate: { type: 'string', example: '40%' },
          byPriority: {
            type: 'object',
            properties: {
              low: { type: 'integer', example: 1 },
              medium: { type: 'integer', example: 1 },
              high: { type: 'integer', example: 2 },
              urgent: { type: 'integer', example: 1 }
            }
          },
          byCategory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', example: 'Architecture' },
                count: { type: 'integer', example: 1 }
              }
            }
          }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Validation Error' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'title' },
                message: { type: 'string', example: 'Title is required and must be a non-empty string.' }
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Task Not Found' },
          message: { type: 'string', example: 'No task exists with ID 99.' }
        }
      }
    }
  }
};

const setupSwagger = (app) => {
  // Raw JSON spec endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  // Swagger UI mount
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'To-Do List REST API Documentation',
      customCss: `
        .swagger-ui .topbar { background-color: #0f172a; border-bottom: 2px solid #3b82f6; }
        .swagger-ui .info { margin: 24px 0; }
        .swagger-ui .scheme-container { background: #f8fafc; padding: 15px 0; }
        .swagger-ui .btn.execute { background-color: #2563eb; color: #fff; }
      `
    })
  );
};

module.exports = {
  swaggerDocument,
  setupSwagger
};
