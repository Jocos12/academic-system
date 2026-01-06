// ========================================
// TIMETABLE MANAGEMENT - COMPLETE IMPLEMENTATION
// ========================================

let timetableData = [];
let currentTimetableId = null;
let timetableDayChart = null;
let timetableTypeChart = null;

// ========================================
// LOAD TIMETABLE DATA
// ========================================

async function loadTimetableData() {
  try {
    const response = await fetch(`${API_BASE_URL}/timetable`);
    if (response.ok) {
      timetableData = await response.json();
    } else {
      timetableData = [];
    }
  } catch (error) {
    console.error('Error fetching timetable:', error);
    timetableData = [];
  }

  await loadCoursesForTimetable();
  await loadAcademicYearsForTimetable();
  updateTimetableStats();
  displayTimetableTable(timetableData);
  createTimetableCharts();
  populateTimetableCourseFilter();
}

window.loadTimetableData = loadTimetableData;

// ========================================
// LOAD DEPENDENCIES
// ========================================

async function loadCoursesForTimetable() {
  try {
    const response = await fetch(`${API_BASE_URL}/courses`);
    if (response.ok) {
      const courses = await response.json();
      populateCourseDropdown(courses);
    }
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

async function loadAcademicYearsForTimetable() {
  try {
    const response = await fetch(`${API_BASE_URL}/academic-years`);
    if (response.ok) {
      const years = await response.json();
      populateAcademicYearDropdown(years);
    }
  } catch (error) {
    console.error('Error loading academic years:', error);
  }
}

function populateCourseDropdown(courses) {
  const select = document.getElementById('timetableCourse');
  select.innerHTML = '<option value="">Select Course</option>';
  courses.forEach((course) => {
    const option = document.createElement('option');
    option.value = course.id;
    option.textContent = `${course.courseCode} - ${course.courseName}`;
    select.appendChild(option);
  });
}

function populateAcademicYearDropdown(years) {
  const select = document.getElementById('timetableAcademicYear');
  select.innerHTML = '<option value="">Select Academic Year</option>';
  years.forEach((year) => {
    const option = document.createElement('option');
    option.value = year.id;
    option.textContent = `${year.yearCode} - Semester ${year.semester}`;
    select.appendChild(option);
  });
}

function populateTimetableCourseFilter() {
  const select = document.getElementById('timetableCourseFilter');
  const courses = [
    ...new Set(timetableData.map((t) => t.course?.courseName || 'Unknown')),
  ];

  select.innerHTML = '<option value="">All Courses</option>';
  courses.forEach((course) => {
    const option = document.createElement('option');
    option.value = course;
    option.textContent = course;
    select.appendChild(option);
  });
}

// ========================================
// UPDATE STATS
// ========================================

function updateTimetableStats() {
  const totalTimetables = timetableData.length;
  const totalLectures = timetableData.filter(
    (t) => t.classType === 'LECTURE'
  ).length;
  const totalLabs = timetableData.filter((t) => t.classType === 'LAB').length;
  const totalTutorials = timetableData.filter(
    (t) => t.classType === 'TUTORIAL'
  ).length;

  animateCounter('totalTimetables', totalTimetables);
  animateCounter('totalLectures', totalLectures);
  animateCounter('totalLabs', totalLabs);
  animateCounter('totalTutorials', totalTutorials);
}

// ========================================
// DISPLAY TABLE
// ========================================

function displayTimetableTable(data) {
  const tbody = document.getElementById('timetableTableBody');

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="loading">No timetable entries found</td></tr>';
    return;
  }

  const html = data
    .map(
      (entry) => `
        <tr>
            <td>${entry.id}</td>
            <td>${entry.course?.courseCode || 'N/A'} - ${entry.course?.courseName || 'N/A'}</td>
            <td>${formatDayOfWeek(entry.dayOfWeek)}</td>
            <td>${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}</td>
            <td>${entry.classroom}</td>
            <td>${entry.building || 'N/A'}</td>
            <td>
                <span class="status-badge-table status-${entry.classType.toLowerCase()}">
                    ${formatClassType(entry.classType)}
                </span>
            </td>
            <td>${entry.academicYear?.yearCode || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editTimetable(${entry.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteTimetable(${entry.id})" title="Delete">
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

// ========================================
// FORMAT HELPERS
// ========================================

function formatDayOfWeek(day) {
  const days = {
    MONDAY: 'Monday',
    TUESDAY: 'Tuesday',
    WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday',
    FRIDAY: 'Friday',
    SATURDAY: 'Saturday',
    SUNDAY: 'Sunday',
  };
  return days[day] || day;
}

function formatTime(time) {
  if (!time) return 'N/A';
  // Time comes as HH:mm:ss, we just need HH:mm
  return time.substring(0, 5);
}

function formatClassType(type) {
  const types = {
    LECTURE: 'Lecture',
    LAB: 'Lab',
    TUTORIAL: 'Tutorial',
  };
  return types[type] || type;
}

// ========================================
// CHARTS
// ========================================

function createTimetableCharts() {
  createTimetableDayChart();
  createTimetableTypeChart();
}

function createTimetableDayChart() {
  const ctx = document.getElementById('timetableDayChart');
  if (!ctx) return;

  if (timetableDayChart) {
    timetableDayChart.destroy();
  }

  const dayCounts = {
    MONDAY: 0,
    TUESDAY: 0,
    WEDNESDAY: 0,
    THURSDAY: 0,
    FRIDAY: 0,
    SATURDAY: 0,
    SUNDAY: 0,
  };

  timetableData.forEach((entry) => {
    if (dayCounts.hasOwnProperty(entry.dayOfWeek)) {
      dayCounts[entry.dayOfWeek]++;
    }
  });

  const labels = Object.keys(dayCounts).map((day) => formatDayOfWeek(day));
  const data = Object.values(dayCounts);
  const isDark = document.body.classList.contains('dark-mode');

  // Calculate insight
  const maxDay = Object.keys(dayCounts).reduce((a, b) =>
    dayCounts[a] > dayCounts[b] ? a : b
  );
  const minDay = Object.keys(dayCounts).reduce((a, b) =>
    dayCounts[a] < dayCounts[b] ? a : b
  );
  const insightEl = document.getElementById('weeklyInsight');
  if (insightEl && timetableData.length > 0) {
    insightEl.textContent = `Busiest day: ${formatDayOfWeek(maxDay)} (${dayCounts[maxDay]} classes) • Lightest: ${formatDayOfWeek(minDay)} (${dayCounts[minDay]} classes)`;
  } else if (insightEl) {
    insightEl.textContent = 'No schedule data available';
  }

  timetableDayChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Classes',
          data: data,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          borderRadius: 10,
          barThickness: 50,
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
              size: 13,
              weight: '600',
            },
            padding: 8,
          },
          grid: {
            color: isDark
              ? 'rgba(51, 65, 85, 0.5)'
              : 'rgba(226, 232, 240, 0.8)',
            drawBorder: false,
            lineWidth: 1,
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
              weight: '600',
            },
            padding: 8,
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
            : 'rgba(0, 0, 0, 0.85)',
          padding: 16,
          titleFont: {
            size: 15,
            weight: 'bold',
          },
          bodyFont: {
            size: 14,
          },
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          displayColors: false,
          cornerRadius: 8,
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              return `${context.parsed.y} Class${context.parsed.y !== 1 ? 'es' : ''}`;
            },
          },
        },
      },
    },
  });
}

function createTimetableTypeChart() {
  const ctx = document.getElementById('timetableTypeChart');
  if (!ctx) return;

  if (timetableTypeChart) {
    timetableTypeChart.destroy();
  }

  const typeCounts = {
    LECTURE: 0,
    LAB: 0,
    TUTORIAL: 0,
  };

  timetableData.forEach((entry) => {
    if (typeCounts.hasOwnProperty(entry.classType)) {
      typeCounts[entry.classType]++;
    }
  });

  const labels = Object.keys(typeCounts).map((type) => formatClassType(type));
  const data = Object.values(typeCounts);
  const isDark = document.body.classList.contains('dark-mode');

  // Calculate insight
  const total = data.reduce((a, b) => a + b, 0);
  const insightEl = document.getElementById('typeInsight');
  if (insightEl && total > 0) {
    const lecturePercent = ((typeCounts.LECTURE / total) * 100).toFixed(0);
    const labPercent = ((typeCounts.LAB / total) * 100).toFixed(0);
    const tutorialPercent = ((typeCounts.TUTORIAL / total) * 100).toFixed(0);
    insightEl.textContent = `${lecturePercent}% Lectures • ${labPercent}% Labs • ${tutorialPercent}% Tutorials`;
  } else if (insightEl) {
    insightEl.textContent = 'No class type data available';
  }

  const colors = ['#1e3a8a', '#10b981', '#f59e0b'];
  const hoverColors = ['#1e40af', '#059669', '#d97706'];

  timetableTypeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          hoverBackgroundColor: hoverColors,
          borderWidth: 0,
          borderRadius: 8,
          spacing: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDark
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(0, 0, 0, 0.85)',
          padding: 16,
          titleFont: {
            size: 15,
            weight: 'bold',
          },
          bodyFont: {
            size: 14,
          },
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          displayColors: true,
          boxWidth: 12,
          boxHeight: 12,
          boxPadding: 6,
          cornerRadius: 8,
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

// ========================================
// MODAL HANDLERS
// ========================================

function openAddTimetableModal() {
  document.getElementById('timetableModalTitle').textContent =
    'Add Timetable Entry';
  document.getElementById('timetableForm').reset();
  document.getElementById('timetableId').value = '';
  currentTimetableId = null;
  document.getElementById('timetableModal').classList.add('active');
}

function closeTimetableModal() {
  document.getElementById('timetableModal').classList.remove('active');
  document.getElementById('timetableForm').reset();
  currentTimetableId = null;
}

async function editTimetable(id) {
  const entry = timetableData.find((t) => t.id === id);
  if (!entry) return;

  document.getElementById('timetableModalTitle').textContent =
    'Edit Timetable Entry';
  document.getElementById('timetableId').value = entry.id;
  document.getElementById('timetableCourse').value = entry.course?.id || '';
  document.getElementById('timetableAcademicYear').value =
    entry.academicYear?.id || '';
  document.getElementById('timetableDayOfWeek').value = entry.dayOfWeek;
  document.getElementById('timetableClassType').value = entry.classType;
  document.getElementById('timetableStartTime').value = formatTime(
    entry.startTime
  );
  document.getElementById('timetableEndTime').value = formatTime(entry.endTime);
  document.getElementById('timetableClassroom').value = entry.classroom;
  document.getElementById('timetableBuilding').value = entry.building || '';

  currentTimetableId = id;
  document.getElementById('timetableModal').classList.add('active');
}

async function deleteTimetable(id) {
  if (!confirm('Are you sure you want to delete this timetable entry?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/timetable/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showNotification('Timetable entry deleted successfully', 'success');
      await loadTimetableData();
    } else {
      const error = await response.text();
      showNotification(error || 'Failed to delete timetable entry', 'error');
    }
  } catch (error) {
    console.error('Error deleting timetable:', error);
    showNotification('Error deleting timetable entry', 'error');
  }
}

// ========================================
// FORM SUBMISSION
// ========================================

async function handleTimetableFormSubmit(e) {
  e.preventDefault();

  const formData = {
    course: {
      id: parseInt(document.getElementById('timetableCourse').value),
    },
    academicYear: {
      id: parseInt(document.getElementById('timetableAcademicYear').value),
    },
    dayOfWeek: document.getElementById('timetableDayOfWeek').value,
    startTime: document.getElementById('timetableStartTime').value + ':00',
    endTime: document.getElementById('timetableEndTime').value + ':00',
    classroom: document.getElementById('timetableClassroom').value,
    building: document.getElementById('timetableBuilding').value || null,
    classType: document.getElementById('timetableClassType').value,
  };

  try {
    let response;
    if (currentTimetableId) {
      formData.id = currentTimetableId;
      response = await fetch(
        `${API_BASE_URL}/timetable/${currentTimetableId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
    } else {
      response = await fetch(`${API_BASE_URL}/timetable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    if (response.ok) {
      showNotification(
        currentTimetableId
          ? 'Timetable updated successfully'
          : 'Timetable created successfully',
        'success'
      );
      closeTimetableModal();
      await loadTimetableData();
    } else {
      const error = await response.text();
      showNotification(error || 'Failed to save timetable', 'error');
    }
  } catch (error) {
    console.error('Error saving timetable:', error);
    showNotification('Error saving timetable', 'error');
  }
}

// ========================================
// FILTERS
// ========================================

function filterTimetable() {
  const searchTerm = document
    .getElementById('searchTimetable')
    .value.toLowerCase();
  const dayFilter = document.getElementById('dayFilter').value;
  const typeFilter = document.getElementById('classTypeFilter').value;
  const courseFilter = document.getElementById('timetableCourseFilter').value;

  const filtered = timetableData.filter((entry) => {
    const matchesSearch =
      !searchTerm ||
      entry.course?.courseName?.toLowerCase().includes(searchTerm) ||
      entry.course?.courseCode?.toLowerCase().includes(searchTerm) ||
      entry.classroom?.toLowerCase().includes(searchTerm) ||
      entry.building?.toLowerCase().includes(searchTerm);

    const matchesDay = !dayFilter || entry.dayOfWeek === dayFilter;
    const matchesType = !typeFilter || entry.classType === typeFilter;
    const matchesCourse =
      !courseFilter || entry.course?.courseName === courseFilter;

    return matchesSearch && matchesDay && matchesType && matchesCourse;
  });

  displayTimetableTable(filtered);
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

function exportTimetablePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('UVT Timetable Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Overview', 14, 40);

  doc.setFontSize(10);
  const stats = [
    `Total Schedules: ${timetableData.length}`,
    `Lectures: ${timetableData.filter((t) => t.classType === 'LECTURE').length}`,
    `Labs: ${timetableData.filter((t) => t.classType === 'LAB').length}`,
    `Tutorials: ${timetableData.filter((t) => t.classType === 'TUTORIAL').length}`,
  ];

  stats.forEach((stat, index) => {
    doc.text(stat, 14, 50 + index * 8);
  });

  const tableData = timetableData.map((entry) => [
    entry.course?.courseCode || 'N/A',
    entry.course?.courseName || 'N/A',
    formatDayOfWeek(entry.dayOfWeek),
    `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`,
    entry.classroom,
    entry.building || 'N/A',
    formatClassType(entry.classType),
  ]);

  doc.autoTable({
    startY: 85,
    head: [
      [
        'Course Code',
        'Course Name',
        'Day',
        'Time',
        'Classroom',
        'Building',
        'Type',
      ],
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

  doc.save('timetable-report.pdf');
  showNotification('Timetable PDF exported successfully', 'success');
}

function exportTimetableExcel() {
  const ws_data = [
    [
      'Course Code',
      'Course Name',
      'Day',
      'Start Time',
      'End Time',
      'Classroom',
      'Building',
      'Type',
      'Academic Year',
    ],
    ...timetableData.map((entry) => [
      entry.course?.courseCode || 'N/A',
      entry.course?.courseName || 'N/A',
      formatDayOfWeek(entry.dayOfWeek),
      formatTime(entry.startTime),
      formatTime(entry.endTime),
      entry.classroom,
      entry.building || 'N/A',
      formatClassType(entry.classType),
      entry.academicYear?.yearCode || 'N/A',
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
  XLSX.writeFile(wb, 'timetable-report.xlsx');
  showNotification('Timetable Excel exported successfully', 'success');
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', function () {
  // Modal buttons
  const addBtn = document.getElementById('addTimetableBtn');
  if (addBtn) {
    addBtn.addEventListener('click', openAddTimetableModal);
  }

  const closeBtn = document.getElementById('closeTimetableModal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeTimetableModal);
  }

  const cancelBtn = document.getElementById('timetableCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeTimetableModal);
  }

  // Form submission
  const form = document.getElementById('timetableForm');
  if (form) {
    form.addEventListener('submit', handleTimetableFormSubmit);
  }

  // Filters
  const searchInput = document.getElementById('searchTimetable');
  if (searchInput) {
    searchInput.addEventListener('input', filterTimetable);
  }

  const dayFilter = document.getElementById('dayFilter');
  if (dayFilter) {
    dayFilter.addEventListener('change', filterTimetable);
  }

  const typeFilter = document.getElementById('classTypeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', filterTimetable);
  }

  const courseFilter = document.getElementById('timetableCourseFilter');
  if (courseFilter) {
    courseFilter.addEventListener('change', filterTimetable);
  }

  // Export buttons
  const exportPdfBtn = document.getElementById('exportTimetablePdfBtn');
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportTimetablePDF);
  }

  const exportExcelBtn = document.getElementById('exportTimetableExcelBtn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', exportTimetableExcel);
  }

  // Close modal on outside click
  const modal = document.getElementById('timetableModal');
  if (modal) {
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeTimetableModal();
      }
    });
  }
});

// Make functions globally available
window.editTimetable = editTimetable;
window.deleteTimetable = deleteTimetable;
window.loadTimetableData = loadTimetableData;
