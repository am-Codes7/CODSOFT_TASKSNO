/**
 * TaskPulse Client Application Logic
 */

// Application state
const state = {
  tasks: [],
  stats: null,
  filters: {
    status: 'all',
    search: '',
    priority: 'all',
    category: 'all',
    sortBy: 'created_at',
    order: 'desc'
  },
  editingTaskId: null
};

// DOM References
const tasksContainer = document.getElementById('tasks-container');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const statusTabs = document.querySelectorAll('.status-tab');
const priorityFilter = document.getElementById('priority-filter');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// Metrics DOM
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statRate = document.getElementById('stat-rate');
const statProgressBar = document.getElementById('stat-progress-bar');

// Live API Console
const apiEndpointBadge = document.getElementById('last-endpoint-badge');
const apiConsoleLog = document.getElementById('api-console-log');

// Modal Elements
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');
const taskIdField = document.getElementById('task-id-field');
const formTitle = document.getElementById('form-title');
const formDescription = document.getElementById('form-description');
const formPriority = document.getElementById('form-priority');
const formCategory = document.getElementById('form-category');
const formDueDate = document.getElementById('form-due-date');
const formStatus = document.getElementById('form-status');
const openCreateModalBtn = document.getElementById('open-create-modal-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/**
 * Log REST API Call to live diagnostics drawer
 */
function logApiInteraction(method, url, status, responseData) {
  apiEndpointBadge.textContent = `${method} ${status}`;
  apiEndpointBadge.style.color = status >= 200 && status < 300 ? '#34d399' : '#f87171';
  apiEndpointBadge.style.background = status >= 200 && status < 300 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  const timestamp = new Date().toLocaleTimeString();
  const summary = `// [${timestamp}] ${method} ${url} -> HTTP ${status}\n` + JSON.stringify(responseData, null, 2);
  apiConsoleLog.textContent = summary;
}

/**
 * Fetch Aggregated Task Statistics
 */
async function fetchStats() {
  try {
    const res = await fetch('/api/tasks/stats/summary');
    const json = await res.json();
    if (json.success) {
      state.stats = json.data;
      updateStatsUI(json.data);
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

/**
 * Update Metrics UI
 */
function updateStatsUI(stats) {
  statTotal.textContent = stats.total;
  statPending.textContent = stats.pending;
  statCompleted.textContent = stats.completed;
  statRate.textContent = stats.completionRate;

  const numericRate = parseInt(stats.completionRate, 10) || 0;
  statProgressBar.style.width = `${numericRate}%`;

  // Update Category Filter options
  const currentCategory = state.filters.category;
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  stats.byCategory.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.category;
    opt.textContent = `${cat.category} (${cat.count})`;
    if (cat.category.toLowerCase() === currentCategory.toLowerCase()) {
      opt.selected = true;
    }
    categoryFilter.appendChild(opt);
  });
}

/**
 * Fetch Tasks from REST API with applied filters
 */
async function fetchTasks() {
  tasksContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Querying database...</span>
    </div>
  `;

  const params = new URLSearchParams();
  if (state.filters.status !== 'all') params.set('status', state.filters.status);
  if (state.filters.priority !== 'all') params.set('priority', state.filters.priority);
  if (state.filters.category !== 'all') params.set('category', state.filters.category);
  if (state.filters.search.trim()) params.set('search', state.filters.search.trim());
  params.set('sortBy', state.filters.sortBy);
  params.set('order', state.filters.order);

  const queryUrl = `/api/tasks?${params.toString()}`;

  try {
    const res = await fetch(queryUrl);
    const json = await res.json();
    logApiInteraction('GET', queryUrl, res.status, json);

    if (json.success) {
      state.tasks = json.data;
      renderTasks(json.data);
    } else {
      tasksContainer.innerHTML = `<div class="empty-state">Error loading tasks: ${json.error}</div>`;
    }
  } catch (err) {
    tasksContainer.innerHTML = `<div class="empty-state">Network error connecting to API server.</div>`;
    console.error('Fetch tasks error:', err);
  }
}

/**
 * Render Task Cards
 */
function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <p>No tasks match the active filters or search criteria.</p>
        <button class="nav-btn btn-ghost" id="empty-state-reset-btn">Reset Filters</button>
      </div>
    `;
    const resetBtn = document.getElementById('empty-state-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetAllFilters);
    }
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  tasksContainer.innerHTML = tasks.map(task => {
    const isCompleted = task.status === 'completed';
    const isOverdue = !isCompleted && task.due_date && task.due_date < todayStr;

    return `
      <div class="task-card ${isCompleted ? 'is-completed' : ''}" data-id="${task.id}">
        <button class="task-toggle-btn" onclick="toggleTaskStatus(${task.id})" title="${isCompleted ? 'Mark as Pending' : 'Mark as Completed'}">
          ${isCompleted ? `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="3" width="18" height="18" rx="5" fill="#10b981" stroke="#10b981"></rect>
              <polyline points="9 11 12 14 16 9" stroke="#ffffff" stroke-width="2.5"></polyline>
            </svg>
          ` : `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="5"></rect>
            </svg>
          `}
        </button>

        <div class="task-body">
          <div class="task-top-row">
            <h3 class="task-title">${escapeHTML(task.title)}</h3>
            <div class="task-actions">
              <button class="action-btn" onclick="openEditModal(${task.id})" title="Edit Task">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button class="action-btn delete-btn" onclick="deleteTask(${task.id})" title="Delete Task">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>

          ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}

          <div class="task-meta-row">
            <span class="badge priority-${task.priority}">
              <span class="dot"></span>
              ${task.priority}
            </span>

            <span class="badge category-badge">
              ${escapeHTML(task.category || 'General')}
            </span>

            ${task.due_date ? `
              <span class="badge due-date-badge ${isOverdue ? 'is-overdue' : ''}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${isOverdue ? 'Overdue: ' : 'Due: '} ${task.due_date}
              </span>
            ` : ''}

            ${task.completed_at ? `
              <span class="badge" style="background: rgba(16, 185, 129, 0.08); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">
                Finished
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Toggle Task Status (Pending / Completed)
 */
async function toggleTaskStatus(id) {
  try {
    const res = await fetch(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    logApiInteraction('PATCH', `/api/tasks/${id}/status`, res.status, json);

    if (json.success) {
      showToast(json.message, 'success');
      await Promise.all([fetchTasks(), fetchStats()]);
    } else {
      showToast(json.error || 'Failed to update status', 'error');
    }
  } catch (err) {
    showToast('Failed to toggle status: ' + err.message, 'error');
  }
}

/**
 * Delete a Task
 */
async function deleteTask(id) {
  if (!confirm(`Are you sure you want to delete task #${id}?`)) return;

  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    logApiInteraction('DELETE', `/api/tasks/${id}`, res.status, json);

    if (json.success) {
      showToast(json.message, 'info');
      await Promise.all([fetchTasks(), fetchStats()]);
    } else {
      showToast(json.error || 'Failed to delete task', 'error');
    }
  } catch (err) {
    showToast('Error deleting task: ' + err.message, 'error');
  }
}

/**
 * Clear All Completed Tasks
 */
async function clearCompleted() {
  if (!confirm('Purge all completed tasks from the database?')) return;

  try {
    const res = await fetch('/api/tasks/completed', {
      method: 'DELETE'
    });
    const json = await res.json();
    logApiInteraction('DELETE', '/api/tasks/completed', res.status, json);

    if (json.success) {
      showToast(json.message, 'info');
      await Promise.all([fetchTasks(), fetchStats()]);
    } else {
      showToast(json.error || 'Failed to clear tasks', 'error');
    }
  } catch (err) {
    showToast('Error purging completed tasks: ' + err.message, 'error');
  }
}

/**
 * Modal Handling: Open Create
 */
function openCreateModal() {
  state.editingTaskId = null;
  modalTitle.textContent = 'Create New Task';
  taskForm.reset();
  taskIdField.value = '';
  formStatus.value = 'pending';
  formPriority.value = 'medium';
  formCategory.value = 'General';
  taskModal.style.display = 'flex';
  formTitle.focus();
}

/**
 * Modal Handling: Open Edit
 */
function openEditModal(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  state.editingTaskId = id;
  modalTitle.textContent = `Edit Task #${id}`;
  taskIdField.value = task.id;
  formTitle.value = task.title;
  formDescription.value = task.description || '';
  formPriority.value = task.priority;
  formCategory.value = task.category || 'General';
  formDueDate.value = task.due_date || '';
  formStatus.value = task.status;

  taskModal.style.display = 'flex';
  formTitle.focus();
}

/**
 * Close Modal
 */
function closeModal() {
  taskModal.style.display = 'none';
  taskForm.reset();
  state.editingTaskId = null;
}

/**
 * Form Submission (Create or Update)
 */
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    title: formTitle.value.trim(),
    description: formDescription.value.trim(),
    priority: formPriority.value,
    category: formCategory.value.trim() || 'General',
    due_date: formDueDate.value || null,
    status: formStatus.value
  };

  if (!payload.title) {
    showToast('Task title is required', 'error');
    return;
  }

  const isEditing = Boolean(state.editingTaskId);
  const endpoint = isEditing ? `/api/tasks/${state.editingTaskId}` : '/api/tasks';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    logApiInteraction(method, endpoint, res.status, json);

    if (json.success) {
      showToast(json.message, 'success');
      closeModal();
      await Promise.all([fetchTasks(), fetchStats()]);
    } else {
      const errMsg = json.details ? json.details.map(d => d.message).join(' ') : json.error;
      showToast(errMsg || 'Failed to save task', 'error');
    }
  } catch (err) {
    showToast('Network error saving task: ' + err.message, 'error');
  }
});

/**
 * Reset all filters to default
 */
function resetAllFilters() {
  state.filters.status = 'all';
  state.filters.search = '';
  state.filters.priority = 'all';
  state.filters.category = 'all';
  state.filters.sortBy = 'created_at';
  state.filters.order = 'desc';

  searchInput.value = '';
  clearSearchBtn.style.display = 'none';
  priorityFilter.value = 'all';
  categoryFilter.value = 'all';
  sortSelect.value = 'created_at-desc';

  statusTabs.forEach(t => {
    t.classList.toggle('active', t.dataset.status === 'all');
  });

  fetchTasks();
}

/**
 * Utilities
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Debounce helper
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
  // Search input debounced
  const debouncedSearch = debounce(() => {
    state.filters.search = searchInput.value;
    clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
    fetchTasks();
  }, 250);

  searchInput.addEventListener('input', debouncedSearch);

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    state.filters.search = '';
    fetchTasks();
  });

  // Status Tabs
  statusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      statusTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.filters.status = tab.dataset.status;
      fetchTasks();
    });
  });

  // Priority Dropdown
  priorityFilter.addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    fetchTasks();
  });

  // Category Dropdown
  categoryFilter.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    fetchTasks();
  });

  // Sort Dropdown
  sortSelect.addEventListener('change', (e) => {
    const [field, dir] = e.target.value.split('-');
    state.filters.sortBy = field;
    state.filters.order = dir;
    fetchTasks();
  });

  // Clear Completed Button
  clearCompletedBtn.addEventListener('click', clearCompleted);

  // Modal Open / Close
  openCreateModalBtn.addEventListener('click', openCreateModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);

  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && taskModal.style.display === 'flex') {
      closeModal();
    }
  });
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchStats();
  fetchTasks();
});
