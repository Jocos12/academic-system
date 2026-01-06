// ========================================
// STUDENTS MANAGEMENT - COMPLETE IMPLEMENTATION
// ========================================

let studentsData = [];
let currentEditStudentId = null;
let studentsFacultyChart = null;
let studentsYearChart = null;

let departmentsData = [];
let academicYearsData = [];
let parentsData = [];

// ========================================
// LOAD STUDENTS DATA
// ========================================



async function loadStudentsData() {
  try {
    await Promise.all([
      loadAllStudents(),
      loadFacultiesForDropdown(),
      loadDepartmentsForDropdown(),
      loadAcademicYearsForDropdown(),
      loadParentsForDropdown()
    ]);

    updateStudentsStats();
    populateFacultyFilter();
    populateStudentAcademicYearDropdown(); // ✅ AJOUTEZ CETTE LIGNE
    displayStudentsTable(studentsData);
    createStudentsCharts();
  } catch (error) {
    console.error('Error loading students data:', error);
    showNotification('Error loading students data', 'error');
  }
}

// ========================================
// LOAD ALL STUDENTS
// ========================================
async function loadAllStudents() {
  try {
    const response = await fetch(`${API_BASE_URL}/students`);
    if (response.ok) {
      studentsData = await response.json();
    } else {
      studentsData = [];
      console.error('Failed to fetch students');
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    studentsData = [];
  }
}

// ========================================
// LOAD FACULTIES FOR DROPDOWN
// ========================================
async function loadFacultiesForDropdown() {
  try {
    const response = await fetch(`${API_BASE_URL}/faculties`);
    if (response.ok) {
      facultiesData = await response.json();
      populateFacultyDropdown();
    } else {
      facultiesData = [];
    }
  } catch (error) {
    console.error('Error fetching faculties:', error);
    facultiesData = [];
  }
}



// ✅ CETTE FONCTION EXISTE DÉJÀ - PAS DE MODIFICATION NÉCESSAIRE
function populateFacultyDropdown() {
  const select = document.getElementById('studentFaculty');
  if (!select) return;

  select.innerHTML = '<option value="">Select Faculty</option>';

  facultiesData
    .filter(f => f.isActive)
    .forEach((faculty) => {
      const option = document.createElement('option');
      option.value = faculty.name;
      option.textContent = `${faculty.name} (${faculty.code})`;
      select.appendChild(option);
    });
}

// ✅ CETTE FONCTION EXISTE DÉJÀ - PAS DE MODIFICATION NÉCESSAIRE
function populateProgramDropdown() {
  const select = document.getElementById('studentProgram');
  if (!select) return;

  select.innerHTML = '<option value="">Select Program</option>';

  departmentsData
    .filter(d => d.isActive)
    .forEach((department) => {
      const option = document.createElement('option');
      option.value = department.name;
      option.textContent = `${department.name} (${department.code})`;
      option.dataset.facultyName = department.facultyName || '';
      select.appendChild(option);
    });
}

// ✅ CETTE FONCTION EXISTE AUSSI - MAIS VÉRIFIEZ QU'ELLE EST BIEN APPELÉE
function setupFacultyProgramFilter() {
  const facultySelect = document.getElementById('studentFaculty');
  const programSelect = document.getElementById('studentProgram');

  if (!facultySelect || !programSelect) return;

  // ✅ SUPPRIMEZ LES ANCIENS EVENT LISTENERS POUR ÉVITER LES DOUBLONS
  facultySelect.removeEventListener('change', handleFacultyChange);
  facultySelect.addEventListener('change', handleFacultyChange);
}

// ✅ AJOUTEZ CETTE FONCTION HELPER
function handleFacultyChange() {
  const facultySelect = document.getElementById('studentFaculty');
  const programSelect = document.getElementById('studentProgram');
  const selectedFaculty = facultySelect.value;

  // Reset program selection
  programSelect.innerHTML = '<option value="">Select Program</option>';

  if (!selectedFaculty) {
    // Show all programs if no faculty selected
    populateProgramDropdown();
    return;
  }

  // Filter programs by faculty
  departmentsData
    .filter(d => d.isActive && d.facultyName === selectedFaculty)
    .forEach((department) => {
      const option = document.createElement('option');
      option.value = department.name;
      option.textContent = `${department.name} (${department.code})`;
      programSelect.appendChild(option);
    });
}
// ========================================
// LOAD DEPARTMENTS FOR DROPDOWN
// ========================================
async function loadDepartmentsForDropdown() {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`);
    if (response.ok) {
      departmentsData = await response.json();
      populateProgramDropdown();
    } else {
      departmentsData = [];
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    departmentsData = [];
  }
}



// ========================================
// LOAD ACADEMIC YEARS FOR DROPDOWN
// ========================================
async function loadAcademicYearsForDropdown() {
  try {
    const response = await fetch(`${API_BASE_URL}/academic-years`);
    if (response.ok) {
      academicYearsData = await response.json();
      populateCurrentYearDropdown();
    } else {
      academicYearsData = [];
    }
  } catch (error) {
    console.error('Error fetching academic years:', error);
    academicYearsData = [];
  }
}






// Add this function after populateCurrentYearDropdown()
function populateStudentAcademicYearDropdown() {
  const select = document.getElementById('studentAcademicYear');
  if (!select) return;

  select.innerHTML = '<option value="">Select Academic Year</option>';

  // Get unique year codes from academic years data
  const uniqueYearCodes = [...new Set(academicYearsData.map(ay => ay.yearCode))];

  uniqueYearCodes.sort().forEach((yearCode) => {
    const option = document.createElement('option');
    option.value = yearCode;
    option.textContent = yearCode;
    select.appendChild(option);
  });
}

// Replace the populateCurrentYearDropdown function with this:
function populateCurrentYearDropdown() {
  const select = document.getElementById('studentCurrentYear');
  if (!select) return;

  select.innerHTML = '<option value="">Select Year</option>';

  // Define year levels instead of using academic year codes
  const yearLevels = [
    { value: 1, label: 'Year 1' },
    { value: 2, label: 'Year 2' },
    { value: 3, label: 'Year 3' },
    { value: 4, label: 'Year 4' }
  ];

  yearLevels.forEach((year) => {
    const option = document.createElement('option');
    option.value = year.value;
    option.textContent = year.label;
    select.appendChild(option);
  });
}





// ========================================
// LOAD PARENTS FOR DROPDOWN
// ========================================
async function loadParentsForDropdown() {
  try {
    const response = await fetch(`${API_BASE_URL}/parents`);
    if (response.ok) {
      parentsData = await response.json();
      populateParentDropdown();
    } else {
      parentsData = [];
    }
  } catch (error) {
    console.error('Error loading parents:', error);
    parentsData = [];
  }
}

function populateParentDropdown() {
  const select = document.getElementById('studentParent');
  if (!select) return;

  select.innerHTML = '<option value="">No Parent Assigned</option>';

  parentsData.forEach((parent) => {
    const option = document.createElement('option');
    option.value = parent.id;
    option.textContent = `${parent.firstName} ${parent.lastName} (${parent.relationship})`;
    select.appendChild(option);
  });
}


// ========================================
// GENERATE AUTO-INCREMENT STUDENT ID
// ========================================
async function generateStudentId() {
  try {
    // Get all existing student IDs
    const allStudents = await fetch(`${API_BASE_URL}/students`).then(r => r.json());

    // Extract numbers from student IDs (STU001, STU002, etc.)
    const numbers = allStudents
      .map(s => {
        const match = s.studentId.match(/STU(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    // Find the highest number
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

    // Generate next ID
    const nextNumber = maxNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');

    return `STU${paddedNumber}`;
  } catch (error) {
    console.error('Error generating student ID:', error);
    // Fallback to timestamp-based ID
    return `STU${Date.now().toString().slice(-6)}`;
  }
}

// ========================================
// UPDATE STATISTICS
// ========================================
function updateStudentsStats() {
  const totalStudents = studentsData.length;
  const faculties = [...new Set(studentsData.map((s) => s.faculty))].length;
  const studentsWithParent = studentsData.filter((s) => s.parent).length;

  const totalGPA = studentsData.reduce(
    (sum, s) => sum + (s.cumulativeGPA || 0),
    0
  );
  const averageGPA =
    totalStudents > 0 ? (totalGPA / totalStudents).toFixed(2) : '0.00';

  animateCounter('totalStudents', totalStudents);
  animateCounter('totalFacultiesStudents', faculties);
  animateCounter('studentsWithParent', studentsWithParent);

  const gpaElement = document.getElementById('averageGPA');
  if (gpaElement) {
    gpaElement.textContent = averageGPA;
  }

  // Update high GPA count
  const highGPACount = studentsData.filter(s => s.cumulativeGPA > 3.5).length;
  const highGPAElement = document.getElementById('highGPAStudents');
  if (highGPAElement) {
    highGPAElement.textContent = highGPACount;
  }
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
// POPULATE FILTERS
// ========================================
function populateFacultyFilter() {
  const select = document.getElementById('studentFacultyFilter');
  if (!select) return;

  const faculties = [...new Set(studentsData.map((s) => s.faculty))];

  select.innerHTML = '<option value="">All Faculties</option>';
  faculties.forEach((faculty) => {
    const option = document.createElement('option');
    option.value = faculty;
    option.textContent = faculty;
    select.appendChild(option);
  });
}






// ========================================
// ENHANCED DISPLAY TABLE WITH PARENT DEBUG
// ========================================

function displayStudentsTable(students) {
  const tbody = document.getElementById('studentsTableBody');

  if (students.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="11" class="loading">No students found</td></tr>';
    return;
  }

  const html = students
    .map(
      (student) => {
        // ✅ Debug parent assignment in table
        const hasParent = student.parent && student.parent.id;
        console.log(`Student ${student.studentId}:`, {
          hasParent,
          parentData: student.parent
        });

        return `
        <tr>
            <td style="font-family: 'Courier New', monospace; font-weight: 600; color: var(--primary-color);">${student.studentId}</td>
            <td style="font-weight: 600;">${student.firstName} ${student.lastName}</td>
            <td style="color: var(--text-secondary); font-size: 0.8125rem;">${student.email}</td>
            <td>${student.faculty}</td>
            <td>${student.program}</td>
            <td>
                <span class="credits-badge" style="display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 5px; font-size: 0.6875rem; font-weight: 600; background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2);">
                    ${student.currentYear || 'N/A'}
                </span>
            </td>
            <td>Semester ${student.currentSemester || 'N/A'}</td>
            <td style="font-weight: 600; color: var(--success-color);">${(student.cumulativeGPA || 0).toFixed(2)}</td>
            <td>${student.totalCreditsEarned || 0}</td>
            <td>
                ${
                  hasParent
                    ? `
                    <span class="status-badge status-completed" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2);">
                        ${student.parent.firstName} ${student.parent.lastName}
                    </span>
                `
                    : `
                    <span class="status-badge status-pending" style="background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2);">
                        No Parent
                    </span>
                `
                }
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editStudent(${student.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteStudent(${student.id})" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `;
      }
    )
    .join('');

  tbody.innerHTML = html;
}


// ========================================
// EXPOSE FUNCTIONS
// ========================================
window.handleStudentFormSubmit = handleStudentFormSubmit;
window.editStudent = editStudent;
window.displayStudentsTable = displayStudentsTable;
// ========================================
// CREATE CHARTS
// ========================================
function createStudentsCharts() {
  createFacultyChart();
  createYearChart();
}

function createFacultyChart() {
  const ctx = document.getElementById('studentsFacultyChart');
  if (!ctx) return;

  if (studentsFacultyChart) {
    studentsFacultyChart.destroy();
  }

  const facultyCounts = {};
  studentsData.forEach((student) => {
    facultyCounts[student.faculty] = (facultyCounts[student.faculty] || 0) + 1;
  });

  const labels = Object.keys(facultyCounts);
  const data = Object.values(facultyCounts);
  const isDark = document.body.classList.contains('dark-mode');

  const backgroundColors = [
    'rgba(30, 58, 138, 0.85)',
    'rgba(59, 130, 246, 0.85)',
    'rgba(96, 165, 250, 0.85)',
    'rgba(16, 185, 129, 0.85)',
    'rgba(245, 158, 11, 0.85)',
    'rgba(239, 68, 68, 0.85)',
    'rgba(139, 92, 246, 0.85)',
  ];

  studentsFacultyChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderWidth: 0,
          borderRadius: 6,
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
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
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

function createYearChart() {
  const ctx = document.getElementById('studentsYearChart');
  if (!ctx) return;

  if (studentsYearChart) {
    studentsYearChart.destroy();
  }

  // Get unique year codes from students
  const yearCounts = {};
  studentsData.forEach((student) => {
    const year = student.currentYear || 'Unknown';
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  const labels = Object.keys(yearCounts).sort();
  const data = labels.map(label => yearCounts[label]);
  const isDark = document.body.classList.contains('dark-mode');

  studentsYearChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Students per Year',
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
          backgroundColor: isDark
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
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
              return `${context.parsed.y} Student${context.parsed.y !== 1 ? 's' : ''}`;
            },
          },
        },
      },
    },
  });
}

