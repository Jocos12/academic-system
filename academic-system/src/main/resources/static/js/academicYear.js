(function () {
  // API Base URL
  const ACADEMIC_YEAR_API_URL = 'http://localhost:8080/api/academic-years';

  // Global Variables
  let academicYears = [];
  let filteredYears = [];
  let currentEditId = null;
  let statusChart = null;
  let timelineChart = null;

  // Initialize Application
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadAcademicYears();
    populateYearCodeOptions(); // ✅ Populate year code combo box
  });

  // Initialize Application
  function initializeApp() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }

  // ✅ NEW: Populate Year Code Combo Box (2020-2035)
  function populateYearCodeOptions() {
    const yearCodeSelect = document.getElementById('ayYearCode');
    if (!yearCodeSelect) return;

    // Convert input to select if it's still an input
    if (yearCodeSelect.tagName === 'INPUT') {
      const selectElement = document.createElement('select');
      selectElement.id = 'ayYearCode';
      selectElement.className = 'form-input';
      selectElement.required = true;
      yearCodeSelect.parentNode.replaceChild(selectElement, yearCodeSelect);
      return populateYearCodeOptions(); // Recursive call after replacement
    }

    // Clear existing options
    yearCodeSelect.innerHTML = '<option value="">Select Academic Year</option>';

    // Generate years from 2020 to 2035
    const startYear = 2020;
    const endYear = 2035;

    for (let year = startYear; year < endYear; year++) {
      const nextYear = year + 1;
      const yearCode = `${year}-${nextYear}`;

      const option = document.createElement('option');
      option.value = yearCode;
      option.textContent = yearCode;

      yearCodeSelect.appendChild(option);
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // Modal Controls
    const addBtn = document.getElementById('addAcademicYearBtn');
    if (addBtn) {
      addBtn.addEventListener('click', openAddModal);
    }

    const closeBtn = document.getElementById('closeAyModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    const cancelBtn = document.getElementById('ayCancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }

    // Form Submit
    const form = document.getElementById('academicYearForm');
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }

    // Search and Filters
    const searchInput = document.getElementById('searchAcademicYear');
    if (searchInput) {
      searchInput.addEventListener('input', filterTable);
    }

    const statusFilter = document.getElementById('ayStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', filterTable);
    }

    const semesterFilter = document.getElementById('aySemesterFilter');
    if (semesterFilter) {
      semesterFilter.addEventListener('change', filterTable);
    }

    // Export Buttons
    const pdfBtn = document.getElementById('exportAyPdfBtn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', exportToPDF);
    }

    const excelBtn = document.getElementById('exportAyExcelBtn');
    if (excelBtn) {
      excelBtn.addEventListener('click', exportToExcel);
    }

    // Click outside modal to close
    const modal = document.getElementById('academicYearModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'academicYearModal') {
          closeModal();
        }
      });
    }

    // ✅ Date validation event listeners
    setupDateValidation();
  }

  // ✅ NEW: Setup Date Validation
  function setupDateValidation() {
    const startDate = document.getElementById('ayStartDate');
    const endDate = document.getElementById('ayEndDate');
    const regStart = document.getElementById('ayRegStartDate');
    const regEnd = document.getElementById('ayRegEndDate');
    const examStart = document.getElementById('ayExamStartDate');
    const examEnd = document.getElementById('ayExamEndDate');

    // Start date changes affect all other dates
    if (startDate) {
      startDate.addEventListener('change', () => {
        const startValue = startDate.value;
        if (endDate) endDate.min = startValue;
        if (regStart) regStart.min = startValue;
      });
    }

    // End date must be after start date
    if (endDate) {
      endDate.addEventListener('change', () => {
        const endValue = endDate.value;
        if (regEnd) regEnd.max = endValue;
        if (examEnd) examEnd.max = endValue;
      });
    }

    // Registration start must be within academic year
    if (regStart) {
      regStart.addEventListener('change', () => {
        const regStartValue = regStart.value;
        if (regEnd) regEnd.min = regStartValue;
      });
    }

    // Exam start must be within academic year
    if (examStart) {
      examStart.addEventListener('change', () => {
        const examStartValue = examStart.value;
        if (examEnd) examEnd.min = examStartValue;
      });
    }
  }

  // Theme Toggle
  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    if (statusChart) updateChartTheme(statusChart);
    if (timelineChart) updateChartTheme(timelineChart);
  }

  // Sidebar Toggle
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
    }
  }

  // Load Academic Years
  async function loadAcademicYears() {
    try {
      showLoading(true);
      const response = await fetch(ACADEMIC_YEAR_API_URL);

      if (!response.ok) {
        throw new Error('Failed to load academic years');
      }

      academicYears = await response.json();
      filteredYears = [...academicYears];

      updateStatistics();
      renderTable();
      renderCharts();

      showLoading(false);
    } catch (error) {
      console.error('Error loading academic years:', error);
      showNotification('Failed to load academic years', 'error');
      showLoading(false);
    }
  }

  // Update Statistics
  function updateStatistics() {
    const total = academicYears.length;
    const active = academicYears.filter((y) => y.isActive).length;
    const inactive = total - active;
    const current = academicYears.find((y) => y.isCurrent);

    const totalEl = document.getElementById('ayTotalYears');
    const activeEl = document.getElementById('ayActiveYears');
    const inactiveEl = document.getElementById('ayInactiveYears');
    const currentEl = document.getElementById('ayCurrentYear');

    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (inactiveEl) inactiveEl.textContent = inactive;
    if (currentEl) currentEl.textContent = current ? current.yearCode : '-';
  }

  // Render Table
  function renderTable() {
    const tbody = document.getElementById('academicYearsTableBody');
    if (!tbody) return;

    if (filteredYears.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="loading">No academic years found</td></tr>';
      return;
    }

    tbody.innerHTML = filteredYears
      .map(
        (year) => `
        <tr>
            <td><strong>${year.yearCode}</strong></td>
            <td>Semester ${year.semester}</td>
            <td>${formatDate(year.startDate)}</td>
            <td>${formatDate(year.endDate)}</td>
            <td>${formatDate(year.registrationStartDate)} - ${formatDate(year.registrationEndDate)}</td>
            <td>${formatDate(year.examStartDate)} - ${formatDate(year.examEndDate)}</td>
            <td>
                <span class="status-badge ${year.isActive ? 'status-active' : 'status-inactive'}">
                    ${year.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                ${year.isCurrent ? '<span class="status-badge status-current">Current</span>' : '-'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="window.editYear(${year.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                    </button>
                    ${
                      !year.isCurrent
                        ? `
                    <button class="btn-icon set-current" onclick="window.setCurrentYear(${year.id})" title="Set as Current">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                    </button>
                    `
                        : ''
                    }
                    ${
                      year.isActive
                        ? `
                    <button class="btn-icon activate" onclick="window.toggleActive(${year.id}, false)" title="Deactivate">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </button>
                    `
                        : `
                    <button class="btn-icon activate" onclick="window.toggleActive(${year.id}, true)" title="Activate">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    `
                    }
                    <button class="btn-icon delete" onclick="window.deleteYear(${year.id})" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `
      )
      .join('');
  }

  // Filter Table
  function filterTable() {
    const searchInput = document.getElementById('searchAcademicYear');
    const statusFilter = document.getElementById('ayStatusFilter');
    const semesterFilter = document.getElementById('aySemesterFilter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const semesterValue = semesterFilter ? semesterFilter.value : '';

    filteredYears = academicYears.filter((year) => {
      const matchesSearch = year.yearCode.toLowerCase().includes(searchTerm);
      const matchesStatus =
        !statusValue ||
        (statusValue === 'active' && year.isActive) ||
        (statusValue === 'inactive' && !year.isActive);
      const matchesSemester =
        !semesterValue || year.semester.toString() === semesterValue;

      return matchesSearch && matchesStatus && matchesSemester;
    });

    renderTable();
  }

  // Render Charts
  function renderCharts() {
    renderStatusChart();
    renderTimelineChart();
  }

  // Render Status Chart
  function renderStatusChart() {
    const ctx = document.getElementById('ayStatusChart');
    if (!ctx) return;

    const active = academicYears.filter((y) => y.isActive).length;
    const inactive = academicYears.filter((y) => !y.isActive).length;

    if (statusChart) {
      statusChart.destroy();
    }

    const isDark = document.body.classList.contains('dark-mode');

    statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Inactive'],
        datasets: [
          {
            data: [active, inactive],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0,
            borderRadius: 8,
            spacing: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#f1f5f9' : '#1e293b',
              padding: 20,
              font: {
                size: 13,
                weight: '500',
              },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  // Render Timeline Chart
  function renderTimelineChart() {
    const ctx = document.getElementById('ayTimelineChart');
    if (!ctx) return;

    const yearCounts = {};
    academicYears.forEach((year) => {
      yearCounts[year.yearCode] = (yearCounts[year.yearCode] || 0) + 1;
    });

    const labels = Object.keys(yearCounts).sort();
    const data = labels.map((label) => yearCounts[label]);

    if (timelineChart) {
      timelineChart.destroy();
    }

    const isDark = document.body.classList.contains('dark-mode');

    timelineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Semesters',
            data: data,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 40,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: isDark ? '#cbd5e1' : '#64748b',
              stepSize: 1,
            },
            grid: {
              color: isDark ? '#334155' : '#e2e8f0',
            },
          },
          x: {
            ticks: {
              color: isDark ? '#cbd5e1' : '#64748b',
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  // Update Chart Theme
  function updateChartTheme(chart) {
    const isDark = document.body.classList.contains('dark-mode');

    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = isDark ? '#f1f5f9' : '#1e293b';
    }

    if (chart.options.scales) {
      if (chart.options.scales.y) {
        chart.options.scales.y.ticks.color = isDark ? '#cbd5e1' : '#64748b';
        chart.options.scales.y.grid.color = isDark ? '#334155' : '#e2e8f0';
      }
      if (chart.options.scales.x) {
        chart.options.scales.x.ticks.color = isDark ? '#cbd5e1' : '#64748b';
      }
    }

    chart.update();
  }

  // Modal Functions
  function openAddModal() {
    currentEditId = null;
    document.getElementById('ayModalTitle').textContent = 'Add Academic Year';
    document.getElementById('academicYearForm').reset();

    populateYearCodeOptions(); // ✅ Repopulate options

    // ✅ Enable year code selection for new records
    const yearCodeSelect = document.getElementById('ayYearCode');
    if (yearCodeSelect) {
      yearCodeSelect.disabled = false;
    }

    const modal = document.getElementById('academicYearModal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  function openEditModal(year) {
    currentEditId = year.id;
    document.getElementById('ayModalTitle').textContent = 'Edit Academic Year';

    populateYearCodeOptions(); // ✅ Ensure options are populated

    const yearCodeSelect = document.getElementById('ayYearCode');
    if (yearCodeSelect) {
      yearCodeSelect.value = year.yearCode;
      // ✅ Disable year code editing for existing records
      yearCodeSelect.disabled = true;
      yearCodeSelect.style.backgroundColor = 'var(--card-bg)';
      yearCodeSelect.style.opacity = '0.7';
      yearCodeSelect.style.cursor = 'not-allowed';
    }

    document.getElementById('aySemester').value = year.semester;
    document.getElementById('ayStartDate').value = year.startDate;
    document.getElementById('ayEndDate').value = year.endDate;
    document.getElementById('ayRegStartDate').value = year.registrationStartDate;
    document.getElementById('ayRegEndDate').value = year.registrationEndDate;
    document.getElementById('ayExamStartDate').value = year.examStartDate;
    document.getElementById('ayExamEndDate').value = year.examEndDate;

    const modal = document.getElementById('academicYearModal');
    if (modal) {
      modal.classList.add('active');
    }
  }

  function closeModal() {
    const modal = document.getElementById('academicYearModal');
    if (modal) {
      modal.classList.remove('active');
    }

    const form = document.getElementById('academicYearForm');
    if (form) {
      form.reset();
    }

    // ✅ Re-enable year code selection
    const yearCodeSelect = document.getElementById('ayYearCode');
    if (yearCodeSelect) {
      yearCodeSelect.disabled = false;
      yearCodeSelect.style.backgroundColor = '';
      yearCodeSelect.style.opacity = '';
      yearCodeSelect.style.cursor = '';
    }

    currentEditId = null;
  }

  // ✅ Enhanced Form Validation
  function validateFormData(formData) {
    const errors = [];

    // Validate dates logic
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const regStart = new Date(formData.registrationStartDate);
    const regEnd = new Date(formData.registrationEndDate);
    const examStart = new Date(formData.examStartDate);
    const examEnd = new Date(formData.examEndDate);

    // Academic year dates
    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }

    // Registration dates
    if (regEnd <= regStart) {
      errors.push('Registration end date must be after registration start date');
    }

    if (regStart < startDate || regStart > endDate) {
      errors.push('Registration start date must be within the academic year period');
    }

    if (regEnd < startDate || regEnd > endDate) {
      errors.push('Registration end date must be within the academic year period');
    }

    // Exam dates
    if (examEnd <= examStart) {
      errors.push('Exam end date must be after exam start date');
    }

    if (examStart < startDate || examStart > endDate) {
      errors.push('Exam start date must be within the academic year period');
    }

    if (examEnd < startDate || examEnd > endDate) {
      errors.push('Exam end date must be within the academic year period');
    }

    // Logical sequence
    if (examStart < regEnd) {
      errors.push('Exam period should typically start after registration ends');
    }

    return errors;
  }

  // Form Submit Handler
  async function handleFormSubmit(e) {
    e.preventDefault();

    const yearCodeElement = document.getElementById('ayYearCode');
    const formData = {
      yearCode: yearCodeElement ? yearCodeElement.value : '',
      semester: parseInt(document.getElementById('aySemester').value),
      startDate: document.getElementById('ayStartDate').value,
      endDate: document.getElementById('ayEndDate').value,
      registrationStartDate: document.getElementById('ayRegStartDate').value,
      registrationEndDate: document.getElementById('ayRegEndDate').value,
      examStartDate: document.getElementById('ayExamStartDate').value,
      examEndDate: document.getElementById('ayExamEndDate').value,
      isActive: true,
      isCurrent: false,
    };

    // ✅ Validate form data
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      showNotification(validationErrors.join('\n'), 'error');
      return;
    }

    try {
      let response;

      if (currentEditId) {
        response = await fetch(`${ACADEMIC_YEAR_API_URL}/${currentEditId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch(ACADEMIC_YEAR_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save academic year');
      }

      showNotification(
        currentEditId
          ? 'Academic year updated successfully'
          : 'Academic year created successfully',
        'success'
      );
      closeModal();
      loadAcademicYears();
    } catch (error) {
      console.error('Error saving academic year:', error);
      showNotification(error.message, 'error');
    }
  }

  // CRUD Operations
  async function editYear(id) {
    try {
      const response = await fetch(`${ACADEMIC_YEAR_API_URL}/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load academic year');
      }

      const year = await response.json();
      openEditModal(year);
    } catch (error) {
      console.error('Error loading academic year:', error);
      showNotification('Failed to load academic year', 'error');
    }
  }

  async function deleteYear(id) {
    if (!confirm('Are you sure you want to delete this academic year?')) {
      return;
    }

    try {
      const response = await fetch(`${ACADEMIC_YEAR_API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete academic year');
      }

      showNotification('Academic year deleted successfully', 'success');
      loadAcademicYears();
    } catch (error) {
      console.error('Error deleting academic year:', error);
      showNotification('Failed to delete academic year', 'error');
    }
  }

  async function setCurrentYear(id) {
    try {
      const response = await fetch(
        `${ACADEMIC_YEAR_API_URL}/${id}/set-current`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to set current academic year');
      }

      showNotification('Academic year set as current successfully', 'success');
      loadAcademicYears();
    } catch (error) {
      console.error('Error setting current academic year:', error);
      showNotification(error.message, 'error');
    }
  }

  async function toggleActive(id, activate) {
    try {
      const endpoint = activate ? 'activate' : 'deactivate';
      const response = await fetch(
        `${ACADEMIC_YEAR_API_URL}/${id}/${endpoint}`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to ${endpoint} academic year`);
      }

      showNotification(
        `Academic year ${activate ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
      loadAcademicYears();
    } catch (error) {
      console.error('Error toggling active status:', error);
      showNotification(error.message, 'error');
    }
  }

  // Export Functions
  function exportToPDF() {
    if (typeof jsPDF === 'undefined') {
      showNotification('PDF library not loaded', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Academic Years Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

    doc.setFontSize(12);
    doc.text('Statistics:', 14, 38);
    doc.setFontSize(10);
    doc.text(`Total Academic Years: ${academicYears.length}`, 20, 45);
    doc.text(
      `Active Years: ${academicYears.filter((y) => y.isActive).length}`,
      20,
      52
    );
    doc.text(
      `Inactive Years: ${academicYears.filter((y) => !y.isActive).length}`,
      20,
      59
    );
    const current = academicYears.find((y) => y.isCurrent);
    doc.text(`Current Year: ${current ? current.yearCode : 'None'}`, 20, 66);

    const tableData = filteredYears.map((year) => [
      year.yearCode,
      `Semester ${year.semester}`,
      formatDate(year.startDate),
      formatDate(year.endDate),
      `${formatDate(year.registrationStartDate)} - ${formatDate(year.registrationEndDate)}`,
      `${formatDate(year.examStartDate)} - ${formatDate(year.examEndDate)}`,
      year.isActive ? 'Active' : 'Inactive',
      year.isCurrent ? 'Yes' : 'No',
    ]);

    doc.autoTable({
      startY: 75,
      head: [
        [
          'Year Code',
          'Semester',
          'Start',
          'End',
          'Registration',
          'Exams',
          'Status',
          'Current',
        ],
      ],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save(
      `academic_years_report_${new Date().toISOString().split('T')[0]}.pdf`
    );
    showNotification('PDF exported successfully', 'success');
  }

  function exportToExcel() {
    if (typeof XLSX === 'undefined') {
      showNotification('Excel library not loaded', 'error');
      return;
    }

    const excelData = filteredYears.map((year) => ({
      'Year Code': year.yearCode,
      Semester: year.semester,
      'Start Date': year.startDate,
      'End Date': year.endDate,
      'Registration Start': year.registrationStartDate,
      'Registration End': year.registrationEndDate,
      'Exam Start': year.examStartDate,
      'Exam End': year.examEndDate,
      Status: year.isActive ? 'Active' : 'Inactive',
      Current: year.isCurrent ? 'Yes' : 'No',
      'Created At': year.createdAt,
      'Updated At': year.updatedAt,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
      { wch: 18 },
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Academic Years');

    XLSX.writeFile(
      wb,
      `academic_years_export_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    showNotification('Excel exported successfully', 'success');
  }

  // Utility Functions
  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function showLoading(show) {
    const tbody = document.getElementById('academicYearsTableBody');
    if (tbody && show) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="loading">Loading academic years...</td></tr>';
    }
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 500;
        max-width: 400px;
        white-space: pre-line;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .status-current {
        background-color: #f59e0b;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
    }
`;
  document.head.appendChild(style);

  // Expose functions to global scope
  window.editYear = editYear;
  window.setCurrentYear = setCurrentYear;
  window.toggleActive = toggleActive;
  window.deleteYear = deleteYear;
})();