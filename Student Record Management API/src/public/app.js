// Global state
let currentStudentPage = 1;
let currentCoursePage = 1;
let currentEnrollmentPage = 1;

// Preset API requests
const presets = {
  get_students: {
    method: 'GET',
    url: '/api/students?page=1&limit=5',
    body: ''
  },
  get_students_search: {
    method: 'GET',
    url: '/api/students?search=alex&status=Active',
    body: ''
  },
  get_student_id: {
    method: 'GET',
    url: '/api/students/1',
    body: ''
  },
  create_student: {
    method: 'POST',
    url: '/api/students',
    body: JSON.stringify({
      student_id: 'STU-2024-999',
      first_name: 'Jordan',
      last_name: 'Bell',
      email: 'jordan.bell@university.edu',
      phone: '+1-555-0199',
      date_of_birth: '2003-05-14',
      gender: 'Other',
      address: '100 Innovation Way, Boston, MA',
      status: 'Active'
    }, null, 2)
  },
  get_courses: {
    method: 'GET',
    url: '/api/courses?page=1&limit=6',
    body: ''
  },
  get_course_id: {
    method: 'GET',
    url: '/api/courses/1',
    body: ''
  },
  create_course: {
    method: 'POST',
    url: '/api/courses',
    body: JSON.stringify({
      course_code: 'DEV301',
      title: 'Cloud Architecture & Microservices',
      description: 'Designing scalable distributed systems and RESTful services.',
      credits: 4,
      department: 'Computer Science',
      instructor: 'Dr. Werner Vogels',
      max_capacity: 30
    }, null, 2)
  },
  get_enrollments: {
    method: 'GET',
    url: '/api/enrollments?page=1&limit=5',
    body: ''
  },
  create_enrollment: {
    method: 'POST',
    url: '/api/enrollments',
    body: JSON.stringify({
      student_id: 2,
      course_id: 3,
      semester: 'Spring 2025',
      grade: 'IP',
      status: 'Enrolled'
    }, null, 2)
  },
  get_dashboard_stats: {
    method: 'GET',
    url: '/api/dashboard/stats',
    body: ''
  },
  get_health: {
    method: 'GET',
    url: '/api/health',
    body: ''
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupPresets();
  setupExplorer();
  setupFilters();
  setupModal();

  // Load initial data
  loadOverviewMetrics();
  loadStudents();
  loadCourses();
  loadEnrollments();
  checkApiHealth();
});

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `tab-${tabId}`);
  });

  const titles = {
    overview: { title: 'System Overview & Metrics', sub: 'Real-time statistics from the Student Record Management relational database.' },
    explorer: { title: 'Live Interactive API Explorer', sub: 'Execute live requests against REST endpoints and inspect payloads and status codes.' },
    students: { title: 'Students Directory', sub: 'View, search, filter, and inspect enrolled student profiles.' },
    courses: { title: 'Courses Catalog', sub: 'Explore available courses, seat allocations, instructors, and credit units.' },
    enrollments: { title: 'Enrollments Ledger', sub: 'Track academic course enrollments, grading statuses, and registrations.' },
    docs: { title: 'REST API Documentation', sub: 'Endpoints, HTTP verbs, validation rules, and error handling guidelines.' }
  };

  if (titles[tabId]) {
    document.getElementById('page-title').textContent = titles[tabId].title;
    document.getElementById('page-subtitle').textContent = titles[tabId].sub;
  }
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('refresh-btn').addEventListener('click', () => {
    loadOverviewMetrics();
    loadStudents();
    loadCourses();
    loadEnrollments();
  });
}

// Check Health
async function checkApiHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.status === 'UP') {
      document.getElementById('api-status-text').textContent = 'API Online (Healthy)';
      document.getElementById('stat-uptime').textContent = `Uptime: ${data.uptime}`;
    }
  } catch (err) {
    document.getElementById('api-status-text').textContent = 'API Disconnected';
  }
}

