(function () {
  const API_BASE_URL = 'http://localhost:8080/api';

  // State management
  let lecturers = [];
  let filteredLecturers = [];
  let courses = [];
  let departments = [];
  let lecturersDeptChart = null;
  let lecturersQualChart = null;

  // Initialize lecturers page
  async function loadLecturersData() {
    await loadLecturers();
    await loadCoursesForLecturers();
    await loadDepartmentsForLecturers();
    setupLecturerEventListeners();
    updateLecturerStats();
    renderLecturerCharts();
  }

  // Load all lecturers
  async function loadLecturers() {
    try {
      const response = await fetch(`${API_BASE_URL}/lecturers`);
      if (!response.ok) throw new Error('Failed to fetch lecturers');
      lecturers = await response.json();
      filteredLecturers = [...lecturers];
      renderLecturersTable();
      populateLecturerFilters();
    } catch (error) {
      console.error('Error loading lecturers:', error);
      showNotification('Failed to load lecturers', 'error');
    }
  }

  // Load courses for assignment
  async function loadCoursesForLecturers() {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      courses = await response.json();
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }

  // Load departments for filters
  async function loadDepartmentsForLecturers() {
    try {
      const response = await fetch(`${API_BASE_URL}/departments`);
      if (!response.ok) throw new Error('Failed to fetch departments');
      const deptData = await response.json();
      departments = [...new Set(deptData.map((d) => d.name))];
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  // Render lecturers table
  function renderLecturersTable() {
    const tbody = document.getElementById('lecturersTableBody');

    if (!filteredLecturers || filteredLecturers.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="loading">No lecturers found</td></tr>';
      return;
    }

    tbody.innerHTML = filteredLecturers
      .map(
        (lecturer) => `
        <tr>
            <td style="font-weight: 600; color: var(--primary-color); font-family: 'Courier New', monospace;">${escapeHtml(lecturer.employeeId)}</td>
            <td style="font-weight: 600;">${escapeHtml(lecturer.firstName)} ${escapeHtml(lecturer.lastName)}</td>
            <td style="color: var(--text-secondary); font-size: 0.875rem;">${escapeHtml(lecturer.email)}</td>
            <td>${escapeHtml(lecturer.department)}</td>
            <td>${escapeHtml(lecturer.qualification)}</td>
            <td>${escapeHtml(lecturer.specialization || 'N/A')}</td>
            <td>${formatDate(lecturer.hireDate)}</td>
            <td>
                <span class="badge badge-info" style="background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2); padding: 0.25rem 0.75rem; border-radius: 5px; font-size: 0.6875rem; font-weight: 600;">
                    ${lecturer.courses ? lecturer.courses.length : 0} courses
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="viewLecturerDetails(${lecturer.id})" title="View Details" style="padding: 0.375rem; border: 1px solid var(--border-color); border-radius: 5px; width: 32px; height: 32px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn-icon edit" onclick="editLecturer(${lecturer.id})" title="Edit" style="padding: 0.375rem; border: 1px solid var(--border-color); border-radius: 5px; width: 32px; height: 32px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="assignCoursesToLecturer(${lecturer.id})" title="Assign Courses" style="padding: 0.375rem; border: 1px solid var(--border-color); border-radius: 5px; width: 32px; height: 32px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteLecturer(${lecturer.id})" title="Delete" style="padding: 0.375rem; border: 1px solid var(--border-color); border-radius: 5px; width: 32px; height: 32px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `
      )
      .join('');
  }

  // Update lecturer statistics
  function updateLecturerStats() {
    animateCounter('totalLecturers', lecturers.length);

    const uniqueDepts = new Set(lecturers.map((l) => l.department));
    animateCounter('lecturersDepartments', uniqueDepts.size);

    const totalCourses = lecturers.reduce(
      (sum, l) => sum + (l.courses ? l.courses.length : 0),
      0
    );
    animateCounter('lecturersTotalCourses', totalCourses);

    const uniqueQuals = new Set(lecturers.map((l) => l.qualification));
    animateCounter('lecturersQualifications', uniqueQuals.size);
  }

  function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        element.textContent = targetValue;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, duration / steps);
  }

  // Render lecturer charts
  function renderLecturerCharts() {
    renderLecturersDepartmentChart();
    renderLecturersQualificationChart();
  }

  // Render lecturers by department chart
  function renderLecturersDepartmentChart() {
    const ctx = document.getElementById('lecturersDepartmentChart');
    if (!ctx) return;

    if (lecturersDeptChart) {
      lecturersDeptChart.destroy();
    }

    const deptCounts = {};
    lecturers.forEach((lecturer) => {
      deptCounts[lecturer.department] =
        (deptCounts[lecturer.department] || 0) + 1;
    });

    const labels = Object.keys(deptCounts);
    const data = Object.values(deptCounts);
    const isDark = document.body.classList.contains('dark-mode');

    lecturersDeptChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Lecturers',
            data: data,
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 45,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: isDark ? '#cbd5e1' : '#64748b',
              font: {
                size: 12,
                weight: '500',
              },
            },
            grid: {
              color: isDark ? '#334155' : '#e2e8f0',
              drawBorder: false,
            },
            border: {
              display: false,
            },
          },
          x: {
            ticks: {
              color: isDark ? '#cbd5e1' : '#64748b',
              font: {
                size: 12,
                weight: '500',
              },
            },
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: isDark
              ? 'rgba(30, 41, 59, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            displayColors: false,
          },
        },
      },
    });
  }

  // Render lecturers by qualification chart
  function renderLecturersQualificationChart() {
    const ctx = document.getElementById('lecturersQualificationChart');
    if (!ctx) return;

    if (lecturersQualChart) {
      lecturersQualChart.destroy();
    }

    const qualCounts = {};
    lecturers.forEach((lecturer) => {
      qualCounts[lecturer.qualification] =
        (qualCounts[lecturer.qualification] || 0) + 1;
    });

    const labels = Object.keys(qualCounts);
    const data = Object.values(qualCounts);
    const isDark = document.body.classList.contains('dark-mode');

    const colors = ['#1e3a8a', '#3b82f6', '#60a5fa', '#10b981', '#f59e0b'];

    lecturersQualChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 0,
            borderRadius: 6,
            spacing: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#f1f5f9' : '#1e293b',
              padding: 16,
              font: {
                size: 13,
                weight: '600',
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
              },
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
            },
          },
          tooltip: {
            backgroundColor: isDark
              ? 'rgba(30, 41, 59, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            displayColors: true,
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  // Populate lecturer filters
  function populateLecturerFilters() {
    const deptFilter = document.getElementById('lecturerDepartmentFilter');
    const qualFilter = document.getElementById('lecturerQualificationFilter');

    if (deptFilter) {
      const uniqueDepts = [
        ...new Set(lecturers.map((l) => l.department)),
      ].sort();
      deptFilter.innerHTML =
        '<option value="">All Departments</option>' +
        uniqueDepts
          .map(
            (dept) =>
              `<option value="${escapeHtml(dept)}">${escapeHtml(dept)}</option>`
          )
          .join('');
    }

    if (qualFilter) {
      const uniqueQuals = [
        ...new Set(lecturers.map((l) => l.qualification)),
      ].sort();
      qualFilter.innerHTML =
        '<option value="">All Qualifications</option>' +
        uniqueQuals
          .map(
            (qual) =>
              `<option value="${escapeHtml(qual)}">${escapeHtml(qual)}</option>`
          )
          .join('');
    }
  }

  // Setup lecturer event listeners
  function setupLecturerEventListeners() {
    const addBtn = document.getElementById('addLecturerBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => openLecturerModal());
    }

    const searchInput = document.getElementById('searchLecturer');
    if (searchInput) {
      searchInput.addEventListener('input', filterLecturers);
    }

    const deptFilter = document.getElementById('lecturerDepartmentFilter');
    if (deptFilter) {
      deptFilter.addEventListener('change', filterLecturers);
    }

    const qualFilter = document.getElementById('lecturerQualificationFilter');
    if (qualFilter) {
      qualFilter.addEventListener('change', filterLecturers);
    }

    const closeBtn = document.getElementById('closeLecturerModal');
    const cancelBtn = document.getElementById('lecturerCancelBtn');

    if (closeBtn) closeBtn.addEventListener('click', closeLecturerModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeLecturerModal);

    const form = document.getElementById('lecturerForm');
    if (form) {
      form.addEventListener('submit', handleLecturerSubmit);
    }

    const exportPdfBtn = document.getElementById('exportLecturersPdfBtn');
    const exportExcelBtn = document.getElementById('exportLecturersExcelBtn');

    if (exportPdfBtn)
      exportPdfBtn.addEventListener('click', exportLecturersPdf);
    if (exportExcelBtn)
      exportExcelBtn.addEventListener('click', exportLecturersExcel);

    window.addEventListener('click', (e) => {
      const modal = document.getElementById('lecturerModal');
      if (e.target === modal) {
        closeLecturerModal();
      }
    });
  }

  // Filter lecturers
  function filterLecturers() {
    const searchTerm =
      document.getElementById('searchLecturer')?.value.toLowerCase() || '';
    const deptFilter =
      document.getElementById('lecturerDepartmentFilter')?.value || '';
    const qualFilter =
      document.getElementById('lecturerQualificationFilter')?.value || '';

    filteredLecturers = lecturers.filter((lecturer) => {
      const matchesSearch =
        !searchTerm ||
        lecturer.employeeId.toLowerCase().includes(searchTerm) ||
        `${lecturer.firstName} ${lecturer.lastName}`
          .toLowerCase()
          .includes(searchTerm) ||
        lecturer.email.toLowerCase().includes(searchTerm) ||
        lecturer.department.toLowerCase().includes(searchTerm);

      const matchesDept = !deptFilter || lecturer.department === deptFilter;
      const matchesQual = !qualFilter || lecturer.qualification === qualFilter;

      return matchesSearch && matchesDept && matchesQual;
    });

    renderLecturersTable();
  }

  function openLecturerModal(lecturer = null) {
    const modal = document.getElementById('lecturerModal');
    const modalTitle = document.getElementById('lecturerModalTitle');
    const form = document.getElementById('lecturerForm');
    const passwordGroup = document.getElementById('lecturerPasswordGroup');

    form.reset();

    if (lecturer) {
      modalTitle.textContent = 'Edit Lecturer';
      document.getElementById('lecturerId').value = lecturer.id;
      document.getElementById('lecturerFirstName').value = lecturer.firstName;
      document.getElementById('lecturerLastName').value = lecturer.lastName;
      document.getElementById('lecturerEmail').value = lecturer.email;
      document.getElementById('lecturerPhone').value = lecturer.phoneNumber;
      document.getElementById('lecturerEmployeeId').value = lecturer.employeeId;
      document.getElementById('lecturerDepartment').value = lecturer.department;
      document.getElementById('lecturerQualification').value =
        lecturer.qualification;
      document.getElementById('lecturerHireDate').value = lecturer.hireDate;
      document.getElementById('lecturerSpecialization').value =
        lecturer.specialization || '';
      document.getElementById('lecturerOfficeLocation').value =
        lecturer.officeLocation || '';
      document.getElementById('lecturerOfficeHours').value =
        lecturer.officeHours || '';

      if (passwordGroup) passwordGroup.style.display = 'none';
      document.getElementById('lecturerPassword').required = false;
    } else {
      modalTitle.textContent = 'Add Lecturer';
      document.getElementById('lecturerId').value = '';
      if (passwordGroup) passwordGroup.style.display = 'block';
      document.getElementById('lecturerPassword').required = true;
    }

    modal.classList.add('active');
  }

  function closeLecturerModal() {
    const modal = document.getElementById('lecturerModal');
    modal.classList.remove('active');
    document.getElementById('lecturerForm').reset();
  }




  async function handleLecturerSubmit(e) {
    e.preventDefault();

    const lecturerId = document.getElementById('lecturerId').value;

    // Validate required fields
    const firstName = document.getElementById('lecturerFirstName').value.trim();
    const lastName = document.getElementById('lecturerLastName').value.trim();
    const email = document.getElementById('lecturerEmail').value.trim();
    const phoneNumber = document.getElementById('lecturerPhone').value.trim();
    const employeeId = document.getElementById('lecturerEmployeeId').value.trim();
    const department = document.getElementById('lecturerDepartment').value.trim();
    const qualification = document.getElementById('lecturerQualification').value.trim();
    const hireDate = document.getElementById('lecturerHireDate').value;

    // Validation
    if (!firstName || !lastName || !email || !phoneNumber || !employeeId || !department || !qualification || !hireDate) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    const lecturerData = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phoneNumber: phoneNumber,
      employeeId: employeeId,
      department: department,
      qualification: qualification,
      hireDate: hireDate,
      specialization: document.getElementById('lecturerSpecialization').value.trim() || null,
      officeLocation: document.getElementById('lecturerOfficeLocation').value.trim() || null,
      officeHours: document.getElementById('lecturerOfficeHours').value.trim() || null,
    };

    // Add password and role for new lecturer
    if (!lecturerId) {
      const password = document.getElementById('lecturerPassword').value.trim();

      if (!password || password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
      }

      lecturerData.password = password;
      lecturerData.role = 'LECTURER';
    }

    try {
      let response;
      if (lecturerId) {
        // Update existing lecturer
        response = await fetch(`${API_BASE_URL}/lecturers/${lecturerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lecturerData),
        });
      } else {
        // Register new lecturer
        response = await fetch(`${API_BASE_URL}/lecturers/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lecturerData),
        });
      }

      // Handle error response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);

        // Parse error message
        let errorMessage = 'Failed to save lecturer';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }

        showNotification(errorMessage, 'error');
        return;
      }

      // Success
      const savedLecturer = await response.json();
      console.log('Lecturer saved successfully:', savedLecturer);

      showNotification(
        `Lecturer ${lecturerId ? 'updated' : 'added'} successfully`,
        'success'
      );

      closeLecturerModal();
      await loadLecturers();
      updateLecturerStats();
      renderLecturerCharts();

    } catch (error) {
      console.error('Error saving lecturer:', error);
      showNotification('Network error. Please check your connection and try again.', 'error');
    }
  }





  async function editLecturer(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/lecturers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch lecturer');
      const lecturer = await response.json();
      openLecturerModal(lecturer);
    } catch (error) {
      console.error('Error fetching lecturer:', error);
      showNotification('Failed to load lecturer details', 'error');
    }
  }

  async function deleteLecturer(id) {
    if (!confirm('Are you sure you want to delete this lecturer?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/lecturers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete lecturer');

      showNotification('Lecturer deleted successfully', 'success');
      await loadLecturers();
      updateLecturerStats();
      renderLecturerCharts();
    } catch (error) {
      console.error('Error deleting lecturer:', error);
      showNotification('Failed to delete lecturer', 'error');
    }
  }

  async function viewLecturerDetails(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/lecturers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch lecturer');
      const lecturer = await response.json();

      // Create professional modal
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.id = 'viewLecturerModal';

      const coursesInfo =
        lecturer.courses && lecturer.courses.length > 0
          ? lecturer.courses
              .map(
                (c) => `
                <div class="course-tag">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    ${escapeHtml(c.courseName || c.courseCode)}
                </div>
            `
              )
              .join('')
          : '<p class="no-courses">No courses assigned yet</p>';

      modal.innerHTML = `
            <div class="modal-content view-modal-content">
                <div class="modal-header">
                    <h2>Lecturer Details</h2>
                    <button class="modal-close" onclick="closeViewModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="view-modal-body">
                    <div class="lecturer-profile-section">
                        <div class="lecturer-avatar">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="lecturer-profile-info">
                            <h3>${escapeHtml(lecturer.firstName)} ${escapeHtml(lecturer.lastName)}</h3>
                            <p class="lecturer-title">${escapeHtml(lecturer.qualification)} • ${escapeHtml(lecturer.department)}</p>
                        </div>
                    </div>

                    <div class="detail-sections">
                        <div class="detail-section">
                            <h4 class="section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                Contact Information
                            </h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Employee ID</span>
                                    <span class="detail-value employee-id">${escapeHtml(lecturer.employeeId)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Email</span>
                                    <span class="detail-value">${escapeHtml(lecturer.email)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Phone</span>
                                    <span class="detail-value">${escapeHtml(lecturer.phoneNumber)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Hire Date</span>
                                    <span class="detail-value">${formatDate(lecturer.hireDate)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4 class="section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                </svg>
                                Academic Information
                            </h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Department</span>
                                    <span class="detail-value">${escapeHtml(lecturer.department)}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Qualification</span>
                                    <span class="detail-value">${escapeHtml(lecturer.qualification)}</span>
                                </div>
                                <div class="detail-item full-width">
                                    <span class="detail-label">Specialization</span>
                                    <span class="detail-value">${escapeHtml(lecturer.specialization || 'Not specified')}</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4 class="section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                Office Information
                            </h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Office Location</span>
                                    <span class="detail-value">${escapeHtml(lecturer.officeLocation || 'Not specified')}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Office Hours</span>
                                    <span class="detail-value">${escapeHtml(lecturer.officeHours || 'Not specified')}</span>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <h4 class="section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                                Assigned Courses
                                <span class="course-count">${lecturer.courses ? lecturer.courses.length : 0}</span>
                            </h4>
                            <div class="courses-container">
                                ${coursesInfo}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

      document.body.appendChild(modal);

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeViewModal();
        }
      });
    } catch (error) {
      console.error('Error fetching lecturer details:', error);
      showNotification('Failed to load lecturer details', 'error');
    }
  }

  window.closeViewModal = function () {
    const modal = document.getElementById('viewLecturerModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  };

  async function assignCoursesToLecturer(lecturerId) {
    try {
      // Get lecturer details
      const lecturerResponse = await fetch(
        `${API_BASE_URL}/lecturers/${lecturerId}`
      );
      if (!lecturerResponse.ok) throw new Error('Failed to fetch lecturer');
      const lecturer = await lecturerResponse.json();

      // Get all courses
      const coursesResponse = await fetch(`${API_BASE_URL}/courses`);
      if (!coursesResponse.ok) throw new Error('Failed to fetch courses');
      const allCourses = await coursesResponse.json();

      // Get assigned course IDs
      const assignedCourseIds = lecturer.courses
        ? lecturer.courses.map((c) => c.id)
        : [];

      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.id = 'assignCoursesModal';

      const courseOptions = allCourses
        .map(
          (course) => `
            <div class="course-checkbox-item">
                <input
                    type="checkbox"
                    id="course_${course.id}"
                    value="${course.id}"
                    ${assignedCourseIds.includes(course.id) ? 'checked' : ''}
                >
                <label for="course_${course.id}">
                    <div class="course-checkbox-content">
                        <div class="course-code">${escapeHtml(course.courseCode)}</div>
                        <div class="course-name">${escapeHtml(course.courseName)}</div>
                        <div class="course-meta">
                            <span>${escapeHtml(course.faculty)}</span>
                            <span>•</span>
                            <span>Year ${course.year}</span>
                            <span>•</span>
                            <span>${course.credits} credits</span>
                        </div>
                    </div>
                </label>
            </div>
        `
        )
        .join('');

      modal.innerHTML = `
            <div class="modal-content assign-modal-content">
                <div class="modal-header">
                    <div>
                        <h2>Assign Courses</h2>
                        <p class="modal-subtitle">Select courses for ${escapeHtml(lecturer.firstName)} ${escapeHtml(lecturer.lastName)}</p>
                    </div>
                    <button class="modal-close" onclick="closeAssignModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="assign-modal-body">
                    <div class="search-courses">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input
                            type="text"
                            id="searchCoursesInput"
                            placeholder="Search courses by name or code..."
                            oninput="filterAssignCourses()"
                        >
                    </div>
                    <div class="courses-list" id="assignCoursesList">
                        ${courseOptions}
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="selected-count">
                        <span id="selectedCount">${assignedCourseIds.length}</span> courses selected
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeAssignModal()">Cancel</button>
                        <button type="button" class="btn-primary" onclick="saveAssignedCourses(${lecturerId})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Save Assignments
                        </button>
                    </div>
                </div>
            </div>
        `;

      document.body.appendChild(modal);

      // Update count on checkbox change
      modal.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', updateSelectedCount);
      });

      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeAssignModal();
        }
      });
    } catch (error) {
      console.error('Error loading courses:', error);
      showNotification('Failed to load courses', 'error');
    }
  }

  window.filterAssignCourses = function () {
    const searchTerm = document
      .getElementById('searchCoursesInput')
      .value.toLowerCase();
    const courseItems = document.querySelectorAll('.course-checkbox-item');

    courseItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  };

  window.updateSelectedCount = function () {
    const checkedBoxes = document.querySelectorAll(
      '#assignCoursesList input[type="checkbox"]:checked'
    );
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
      countElement.textContent = checkedBoxes.length;
    }
  };




// ✅ FONCTION CORRIGÉE - Remplacer la fonction window.saveAssignedCourses

window.saveAssignedCourses = async function (lecturerId) {
  console.log('🔵 ========================================');
  console.log('🔵 FRONTEND: Starting course assignment');
  console.log('🔵 Lecturer ID:', lecturerId);

  const checkedBoxes = document.querySelectorAll(
    '#assignCoursesList input[type="checkbox"]:checked'
  );
  const courseIds = Array.from(checkedBoxes).map((cb) => parseInt(cb.value));

  console.log('🔵 Selected course IDs:', courseIds);
  console.log('🔵 Total courses selected:', courseIds.length);
  console.log('🔵 ========================================');

  if (courseIds.length === 0) {
    console.warn('⚠️  No courses selected');
    showNotification('Please select at least one course', 'error');
    return;
  }

  try {
    // ✅ CORRECTION: Utiliser la bonne URL du backend
    const url = `${API_BASE_URL}/lecturers/${lecturerId}/courses/assign-multiple`;
    const payload = { courseIds: courseIds };

    console.log('📡 Making API request...');
    console.log('   URL:', url);
    console.log('   Payload:', JSON.stringify(payload));

    const response = await fetch(url, {
      method: 'POST',  // ✅ CORRECTION: Method POST au lieu de PUT
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error response:', errorData);
      throw new Error(errorData.error || 'Failed to assign courses');
    }

    const result = await response.json();
    console.log('✅ ========================================');
    console.log('✅ SUCCESS! API Response:', result);
    console.log('✅ Message:', result.message);
    console.log('✅ Courses assigned:', result.assignedCount);
    console.log('✅ ========================================');

    showNotification(
      `✅ Successfully assigned ${courseIds.length} course(s) to lecturer`,
      'success'
    );

    // Fermer le modal
    closeAssignModal();

    console.log('🔄 Reloading lecturers data...');
    await loadLecturers();
    updateLecturerStats();
    renderLecturerCharts();
    console.log('✅ Data reloaded successfully');

  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ FRONTEND ERROR:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ ========================================');

    showNotification(
      `❌ ${error.message || 'Failed to save course assignments'}`,
      'error'
    );
  }
};





  window.closeAssignModal = function () {
    const modal = document.getElementById('assignCoursesModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  };

  function exportLecturersPdf() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('Lecturers Report', 14, 20);

      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Lecturers: ${lecturers.length}`, 14, 37);

      const tableData = filteredLecturers.map((lecturer) => [
        lecturer.employeeId,
        `${lecturer.firstName} ${lecturer.lastName}`,
        lecturer.department,
        lecturer.qualification,
        formatDate(lecturer.hireDate),
        lecturer.courses ? lecturer.courses.length : 0,
      ]);

      doc.autoTable({
        startY: 45,
        head: [
          [
            'Employee ID',
            'Name',
            'Department',
            'Qualification',
            'Hire Date',
            'Courses',
          ],
        ],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save('lecturers-report.pdf');
      showNotification('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showNotification('Failed to export PDF', 'error');
    }
  }

  function exportLecturersExcel() {
    try {
      const data = filteredLecturers.map((lecturer) => ({
        'Employee ID': lecturer.employeeId,
        'First Name': lecturer.firstName,
        'Last Name': lecturer.lastName,
        Email: lecturer.email,
        Phone: lecturer.phoneNumber,
        Department: lecturer.department,
        Qualification: lecturer.qualification,
        Specialization: lecturer.specialization || '',
        'Hire Date': formatDate(lecturer.hireDate),
        'Office Location': lecturer.officeLocation || '',
        'Office Hours': lecturer.officeHours || '',
        Courses: lecturer.courses ? lecturer.courses.length : 0,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lecturers');

      XLSX.writeFile(wb, 'lecturers-report.xlsx');
      showNotification('Excel exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showNotification('Failed to export Excel', 'error');
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  window.editLecturer = editLecturer;
  window.deleteLecturer = deleteLecturer;
  window.viewLecturerDetails = viewLecturerDetails;
  window.assignCoursesToLecturer = assignCoursesToLecturer;
  window.loadLecturersData = loadLecturersData;

  window.refreshLecturersCharts = function () {
    if (lecturersDeptChart) {
      renderLecturersDepartmentChart();
    }
    if (lecturersQualChart) {
      renderLecturersQualificationChart();
    }
  };

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(window.refreshLecturersCharts, 100);
    });
  }
})();