// ========================================
// FILTER STUDENTS
// ========================================
function filterStudents() {
  const searchTerm = document
    .getElementById('searchStudent')
    .value.toLowerCase();
  const facultyFilter = document.getElementById('studentFacultyFilter').value;
  const yearFilter = document.getElementById('studentYearFilter').value;

  const filtered = studentsData.filter((student) => {
    const matchesSearch =
      !searchTerm ||
      student.firstName.toLowerCase().includes(searchTerm) ||
      student.lastName.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm);

    const matchesFaculty = !facultyFilter || student.faculty === facultyFilter;
    const matchesYear =
      !yearFilter || student.currentYear === yearFilter;

    return matchesSearch && matchesFaculty && matchesYear;
  });

  displayStudentsTable(filtered);
}

// ========================================
// FORM VALIDATION
// ========================================
function validateStudentForm(formData) {
  const errors = [];

  // Validate required fields
  if (!formData.firstName || formData.firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters');
  }

  if (!formData.lastName || formData.lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters');
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    errors.push('Please enter a valid email address');
  }

  // Validate phone
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  if (!phoneRegex.test(formData.phoneNumber) || formData.phoneNumber.length < 10) {
    errors.push('Please enter a valid phone number (at least 10 digits)');
  }

  // Validate date of birth
  const dob = new Date(formData.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  if (age < 16 || age > 100) {
    errors.push('Student must be between 16 and 100 years old');
  }

  // Validate enrollment date
  const enrollmentDate = new Date(formData.enrollmentDate);
  if (enrollmentDate > today) {
    errors.push('Enrollment date cannot be in the future');
  }

  // Validate password (only for new students)
  if (!currentEditStudentId && (!formData.password || formData.password.length < 6)) {
    errors.push('Password must be at least 6 characters');
  }

  // Validate semester
  if (formData.currentSemester < 1 || formData.currentSemester > 2) {
    errors.push('Semester must be 1 or 2');
  }

  return errors;
}

// ========================================
// MODAL FUNCTIONS
// ========================================
async function openAddStudentModal() {
  document.getElementById('studentModalTitle').textContent = 'Add Student';
  document.getElementById('studentForm').reset();
  document.getElementById('studentId').value = '';
  document.getElementById('studentPasswordGroup').style.display = 'block';
  document.getElementById('studentPassword').required = true;
  currentEditStudentId = null;

  // Generate auto-increment student ID
  const newStudentId = await generateStudentId();
  document.getElementById('studentStudentId').value = newStudentId;
  document.getElementById('studentStudentId').readOnly = true;
  document.getElementById('studentStudentId').style.backgroundColor = 'var(--card-bg)';
  document.getElementById('studentStudentId').style.opacity = '0.7';

  // Setup faculty-program filter
  setupFacultyProgramFilter();

  document.getElementById('studentModal').classList.add('active');
}

function closeStudentModal() {
  document.getElementById('studentModal').classList.remove('active');
  document.getElementById('studentForm').reset();
  currentEditStudentId = null;

  // Reset student ID field
  document.getElementById('studentStudentId').readOnly = false;
  document.getElementById('studentStudentId').style.backgroundColor = '';
  document.getElementById('studentStudentId').style.opacity = '';
}



// ========================================
// ENHANCED EDIT STUDENT WITH DEBUG
// ========================================

async function editStudent(id) {
  try {
    console.log(`📝 Editing student ID: ${id}`);
    const response = await fetch(`${API_BASE_URL}/students/${id}`);

    if (!response.ok) {
      showNotification('Failed to fetch student details', 'error');
      return;
    }

    const student = await response.json();
    console.log('📄 Student data loaded:', student);
    console.log('👨‍👩‍👧 Current parent:', student.parent);

    document.getElementById('studentModalTitle').textContent = 'Edit Student';
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentFirstName').value = student.firstName;
    document.getElementById('studentLastName').value = student.lastName;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentPhone').value = student.phoneNumber;
    document.getElementById('studentStudentId').value = student.studentId;
    document.getElementById('studentStudentId').readOnly = true;
    document.getElementById('studentDateOfBirth').value = student.dateOfBirth;
    document.getElementById('studentFaculty').value = student.faculty;
    document.getElementById('studentProgram').value = student.program;
    document.getElementById('studentAcademicYear').value = student.academicYear;
    document.getElementById('studentCurrentYear').value = student.currentYear;
    document.getElementById('studentCurrentSemester').value = student.currentSemester;
    document.getElementById('studentEnrollmentDate').value = student.enrollmentDate;

    // ✅ FIX 4: Properly set parent dropdown value
    const parentSelect = document.getElementById('studentParent');
    if (student.parent && student.parent.id) {
      parentSelect.value = student.parent.id;
      console.log('✅ Parent dropdown set to:', student.parent.id);
    } else {
      parentSelect.value = '';
      console.log('⚠️ No parent assigned');
    }

    document.getElementById('studentAddress').value = student.address || '';

    document.getElementById('studentPasswordGroup').style.display = 'none';
    document.getElementById('studentPassword').required = false;

    setupFacultyProgramFilter();

    currentEditStudentId = id;
    document.getElementById('studentModal').classList.add('active');
  } catch (error) {
    console.error('❌ Error fetching student:', error);
    showNotification('Error loading student details', 'error');
  }
}






async function deleteStudent(id) {
  if (
    !confirm(
      'Are you sure you want to delete this student? This will also delete all related enrollments and payments.'
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showNotification('Student deleted successfully', 'success');
      await loadStudentsData();
    } else {
      showNotification('Failed to delete student', 'error');
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    showNotification('Error deleting student', 'error');
  }
}


// ========================================
// HANDLE STUDENT FORM SUBMIT - FIXED VERSION
// ========================================

async function handleStudentFormSubmit(e) {
  e.preventDefault();

  // ✅ FIX 1: Get parent ID and convert to INTEGER
  const parentIdValue = document.getElementById('studentParent').value;
  const parentId = parentIdValue ? parseInt(parentIdValue) : null;

  console.log('🔍 Parent ID Debug:', {
    raw: parentIdValue,
    parsed: parentId,
    type: typeof parentId
  });

  // ✅ FIX 2: Get current year as INTEGER
  const currentYearSelect = document.getElementById('studentCurrentYear');
  const currentYearValue = currentYearSelect.value;

  let currentYear;
  if (currentYearValue === "1" || currentYearValue === "2" ||
      currentYearValue === "3" || currentYearValue === "4") {
    currentYear = parseInt(currentYearValue);
  } else {
    currentYear = 1;
  }

  const formData = {
    firstName: document.getElementById('studentFirstName').value.trim(),
    lastName: document.getElementById('studentLastName').value.trim(),
    email: document.getElementById('studentEmail').value.trim(),
    phoneNumber: document.getElementById('studentPhone').value.trim(),
    role: 'STUDENT',
    isActive: true,
    studentId: document.getElementById('studentStudentId').value.trim(),
    dateOfBirth: document.getElementById('studentDateOfBirth').value,
    faculty: document.getElementById('studentFaculty').value,
    program: document.getElementById('studentProgram').value,
    currentYear: currentYear,
    currentSemester: parseInt(document.getElementById('studentCurrentSemester').value),
    academicYear: document.getElementById('studentAcademicYear').value || '2024-2025',
    enrollmentDate: document.getElementById('studentEnrollmentDate').value,
    cumulativeGPA: 0.0,
    totalCreditsEarned: 0,
    address: document.getElementById('studentAddress').value.trim(),
    // ✅ FIX 3: Send parent as object with INTEGER id, or null if no parent
    parent: parentId ? { id: parentId } : null
  };

  // Add password for new students
  if (!currentEditStudentId) {
    formData.password = document.getElementById('studentPassword').value;
  }

  // Validate form
  const validationErrors = validateStudentForm(formData);
  if (validationErrors.length > 0) {
    showNotification(validationErrors.join('\n'), 'error');
    return;
  }

  console.log('📤 Sending student data:', JSON.stringify(formData, null, 2));

  try {
    let response;
    if (currentEditStudentId) {
      console.log(`🔄 Updating student ID: ${currentEditStudentId}`);
      response = await fetch(
        `${API_BASE_URL}/students/${currentEditStudentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
    } else {
      console.log('➕ Creating new student');
      response = await fetch(`${API_BASE_URL}/students/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    console.log('📥 Response status:', response.status);

    if (response.ok) {
      const savedStudent = await response.json();
      console.log('✅ Student saved successfully:', savedStudent);
      console.log('👨‍👩‍👧 Parent assignment:', {
        parentId: parentId,
        studentParent: savedStudent.parent,
        isAssigned: !!savedStudent.parent
      });

      showNotification(
        currentEditStudentId
          ? 'Student updated successfully'
          : 'Student added successfully',
        'success'
      );
      closeStudentModal();
      await loadStudentsData();
    } else {
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      showNotification(errorText || 'Failed to save student', 'error');
    }
  } catch (error) {
    console.error('❌ Error saving student:', error);
    showNotification('Error saving student: ' + error.message, 'error');
  }
}








// ========================================
// EXPORT FUNCTIONS
// ========================================
function exportStudentsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Students Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Overview', 14, 40);

  doc.setFontSize(10);
  const stats = [
    `Total Students: ${studentsData.length}`,
    `Faculties: ${[...new Set(studentsData.map((s) => s.faculty))].length}`,
    `Average GPA: ${(studentsData.reduce((sum, s) => sum + (s.cumulativeGPA || 0), 0) / studentsData.length).toFixed(2)}`,
    `With Parent: ${studentsData.filter((s) => s.parent).length}`,
  ];

  stats.forEach((stat, index) => {
    doc.text(stat, 14, 50 + index * 8);
  });

  const tableData = studentsData.map((student) => [
    student.studentId,
    `${student.firstName} ${student.lastName}`,
    student.faculty,
    student.program,
    student.currentYear,
    (student.cumulativeGPA || 0).toFixed(2),
    student.totalCreditsEarned || 0,
  ]);

  doc.autoTable({
    startY: 85,
    head: [
      ['Student ID', 'Name', 'Faculty', 'Program', 'Year', 'GPA', 'Credits'],
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
    margin: { top: 10 },
  });

  doc.save('students-report.pdf');
  showNotification('PDF report generated successfully', 'success');
}

function exportStudentsExcel() {
  const ws_data = [
    [
      'Student ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Faculty',
      'Program',
      'Year',
      'Semester',
      'GPA',
      'Credits',
      'Parent',
      'Enrollment Date',
      'Address',
    ],
  ];

  studentsData.forEach((student) => {
    ws_data.push([
      student.studentId,
      student.firstName,
      student.lastName,
      student.email,
      student.phoneNumber,
      student.faculty,
      student.program,
      student.currentYear,
      student.currentSemester,
      (student.cumulativeGPA || 0).toFixed(2),
      student.totalCreditsEarned || 0,
      student.parent
        ? `${student.parent.firstName} ${student.parent.lastName}`
        : 'No Parent',
      student.enrollmentDate,
      student.address || '',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 12 },
    { wch: 10 },
    { wch: 8 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students');

  XLSX.writeFile(wb, 'students-report.xlsx');
  showNotification('Excel report generated successfully', 'success');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
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
    max-width: 400px;
    white-space: pre-line;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ========================================
// EVENT LISTENERS
// ========================================
document.addEventListener('DOMContentLoaded', function () {
  const addStudentBtn = document.getElementById('addStudentBtn');
  if (addStudentBtn) {
    addStudentBtn.addEventListener('click', openAddStudentModal);
  }

  const closeStudentModalBtn = document.getElementById('closeStudentModal');
  if (closeStudentModalBtn) {
    closeStudentModalBtn.addEventListener('click', closeStudentModal);
  }

  const studentCancelBtn = document.getElementById('studentCancelBtn');
  if (studentCancelBtn) {
    studentCancelBtn.addEventListener('click', closeStudentModal);
  }

  const studentForm = document.getElementById('studentForm');
  if (studentForm) {
    studentForm.addEventListener('submit', handleStudentFormSubmit);
  }

  const searchStudent = document.getElementById('searchStudent');
  if (searchStudent) {
    searchStudent.addEventListener('input', filterStudents);
  }

  const studentFacultyFilter = document.getElementById('studentFacultyFilter');
  if (studentFacultyFilter) {
    studentFacultyFilter.addEventListener('change', filterStudents);
  }

  const studentYearFilter = document.getElementById('studentYearFilter');
  if (studentYearFilter) {
    studentYearFilter.addEventListener('change', filterStudents);
  }

  const studentSemesterFilter = document.getElementById('studentSemesterFilter');
  if (studentSemesterFilter) {
    studentSemesterFilter.addEventListener('change', filterStudents);
  }

  const exportStudentsPdfBtn = document.getElementById('exportStudentsPdfBtn');
  if (exportStudentsPdfBtn) {
    exportStudentsPdfBtn.addEventListener('click', exportStudentsPDF);
  }

  const exportStudentsExcelBtn = document.getElementById('exportStudentsExcelBtn');
  if (exportStudentsExcelBtn) {
    exportStudentsExcelBtn.addEventListener('click', exportStudentsExcel);
  }

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('studentModal');
    if (e.target === modal) {
      closeStudentModal();
    }
  });
});

// ========================================
// GLOBAL EXPOSURE
// ========================================
window.loadStudentsData = loadStudentsData;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.openAddStudentModal = openAddStudentModal;