// Overview Metrics
async function loadOverviewMetrics() {
  try {
    const res = await fetch('/api/dashboard/stats');
    const result = await res.json();
    if (!result.success) return;

    const { students, courses, enrollments, departments, recent_enrollments } = result.data;

    // Student stats
    document.getElementById('stat-total-students').textContent = students.total_students || 0;
    document.getElementById('stat-active-students').textContent = `${students.active_students || 0} active, ${students.graduated_students || 0} graduated`;

    // Course stats
    document.getElementById('stat-total-courses').textContent = courses.total_courses || 0;
    document.getElementById('stat-total-credits').textContent = `${courses.total_credits || 0} total credit hours`;

    // Enrollment stats
    document.getElementById('stat-total-enrollments').textContent = enrollments.total_enrollments || 0;
    document.getElementById('stat-enrolled-active').textContent = `${enrollments.currently_enrolled || 0} in progress, ${enrollments.completed || 0} completed`;

    // Department breakdown
    const deptContainer = document.getElementById('department-list');
    if (departments && departments.length > 0) {
      deptContainer.innerHTML = departments.map(d => `
        <div class="dept-row">
          <span>${escapeHtml(d.department)}</span>
          <span class="badge">${d.course_count} courses</span>
        </div>
      `).join('');

      // Populate department filter in courses tab
      const deptFilter = document.getElementById('course-dept-filter');
      deptFilter.innerHTML = '<option value="">All Departments</option>' +
        departments.map(d => `<option value="${escapeHtml(d.department)}">${escapeHtml(d.department)}</option>`).join('');
    }

    // Recent enrollments
    const feedContainer = document.getElementById('recent-enrollments');
    if (recent_enrollments && recent_enrollments.length > 0) {
      feedContainer.innerHTML = recent_enrollments.map(e => `
        <div class="feed-row">
          <div>
            <div class="feed-title">${escapeHtml(e.student_name)} (${escapeHtml(e.student_code)})</div>
            <div class="feed-sub">${escapeHtml(e.course_code)} - ${escapeHtml(e.course_title)} • ${escapeHtml(e.semester)}</div>
          </div>
          <span class="status-badge ${e.status.toLowerCase()}">${escapeHtml(e.status)}</span>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

// API Explorer
function setupPresets() {
  const selector = document.getElementById('preset-selector');
  selector.addEventListener('change', () => {
    const preset = presets[selector.value];
    if (preset) {
      document.getElementById('req-method').value = preset.method;
      document.getElementById('req-url').value = preset.url;
      const bodyContainer = document.getElementById('payload-container');
      const bodyArea = document.getElementById('req-body');

      if (['POST', 'PUT', 'PATCH'].includes(preset.method)) {
        bodyContainer.style.display = 'block';
        bodyArea.value = preset.body;
      } else {
        bodyContainer.style.display = 'none';
        bodyArea.value = '';
      }
    }
  });

  document.getElementById('req-method').addEventListener('change', (e) => {
    const isPayload = ['POST', 'PUT', 'PATCH'].includes(e.target.value);
    document.getElementById('payload-container').style.display = isPayload ? 'block' : 'none';
  });
}

function setupExplorer() {
  const sendBtn = document.getElementById('send-request-btn');
  const copyBtn = document.getElementById('copy-response-btn');

  sendBtn.addEventListener('click', async () => {
    const method = document.getElementById('req-method').value;
    const url = document.getElementById('req-url').value;
    const bodyText = document.getElementById('req-body').value;
    const statusBadge = document.getElementById('res-status-badge');
    const timeBadge = document.getElementById('res-time-badge');
    const resBody = document.getElementById('res-body-code');

    statusBadge.textContent = 'SENDING...';
    statusBadge.className = 'status-badge ready';
    resBody.textContent = '// Waiting for response...';

    const startTime = performance.now();

    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText.trim()) {
        try {
          JSON.parse(bodyText); // Validate JSON
          options.body = bodyText;
        } catch (e) {
          statusBadge.textContent = 'INVALID JSON';
          statusBadge.className = 'status-badge dropped';
          resBody.textContent = `Error parsing JSON payload:\n${e.message}`;
          return;
        }
      }

      const response = await fetch(url, options);
      const latency = Math.round(performance.now() - startTime);
      timeBadge.textContent = `${latency}ms`;

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }

      statusBadge.textContent = `${response.status} ${response.statusText}`;
      if (response.ok) {
        statusBadge.className = 'status-badge success';
      } else if (response.status >= 400 && response.status < 500) {
        statusBadge.className = 'status-badge suspended';
      } else {
        statusBadge.className = 'status-badge dropped';
      }

      resBody.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    } catch (err) {
      statusBadge.textContent = 'FETCH ERROR';
      statusBadge.className = 'status-badge dropped';
      resBody.textContent = `Network / Request Error:\n${err.message}`;
    }
  });

  copyBtn.addEventListener('click', () => {
    const code = document.getElementById('res-body-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => copyBtn.textContent = '📋 Copy JSON', 1800);
    });
  });
}

// Students Directory
async function loadStudents() {
  const search = document.getElementById('student-search-input')?.value || '';
  const status = document.getElementById('student-status-filter')?.value || '';
  const gender = document.getElementById('student-gender-filter')?.value || '';

  const params = new URLSearchParams({
    page: currentStudentPage,
    limit: 8,
    ...(search && { search }),
    ...(status && { status }),
    ...(gender && { gender })
  });

  try {
    const res = await fetch(`/api/students?${params}`);
    const result = await res.json();
    if (!result.success) return;

    const tbody = document.getElementById('students-table-body');
    if (result.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4">No student records found matching filters.</td></tr>`;
    } else {
      tbody.innerHTML = result.data.map(s => `
        <tr>
          <td><code class="course-code-tag">${escapeHtml(s.student_id)}</code></td>
          <td><strong>${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}</strong></td>
          <td>${escapeHtml(s.email)}</td>
          <td>${escapeHtml(s.phone || 'N/A')}</td>
          <td>${escapeHtml(s.gender || 'N/A')}</td>
          <td><span class="status-badge ${s.status.toLowerCase()}">${escapeHtml(s.status)}</span></td>
          <td>
            <button class="btn btn-sm btn-ghost" onclick="viewStudentDetails(${s.id})">🔍 View</button>
            <button class="btn btn-sm btn-ghost text-red" onclick="deleteStudentRecord(${s.id}, '${escapeHtml(s.student_id)}')">🗑️</button>
          </td>
        </tr>
      `).join('');
    }

    // Pagination
    const { totalRecords, totalPages, currentPage, hasNextPage, hasPrevPage } = result.pagination;
    document.getElementById('student-pagination-info').textContent = `Showing page ${currentPage} of ${totalPages} (${totalRecords} total)`;
    document.getElementById('student-current-page').textContent = currentPage;
    document.getElementById('prev-student-page').disabled = !hasPrevPage;
    document.getElementById('next-student-page').disabled = !hasNextPage;
  } catch (err) {
    console.error('Error loading students:', err);
  }
}

// View Student Modal
async function viewStudentDetails(studentId) {
  try {
    const res = await fetch(`/api/students/${studentId}`);
    const result = await res.json();
    if (!result.success) return;

    const s = result.data;
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = `${s.first_name} ${s.last_name} (${s.student_id})`;

    modalContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: var(--bg-card); padding: 1rem; border-radius: var(--radius-sm);">
          <div><strong>Email:</strong> ${escapeHtml(s.email)}</div>
          <div><strong>Phone:</strong> ${escapeHtml(s.phone || 'N/A')}</div>
          <div><strong>DOB:</strong> ${escapeHtml(s.date_of_birth || 'N/A')}</div>
          <div><strong>Gender:</strong> ${escapeHtml(s.gender || 'N/A')}</div>
          <div><strong>Status:</strong> <span class="status-badge ${s.status.toLowerCase()}">${escapeHtml(s.status)}</span></div>
          <div><strong>Address:</strong> ${escapeHtml(s.address || 'N/A')}</div>
        </div>

        <div>
          <h4 style="margin-bottom: 0.5rem;">Enrolled Courses (${s.enrollments_count})</h4>
          ${s.enrollments.length === 0 ? '<p class="text-muted">Not currently enrolled in any courses.</p>' : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Credits</th>
                  <th>Semester</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${s.enrollments.map(e => `
                  <tr>
                    <td><strong>${escapeHtml(e.course_code)}:</strong> ${escapeHtml(e.course_title)}</td>
                    <td>${e.credits}</td>
                    <td>${escapeHtml(e.semester)}</td>
                    <td><span class="page-indicator">${escapeHtml(e.grade)}</span></td>
                    <td><span class="status-badge ${e.enrollment_status.toLowerCase()}">${escapeHtml(e.enrollment_status)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;

    document.getElementById('detail-modal').classList.add('active');
  } catch (err) {
    alert('Error loading student details: ' + err.message);
  }
}

// Delete student
async function deleteStudentRecord(id, code) {
  if (!confirm(`Are you sure you want to delete student ${code}? This will remove all their enrollments.`)) return;

  try {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      loadStudents();
      loadOverviewMetrics();
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (err) {
    alert(`Failed: ${err.message}`);
  }
}

// Courses Catalog
async function loadCourses() {
  const search = document.getElementById('course-search-input')?.value || '';
  const department = document.getElementById('course-dept-filter')?.value || '';

  const params = new URLSearchParams({
    page: currentCoursePage,
    limit: 6,
    ...(search && { search }),
    ...(department && { department })
  });

  try {
    const res = await fetch(`/api/courses?${params}`);
    const result = await res.json();
    if (!result.success) return;

    const container = document.getElementById('courses-grid-container');
    if (result.data.length === 0) {
      container.innerHTML = `<p class="text-center p-4">No courses found matching filters.</p>`;
    } else {
      container.innerHTML = result.data.map(c => `
        <div class="course-card">
          <div class="course-card-top">
            <span class="course-code-tag">${escapeHtml(c.course_code)}</span>
            <span class="badge">${c.credits} Credits</span>
          </div>
          <h4 class="course-title">${escapeHtml(c.title)}</h4>
          <p class="course-desc">${escapeHtml(c.description || 'No description provided.')}</p>
          <div class="course-meta">
            <span>👤 ${escapeHtml(c.instructor)}</span>
            <span>🏛️ ${escapeHtml(c.department)}</span>
          </div>
          <div class="course-meta">
            <span>Enrolled: <strong>${c.active_enrolled_count || 0} / ${c.max_capacity}</strong></span>
            <button class="btn btn-sm btn-ghost" onclick="viewCourseDetails(${c.id})">Roster →</button>
          </div>
        </div>
      `).join('');
    }

    const { totalRecords, totalPages, currentPage, hasNextPage, hasPrevPage } = result.pagination;
    document.getElementById('course-pagination-info').textContent = `Showing page ${currentPage} of ${totalPages} (${totalRecords} courses)`;
    document.getElementById('course-current-page').textContent = currentPage;
    document.getElementById('prev-course-page').disabled = !hasPrevPage;
    document.getElementById('next-course-page').disabled = !hasNextPage;
  } catch (err) {
    console.error('Error loading courses:', err);
  }
}

// View Course Details Modal
async function viewCourseDetails(courseId) {
  try {
    const res = await fetch(`/api/courses/${courseId}`);
    const result = await res.json();
    if (!result.success) return;

    const c = result.data;
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.textContent = `${c.course_code}: ${c.title}`;

    modalContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: var(--bg-card); padding: 1rem; border-radius: var(--radius-sm);">
          <div><strong>Department:</strong> ${escapeHtml(c.department)}</div>
          <div><strong>Instructor:</strong> ${escapeHtml(c.instructor)}</div>
          <div><strong>Credits:</strong> ${c.credits}</div>
          <div><strong>Seats:</strong> ${c.active_enrolled_count} / ${c.max_capacity} (${c.available_seats} remaining)</div>
        </div>

        <div>
          <h4 style="margin-bottom: 0.5rem;">Enrolled Students Roster (${c.students.length})</h4>
          ${c.students.length === 0 ? '<p class="text-muted">No students currently enrolled.</p>' : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Semester</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${c.students.map(s => `
                  <tr>
                    <td><code>${escapeHtml(s.student_id)}</code></td>
                    <td>${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}</td>
                    <td>${escapeHtml(s.semester)}</td>
                    <td><span class="page-indicator">${escapeHtml(s.grade)}</span></td>
                    <td><span class="status-badge ${s.enrollment_status.toLowerCase()}">${escapeHtml(s.enrollment_status)}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;

    document.getElementById('detail-modal').classList.add('active');
  } catch (err) {
    alert('Error loading course roster: ' + err.message);
  }
}

// Enrollments Ledger
async function loadEnrollments() {
  const search = document.getElementById('enrollment-search-input')?.value || '';
  const status = document.getElementById('enrollment-status-filter')?.value || '';
  const semester = document.getElementById('enrollment-semester-filter')?.value || '';

  const params = new URLSearchParams({
    page: currentEnrollmentPage,
    limit: 8,
    ...(search && { search }),
    ...(status && { status }),
    ...(semester && { semester })
  });

  try {
    const res = await fetch(`/api/enrollments?${params}`);
    const result = await res.json();
    if (!result.success) return;

    const tbody = document.getElementById('enrollments-table-body');
    if (result.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4">No enrollment records found.</td></tr>`;
    } else {
      tbody.innerHTML = result.data.map(e => `
        <tr>
          <td>#${e.id}</td>
          <td><strong>${escapeHtml(e.first_name)} ${escapeHtml(e.last_name)}</strong><br><small class="text-muted">${escapeHtml(e.student_code)}</small></td>
          <td><strong>${escapeHtml(e.course_code)}</strong> - ${escapeHtml(e.course_title)}</td>
          <td>${e.credits} cr</td>
          <td>${escapeHtml(e.semester)}</td>
          <td><span class="page-indicator">${escapeHtml(e.grade)}</span></td>
          <td><span class="status-badge ${e.status.toLowerCase()}">${escapeHtml(e.status)}</span></td>
          <td>
            <button class="btn btn-sm btn-ghost text-red" onclick="dropEnrollment(${e.id})">Drop</button>
          </td>
        </tr>
      `).join('');
    }

    const { totalRecords, totalPages, currentPage, hasNextPage, hasPrevPage } = result.pagination;
    document.getElementById('enrollment-pagination-info').textContent = `Showing page ${currentPage} of ${totalPages} (${totalRecords} enrollments)`;
    document.getElementById('enrollment-current-page').textContent = currentPage;
    document.getElementById('prev-enrollment-page').disabled = !hasPrevPage;
    document.getElementById('next-enrollment-page').disabled = !hasNextPage;
  } catch (err) {
    console.error('Error loading enrollments:', err);
  }
}

async function dropEnrollment(id) {
  if (!confirm(`Are you sure you want to drop or delete enrollment #${id}?`)) return;

  try {
    const res = await fetch(`/api/enrollments/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      loadEnrollments();
      loadOverviewMetrics();
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (err) {
    alert(`Failed: ${err.message}`);
  }
}

// Filters & Pagination Handlers
function setupFilters() {
  // Students
  document.getElementById('student-search-input')?.addEventListener('input', debounce(() => {
    currentStudentPage = 1;
    loadStudents();
  }, 300));
  document.getElementById('student-status-filter')?.addEventListener('change', () => {
    currentStudentPage = 1;
    loadStudents();
  });
  document.getElementById('student-gender-filter')?.addEventListener('change', () => {
    currentStudentPage = 1;
    loadStudents();
  });
  document.getElementById('prev-student-page')?.addEventListener('click', () => {
    if (currentStudentPage > 1) {
      currentStudentPage--;
      loadStudents();
    }
  });
  document.getElementById('next-student-page')?.addEventListener('click', () => {
    currentStudentPage++;
    loadStudents();
  });

  // Courses
  document.getElementById('course-search-input')?.addEventListener('input', debounce(() => {
    currentCoursePage = 1;
    loadCourses();
  }, 300));
  document.getElementById('course-dept-filter')?.addEventListener('change', () => {
    currentCoursePage = 1;
    loadCourses();
  });
  document.getElementById('prev-course-page')?.addEventListener('click', () => {
    if (currentCoursePage > 1) {
      currentCoursePage--;
      loadCourses();
    }
  });
  document.getElementById('next-course-page')?.addEventListener('click', () => {
    currentCoursePage++;
    loadCourses();
  });

  // Enrollments
  document.getElementById('enrollment-search-input')?.addEventListener('input', debounce(() => {
    currentEnrollmentPage = 1;
    loadEnrollments();
  }, 300));
  document.getElementById('enrollment-status-filter')?.addEventListener('change', () => {
    currentEnrollmentPage = 1;
    loadEnrollments();
  });
  document.getElementById('enrollment-semester-filter')?.addEventListener('change', () => {
    currentEnrollmentPage = 1;
    loadEnrollments();
  });
  document.getElementById('prev-enrollment-page')?.addEventListener('click', () => {
    if (currentEnrollmentPage > 1) {
      currentEnrollmentPage--;
      loadEnrollments();
    }
  });
  document.getElementById('next-enrollment-page')?.addEventListener('click', () => {
    currentEnrollmentPage++;
    loadEnrollments();
  });

  // Modal open buttons for quick creation
  document.getElementById('add-student-modal-btn')?.addEventListener('click', () => {
    switchTab('explorer');
    document.getElementById('preset-selector').value = 'create_student';
    document.getElementById('preset-selector').dispatchEvent(new Event('change'));
  });

  document.getElementById('add-course-modal-btn')?.addEventListener('click', () => {
    switchTab('explorer');
    document.getElementById('preset-selector').value = 'create_course';
    document.getElementById('preset-selector').dispatchEvent(new Event('change'));
  });

  document.getElementById('enroll-modal-btn')?.addEventListener('click', () => {
    switchTab('explorer');
    document.getElementById('preset-selector').value = 'create_enrollment';
    document.getElementById('preset-selector').dispatchEvent(new Event('change'));
  });
}

function setupModal() {
  const modal = document.getElementById('detail-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

// Utilities
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
