const db = require('../config/db');

class TaskModel {
  /**
   * Create a new task
   */
  static create({ title, description = '', status = 'pending', priority = 'medium', category = 'General', due_date = null }) {
    const completed_at = status === 'completed' ? new Date().toISOString() : null;
    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, category, due_date, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = stmt.run(title.trim(), description ? description.trim() : '', status, priority, category.trim(), due_date, completed_at);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Find a task by primary ID
   */
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const task = stmt.get(id);
    return task || null;
  }

  /**
   * Get all tasks with flexible filtering, searching, sorting, and pagination
   */
  static findAll({
    status,
    search,
    priority,
    category,
    sortBy = 'created_at',
    order = 'DESC',
    page = 1,
    limit = 50
  } = {}) {
    const conditions = [];
    const params = [];

    // Filter by completion status
    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status.toLowerCase());
    }

    // Filter by priority
    if (priority && priority !== 'all') {
      conditions.push('priority = ?');
      params.push(priority.toLowerCase());
    }

    // Filter by category
    if (category && category !== 'all') {
      conditions.push('LOWER(category) = LOWER(?)');
      params.push(category);
    }

    // Full-text search on title and description
    if (search && search.trim() !== '') {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      const searchWildcard = `%${search.trim()}%`;
      params.push(searchWildcard, searchWildcard);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column to avoid SQL injection
    const allowedSortFields = {
      id: 'id',
      title: 'title',
      status: 'status',
      priority: `CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`,
      category: 'category',
      due_date: 'due_date',
      created_at: 'created_at',
      updated_at: 'updated_at'
    };

    const sortColumn = allowedSortFields[sortBy] || 'created_at';
    const sortOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total matching items
    const countQuery = `SELECT COUNT(*) as total FROM tasks ${whereClause}`;
    const totalRow = db.prepare(countQuery).get(...params);
    const total = totalRow ? totalRow.total : 0;

    // Apply pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const dataQuery = `
      SELECT * FROM tasks
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const tasks = db.prepare(dataQuery).all(...params, limitNum, offset);

    return {
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  /**
   * Update task fields by ID
   */
  static update(id, updates = {}) {
    const existing = this.findById(id);
    if (!existing) return null;

    const updateFields = [];
    const values = [];

    if (updates.title !== undefined) {
      updateFields.push('title = ?');
      values.push(updates.title.trim());
    }

    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description ? updates.description.trim() : '');
    }

    if (updates.status !== undefined) {
      const newStatus = updates.status.toLowerCase();
      updateFields.push('status = ?');
      values.push(newStatus);

      if (newStatus === 'completed' && existing.status !== 'completed') {
        updateFields.push("completed_at = datetime('now')");
      } else if (newStatus === 'pending') {
        updateFields.push('completed_at = NULL');
      }
    }

    if (updates.priority !== undefined) {
      updateFields.push('priority = ?');
      values.push(updates.priority.toLowerCase());
    }

    if (updates.category !== undefined) {
      updateFields.push('category = ?');
      values.push(updates.category.trim());
    }

    if (updates.due_date !== undefined) {
      updateFields.push('due_date = ?');
      values.push(updates.due_date || null);
    }

    if (updateFields.length === 0) {
      return existing;
    }

    updateFields.push("updated_at = datetime('now')");
    values.push(id);

    const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...values);

    return this.findById(id);
  }

  /**
   * Toggle task status between 'completed' and 'pending'
   */
  static toggleStatus(id, explicitStatus = null) {
    const existing = this.findById(id);
    if (!existing) return null;

    let nextStatus;
    if (explicitStatus) {
      nextStatus = explicitStatus.toLowerCase();
    } else {
      nextStatus = existing.status === 'completed' ? 'pending' : 'completed';
    }

    const completedAt = nextStatus === 'completed' ? new Date().toISOString() : null;

    const stmt = db.prepare(`
      UPDATE tasks
      SET status = ?, completed_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(nextStatus, completedAt, id);

    return this.findById(id);
  }

  /**
   * Delete a task by ID
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Clear all completed tasks
   */
  static clearCompleted() {
    const stmt = db.prepare("DELETE FROM tasks WHERE status = 'completed'");
    const result = stmt.run();
    return result.changes;
  }

  /**
   * Get aggregate statistics for dashboard & reporting
   */
  static getStats() {
    const totalRow = db.prepare('SELECT COUNT(*) as total FROM tasks').get();
    const completedRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get();
    const pendingRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get();
    const overdueRow = db.prepare(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status = 'pending'
        AND due_date IS NOT NULL
        AND date(due_date) < date('now')
    `).get();

    const priorityRows = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM tasks
      GROUP BY priority
    `).all();

    const categoryRows = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM tasks
      GROUP BY category
      ORDER BY count DESC
    `).all();

    const total = totalRow.total;
    const completed = completedRow.count;
    const pending = pendingRow.count;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };
    for (const row of priorityRows) {
      if (byPriority[row.priority] !== undefined) {
        byPriority[row.priority] = row.count;
      }
    }

    return {
      total,
      completed,
      pending,
      overdue: overdueRow.count,
      completionRate: `${completionRate}%`,
      byPriority,
      byCategory: categoryRows
    };
  }
}

module.exports = TaskModel;
