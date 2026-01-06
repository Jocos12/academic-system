// ========================================
// ENHANCED COURSES MANAGEMENT WITH VALIDATIONS
// ========================================

(function () {
  const API_BASE_URL = 'http://localhost:8080/api';

  let coursesData = [];
  let currentCourseId = null;
  let coursesFacultyChart = null;
  let coursesYearChart = null;
  let academicYears = [];
  let nextCourseNumber = 1;

  document.addEventListener('DOMContentLoaded', function () {
    setupCoursesEventListeners();
    loadAcademicYears();
  });

  // ========================================
  // EVENT LISTENERS SETUP
  // ========================================
  function setupCoursesEventListeners() {
    const addBtn = document.getElementById('addCourseBtn');
    if (addBtn) addBtn.addEventListener('click', openAddCourseModal);

    const closeBtn = document.getElementById('closeCourseModal');
    if (closeBtn) closeBtn.addEventListener('click', closeCourseModal);

    const cancelBtn = document.getElementById('courseCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeCourseModal);

    const form = document.getElementById('courseForm');
    if (form) form.addEventListener('submit', handleCourseFormSubmit);

    const searchInput = document.getElementById('searchCourse');
    if (searchInput) searchInput.addEventListener('input', filterCourses);

    const facultyFilter = document.getElementById('facultyFilter');
    if (facultyFilter) facultyFilter.addEventListener('change', filterCourses);

    const yearFilter = document.getElementById('yearFilter');
    if (yearFilter) yearFilter.addEventListener('change', filterCourses);

    const semesterFilter = document.getElementById('semesterFilter');
    if (semesterFilter) semesterFilter.addEventListener('change', filterCourses);

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.addEventListener('change', filterCourses);

    const exportPdfBtn = document.getElementById('exportCoursesPdfBtn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportCoursesPDF);

    const exportExcelBtn = document.getElementById('exportCoursesExcelBtn');
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', exportCoursesExcel);

    window.addEventListener('click', (e) => {
      const modal = document.getElementById('courseModal');
      if (e.target === modal) closeCourseModal();
    });

    const coursesNavItem = document.querySelector('[data-page="courses"]');
    if (coursesNavItem) {
      coursesNavItem.addEventListener('click', () => {
        loadCoursesData();
      });
    }

    setupFacultyDepartmentLink();
    setupRealTimeValidation();
  }

  // ========================================
  // REAL-TIME FORM VALIDATION
  // ========================================
  function setupRealTimeValidation() {
    const courseName = document.getElementById('courseName');
    if (courseName) {
      courseName.addEventListener('input', function() {
        validateCourseName(this.value);
      });
    }

    const credits = document.getElementById('courseCredits');
    if (credits) {
      credits.addEventListener('input', function() {
        validateCredits(this.value);
      });
    }

    const price = document.getElementById('coursePrice');
    if (price) {
      price.addEventListener('input', function() {
        validatePrice(this.value);
      });
    }

    const maxStudents = document.getElementById('courseMaxStudents');
    if (maxStudents) {
      maxStudents.addEventListener('input', function() {
        validateMaxStudents(this.value);
      });
    }
  }

  function validateCourseName(value) {
    const field = document.getElementById('courseName');
    if (!value || value.trim().length < 3) {
      setFieldError(field, 'Course name must be at least 3 characters');
      return false;
    } else if (value.trim().length > 200) {
      setFieldError(field, 'Course name must be less than 200 characters');
      return false;
    }
    clearFieldError(field);
    return true;
  }

  function validateCredits(value) {
    const field = document.getElementById('courseCredits');
    const credits = parseInt(value);
    if (!credits || credits < 1 || credits > 10) {
      setFieldError(field, 'Credits must be between 1 and 10');
      return false;
    }
    clearFieldError(field);
    return true;
  }

  function validatePrice(value) {
    const field = document.getElementById('coursePrice');
    const price = parseFloat(value);
    if (!price || price < 0) {
      setFieldError(field, 'Price must be a positive number');
      return false;
    } else if (price > 10000) {
      setFieldError(field, 'Price seems unusually high. Please verify.');
      return false;
    }
    clearFieldError(field);
    return true;
  }

  function validateMaxStudents(value) {
    const field = document.getElementById('courseMaxStudents');
    const max = parseInt(value);
    if (!max || max < 1) {
      setFieldError(field, 'Max students must be at least 1');
      return false;
    } else if (max > 500) {
      setFieldError(field, 'Max students cannot exceed 500');
      return false;
    }
    clearFieldError(field);
    return true;
  }

  function setFieldError(field, message) {
    if (!field) return;

    field.style.borderColor = '#ef4444';

    let errorDiv = field.parentElement.querySelector('.field-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.style.cssText = 'color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem;';
      field.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
  }

  function clearFieldError(field) {
    if (!field) return;

    field.style.borderColor = '';

    const errorDiv = field.parentElement.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  // ========================================
  // LOAD ACADEMIC YEARS
  // ========================================
  async function loadAcademicYears() {
    try {
      const response = await fetch(`${API_BASE_URL}/academic-years`);
      if (response.ok) {
        academicYears = await response.json();
        populateYearDropdown();
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
      showNotification('Failed to load academic years', 'error');
    }
  }



function populateYearDropdown() {
    const yearFilter = document.getElementById('yearFilter');
    const courseYear = document.getElementById('courseYear');

    if (yearFilter) {
      yearFilter.innerHTML = '<option value="">All Years</option>';

      // Extraire les années uniques des cours existants
      const uniqueYears = [...new Set(coursesData.map(c => c.year))].filter(Boolean).sort();

      uniqueYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
      });
    }

    if (courseYear) {
      courseYear.innerHTML = '<option value="">Select Year</option>';

      // Utiliser les années académiques actives
      const activeYears = academicYears
        .filter(ay => ay.isActive)
        .map(ay => ay.yearCode)
        .sort();

      activeYears.forEach(yearCode => {
        const option = document.createElement('option');
        option.value = yearCode;  // Ceci sera "2024-2025"
        option.textContent = yearCode;  // Affiche "2024-2025"
        courseYear.appendChild(option);
      });
    }
}






  // ========================================
  // GENERATE NEXT COURSE CODE
  // ========================================
  async function generateNextCourseCode() {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (response.ok) {
        const courses = await response.json();

        const csCourses = courses
          .filter(c => c.courseCode.startsWith('CS'))
          .map(c => {
            const match = c.courseCode.match(/^CS(\d+)$/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(num => !isNaN(num));

        if (csCourses.length > 0) {
          nextCourseNumber = Math.max(...csCourses) + 1;
        } else {
          nextCourseNumber = 1;
        }
      }
    } catch (error) {
      console.error('Error generating course code:', error);
      nextCourseNumber = 1;
    }

    const paddedNumber = String(nextCourseNumber).padStart(3, '0');
    return `CS${paddedNumber}`;
  }

  // ========================================
  // POPULATE DROPDOWNS
  // ========================================
  async function populateCourseFacultyDropdown() {
    const select = document.getElementById('courseFaculty');
    if (!select) return;

    select.innerHTML = '<option value="">Select Faculty</option>';

    try {
      const response = await fetch(`${API_BASE_URL}/faculties`);
      if (response.ok) {
        const faculties = await response.json();
        faculties
          .filter((f) => f.isActive)
          .forEach((faculty) => {
            const option = document.createElement('option');
            option.value = faculty.name;
            option.textContent = `${faculty.name} (${faculty.code})`;
            select.appendChild(option);
          });
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  }

  async function populateCourseDepartmentDropdown(facultyName = null) {
    const select = document.getElementById('courseDepartment');
    if (!select) return;

    select.innerHTML = '<option value="">Select Department</option>';

    try {
      const response = await fetch(`${API_BASE_URL}/departments`);
      if (response.ok) {
        const departments = await response.json();

        const filteredDepts = facultyName
          ? departments.filter(d => d.facultyName === facultyName && d.isActive)
          : departments.filter(d => d.isActive);

        filteredDepts.forEach((dept) => {
          const option = document.createElement('option');
          option.value = dept.name;
          option.textContent = `${dept.name} (${dept.code})`;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }

  function setupFacultyDepartmentLink() {
    const facultySelect = document.getElementById('courseFaculty');
    if (facultySelect) {
      facultySelect.addEventListener('change', async function () {
        const selectedFaculty = this.value;
        await populateCourseDepartmentDropdown(selectedFaculty);
      });
    }
  }

  // ========================================
  // LOAD COURSES DATA
  // ========================================
  async function loadCoursesData() {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (response.ok) {
        coursesData = await response.json();
      } else {
        coursesData = [];
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      coursesData = [];
    }

    updateCoursesStats();
    populateFacultyFilter();
    displayCoursesTable(coursesData);
    createCoursesCharts();
  }

  window.loadCoursesData = loadCoursesData;

  // ========================================
  // UPDATE STATS
  // ========================================
  function updateCoursesStats() {
    const totalCourses = coursesData.length;
    const activeCourses = coursesData.filter((c) => c.isActive).length;
    const faculties = [...new Set(coursesData.map((c) => c.faculty))].length;
    const totalCredits = coursesData.reduce((sum, c) => sum + (c.credits || 0), 0);

    animateCounter('totalCourses', totalCourses);
    animateCounter('activeCourses', activeCourses);
    animateCounter('totalFaculties', faculties);
    animateCounter('totalCredits', totalCredits);
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

  // ========================================
  // DISPLAY TABLE
  // ========================================
  function populateFacultyFilter() {
    const select = document.getElementById('facultyFilter');
    if (!select) return;

    const faculties = [...new Set(coursesData.map((c) => c.faculty))].sort();

    select.innerHTML = '<option value="">All Faculties</option>';
    faculties.forEach((faculty) => {
      const option = document.createElement('option');
      option.value = faculty;
      option.textContent = faculty;
      select.appendChild(option);
    });
  }





function filterCourses() {
    const searchTerm = document.getElementById('searchCourse')?.value.toLowerCase() || '';
    const facultyFilter = document.getElementById('facultyFilter')?.value || '';
    const yearFilter = document.getElementById('yearFilter')?.value || '';
    const semesterFilter = document.getElementById('semesterFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    const filtered = coursesData.filter((course) => {
      const matchesSearch =
        !searchTerm ||
        course.courseCode.toLowerCase().includes(searchTerm) ||
        course.courseName.toLowerCase().includes(searchTerm) ||
        course.department.toLowerCase().includes(searchTerm);

      const matchesFaculty = !facultyFilter || course.faculty === facultyFilter;
      const matchesYear = !yearFilter || course.year === yearFilter;  // Comparaison exacte maintenant
      const matchesSemester = !semesterFilter || course.semester.toString() === semesterFilter;
      const matchesStatus = !statusFilter || course.isActive.toString() === statusFilter;

      return matchesSearch && matchesFaculty && matchesYear && matchesSemester && matchesStatus;
    });

    displayCoursesTable(filtered);
}








  function displayCoursesTable(data) {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="11" class="loading">No courses found</td></tr>';
      return;
    }

    const html = data
      .map(
        (course) => `
            <tr>
                <td style="font-weight: 600; font-family: monospace;">${escapeHtml(course.courseCode)}</td>
                <td>${escapeHtml(course.courseName)}</td>
                <td>${escapeHtml(course.faculty)}</td>
                <td>${escapeHtml(course.department)}</td>
                <td>${course.year}</td>
                <td>Semester ${course.semester}</td>
                <td><span style="font-weight: 600;">${course.credits}</span></td>
                <td style="font-weight: 600; color: #10b981;">$${parseFloat(course.price).toFixed(2)}</td>
                <td>${course.maxStudents}</td>
                <td>
                    <span class="status-badge ${course.isActive ? 'status-active' : 'status-inactive'}">
                        ${course.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit" onclick="window.editCourse(${course.id})" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon delete" onclick="window.deleteCourse(${course.id})" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  // ========================================
  // CHARTS
  // ========================================
  function createCoursesCharts() {
    createCoursesFacultyChart();
    createCoursesYearChart();
  }

  function createCoursesFacultyChart() {
    const ctx = document.getElementById('coursesFacultyChart');
    if (!ctx) return;

    if (coursesFacultyChart) coursesFacultyChart.destroy();

    const facultyCounts = {};
    coursesData.forEach((course) => {
      facultyCounts[course.faculty] = (facultyCounts[course.faculty] || 0) + 1;
    });

    const labels = Object.keys(facultyCounts);
    const data = Object.values(facultyCounts);
    const isDark = document.body.classList.contains('dark-mode');

    const colors = ['#1e3a8a', '#3b82f6', '#60a5fa', '#10b981'];

    coursesFacultyChart = new Chart(ctx, {
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
              font: { size: 13, weight: '600' },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            displayColors: true,
          },
        },
      },
    });
  }

  function createCoursesYearChart() {
    const ctx = document.getElementById('coursesYearChart');
    if (!ctx) return;

    if (coursesYearChart) coursesYearChart.destroy();

    const yearCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    coursesData.forEach((course) => {
      if (yearCounts.hasOwnProperty(course.year)) {
        yearCounts[course.year]++;
      }
    });

    const labels = Object.keys(yearCounts).map((y) => `Year ${y}`);
    const data = Object.values(yearCounts);
    const isDark = document.body.classList.contains('dark-mode');

    coursesYearChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Courses',
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
              color: isDark ? '#cbd5e1' : '#64748b',
              stepSize: 1,
              font: { size: 12, weight: '500' },
            },
            grid: {
              color: isDark ? '#334155' : '#e2e8f0',
              drawBorder: false,
            },
            border: { display: false },
          },
          x: {
            ticks: {
              color: isDark ? '#cbd5e1' : '#64748b',
              font: { size: 12, weight: '500' },
            },
            grid: { display: false },
            border: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            displayColors: false,
          },
        },
      },
    });
  }

  // ========================================
  // MODAL HANDLERS
  // ========================================
  async function openAddCourseModal() {
    document.getElementById('courseModalTitle').textContent = 'Add Course';
    document.getElementById('courseForm').reset();
    document.getElementById('courseId').value = '';
    document.getElementById('courseStatus').value = 'true';
    currentCourseId = null;

    const nextCode = await generateNextCourseCode();
    const codeField = document.getElementById('courseCode');
    if (codeField) {
      codeField.value = nextCode;
      codeField.readOnly = true;
      codeField.style.backgroundColor = 'var(--card-bg)';
      codeField.style.fontFamily = 'monospace';
      codeField.style.fontWeight = '600';
    }

    await populateCourseFacultyDropdown();
    await populateCourseDepartmentDropdown();
    populateYearDropdown();

    document.getElementById('courseModal').classList.add('active');
  }

  function closeCourseModal() {
    document.getElementById('courseModal').classList.remove('active');
    document.getElementById('courseForm').reset();

    const codeField = document.getElementById('courseCode');
    if (codeField) {
      codeField.readOnly = false;
      codeField.style.backgroundColor = '';
    }

    const allFields = document.querySelectorAll('.form-input');
    allFields.forEach(field => clearFieldError(field));

    currentCourseId = null;
  }

  window.editCourse = async function (id) {
    const course = coursesData.find((c) => c.id === id);
    if (!course) return;

    document.getElementById('courseModalTitle').textContent = 'Edit Course';
    document.getElementById('courseId').value = course.id;

    const codeField = document.getElementById('courseCode');
    if (codeField) {
      codeField.value = course.courseCode;
      codeField.readOnly = true;
      codeField.style.backgroundColor = 'var(--card-bg)';
      codeField.style.fontFamily = 'monospace';
      codeField.style.fontWeight = '600';
    }

    document.getElementById('courseName').value = course.courseName;
    document.getElementById('courseDescription').value = course.description || '';

    await populateCourseFacultyDropdown();
    await populateCourseDepartmentDropdown(course.faculty);

    document.getElementById('courseFaculty').value = course.faculty;
    document.getElementById('courseDepartment').value = course.department;
    document.getElementById('courseYear').value = course.year;
    document.getElementById('courseSemester').value = course.semester;
    document.getElementById('courseCredits').value = course.credits;
    document.getElementById('coursePrice').value = course.price;
    document.getElementById('courseMaxStudents').value = course.maxStudents;
    document.getElementById('courseStatus').value = course.isActive ? 'true' : 'false';

    currentCourseId = id;
    document.getElementById('courseModal').classList.add('active');
  };

  window.deleteCourse = async function (id) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification('Course deleted successfully', 'success');
        await loadCoursesData();
      } else {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      showNotification(error.message, 'error');
    }
  };




function validateForm() {
    const errors = [];

    const courseName = document.getElementById('courseName').value.trim();
    if (!courseName || courseName.length < 3) {
      errors.push('Course name must be at least 3 characters');
    } else if (courseName.length > 200) {
      errors.push('Course name must be less than 200 characters');
    }

    const faculty = document.getElementById('courseFaculty').value;
    if (!faculty) {
      errors.push('Please select a faculty');
    }

    const department = document.getElementById('courseDepartment').value;
    if (!department) {
      errors.push('Please select a department');
    }

    const year = document.getElementById('courseYear').value;
    if (!year) {
      errors.push('Please select an academic year');
    } else if (!/^\d{4}-\d{4}$/.test(year)) {
      errors.push('Year must be in format YYYY-YYYY (e.g., 2024-2025)');
    }

    const semester = document.getElementById('courseSemester').value;
    if (!semester) {
      errors.push('Please select a semester');
    }

    const credits = parseInt(document.getElementById('courseCredits').value);
    if (!credits || credits < 1 || credits > 10) {
      errors.push('Credits must be between 1 and 10');
    }

    const price = parseFloat(document.getElementById('coursePrice').value);
    if (isNaN(price) || price < 0) {
      errors.push('Price must be a positive number');
    } else if (price > 10000) {
      errors.push('Price seems unusually high. Please verify.');
    }

    const maxStudents = parseInt(document.getElementById('courseMaxStudents').value);
    if (!maxStudents || maxStudents < 1) {
      errors.push('Max students must be at least 1');
    } else if (maxStudents > 500) {
      errors.push('Max students cannot exceed 500');
    }

    return errors;
}



async function handleCourseFormSubmit(e) {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showNotification(validationErrors.join('\n'), 'error');
      return;
    }

    const formData = {
      courseCode: document.getElementById('courseCode').value.trim(),
      courseName: document.getElementById('courseName').value.trim(),
      description: document.getElementById('courseDescription').value.trim(),
      faculty: document.getElementById('courseFaculty').value.trim(),
      department: document.getElementById('courseDepartment').value.trim(),
      year: document.getElementById('courseYear').value,  // Enverra "2024-2025"
      semester: parseInt(document.getElementById('courseSemester').value),
      credits: parseInt(document.getElementById('courseCredits').value),
      price: parseFloat(document.getElementById('coursePrice').value),
      maxStudents: parseInt(document.getElementById('courseMaxStudents').value),
      isActive: document.getElementById('courseStatus').value === 'true',
    };

    const courseId = document.getElementById('courseId').value;

    try {
      let response;
      if (courseId) {
        formData.id = parseInt(courseId);
        response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save course');
      }

      showNotification(
        `Course ${courseId ? 'updated' : 'created'} successfully`,
        'success'
      );
      closeCourseModal();
      await loadCoursesData();
    } catch (error) {
      console.error('Error saving course:', error);
      showNotification(error.message, 'error');
    }
}





  // ========================================
  // EXPORT FUNCTIONS
  // ========================================
  function exportCoursesPDF() {
    if (typeof jsPDF === 'undefined') {
      showNotification('PDF library not loaded', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.text('UNT Academic System - Courses Report', 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Courses: ${coursesData.length}`, 14, 35);
    doc.text(`Active Courses: ${coursesData.filter(c => c.isActive).length}`, 14, 40);

    const tableData = coursesData.map((course) => [
      course.courseCode,
      course.courseName,
      course.faculty,
      course.department,
      course.year,
      `Sem ${course.semester}`,
      course.credits,
      `${parseFloat(course.price).toFixed(2)}`,
      course.maxStudents,
      course.isActive ? 'Active' : 'Inactive',
    ]);

    doc.autoTable({
      startY: 48,
      head: [
        [
          'Code',
          'Name',
          'Faculty',
          'Department',
          'Year',
          'Semester',
          'Credits',
          'Price',
          'Max Students',
          'Status',
        ],
      ],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save(`courses_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('PDF exported successfully', 'success');
  }

  function exportCoursesExcel() {
    if (typeof XLSX === 'undefined') {
      showNotification('Excel library not loaded', 'error');
      return;
    }

    const ws_data = [
      [
        'Course Code',
        'Course Name',
        'Faculty',
        'Department',
        'Year',
        'Semester',
        'Credits',
        'Price',
        'Max Students',
        'Status',
        'Description',
      ],
    ];

    coursesData.forEach((course) => {
      ws_data.push([
        course.courseCode,
        course.courseName,
        course.faculty,
        course.department,
        course.year,
        course.semester,
        course.credits,
        parseFloat(course.price).toFixed(2),
        course.maxStudents,
        course.isActive ? 'Active' : 'Inactive',
        course.description || '',
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    ws['!cols'] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 8 },
      { wch: 10 },
      { wch: 8 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 40 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(
      wb,
      `courses_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    showNotification('Excel exported successfully', 'success');
  }

  // ========================================
  // UTILITIES
  // ========================================
  function showNotification(message, type = 'info') {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
      white-space: pre-line;
      font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

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

    .field-error {
      animation: shake 0.3s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
})();