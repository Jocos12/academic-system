(function () {
  const API_BASE_URL = 'http://localhost:8080/api';

  let departmentsData = [];
  let facultiesData = [];
  let lecturersData = [];
  let currentEditDeptId = null;
  let currentDepartmentEditId = null; // Add this line
  let deptFacultyChart = null;
  let deptStatusChart = null;

  document.addEventListener('DOMContentLoaded', function () {
    setupDepartmentEventListeners();
  });

  function setupDepartmentEventListeners() {
    const addBtn = document.getElementById('addDepartmentBtn');
    const closeBtn = document.getElementById('closeDepartmentModal');
    const cancelBtn = document.getElementById('deptCancelBtn');
    const form = document.getElementById('departmentForm');
    const searchInput = document.getElementById('searchDepartment');
    const facultyFilter = document.getElementById('deptFacultyFilter');
    const statusFilter = document.getElementById('deptStatusFilter');
    const exportPdfBtn = document.getElementById('exportDeptPdfBtn');
    const exportExcelBtn = document.getElementById('exportDeptExcelBtn');

    if (addBtn) addBtn.addEventListener('click', openAddDepartmentModal);
    if (closeBtn) closeBtn.addEventListener('click', closeDepartmentModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeDepartmentModal);
    if (form) form.addEventListener('submit', handleDepartmentFormSubmit);
    if (searchInput) searchInput.addEventListener('input', filterDepartments);
    if (facultyFilter)
      facultyFilter.addEventListener('change', filterDepartments);
    if (statusFilter)
      statusFilter.addEventListener('change', filterDepartments);
    if (exportPdfBtn)
      exportPdfBtn.addEventListener('click', exportDepartmentsPdf);
    if (exportExcelBtn)
      exportExcelBtn.addEventListener('click', exportDepartmentsExcel);

    window.addEventListener('click', (e) => {
      const modal = document.getElementById('departmentModal');
      if (e.target === modal) {
        closeDepartmentModal();
      }
    });
  }

  async function loadDepartmentsData() {
    try {
      await Promise.all([
        loadAllDepartments(),
        loadAllFaculties(),
        loadAllLecturers(),
      ]);

      if (departmentsData.length === 0) {
        showNotification(
          'No departments found. Please add some departments.',
          'info'
        );
      }
      populateFacultyFilters();
      updateDepartmentStats();
      displayDepartmentsTable(departmentsData);
      createDepartmentCharts();
    } catch (error) {
      console.error('Error loading departments data:', error);
      showNotification('Error loading departments data', 'error');
    }
  }

  async function loadAllDepartments() {
    try {
      const response = await fetch(`${API_BASE_URL}/departments`);
      if (response.ok) {
        departmentsData = await response.json();
      } else {
        departmentsData = []; // ← Use empty array instead
        console.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      departmentsData = []; // ← Use empty array instead
    }
  }

  async function loadAllFaculties() {
    try {
      const response = await fetch(`${API_BASE_URL}/faculties`);
      if (response.ok) {
        facultiesData = await response.json();
      } else {
        facultiesData = [];
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
      facultiesData = [];
    }
  }

  async function loadAllLecturers() {
    try {
      const response = await fetch(`${API_BASE_URL}/lecturers`);
      if (response.ok) {
        lecturersData = await response.json();
      } else {
        lecturersData = [];
      }
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      lecturersData = [];
    }
  }

  function updateDepartmentStats() {
    const total = departmentsData.length;
    const active = departmentsData.filter((d) => d.isActive).length;
    const faculties = [...new Set(departmentsData.map((d) => d.faculty?.id))]
      .length;
    const withHead = departmentsData.filter((d) => d.head !== null).length;

    animateCounter('totalDepartments', total);
    animateCounter('activeDepartmentsCount', active);
    animateCounter('totalFacultiesDept', faculties);
    animateCounter('departmentsWithHead', withHead);
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

  function populateFacultyFilters() {
    const filter = document.getElementById('deptFacultyFilter');
    if (!filter) return;

    filter.innerHTML = '<option value="">All Faculties</option>';
    facultiesData.forEach((faculty) => {
      const option = document.createElement('option');
      option.value = faculty.id;
      option.textContent = faculty.name;
      filter.appendChild(option);
    });
  }

  function filterDepartments() {
    const searchTerm =
      document.getElementById('searchDepartment')?.value.toLowerCase() || '';
    const facultyFilter =
      document.getElementById('deptFacultyFilter')?.value || '';
    const statusFilter =
      document.getElementById('deptStatusFilter')?.value || '';

    const filtered = departmentsData.filter((dept) => {
      const matchesSearch =
        !searchTerm ||
        dept.name.toLowerCase().includes(searchTerm) ||
        dept.code.toLowerCase().includes(searchTerm) ||
        (dept.description &&
          dept.description.toLowerCase().includes(searchTerm));

      const matchesFaculty =
        !facultyFilter || dept.faculty?.id == facultyFilter;
      const matchesStatus =
        !statusFilter || dept.isActive.toString() === statusFilter;

      return matchesSearch && matchesFaculty && matchesStatus;
    });

    displayDepartmentsTable(filtered);
  }

  function displayDepartmentsTable(departments) {
    const tbody = document.getElementById('departmentsTableBody');

    if (departments.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="loading">No departments found</td></tr>';
      return;
    }

    const html = departments
      .map(
        (dept) => `
        <tr>
            <td>${dept.code}</td>
            <td>${dept.name}</td>
            <td>${dept.facultyName || 'N/A'}</td>
            <td>${dept.head ? `${dept.head.firstName} ${dept.head.lastName}` : 'Not Assigned'}</td>
            <td>${dept.description ? dept.description.substring(0, 50) + '...' : '-'}</td>
            <td>
                <span class="status-badge ${dept.isActive ? 'status-active' : 'status-inactive'}">
                    ${dept.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDate(dept.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editDepartment(${dept.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteDepartment(${dept.id})" title="Delete">
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

    tbody.innerHTML = html;
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

  function createDepartmentCharts() {
    createDeptFacultyChart();
    createDeptStatusChart();
  }

  function createDeptFacultyChart() {
    const ctx = document.getElementById('deptFacultyChart');
    if (!ctx) return;

    if (deptFacultyChart) {
      deptFacultyChart.destroy();
    }

    const facultyCounts = {};
    departmentsData.forEach((dept) => {
      const facultyName = dept.faculty?.name || 'Unknown';
      facultyCounts[facultyName] = (facultyCounts[facultyName] || 0) + 1;
    });

    const labels = Object.keys(facultyCounts);
    const data = Object.values(facultyCounts);

    const isDark = document.body.classList.contains('dark-mode');

    deptFacultyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Departments per Faculty',
            data: data,
            backgroundColor: 'rgba(139, 92, 246, 0.85)',
            borderColor: '#8b5cf6',
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
              color: isDark ? '#cbd5e1' : '#64748b',
              stepSize: 1,
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
            callbacks: {
              title: function (context) {
                return context[0].label;
              },
              label: function (context) {
                return `${context.parsed.y} Department${context.parsed.y !== 1 ? 's' : ''}`;
              },
            },
          },
        },
      },
    });
  }

  function createDeptStatusChart() {
    const ctx = document.getElementById('deptStatusChart');
    if (!ctx) return;

    if (deptStatusChart) {
      deptStatusChart.destroy();
    }

    const activeCount = departmentsData.filter((d) => d.isActive).length;
    const inactiveCount = departmentsData.length - activeCount;

    const isDark = document.body.classList.contains('dark-mode');

    deptStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Inactive'],
        datasets: [
          {
            data: [activeCount, inactiveCount],
            backgroundColor: ['#10b981', '#ef4444'],
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

  async function openAddDepartmentModal() {
    document.getElementById('departmentModalTitle').textContent =
      'Add Department';
    document.getElementById('departmentForm').reset();
    document.getElementById('departmentId').value = '';
    document.getElementById('deptStatus').value = 'true'; // Changed
    currentDepartmentEditId = null;

    // Load lecturers and faculties into dropdowns
    await populateDepartmentFacultyFilter();
    await populateDepartmentHeadFilter();

    document.getElementById('departmentModal').classList.add('active');
  }

  async function editDepartment(id) {
    const dept = departmentsData.find((d) => d.id === id);
    if (!dept) return;

    document.getElementById('departmentModalTitle').textContent =
      'Edit Department';
    document.getElementById('departmentId').value = dept.id;
    document.getElementById('deptCode').value = dept.code; // Changed
    document.getElementById('deptName').value = dept.name; // Changed
    document.getElementById('deptDescription').value = dept.description || ''; // Changed
    document.getElementById('deptStatus').value = dept.isActive
      ? 'true'
      : 'false'; // Changed

    // Load the dropdowns first
    await populateDepartmentFacultyFilter();
    await populateDepartmentHeadFilter();

    // Then set their values
    document.getElementById('deptFaculty').value = dept.facultyId || ''; // Changed
    document.getElementById('deptHead').value = dept.head ? dept.head.id : ''; // Changed

    currentDepartmentEditId = id;
    document.getElementById('departmentModal').classList.add('active');
  }

  async function deleteDepartment(id) {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 404) {
        departmentsData = departmentsData.filter((d) => d.id !== id);
        displayDepartmentsTable(departmentsData);
        updateDepartmentStats();
        createDepartmentCharts();
        showNotification('Department deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      departmentsData = departmentsData.filter((d) => d.id !== id);
      displayDepartmentsTable(departmentsData);
      updateDepartmentStats();
      createDepartmentCharts();
      showNotification('Department deleted successfully', 'success');
    }
  }

  function closeDepartmentModal() {
    document.getElementById('departmentModal').classList.remove('active');
    document.getElementById('departmentForm').reset();
    currentEditDeptId = null;
  }

  async function populateFacultyDropdown() {
    const select = document.getElementById('deptFaculty');
    if (!select) return;

    select.innerHTML = '<option value="">Select Faculty</option>';
    facultiesData
      .filter((f) => f.isActive)
      .forEach((faculty) => {
        const option = document.createElement('option');
        option.value = faculty.id;
        option.textContent = faculty.name;
        select.appendChild(option);
      });
  }

  async function populateLecturerDropdown() {
    const select = document.getElementById('deptHead');
    if (!select) return;

    select.innerHTML = '<option value="">No Head Assigned</option>';
    lecturersData.forEach((lecturer) => {
      const option = document.createElement('option');
      option.value = lecturer.id;
      option.textContent = `${lecturer.firstName} ${lecturer.lastName}`;
      select.appendChild(option);
    });
  }

  async function populateDepartmentFacultyFilter() {
    const select = document.getElementById('deptFaculty');
    if (!select) return;

    select.innerHTML = '<option value="">Select Faculty</option>';

    try {
      const response = await fetch(`${API_BASE_URL}/faculties`);
      if (response.ok) {
        const faculties = await response.json();
        faculties.forEach((faculty) => {
          const option = document.createElement('option');
          option.value = faculty.id;
          option.textContent = `${faculty.name} (${faculty.code})`;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  }

  async function populateDepartmentHeadFilter() {
    const select = document.getElementById('deptHead');
    if (!select) return;

    select.innerHTML = '<option value="">No Head Assigned</option>';

    try {
      const response = await fetch(`${API_BASE_URL}/lecturers`);
      if (response.ok) {
        const lecturers = await response.json();
        lecturers.forEach((lecturer) => {
          const option = document.createElement('option');
          option.value = lecturer.id;
          option.textContent = `${lecturer.firstName} ${lecturer.lastName}`;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    }
  }

  async function handleDepartmentFormSubmit(e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById('deptName').value, // Changed
      code: document.getElementById('deptCode').value, // Changed
      description: document.getElementById('deptDescription').value || null, // Changed
      isActive: document.getElementById('deptStatus').value === 'true', // Changed
      facultyId: parseInt(document.getElementById('deptFaculty').value) || null, // Changed
    };

    // Only add head if one is selected
    const headId = document.getElementById('deptHead').value; // Changed
    if (headId && headId !== '') {
      formData.head = { id: parseInt(headId) };
    } else {
      formData.head = null;
    }

    try {
      let response;
      if (currentDepartmentEditId) {
        response = await fetch(
          `${API_BASE_URL}/departments/${currentDepartmentEditId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/departments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        showNotification(
          currentDepartmentEditId
            ? 'Department updated successfully'
            : 'Department added successfully',
          'success'
        );
        closeDepartmentModal();
        await loadDepartmentsData();
      } else {
        const errorText = await response.text();
        showNotification(`Error: ${errorText}`, 'error');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      showNotification('Error saving department. Please try again.', 'error');
    }
  }

  function exportDepartmentsPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text('UVT Departments Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Overview', 14, 40);

    doc.setFontSize(10);
    const stats = [
      `Total Departments: ${departmentsData.length}`,
      `Active: ${departmentsData.filter((d) => d.isActive).length}`,
      `Inactive: ${departmentsData.filter((d) => !d.isActive).length}`,
      `With Department Head: ${departmentsData.filter((d) => d.head).length}`,
    ];

    stats.forEach((stat, index) => {
      doc.text(stat, 14, 50 + index * 7);
    });

    const tableData = departmentsData.map((dept) => [
      dept.code,
      dept.name,
      dept.faculty?.name || 'N/A',
      dept.head
        ? `${dept.head.firstName} ${dept.head.lastName}`
        : 'Not assigned',
      dept.isActive ? 'Active' : 'Inactive',
      formatDate(dept.createdAt),
    ]);

    doc.autoTable({
      startY: 80,
      head: [
        ['Code', 'Name', 'Faculty', 'Department Head', 'Status', 'Created'],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { top: 10 },
    });

    doc.save('departments-report.pdf');
    showNotification('PDF exported successfully', 'success');
  }

  function exportDepartmentsExcel() {
    const wb = XLSX.utils.book_new();

    const wsData = [
      [
        'Code',
        'Name',
        'Faculty',
        'Department Head',
        'Description',
        'Status',
        'Created',
      ],
      ...departmentsData.map((dept) => [
        dept.code,
        dept.name,
        dept.faculty?.name || 'N/A',
        dept.head
          ? `${dept.head.firstName} ${dept.head.lastName}`
          : 'Not assigned',
        dept.description || 'N/A',
        dept.isActive ? 'Active' : 'Inactive',
        formatDate(dept.createdAt),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
      { wch: 40 },
      { wch: 10 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Departments');

    XLSX.writeFile(wb, 'departments-report.xlsx');
    showNotification('Excel exported successfully', 'success');
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  window.loadDepartmentsData = loadDepartmentsData;
  window.editDepartment = editDepartment;
  window.deleteDepartment = deleteDepartment;
})();
