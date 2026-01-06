// Variables are declared in admin.js, we'll use them from there

(function () {
  // Use variables from global scope or admin.js
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080/api';

  let enrollmentsData = [];
  let studentsData = [];
  let coursesData = [];
  let academicYearsData = [];
  let currentEnrollmentEditId = null;
  let enrollmentStatusChart = null;
  let enrollmentTimelineChart = null;

  function initializeEnrollmentsPage() {
    setupEnrollmentEventListeners();
  }

  function setupEnrollmentEventListeners() {
    const addEnrollmentBtn = document.getElementById('addEnrollmentBtn');
    if (addEnrollmentBtn) {
      addEnrollmentBtn.addEventListener('click', openAddEnrollmentModal);
    }

    const closeEnrollmentModal = document.getElementById('closeEnrollmentModal');
    if (closeEnrollmentModal) {
      closeEnrollmentModal.addEventListener('click', closeEnrollmentModalFunc);
    }

    const enrollmentCancelBtn = document.getElementById('enrollmentCancelBtn');
    if (enrollmentCancelBtn) {
      enrollmentCancelBtn.addEventListener('click', closeEnrollmentModalFunc);
    }

    const enrollmentForm = document.getElementById('enrollmentForm');
    if (enrollmentForm) {
      enrollmentForm.addEventListener('submit', handleEnrollmentFormSubmit);
    }

    const searchEnrollment = document.getElementById('searchEnrollment');
    if (searchEnrollment) {
      searchEnrollment.addEventListener('input', filterEnrollments);
    }

    const enrollmentStatusFilter = document.getElementById('enrollmentStatusFilter');
    if (enrollmentStatusFilter) {
      enrollmentStatusFilter.addEventListener('change', filterEnrollments);
    }

    const enrollmentPaymentFilter = document.getElementById('enrollmentPaymentFilter');
    if (enrollmentPaymentFilter) {
      enrollmentPaymentFilter.addEventListener('change', filterEnrollments);
    }

    const enrollmentYearFilter = document.getElementById('enrollmentYearFilter');
    if (enrollmentYearFilter) {
      enrollmentYearFilter.addEventListener('change', filterEnrollments);
    }

    const exportEnrollmentsPdfBtn = document.getElementById('exportEnrollmentsPdfBtn');
    if (exportEnrollmentsPdfBtn) {
      exportEnrollmentsPdfBtn.addEventListener('click', exportEnrollmentsPDF);
    }

    const exportEnrollmentsExcelBtn = document.getElementById('exportEnrollmentsExcelBtn');
    if (exportEnrollmentsExcelBtn) {
      exportEnrollmentsExcelBtn.addEventListener('click', exportEnrollmentsExcel);
    }

    window.addEventListener('click', (e) => {
      const modal = document.getElementById('enrollmentModal');
      if (e.target === modal) {
        closeEnrollmentModalFunc();
      }
    });
  }

  async function loadEnrollmentsData() {
    try {
      await Promise.all([
        loadAllEnrollments(),
        loadAllStudents(),
        loadAllCourses(),
        loadAllAcademicYears(),
      ]);

      updateEnrollmentStats();
      populateEnrollmentFilters();
      displayEnrollmentsTable(enrollmentsData);
      createEnrollmentCharts();
    } catch (error) {
      console.error('Error loading enrollments data:', error);
      showNotification('Failed to load enrollment data. Please refresh the page.', 'error');
    }
  }

  async function loadAllEnrollments() {
    try {
      const response = await fetch(`${API_BASE_URL}/enrollments`);
      if (response.ok) {
        enrollmentsData = await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      enrollmentsData = [];
      showNotification('Failed to load enrollments. Please check your connection.', 'error');
    }
  }

  async function loadAllStudents() {
    try {
      const response = await fetch(`${API_BASE_URL}/students`);
      if (response.ok) {
        studentsData = await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      studentsData = [];
      showNotification('Failed to load students data.', 'error');
    }
  }

  async function loadAllCourses() {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/active`);
      if (response.ok) {
        const data = await response.json();
        // Vérifier si c'est un tableau
        if (Array.isArray(data)) {
          coursesData = data;
          console.log(`Loaded ${coursesData.length} active courses successfully`);
        } else {
          console.warn('Courses data is not an array:', data);
          coursesData = [];
        }
      } else if (response.status === 500) {
        // Si l'endpoint /active échoue, essayer avec un endpoint simple
        console.warn('Active courses endpoint failed, trying alternative...');
        try {
          const altResponse = await fetch(`${API_BASE_URL}/courses`);
          if (!altResponse.ok) {
            throw new Error('Alternative endpoint also failed');
          }
          const altData = await altResponse.json();
          if (Array.isArray(altData)) {
            // Filtrer manuellement les cours actifs
            coursesData = altData.filter(course => course.isActive === true);
            console.log(`Loaded ${coursesData.length} courses (filtered manually)`);
          } else {
            coursesData = [];
          }
        } catch (altError) {
          console.error('Alternative fetch also failed:', altError);
          coursesData = [];
        }
      } else {
        console.error(`HTTP error! status: ${response.status}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        coursesData = [];
      }

      // Notification seulement si vraiment aucun cours n'a été chargé
      if (coursesData.length === 0) {
        showNotification('No courses available. Please add courses first.', 'warning');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      coursesData = [];
      showNotification('Failed to load courses. Please check your connection.', 'warning');
    }
  }

  async function loadAllAcademicYears() {
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years`);
      if (response.ok) {
        academicYearsData = await response.json();
        // Trier par yearCode décroissant
        academicYearsData.sort((a, b) => b.yearCode.localeCompare(a.yearCode));
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
      academicYearsData = [];
      showNotification('Failed to load academic years data.', 'error');
    }
  }

  function calculateLetterGrade(total) {
    if (total >= 90) return 'A';
    if (total >= 85) return 'B+';
    if (total >= 80) return 'B';
    if (total >= 75) return 'C+';
    if (total >= 70) return 'C';
    if (total >= 60) return 'D';
    return 'F';
  }

  function updateEnrollmentStats() {
    const total = enrollmentsData.length;
    const registered = enrollmentsData.filter((e) => e.status === 'REGISTERED').length;
    const pending = enrollmentsData.filter((e) => e.status === 'PENDING').length;
    const completed = enrollmentsData.filter((e) => e.status === 'COMPLETED').length;

    animateCounter('totalEnrollments', total);
    animateCounter('registeredEnrollments', registered);
    animateCounter('pendingEnrollments', pending);
    animateCounter('completedEnrollments', completed);
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

  function populateEnrollmentFilters() {
    const yearFilter = document.getElementById('enrollmentYearFilter');
    if (yearFilter && academicYearsData.length > 0) {
      const years = [...new Set(academicYearsData.map((ay) => ay.yearCode))];
      yearFilter.innerHTML = '<option value="">All Years</option>';
      years.forEach((year) => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      });
    }
  }



// ✅ FONCTION CORRIGÉE: displayEnrollmentsTable
function displayEnrollmentsTable(enrollments) {
  const tbody = document.getElementById('enrollmentsTableBody');
  if (!tbody) return;

  if (enrollments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" class="loading">No enrollments found</td></tr>';
    return;
  }

  const html = enrollments
    .map(
      (enrollment) => `
      <tr>
          <td>${enrollment.id}</td>
          <td>${enrollment.studentIdNumber || 'N/A'}<br><small>${enrollment.studentName || 'N/A'}</small></td>
          <td>${enrollment.courseCode || 'N/A'}<br><small>${enrollment.courseName || 'N/A'}</small></td>
          <td>${enrollment.academicYear || 'N/A'}</td>
          <td>Semester ${enrollment.semester || 'N/A'}</td>
          <td>
              <span class="status-badge status-${(enrollment.status || 'pending').toLowerCase().replace('_', '-')}">
                  ${(enrollment.status || 'PENDING').replace('_', ' ')}
              </span>
          </td>
          <td>${enrollment.midtermGrade !== null && enrollment.midtermGrade !== undefined ? enrollment.midtermGrade : '-'}</td>
          <td>${enrollment.finalGrade !== null && enrollment.finalGrade !== undefined ? enrollment.finalGrade : '-'}</td>
          <td>${enrollment.totalGrade !== null && enrollment.totalGrade !== undefined ? enrollment.totalGrade : '-'}</td>
          <td>${enrollment.letterGrade || '-'}</td>
          <td>
              <span class="status-badge ${enrollment.isPaid ? 'status-active' : 'status-inactive'}">
                  ${enrollment.isPaid ? 'Paid' : 'Unpaid'}
              </span>
          </td>
          <td>
              <div class="action-buttons">
                  <button class="btn-icon edit" onclick="window.editEnrollment(${enrollment.id})" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                  </button>
                  <button class="btn-icon delete" onclick="window.deleteEnrollment(${enrollment.id})" title="Delete">
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





  function openAddEnrollmentModal() {
    document.getElementById('enrollmentModalTitle').textContent = 'Add Enrollment';
    document.getElementById('enrollmentForm').reset();
    document.getElementById('enrollmentId').value = '';
    currentEnrollmentEditId = null;

    populateStudentSelect();
    populateCourseSelect();
    populateAcademicYearSelect(); // ✅ AJOUT: Remplir le combo box des années académiques

    document.getElementById('enrollmentModal').classList.add('active');
  }

  function populateStudentSelect() {
    const select = document.getElementById('enrollStudent');
    if (!select) return;

    select.innerHTML = '<option value="">Select Student</option>';
    studentsData.forEach((student) => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.studentId} - ${student.firstName} ${student.lastName}`;
      select.appendChild(option);
    });
  }

  function populateCourseSelect() {
    const select = document.getElementById('enrollCourse');
    if (!select) return;

    select.innerHTML = '<option value="">Select Course</option>';

    if (coursesData.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No courses available';
      option.disabled = true;
      select.appendChild(option);
      console.warn('No courses available to populate select');
      return;
    }

    coursesData.forEach((course) => {
      const option = document.createElement('option');
      option.value = course.id;
      option.textContent = `${course.courseCode} - ${course.courseName}`;
      select.appendChild(option);
    });

    console.log(`Populated course select with ${coursesData.length} courses`);
  }

  // ✅ NOUVELLE FONCTION: Remplir le combo box des années académiques
  function populateAcademicYearSelect() {
    const select = document.getElementById('enrollAcademicYear');
    if (!select) return;

    select.innerHTML = '<option value="">Select Academic Year</option>';

    if (academicYearsData.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No academic years available';
      option.disabled = true;
      select.appendChild(option);
      return;
    }

    academicYearsData.forEach((academicYear) => {
      const option = document.createElement('option');
      option.value = academicYear.yearCode;

      // Afficher avec le semestre et marquer si c'est l'année courante
      let displayText = `${academicYear.yearCode} - Semester ${academicYear.semester}`;
      if (academicYear.isCurrent) {
        displayText += ' (Current)';
      }
      if (!academicYear.isActive) {
        displayText += ' (Inactive)';
      }

      option.textContent = displayText;

      // Désactiver les années académiques inactives
      if (!academicYear.isActive) {
        option.disabled = true;
      }

      select.appendChild(option);
    });
  }




  async function deleteEnrollment(id) {
    if (!confirm('Are you sure you want to delete this enrollment?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification('Enrollment deleted successfully', 'success');
        await loadEnrollmentsData();
      } else {
        const errorText = await response.text();
        showNotification(errorText || 'Failed to delete enrollment', 'error');
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      showNotification('Failed to delete enrollment. Please try again.', 'error');
    }
  }

  function closeEnrollmentModalFunc() {
    document.getElementById('enrollmentModal').classList.remove('active');
    document.getElementById('enrollmentForm').reset();
    currentEnrollmentEditId = null;
  }

  async function handleEnrollmentFormSubmit(e) {
    e.preventDefault();

    const studentId = document.getElementById('enrollStudent').value;
    const courseId = document.getElementById('enrollCourse').value;
    const academicYear = document.getElementById('enrollAcademicYear').value;
    const semester = parseInt(document.getElementById('enrollSemester').value);
    const status = document.getElementById('enrollStatus').value;
    const isPaid = document.getElementById('enrollPayment').value === 'true';
    const midtermGrade = document.getElementById('enrollMidterm').value
      ? parseFloat(document.getElementById('enrollMidterm').value)
      : null;
    const finalGrade = document.getElementById('enrollFinal').value
      ? parseFloat(document.getElementById('enrollFinal').value)
      : null;
    const attendance = parseInt(document.getElementById('enrollAttendance').value) || 0;

    // ✅ VALIDATIONS
    if (!studentId || !courseId) {
      showNotification('Please select both student and course', 'error');
      return;
    }

    if (!academicYear) {
      showNotification('Please select an academic year', 'error');
      return;
    }

    if (!semester || (semester !== 1 && semester !== 2)) {
      showNotification('Please select a valid semester (1 or 2)', 'error');
      return;
    }

    if (midtermGrade !== null && (midtermGrade < 0 || midtermGrade > 100)) {
      showNotification('Midterm grade must be between 0 and 100', 'error');
      return;
    }

    if (finalGrade !== null && (finalGrade < 0 || finalGrade > 100)) {
      showNotification('Final grade must be between 0 and 100', 'error');
      return;
    }

    if (attendance < 0 || attendance > 100) {
      showNotification('Attendance must be between 0 and 100', 'error');
      return;
    }

    const totalGrade =
      midtermGrade && finalGrade
        ? (midtermGrade * 0.4 + finalGrade * 0.6).toFixed(2)
        : null;
    const letterGrade = totalGrade ? calculateLetterGrade(parseFloat(totalGrade)) : null;

    const formData = {
      studentId: parseInt(studentId),
      courseId: parseInt(courseId),
      academicYear: academicYear,
      semester: semester,
      status: status,
      midtermGrade: midtermGrade,
      finalGrade: finalGrade,
      totalGrade: totalGrade ? parseFloat(totalGrade) : null,
      letterGrade: letterGrade,
      attendance: attendance,
      isPaid: isPaid,
    };

    try {
      let response;
      if (currentEnrollmentEditId) {
        response = await fetch(`${API_BASE_URL}/enrollments/${currentEnrollmentEditId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/enrollments/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        showNotification(
          currentEnrollmentEditId
            ? 'Enrollment updated successfully'
            : 'Enrollment created successfully',
          'success'
        );
        closeEnrollmentModalFunc();
        await loadEnrollmentsData();
      } else {
        const errorText = await response.text();
        showNotification(errorText || 'Failed to save enrollment', 'error');
      }
    } catch (error) {
      console.error('Error saving enrollment:', error);
      showNotification('Failed to save enrollment. Please try again.', 'error');
    }
  }

  function createEnrollmentCharts() {
    createEnrollmentStatusChart();
    createEnrollmentTimelineChart();
  }

  function createEnrollmentStatusChart() {
    const ctx = document.getElementById('enrollmentStatusChart');
    if (!ctx) return;

    if (enrollmentStatusChart) {
      enrollmentStatusChart.destroy();
    }

    const statusCounts = {
      PENDING: 0,
      REGISTERED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      DROPPED: 0,
      FAILED: 0,
    };

    enrollmentsData.forEach((enrollment) => {
      statusCounts[enrollment.status]++;
    });

    const isDark = document.body.classList.contains('dark-mode');

    enrollmentStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts).map((s) => s.replace('_', ' ')),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: [
              '#f59e0b',
              '#10b981',
              '#3b82f6',
              '#8b5cf6',
              '#ef4444',
              '#6b7280',
            ],
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
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            displayColors: true,
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

  function createEnrollmentTimelineChart() {
    const ctx = document.getElementById('enrollmentTimelineChart');
    if (!ctx) return;

    if (enrollmentTimelineChart) {
      enrollmentTimelineChart.destroy();
    }

    const monthlyData = {};
    enrollmentsData.forEach((enrollment) => {
      const date = new Date(enrollment.enrolledAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const sortedKeys = Object.keys(monthlyData).sort();
    const labels = sortedKeys.map((key) => {
      const [year, month] = key.split('-');
      return new Date(year, month - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    });
    const data = sortedKeys.map((key) => monthlyData[key]);

    const isDark = document.body.classList.contains('dark-mode');

    enrollmentTimelineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.slice(-6),
        datasets: [
          {
            label: 'Enrollments',
            data: data.slice(-6),
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
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            displayColors: false,
          },
        },
      },
    });
  }





// ✅ FONCTION CORRIGÉE: exportEnrollmentsPDF
function exportEnrollmentsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('UVT Enrollments Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // ✅ CORRECTION: Utiliser les champs du DTO
  const tableData = enrollmentsData.map((enrollment) => [
    enrollment.id,
    enrollment.studentIdNumber || 'N/A',
    enrollment.studentName || 'N/A',
    enrollment.courseCode || 'N/A',
    enrollment.academicYear || 'N/A',
    `S${enrollment.semester || 'N/A'}`,
    enrollment.status || 'PENDING',
    enrollment.totalGrade !== null && enrollment.totalGrade !== undefined ? enrollment.totalGrade : '-',
    enrollment.letterGrade || '-',
    enrollment.isPaid ? 'Yes' : 'No',
  ]);

  doc.autoTable({
    startY: 35,
    head: [
      [
        'ID',
        'Student ID',
        'Student Name',
        'Course',
        'Year',
        'Sem',
        'Status',
        'Grade',
        'Letter',
        'Paid',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save('enrollments-report.pdf');
  showNotification('PDF exported successfully', 'success');
}






// ✅ FONCTION CORRIGÉE: filterEnrollments
function filterEnrollments() {
  const searchTerm = document.getElementById('searchEnrollment')?.value.toLowerCase() || '';
  const statusFilter = document.getElementById('enrollmentStatusFilter')?.value || '';
  const paymentFilter = document.getElementById('enrollmentPaymentFilter')?.value || '';
  const yearFilter = document.getElementById('enrollmentYearFilter')?.value || '';

  const filtered = enrollmentsData.filter((enrollment) => {
    // ✅ CORRECTION: Utiliser les champs du DTO
    const studentName = enrollment.studentName ? enrollment.studentName.toLowerCase() : '';
    const studentId = enrollment.studentIdNumber ? enrollment.studentIdNumber.toLowerCase() : '';
    const courseName = enrollment.courseName ? enrollment.courseName.toLowerCase() : '';
    const courseCode = enrollment.courseCode ? enrollment.courseCode.toLowerCase() : '';

    const matchesSearch =
      !searchTerm ||
      studentName.includes(searchTerm) ||
      studentId.includes(searchTerm) ||
      courseName.includes(searchTerm) ||
      courseCode.includes(searchTerm);

    const matchesStatus = !statusFilter || enrollment.status === statusFilter;
    const matchesPayment = !paymentFilter || enrollment.isPaid.toString() === paymentFilter;
    const matchesYear = !yearFilter || enrollment.academicYear === yearFilter;

    return matchesSearch && matchesStatus && matchesPayment && matchesYear;
  });

  displayEnrollmentsTable(filtered);
}






// ✅ FONCTION CORRIGÉE: editEnrollment
function editEnrollment(id) {
  const enrollment = enrollmentsData.find((e) => e.id === id);
  if (!enrollment) {
    showNotification('Enrollment not found', 'error');
    return;
  }

  document.getElementById('enrollmentModalTitle').textContent = 'Edit Enrollment';
  document.getElementById('enrollmentId').value = enrollment.id;

  populateStudentSelect();
  populateCourseSelect();
  populateAcademicYearSelect();

  // ✅ CORRECTION: Utiliser les IDs du DTO
  document.getElementById('enrollStudent').value = enrollment.studentId || '';
  document.getElementById('enrollCourse').value = enrollment.courseId || '';
  document.getElementById('enrollAcademicYear').value = enrollment.academicYear || '';
  document.getElementById('enrollSemester').value = enrollment.semester || '';
  document.getElementById('enrollStatus').value = enrollment.status || 'PENDING';
  document.getElementById('enrollPayment').value = enrollment.isPaid ? 'true' : 'false';
  document.getElementById('enrollMidterm').value = enrollment.midtermGrade || '';
  document.getElementById('enrollFinal').value = enrollment.finalGrade || '';
  document.getElementById('enrollAttendance').value = enrollment.attendance || 0;

  currentEnrollmentEditId = id;
  document.getElementById('enrollmentModal').classList.add('active');
}




// ✅ FONCTION CORRIGÉE: exportEnrollmentsExcel
function exportEnrollmentsExcel() {
  // ✅ CORRECTION: Utiliser les champs du DTO
  const data = enrollmentsData.map((enrollment) => ({
    ID: enrollment.id,
    'Student ID': enrollment.studentIdNumber || 'N/A',
    'Student Name': enrollment.studentName || 'N/A',
    'Course Code': enrollment.courseCode || 'N/A',
    'Course Name': enrollment.courseName || 'N/A',
    'Academic Year': enrollment.academicYear || 'N/A',
    Semester: enrollment.semester || 'N/A',
    Status: enrollment.status || 'PENDING',
    Midterm: enrollment.midtermGrade !== null && enrollment.midtermGrade !== undefined ? enrollment.midtermGrade : '',
    Final: enrollment.finalGrade !== null && enrollment.finalGrade !== undefined ? enrollment.finalGrade : '',
    Total: enrollment.totalGrade !== null && enrollment.totalGrade !== undefined ? enrollment.totalGrade : '',
    'Letter Grade': enrollment.letterGrade || '',
    Attendance: enrollment.attendance || 0,
    Paid: enrollment.isPaid ? 'Yes' : 'No',
    'Enrolled Date': enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Enrollments');

  XLSX.writeFile(wb, 'enrollments-report.xlsx');
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

  // ✅ Exposer les fonctions globalement
  window.loadEnrollmentsData = loadEnrollmentsData;
  window.editEnrollment = editEnrollment;
  window.deleteEnrollment = deleteEnrollment;
  window.exportEnrollmentsPDF = exportEnrollmentsPDF;
  window.exportEnrollmentsExcel = exportEnrollmentsExcel;

  // ✅ Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnrollmentsPage);
  } else {
    initializeEnrollmentsPage();
  }
})();