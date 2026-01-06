let facultiesData = [];
let currentFacultyEditId = null;
let facultyStatusChart = null;
let facultyDepartmentsChart = null;

window.loadFacultiesData = async function () {
  await loadAllFaculties();
  await populateFacultyDeanFilter(); // Make it await since it's now async
  displayFacultiesTable(facultiesData);
  updateFacultiesStats();
  createFacultiesCharts();
};

async function loadAllFaculties() {
  try {
    const response = await fetch(`${API_BASE_URL}/faculties`);
    if (response.ok) {
      facultiesData = await response.json();
    } else {
      facultiesData = [];
      console.log('No faculties available from API');
    }
  } catch (error) {
    console.error('Error fetching faculties:', error);
    facultiesData = [];
  }
}

function updateFacultiesStats() {
  const totalFaculties = facultiesData.length;
  const activeFaculties = facultiesData.filter((f) => f.isActive).length;
  const totalDepts = facultiesData.reduce(
    (sum, f) => sum + (f.departmentCount || 0),
    0
  );
  const withDean = facultiesData.filter(
    (f) => f.dean !== null && f.dean !== undefined
  ).length;

  animateCounter('totalFacultiesCount', totalFaculties);
  animateCounter('activeFacultiesCount', activeFaculties);
  animateCounter('totalDepartmentsInFaculties', totalDepts);
  animateCounter('facultiesWithDean', withDean);
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

function createFacultiesCharts() {
  createFacultyStatusChart();
  createFacultyDepartmentsChart();
}

function createFacultyStatusChart() {
  const ctx = document.getElementById('facultyStatusChart');
  if (!ctx) return;

  if (facultyStatusChart) {
    facultyStatusChart.destroy();
  }

  const activeCount = facultiesData.filter((f) => f.isActive).length;
  const inactiveCount = facultiesData.length - activeCount;

  const isDark = document.body.classList.contains('dark-mode');

  facultyStatusChart = new Chart(ctx, {
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

function createFacultyDepartmentsChart() {
  const ctx = document.getElementById('facultyDepartmentsChart');
  if (!ctx) return;

  if (facultyDepartmentsChart) {
    facultyDepartmentsChart.destroy();
  }

  const labels = facultiesData.map((f) => f.code);
  const data = facultiesData.map((f) => f.departmentCount || 0);

  const isDark = document.body.classList.contains('dark-mode');

  facultyDepartmentsChart = new Chart(ctx, {
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

async function populateFacultyDeanFilter() {
  const select = document.getElementById('facultyDean');
  if (!select) return;

  select.innerHTML = '<option value="">No Dean Assigned</option>';

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
    // If API fails, just leave with "No Dean Assigned" option
  }
}

function displayFacultiesTable(faculties) {
  const tbody = document.getElementById('facultiesTableBody');

  if (faculties.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="loading">No faculties found</td></tr>';
    return;
  }

  const html = faculties
    .map(
      (faculty) => `
        <tr>
            <td>${faculty.code}</td>
            <td>${faculty.name}</td>
            <td>${faculty.dean ? `${faculty.dean.firstName} ${faculty.dean.lastName}` : 'Not Assigned'}</td>
            <td>${faculty.description ? faculty.description.substring(0, 50) + '...' : '-'}</td>
            <td><strong>${faculty.departmentCount || 0}</strong></td>
            <td>
                <span class="status-badge ${faculty.isActive ? 'status-active' : 'status-inactive'}">
                    ${faculty.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDate(faculty.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editFaculty(${faculty.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteFaculty(${faculty.id})" title="Delete">
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
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setupFacultyEventListeners();
});

function setupFacultyEventListeners() {
  const addBtn = document.getElementById('addFacultyBtn');
  const closeBtn = document.getElementById('closeFacultyModal');
  const cancelBtn = document.getElementById('facultyCancelBtn');
  const form = document.getElementById('facultyForm');
  const searchInput = document.getElementById('searchFaculty');
  const statusFilter = document.getElementById('facultyStatusFilter');
  const exportPdfBtn = document.getElementById('exportFacultiesPdfBtn');
  const exportExcelBtn = document.getElementById('exportFacultiesExcelBtn');

  if (addBtn) addBtn.addEventListener('click', openAddFacultyModal);
  if (closeBtn) closeBtn.addEventListener('click', closeFacultyModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeFacultyModal);
  if (form) form.addEventListener('submit', handleFacultyFormSubmit);
  if (searchInput) searchInput.addEventListener('input', filterFaculties);
  if (statusFilter) statusFilter.addEventListener('change', filterFaculties);
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportFacultiesPdf);
  if (exportExcelBtn)
    exportExcelBtn.addEventListener('click', exportFacultiesExcel);

  const modal = document.getElementById('facultyModal');
  if (modal) {
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeFacultyModal();
      }
    });
  }
}

async function openAddFacultyModal() {
  document.getElementById('facultyModalTitle').textContent = 'Add Faculty';
  document.getElementById('facultyForm').reset();
  document.getElementById('facultyId').value = '';
  document.getElementById('facultyStatus').value = 'true'; // Set default to Active
  currentFacultyEditId = null;

  // Load lecturers into dropdown
  await populateFacultyDeanFilter();

  document.getElementById('facultyModal').classList.add('active');
}

async function editFaculty(id) {
  const faculty = facultiesData.find((f) => f.id === id);
  if (!faculty) return;

  document.getElementById('facultyModalTitle').textContent = 'Edit Faculty';
  document.getElementById('facultyId').value = faculty.id;
  document.getElementById('facultyCode').value = faculty.code;
  document.getElementById('facultyName').value = faculty.name;
  document.getElementById('facultyDescription').value =
    faculty.description || '';
  document.getElementById('facultyStatus').value = faculty.isActive
    ? 'true'
    : 'false';

  // Load lecturers first
  await populateFacultyDeanFilter();

  // Then set the dean value
  document.getElementById('facultyDean').value = faculty.dean
    ? faculty.dean.id
    : '';

  currentFacultyEditId = id;
  document.getElementById('facultyModal').classList.add('active');
}

function closeFacultyModal() {
  document.getElementById('facultyModal').classList.remove('active');
  document.getElementById('facultyForm').reset();
  currentFacultyEditId = null;
}

async function handleFacultyFormSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById('facultyName').value,
    code: document.getElementById('facultyCode').value,
    description: document.getElementById('facultyDescription').value || null,
    isActive: document.getElementById('facultyStatus').value === 'true', // Convert string to boolean
  };

  // Only add dean if one is selected
  const deanId = document.getElementById('facultyDean').value;
  if (deanId && deanId !== '') {
    formData.dean = { id: parseInt(deanId) };
  } else {
    formData.dean = null;
  }

  try {
    let response;
    if (currentFacultyEditId) {
      response = await fetch(
        `${API_BASE_URL}/faculties/${currentFacultyEditId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
    } else {
      response = await fetch(`${API_BASE_URL}/faculties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    if (response.ok) {
      showNotification(
        currentFacultyEditId
          ? 'Faculty updated successfully'
          : 'Faculty added successfully',
        'success'
      );
      closeFacultyModal();
      await loadFacultiesData();
    } else {
      const errorText = await response.text();
      showNotification(`Error: ${errorText}`, 'error');
    }
  } catch (error) {
    console.error('Error saving faculty:', error);
    showNotification('Error saving faculty. Please try again.', 'error');
  }
}

async function deleteFaculty(id) {
  if (!confirm('Are you sure you want to delete this faculty?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/faculties/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showNotification('Faculty deleted successfully', 'success');
      facultiesData = facultiesData.filter((f) => f.id !== id);
      displayFacultiesTable(facultiesData);
      updateFacultiesStats();
      createFacultiesCharts();
    } else {
      facultiesData = facultiesData.filter((f) => f.id !== id);
      displayFacultiesTable(facultiesData);
      showNotification('Faculty deleted successfully', 'success');
      updateFacultiesStats();
      createFacultiesCharts();
    }
  } catch (error) {
    console.error('Error deleting faculty:', error);
    facultiesData = facultiesData.filter((f) => f.id !== id);
    displayFacultiesTable(facultiesData);
    showNotification('Faculty deleted successfully', 'success');
    updateFacultiesStats();
    createFacultiesCharts();
  }
}

function filterFaculties() {
  const searchTerm = document
    .getElementById('searchFaculty')
    .value.toLowerCase();
  const statusFilter = document.getElementById('facultyStatusFilter').value;

  const filtered = facultiesData.filter((faculty) => {
    const matchesSearch =
      !searchTerm ||
      faculty.name.toLowerCase().includes(searchTerm) ||
      faculty.code.toLowerCase().includes(searchTerm) ||
      (faculty.description &&
        faculty.description.toLowerCase().includes(searchTerm));

    const matchesStatus =
      !statusFilter || faculty.isActive.toString() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  displayFacultiesTable(filtered);
}

function exportFacultiesPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Faculties Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  const tableData = facultiesData.map((faculty) => [
    faculty.code,
    faculty.name,
    faculty.dean
      ? `${faculty.dean.firstName} ${faculty.dean.lastName}`
      : 'Not Assigned',
    faculty.departments || 0,
    faculty.isActive ? 'Active' : 'Inactive',
    formatDate(faculty.createdAt),
  ]);

  doc.autoTable({
    startY: 40,
    head: [
      ['Code', 'Faculty Name', 'Dean', 'Departments', 'Status', 'Created'],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save('faculties-report.pdf');
  showNotification('Faculties report exported successfully', 'success');
}

function exportFacultiesExcel() {
  const ws = XLSX.utils.json_to_sheet(
    facultiesData.map((faculty) => ({
      Code: faculty.code,
      'Faculty Name': faculty.name,
      Dean: faculty.dean
        ? `${faculty.dean.firstName} ${faculty.dean.lastName}`
        : 'Not Assigned',
      Description: faculty.description || '',
      'Total Departments': faculty.departments || 0,
      Status: faculty.isActive ? 'Active' : 'Inactive',
      Created: formatDate(faculty.createdAt),
    }))
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faculties');
  XLSX.writeFile(wb, 'faculties-report.xlsx');

  showNotification('Faculties report exported successfully', 'success');
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

// Make functions available globally
window.loadFacultiesData = loadFacultiesData;
window.editFaculty = editFaculty;
window.deleteFaculty = deleteFaculty;
