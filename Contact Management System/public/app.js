// Contact Management System Client Application

const state = {
  contacts: [],
  currentPage: 1,
  limit: 10,
  totalPages: 1,
  totalRecords: 0,
  search: '',
  category: '',
  sortBy: 'createdAt',
  order: 'DESC',
  selectedContactId: null
};

// DOM Elements
const elements = {
  // Stats
  statTotal: document.getElementById('statTotal'),
  statPersonal: document.getElementById('statPersonal'),
  statProfessional: document.getElementById('statProfessional'),
  statOther: document.getElementById('statOther'),

  // Filters & Search
  searchInput: document.getElementById('searchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  categoryFilter: document.getElementById('categoryFilter'),
  sortBySelect: document.getElementById('sortBySelect'),
  btnToggleOrder: document.getElementById('btnToggleOrder'),
  sortOrderIndicator: document.getElementById('sortOrderIndicator'),

  // Table & Pagination
  contactsTableBody: document.getElementById('contactsTableBody'),
  paginationInfo: document.getElementById('paginationInfo'),
  pageNumbers: document.getElementById('pageNumbers'),
  btnPrevPage: document.getElementById('btnPrevPage'),
  btnNextPage: document.getElementById('btnNextPage'),

  // Modals
  contactModal: document.getElementById('contactModal'),
  modalTitle: document.getElementById('modalTitle'),
  contactForm: document.getElementById('contactForm'),
  contactId: document.getElementById('contactId'),
  inputName: document.getElementById('inputName'),
  inputEmail: document.getElementById('inputEmail'),
  inputPhone: document.getElementById('inputPhone'),
  inputCompany: document.getElementById('inputCompany'),
  inputCategory: document.getElementById('inputCategory'),
  inputAddress: document.getElementById('inputAddress'),
  inputNotes: document.getElementById('inputNotes'),
  formGlobalError: document.getElementById('formGlobalError'),
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCancelModal: document.getElementById('btnCancelModal'),

  // Delete Modal
  deleteModal: document.getElementById('deleteModal'),
  deleteContactName: document.getElementById('deleteContactName'),
  btnCloseDeleteModal: document.getElementById('btnCloseDeleteModal'),
  btnCancelDelete: document.getElementById('btnCancelDelete'),
  btnConfirmDelete: document.getElementById('btnConfirmDelete'),

  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// Toast Notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '⚠'}</span>
    <span>${message}</span>
  `;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

// Fetch Statistics
async function loadStats() {
  try {
    const res = await fetch('/api/contacts/stats');
    const json = await res.json();
    if (json.success && json.data) {
      elements.statTotal.textContent = json.data.totalContacts || 0;
      elements.statPersonal.textContent = json.data.byCategory.Personal || 0;
      elements.statProfessional.textContent = json.data.byCategory.Professional || 0;
      elements.statOther.textContent = json.data.byCategory.Other || 0;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Fetch Contacts
async function loadContacts() {
  elements.contactsTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-state">
        <div class="spinner"></div>
        <p>Loading contacts from REST API...</p>
      </td>
    </tr>
  `;

  try {
    const query = new URLSearchParams({
      page: state.currentPage,
      limit: state.limit,
      sortBy: state.sortBy,
      order: state.order
    });

    if (state.search.trim()) {
      query.append('search', state.search.trim());
    }
    if (state.category.trim()) {
      query.append('category', state.category.trim());
    }

    const res = await fetch(`/api/contacts?${query.toString()}`);
    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch contacts');
    }

    state.contacts = json.data || [];
    const meta = json.meta || {};
    state.totalPages = meta.totalPages || 1;
    state.totalRecords = meta.totalRecords || 0;

    renderContacts();
    renderPagination();
    loadStats();
  } catch (err) {
    elements.contactsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <p style="color: var(--danger);">Failed to load contacts: ${err.message}</p>
        </td>
      </tr>
    `;
    showToast(err.message, 'error');
  }
}

// Render Table
function renderContacts() {
  if (state.contacts.length === 0) {
    elements.contactsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <p>No contacts found matching your query.</p>
        </td>
      </tr>
    `;
    return;
  }

  elements.contactsTableBody.innerHTML = state.contacts.map((contact) => `
    <tr>
      <td>
        <div class="contact-name-cell">
          <span class="contact-name-title">${escapeHtml(contact.name)}</span>
          ${contact.notes ? `<span class="contact-notes-sub" title="${escapeHtml(contact.notes)}">${escapeHtml(contact.notes)}</span>` : ''}
        </div>
      </td>
      <td><span style="font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem;">${escapeHtml(contact.email)}</span></td>
      <td><span style="font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem;">${escapeHtml(contact.phoneNumber)}</span></td>
      <td>${contact.company ? escapeHtml(contact.company) : '<span style="color: var(--text-muted);">&mdash;</span>'}</td>
      <td>${contact.address ? escapeHtml(contact.address) : '<span style="color: var(--text-muted);">&mdash;</span>'}</td>
      <td>
        <span class="tag-badge ${escapeHtml(contact.category)}">${escapeHtml(contact.category)}</span>
      </td>
      <td style="text-align: right;">
        <div class="action-buttons">
          <button class="btn-action edit" onclick="openEditModal(${contact.id})">Edit</button>
          <button class="btn-action delete" onclick="openDeleteModal(${contact.id}, '${escapeHtml(contact.name).replace(/'/g, "\\'")}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Render Pagination
function renderPagination() {
  const startIdx = state.totalRecords === 0 ? 0 : (state.currentPage - 1) * state.limit + 1;
  const endIdx = Math.min(state.currentPage * state.limit, state.totalRecords);

  elements.paginationInfo.textContent = `Showing ${startIdx} to ${endIdx} of ${state.totalRecords} contacts`;
  elements.pageNumbers.textContent = `Page ${state.currentPage} of ${state.totalPages}`;

  elements.btnPrevPage.disabled = state.currentPage <= 1;
  elements.btnNextPage.disabled = state.currentPage >= state.totalPages;
}

// Utility: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Clear Field Errors
function clearFormErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  elements.formGlobalError.textContent = '';
  elements.formGlobalError.classList.add('hidden');
}

// Open Add Contact Modal
elements.btnOpenAddModal.addEventListener('click', () => {
  clearFormErrors();
  elements.contactForm.reset();
  elements.contactId.value = '';
  elements.modalTitle.textContent = 'Add New Contact';
  elements.inputCategory.value = 'Professional';
  elements.contactModal.classList.remove('hidden');
});

// Close Modals
function closeModal() {
  elements.contactModal.classList.add('hidden');
  clearFormErrors();
}

elements.btnCloseModal.addEventListener('click', closeModal);
elements.btnCancelModal.addEventListener('click', closeModal);

// Open Edit Contact Modal
window.openEditModal = (id) => {
  const contact = state.contacts.find(c => c.id === id);
  if (!contact) return;

  clearFormErrors();
  elements.contactId.value = contact.id;
  elements.inputName.value = contact.name;
  elements.inputEmail.value = contact.email;
  elements.inputPhone.value = contact.phoneNumber;
  elements.inputCompany.value = contact.company || '';
  elements.inputCategory.value = contact.category || 'Personal';
  elements.inputAddress.value = contact.address || '';
  elements.inputNotes.value = contact.notes || '';

  elements.modalTitle.textContent = `Edit Contact: ${contact.name}`;
  elements.contactModal.classList.remove('hidden');
};

// Form Submission (Add or Update)
elements.contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors();

  const id = elements.contactId.value;
  const isEditing = Boolean(id);

  const payload = {
    name: elements.inputName.value.trim(),
    email: elements.inputEmail.value.trim(),
    phoneNumber: elements.inputPhone.value.trim(),
    company: elements.inputCompany.value.trim(),
    category: elements.inputCategory.value,
    address: elements.inputAddress.value.trim(),
    notes: elements.inputNotes.value.trim()
  };

  try {
    const url = isEditing ? `/api/contacts/${id}` : '/api/contacts';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (!res.ok) {
      if (json.errors && Array.isArray(json.errors)) {
        json.errors.forEach(err => {
          if (err.field === 'name') document.getElementById('errorName').textContent = err.message;
          if (err.field === 'email') document.getElementById('errorEmail').textContent = err.message;
          if (err.field === 'phoneNumber') document.getElementById('errorPhone').textContent = err.message;
        });
      }
      elements.formGlobalError.textContent = json.message || 'Operation failed.';
      elements.formGlobalError.classList.remove('hidden');
      return;
    }

    closeModal();
    showToast(isEditing ? 'Contact updated successfully!' : 'Contact added successfully!', 'success');
    loadContacts();
  } catch (err) {
    elements.formGlobalError.textContent = err.message || 'Network error occurred.';
    elements.formGlobalError.classList.remove('hidden');
  }
});

// Delete Modal Handling
window.openDeleteModal = (id, name) => {
  state.selectedContactId = id;
  elements.deleteContactName.textContent = name;
  elements.deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
  state.selectedContactId = null;
  elements.deleteModal.classList.add('hidden');
}

elements.btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
elements.btnCancelDelete.addEventListener('click', closeDeleteModal);

elements.btnConfirmDelete.addEventListener('click', async () => {
  if (!state.selectedContactId) return;

  try {
    const res = await fetch(`/api/contacts/${state.selectedContactId}`, {
      method: 'DELETE'
    });
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || 'Failed to delete contact.');
    }

    closeDeleteModal();
    showToast(json.message || 'Contact deleted.', 'success');
    loadContacts();
  } catch (err) {
    showToast(err.message, 'error');
    closeDeleteModal();
  }
});

// Search Debounce
let searchTimeout;
elements.searchInput.addEventListener('input', (e) => {
  const val = e.target.value;
  elements.btnClearSearch.classList.toggle('hidden', val.length === 0);

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    state.search = val;
    state.currentPage = 1;
    loadContacts();
  }, 300);
});

elements.btnClearSearch.addEventListener('click', () => {
  elements.searchInput.value = '';
  elements.btnClearSearch.classList.add('hidden');
  state.search = '';
  state.currentPage = 1;
  loadContacts();
});

// Category Filter
elements.categoryFilter.addEventListener('change', (e) => {
  state.category = e.target.value;
  state.currentPage = 1;
  loadContacts();
});

// Sort By
elements.sortBySelect.addEventListener('change', (e) => {
  state.sortBy = e.target.value;
  loadContacts();
});

// Toggle Order (ASC / DESC)
elements.btnToggleOrder.addEventListener('click', () => {
  state.order = state.order === 'ASC' ? 'DESC' : 'ASC';
  elements.sortOrderIndicator.innerHTML = state.order === 'ASC' ? 'ASC &#8593;' : 'DESC &#8595;';
  loadContacts();
});

// Pagination
elements.btnPrevPage.addEventListener('click', () => {
  if (state.currentPage > 1) {
    state.currentPage--;
    loadContacts();
  }
});

elements.btnNextPage.addEventListener('click', () => {
  if (state.currentPage < state.totalPages) {
    state.currentPage++;
    loadContacts();
  }
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadContacts();
});
