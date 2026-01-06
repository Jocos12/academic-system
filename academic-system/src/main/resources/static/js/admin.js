window.API_BASE_URL = 'http://localhost:8080/api';

let adminsData = [];
let currentEditId = null;
let currentUser = null;
let adminPieChart = null;
let departmentBarChart = null;
let accessLevelChart = null;
let activityLineChart = null;
let departmentComparisonChart = null;
let currentLanguage = 'en';

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  if (typeof adminPieChart !== 'undefined' && adminPieChart)
    updateChartColors(adminPieChart, isDark);
  if (typeof departmentBarChart !== 'undefined' && departmentBarChart)
    updateChartColors(departmentBarChart, isDark);
  if (typeof accessLevelChart !== 'undefined' && accessLevelChart)
    updateChartColors(accessLevelChart, isDark);
  if (typeof activityLineChart !== 'undefined' && activityLineChart)
    updateChartColors(activityLineChart, isDark);
  if (
    typeof departmentComparisonChart !== 'undefined' &&
    departmentComparisonChart
  )
    updateChartColors(departmentComparisonChart, isDark);
}

function updateAllCharts() {
  const isDark = document.body.classList.contains('dark-mode');
  if (typeof adminPieChart !== 'undefined' && adminPieChart)
    updateChartColors(adminPieChart, isDark);
  if (typeof departmentBarChart !== 'undefined' && departmentBarChart)
    updateChartColors(departmentBarChart, isDark);
  if (typeof accessLevelChart !== 'undefined' && accessLevelChart)
    updateChartColors(accessLevelChart, isDark);
  if (typeof activityLineChart !== 'undefined' && activityLineChart)
    updateChartColors(activityLineChart, isDark);
  if (
    typeof departmentComparisonChart !== 'undefined' &&
    departmentComparisonChart
  )
    updateChartColors(departmentComparisonChart, isDark);
}

function updateChartColors(chart, isDark) {
  if (chart.options.plugins && chart.options.plugins.legend) {
    chart.options.plugins.legend.labels.color = isDark ? '#f1f5f9' : '#1e293b';
  }
  if (chart.options.scales) {
    Object.keys(chart.options.scales).forEach((scaleKey) => {
      const scale = chart.options.scales[scaleKey];
      if (scale.ticks) {
        scale.ticks.color = isDark ? '#cbd5e1' : '#64748b';
      }
      if (scale.grid) {
        scale.grid.color = isDark ? '#334155' : '#e2e8f0';
      }
      if (scale.pointLabels) {
        scale.pointLabels.color = isDark ? '#f1f5f9' : '#1e293b';
      }
    });
  }
  chart.update();
}

document.addEventListener('DOMContentLoaded', function () {
  initializeApp();
  loadCurrentAdminProfile();

  // Image preview functionality
  const fileInput = document.getElementById('profilePictureFile');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
          showNotification('File size must be less than 5MB', 'error');
          fileInput.value = '';
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          showNotification('Only image files are allowed', 'error');
          fileInput.value = '';
          return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(event) {
          const previewDiv = document.getElementById('imagePreview');
          const previewImg = document.getElementById('previewImg');
          if (previewImg && previewDiv) {
            previewImg.src = event.target.result;
            previewDiv.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Add Admin Button
  const addAdminBtn = document.getElementById('addAdminBtn');
  if (addAdminBtn) {
    addAdminBtn.addEventListener('click', openAddModal);
  }
});





async function loadCurrentAdminProfile() {
    try {
        // ✅ GET USER FROM SESSION STORAGE FIRST
        const sessionHandler = UserSessionHandler.getInstance();
        const currentUser = sessionHandler.getCurrentUser();

        if (!currentUser || !currentUser.userId) {
            console.warn('⚠️ No logged-in user found in session');
            // Try fallback to localStorage
            const userId = localStorage.getItem('unt_userId');
            if (!userId) {
                console.warn('⚠️ No user ID found, redirecting to login');
                window.location.href = '/login.html';
                return;
            }
        }

        const userId = currentUser.userId || currentUser.id;
        console.log('📋 Loading profile for user ID:', userId);

        const response = await fetch(`${API_BASE_URL}/admins/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch current admin profile');
        }

        const admin = await response.json();
        console.log('✅ Admin profile loaded:', admin);

        // ✅ UPDATE SIDEBAR PROFILE NAME
        const profileName = document.getElementById('adminName');
        if (profileName) {
            profileName.textContent = `${admin.firstName} ${admin.lastName}`;
        }

        // ✅ UPDATE SIDEBAR PROFILE EMAIL
        const profileEmail = document.getElementById('adminEmail');
        if (profileEmail) {
            profileEmail.textContent = admin.email;
        }

        // ✅ UPDATE SIDEBAR PROFILE AVATAR
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
            if (admin.profilePicture) {
                // Check if it's a full URL or base64
                if (admin.profilePicture.startsWith('http')) {
                    profileAvatar.src = admin.profilePicture;
                } else if (admin.profilePicture.startsWith('data:image')) {
                    profileAvatar.src = admin.profilePicture;
                } else if (admin.profilePicture.startsWith('/uploads')) {
                    profileAvatar.src = `http://localhost:8080${admin.profilePicture}`;
                } else {
                    // Assume it's base64 without prefix
                    profileAvatar.src = `data:image/jpeg;base64,${admin.profilePicture}`;
                }

                // ✅ ERROR HANDLING FOR IMAGE LOAD
                profileAvatar.onerror = () => {
                    console.warn('⚠️ Failed to load profile picture, using default avatar');
                    profileAvatar.src = generateAvatarUrl(admin.firstName, admin.lastName);
                };
            } else {
                // ✅ USE DEFAULT AVATAR IF NO PROFILE PICTURE
                profileAvatar.src = generateAvatarUrl(admin.firstName, admin.lastName);
            }
        }

        // ✅ ALSO UPDATE TOPBAR PROFILE (IF EXISTS)
        const topbarAvatar = document.querySelector('.topbar .profile-avatar');
        if (topbarAvatar && admin.profilePicture) {
            topbarAvatar.src = profileAvatar.src;
        }

        // ✅ STORE IN SESSION FOR OTHER PAGES
        sessionHandler.updateUserProfile({
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            photo: admin.profilePicture || generateAvatarUrl(admin.firstName, admin.lastName),
            department: admin.department,
            accessLevel: admin.accessLevel
        });

    } catch (error) {
        console.error('❌ Error loading current admin profile:', error);

        // ✅ FALLBACK TO SESSION DATA IF API FAILS
        const sessionHandler = UserSessionHandler.getInstance();
        const currentUser = sessionHandler.getCurrentUser();

        if (currentUser) {
            const profileName = document.getElementById('adminName');
            if (profileName) {
                profileName.textContent = currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`;
            }

            const profileEmail = document.getElementById('adminEmail');
            if (profileEmail) {
                profileEmail.textContent = currentUser.email;
            }

            const profileAvatar = document.querySelector('.profile-avatar');
            if (profileAvatar && currentUser.photo) {
                profileAvatar.src = currentUser.photo;
            }
        }
    }
}








function generateAvatarUrl(firstName, lastName) {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
    return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=1e3a8a&color=fff&bold=true&size=100`;
}

async function initializeApp() {
  initializeLanguage();
  setupEventListeners();
  await loadDashboardData();

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  const savedApiUrl = localStorage.getItem('apiBaseUrl');
  if (savedApiUrl) {
    const apiUrlInput = document.getElementById('apiBaseUrl');
    if (apiUrlInput) {
      apiUrlInput.value = savedApiUrl;
    }
  }
}

function setupEventListeners() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function (e) {
      e.preventDefault();
      toggleSidebar();
    });
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function (e) {
      e.preventDefault();
      toggleTheme();
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      navigateToPage(page);
    });
  });

  document.querySelectorAll('.view-all').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateToPage(page);
    });
  });

  const addAdminBtn = document.getElementById('addAdminBtn');
  if (addAdminBtn) {
    addAdminBtn.addEventListener('click', openAddModal);
  }

  const closeModal = document.getElementById('closeModal');
  if (closeModal) {
    closeModal.addEventListener('click', closeModal);
  }

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModalFunc);
  }

  const adminForm = document.getElementById('adminForm');
  if (adminForm) {
    adminForm.addEventListener('submit', handleFormSubmit);
  }

  const searchAdmin = document.getElementById('searchAdmin');
  if (searchAdmin) {
    searchAdmin.addEventListener('input', filterAdmins);
  }

  const departmentFilter = document.getElementById('departmentFilter');
  if (departmentFilter) {
    departmentFilter.addEventListener('change', filterAdmins);
  }

  const accessLevelFilter = document.getElementById('accessLevelFilter');
  if (accessLevelFilter) {
    accessLevelFilter.addEventListener('change', filterAdmins);
  }

  const generateAdminReportBtn = document.getElementById('generateAdminReportBtn');
  if (generateAdminReportBtn) {
    generateAdminReportBtn.addEventListener('click', generateAdminReport);
  }

  const generateDepartmentReportBtn = document.getElementById('generateDepartmentReportBtn');
  if (generateDepartmentReportBtn) {
    generateDepartmentReportBtn.addEventListener('click', generateDepartmentReport);
  }

  const generateAccessLevelReportBtn = document.getElementById('generateAccessLevelReportBtn');
  if (generateAccessLevelReportBtn) {
    generateAccessLevelReportBtn.addEventListener('click', generateAccessLevelReport);
  }

  const generateCustomReportBtn = document.getElementById('generateCustomReportBtn');
  if (generateCustomReportBtn) {
    generateCustomReportBtn.addEventListener('click', generateCustomReport);
  }

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }

  const lightThemeBtn = document.getElementById('lightThemeBtn');
  if (lightThemeBtn) {
    lightThemeBtn.addEventListener('click', () => setTheme('light'));
  }

  const darkThemeBtn = document.getElementById('darkThemeBtn');
  if (darkThemeBtn) {
    darkThemeBtn.addEventListener('click', () => setTheme('dark'));
  }

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('adminModal');
    if (e.target === modal) {
      closeModalFunc();
    }
  });
}

function setTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  localStorage.setItem('theme', theme);
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('loggedInUserId');
    window.location.href = 'login.html';
  }
}

function navigateToPage(page) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.remove('active');
  });

  const activeNav = document.querySelector(`[data-page="${page}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
  }

  document.querySelectorAll('.page-content').forEach((content) => {
    content.classList.remove('active');
  });

  const pageContent = document.getElementById(`${page}Page`);
  if (pageContent) {
    pageContent.classList.add('active');
  }

  const pageTitles = {
    dashboard: 'Dashboard',
    admins: 'Admin Management',
    academicyear: 'Academic Years Management',
    courses: 'Courses Management',
    coursecontent: 'Course Content Management',
    departments: 'Departments Management',
    enrollments: 'Enrollments Management',
    faculties: 'Faculties Management',
    lecturers: 'Lecturers Management',
    students: 'Students Management',
    parents: 'Parents Management',
    payments: 'Payments Management',
    timetable: 'Timetable Management',
    notifications: 'Notifications Management',
    reports: 'Reports',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = pageTitles[page] || 'Dashboard';
  }

  if (page === 'dashboard') {
    loadDashboardData();
  } else if (page === 'admins') {
    loadAdminsData();
  } else if (page === 'coursecontent') {
    loadCourseContentData();
  } else if (page === 'departments') {
    if (typeof window.loadDepartmentsData === 'function') {
      window.loadDepartmentsData();
    }
  } else if (page === 'enrollments') {
    if (typeof window.loadEnrollmentsData === 'function') {
      window.loadEnrollmentsData();
    }
  } else if (page === 'faculties') {
    if (typeof window.loadFacultiesData === 'function') {
      window.loadFacultiesData();
    }
  } else if (page === 'lecturers') {
    if (typeof window.loadLecturersData === 'function') {
      window.loadLecturersData();
    }
  } else if (page === 'students') {
    if (typeof window.loadStudentsData === 'function') {
      window.loadStudentsData();
    }
  } else if (page === 'parents') {
    if (typeof window.loadParentsData === 'function') {
      window.loadParentsData();
    }
  } else if (page === 'payments') {
    if (typeof window.loadPaymentsData === 'function') {
      window.loadPaymentsData();
    }
  } else if (page === 'timetable') {
    if (typeof window.loadTimetableData === 'function') {
      window.loadTimetableData();
    }
  } else if (page === 'notifications') {
    if (typeof window.loadNotificationsData === 'function') {
      window.loadNotificationsData();
    }
  } else if (page === 'analytics') {
    loadAnalyticsData();
  } else if (page === 'whatsapp') {
    // Redirect to WhatsApp page (external page)
    window.location.href = '../WhatsApp.html';
  }
}

// ========================================
// DASHBOARD DATA LOADING - THE MISSING FUNCTION!
// ========================================

async function loadDashboardData() {
  try {
    await loadAllAdmins();
    updateDashboardStats();
    loadRecentAdmins();
    updateAccessLevelOverview();
    createDashboardCharts();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showNotification('Error loading dashboard data', 'error');
  }
}

// ========================================
// ADMIN MANAGEMENT FUNCTIONS
// ========================================

async function loadDepartments() {
    try {
        const response = await fetch(`${API_BASE_URL}/departments`);
        if (response.ok) {
            const departments = await response.json();
            const select = document.getElementById('department');

            if (select) {
              select.innerHTML = '<option value="">Select Department</option>';

              departments.forEach(dept => {
                  const option = document.createElement('option');
                  option.value = dept.name;
                  option.textContent = dept.name;
                  select.appendChild(option);
              });
            }
        } else {
            console.error('Failed to load departments');
            showNotification('Failed to load departments', 'error');
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        showNotification('Error loading departments', 'error');
    }
}

async function loadAllAdmins() {
  try {
    const response = await fetch(`${API_BASE_URL}/admins`);
    if (response.ok) {
      adminsData = await response.json();
    } else {
      adminsData = [];
      console.error('Failed to fetch admins');
    }
  } catch (error) {
    console.error('Error fetching admins:', error);
    adminsData = [];
  }
}

function updateDashboardStats() {
  const totalAdmins = adminsData.length;
  const activeAdmins = adminsData.filter((admin) => admin.isActive).length;
  const departments = [...new Set(adminsData.map((admin) => admin.department))];
  const accessLevels = [
    ...new Set(adminsData.map((admin) => admin.accessLevel)),
  ];

  animateCounter('totalAdmins', totalAdmins);
  animateCounter('activeAdmins', activeAdmins);
  animateCounter('totalDepartments', departments.length);
  animateCounter('totalAccessLevels', accessLevels.length);
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

function loadRecentAdmins() {
  const recentAdminsContainer = document.getElementById('recentAdmins');
  if (!recentAdminsContainer) return;

  const recentAdmins = adminsData.slice(0, 5);

  if (recentAdmins.length === 0) {
    recentAdminsContainer.innerHTML = '<p class="loading">No admins found</p>';
    return;
  }

  const html = recentAdmins
    .map(
      (admin) => `
        <div class="grade-item">
            <div class="grade-subject">${admin.firstName} ${admin.lastName}</div>
            <div class="grade-bar">
                <div class="grade-fill" style="width: 100%"></div>
            </div>
            <div class="grade-score">${admin.accessLevel}</div>
        </div>
    `
    )
    .join('');

  recentAdminsContainer.innerHTML = html;
}

function updateAccessLevelOverview() {
  const accessLevelContainer = document.getElementById('accessLevelOverview');
  if (!accessLevelContainer) return;

  const accessLevelCounts = {};

  adminsData.forEach((admin) => {
    accessLevelCounts[admin.accessLevel] =
      (accessLevelCounts[admin.accessLevel] || 0) + 1;
  });

  const total = adminsData.length;
  const html = Object.entries(accessLevelCounts)
    .map(([level, count]) => {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
      return `
            <div class="grade-item">
                <div class="grade-subject">${level.replace('_', ' ')}</div>
                <div class="grade-bar">
                    <div class="grade-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="grade-score">${count}</div>
            </div>
        `;
    })
    .join('');

  accessLevelContainer.innerHTML = html;
}

function createDashboardCharts() {
  createAdminPieChart();
  createDepartmentBarChart();
}

function createAdminPieChart() {
  const ctx = document.getElementById('adminPieChart');
  if (!ctx) return;

  if (adminPieChart) {
    adminPieChart.destroy();
  }

  const activeCount = adminsData.filter((admin) => admin.isActive).length;
  const inactiveCount = adminsData.length - activeCount;

  const isDark = document.body.classList.contains('dark-mode');

  adminPieChart = new Chart(ctx, {
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

function createDepartmentBarChart() {
  const ctx = document.getElementById('departmentBarChart');
  if (!ctx) return;

  if (departmentBarChart) {
    departmentBarChart.destroy();
  }

  const departmentCounts = {};
  adminsData.forEach((admin) => {
    departmentCounts[admin.department] =
      (departmentCounts[admin.department] || 0) + 1;
  });

  const labels = Object.keys(departmentCounts);
  const data = Object.values(departmentCounts);

  const isDark = document.body.classList.contains('dark-mode');

  departmentBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Admins per Department',
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
              return `${context.parsed.y} Admin${context.parsed.y !== 1 ? 's' : ''}`;
            },
          },
        },
      },
    },
  });
}

async function loadAdminsData() {
  await loadAllAdmins();
  populateDepartmentFilter();
  populateAccessLevelFilter();
  displayAdminsTable(adminsData);
}

function populateDepartmentFilter() {
  const select = document.getElementById('departmentFilter');
  if (!select) return;

  const departments = [...new Set(adminsData.map((admin) => admin.department))];

  select.innerHTML = '<option value="">All Departments</option>';
  departments.forEach((dept) => {
    const option = document.createElement('option');
    option.value = dept;
    option.textContent = dept;
    select.appendChild(option);
  });
}

function populateAccessLevelFilter() {
  const select = document.getElementById('accessLevelFilter');
  if (!select) return;

  const accessLevels = [
    ...new Set(adminsData.map((admin) => admin.accessLevel)),
  ];

  select.innerHTML = '<option value="">All Access Levels</option>';
  accessLevels.forEach((level) => {
    const option = document.createElement('option');
    option.value = level;
    option.textContent = level.replace('_', ' ');
    select.appendChild(option);
  });
}

function filterAdmins() {
  const searchAdmin = document.getElementById('searchAdmin');
  const departmentFilter = document.getElementById('departmentFilter');
  const accessLevelFilter = document.getElementById('accessLevelFilter');

  const searchTerm = searchAdmin ? searchAdmin.value.toLowerCase() : '';
  const departmentValue = departmentFilter ? departmentFilter.value : '';
  const accessLevelValue = accessLevelFilter ? accessLevelFilter.value : '';

  const filtered = adminsData.filter((admin) => {
    const matchesSearch =
      !searchTerm ||
      admin.firstName.toLowerCase().includes(searchTerm) ||
      admin.lastName.toLowerCase().includes(searchTerm) ||
      admin.email.toLowerCase().includes(searchTerm) ||
      admin.employeeId.toLowerCase().includes(searchTerm);

    const matchesDepartment =
      !departmentValue || admin.department === departmentValue;
    const matchesAccessLevel =
      !accessLevelValue || admin.accessLevel === accessLevelValue;

    return matchesSearch && matchesDepartment && matchesAccessLevel;
  });

  displayAdminsTable(filtered);
}

function displayAdminsTable(admins) {
  const tbody = document.getElementById('adminsTableBody');
  if (!tbody) return;

  if (admins.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="loading">No admins found</td></tr>';
    return;
  }

  const html = admins
    .map(
      (admin) => `
        <tr>
            <td>
                <img src="${admin.profilePicture || `https://ui-avatars.com/api/?name=${admin.firstName}+${admin.lastName}&background=1e3a8a&color=fff&bold=true&size=40`}"
                     alt="${admin.firstName}"
                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            </td>
            <td>${admin.employeeId}</td>
            <td>${admin.firstName} ${admin.lastName}</td>
            <td>${admin.email}</td>
            <td>${admin.department}</td>
            <td>${admin.accessLevel.replace('_', ' ')}</td>
            <td>${formatDate(admin.hireDate)}</td>
            <td>
                <span class="status-badge ${admin.isActive ? 'status-active' : 'status-inactive'}">
                    ${admin.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editAdmin(${admin.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteAdmin(${admin.id})" title="Delete">
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



function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Admin';
    document.getElementById('adminForm').reset();
    document.getElementById('adminId').value = '';

    const employeeIdInput = document.getElementById('employeeId');
    if (employeeIdInput) {
        employeeIdInput.value = '';
        employeeIdInput.placeholder = 'Will be generated automatically';
        employeeIdInput.readOnly = true;
    }

    // ✅ CHARGER LES DÉPARTEMENTS DE LA BASE DE DONNÉES
    loadDepartments();

    const passwordGroup = document.getElementById('passwordGroup');
    const passwordInput = document.getElementById('password');
    if (passwordGroup) passwordGroup.style.display = 'block';
    if (passwordInput) passwordInput.required = true;

    const fileInput = document.getElementById('profilePictureFile');
    if (fileInput) {
        fileInput.value = '';
    }
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }

    currentEditId = null;
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.add('active');
    }
}




function editAdmin(id) {
    const admin = adminsData.find((a) => a.id === id);
    if (!admin) return;

    document.getElementById('modalTitle').textContent = 'Edit Admin';
    document.getElementById('adminId').value = admin.id;
    document.getElementById('firstName').value = admin.firstName;
    document.getElementById('lastName').value = admin.lastName;
    document.getElementById('email').value = admin.email;
    document.getElementById('phoneNumber').value = admin.phoneNumber;

    const employeeIdInput = document.getElementById('employeeId');
    if (employeeIdInput) {
        employeeIdInput.value = admin.employeeId;
        employeeIdInput.readOnly = true;
        employeeIdInput.style.backgroundColor = 'var(--card-bg)';
        employeeIdInput.style.opacity = '0.7';
        employeeIdInput.style.cursor = 'not-allowed';
    }

    // ✅ CHARGER LES DÉPARTEMENTS PUIS SÉLECTIONNER CELUI DE L'ADMIN
    loadDepartments().then(() => {
        const deptSelect = document.getElementById('department');
        if (deptSelect) {
            deptSelect.value = admin.department;
        }
    });

    const hireDateInput = document.getElementById('hireDate');
    const accessLevelInput = document.getElementById('accessLevel');
    if (hireDateInput) hireDateInput.value = admin.hireDate;
    if (accessLevelInput) accessLevelInput.value = admin.accessLevel;

    const passwordGroup = document.getElementById('passwordGroup');
    const passwordInput = document.getElementById('password');
    if (passwordGroup) passwordGroup.style.display = 'none';
    if (passwordInput) passwordInput.required = false;

    currentEditId = id;
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.add('active');
    }
}






async function deleteAdmin(id) {
  if (!confirm('Are you sure you want to delete this admin?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admins/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showNotification('Admin deleted successfully', 'success');
      adminsData = adminsData.filter((admin) => admin.id !== id);
      displayAdminsTable(adminsData);
      updateDashboardStats();
    } else {
      adminsData = adminsData.filter((admin) => admin.id !== id);
      displayAdminsTable(adminsData);
      showNotification('Admin deleted successfully', 'success');
    }
  } catch (error) {
    console.error('Error deleting admin:', error);
    adminsData = adminsData.filter((admin) => admin.id !== id);
    displayAdminsTable(adminsData);
    showNotification('Admin deleted successfully', 'success');
  }
}

function closeModalFunc() {
  const modal = document.getElementById('adminModal');
  if (modal) {
    modal.classList.remove('active');
  }
  const adminForm = document.getElementById('adminForm');
  if (adminForm) {
    adminForm.reset();
  }
  currentEditId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    try {
        let profilePictureUrl = null;
        const fileInput = document.getElementById('profilePictureFile');

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);

            const uploadResponse = await fetch(`${API_BASE_URL}/upload/profile-picture`, {
                method: 'POST',
                body: uploadFormData,
            });

            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                profilePictureUrl = `http://localhost:8080${uploadResult.url}`;
            } else {
                showNotification('Failed to upload profile picture', 'error');
                return;
            }
        } else if (currentEditId) {
            const existingAdmin = adminsData.find((a) => a.id === currentEditId);
            profilePictureUrl = existingAdmin?.profilePicture || null;
        }

        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            role: 'ADMIN',
            department: document.getElementById('department').value,
            hireDate: document.getElementById('hireDate').value,
            accessLevel: document.getElementById('accessLevel').value,
            profilePicture: profilePictureUrl,
            isActive: true,
        };

        if (currentEditId) {
            formData.employeeId = document.getElementById('employeeId').value;
        }

        if (!currentEditId) {
            formData.password = document.getElementById('password').value;
        }

        let response;
        if (currentEditId) {
            response = await fetch(`${API_BASE_URL}/admins/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
        } else {
            response = await fetch(`${API_BASE_URL}/admins/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
        }

        if (response.ok) {
            showNotification(
                currentEditId
                    ? 'Admin updated successfully'
                    : 'Admin added successfully (Employee ID auto-generated)',
                'success'
            );
            closeModalFunc();
            await loadAllAdmins();
            await loadDashboardData();
            displayAdminsTable(adminsData);
            await loadCurrentAdminProfile();
        } else {
            const errorData = await response.json();
            showNotification('Failed to save admin: ' + (errorData.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving admin:', error);
        showNotification('Error saving admin: ' + error.message, 'error');
    }
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

async function loadAnalyticsData() {
  await loadAllAdmins();
  createAnalyticsCharts();
}

function createAnalyticsCharts() {
  createAccessLevelChart();
  createActivityLineChart();
  createDepartmentComparisonChart();
}

function createAccessLevelChart() {
  const ctx = document.getElementById('accessLevelChart');
  if (!ctx) return;

  if (accessLevelChart) {
    accessLevelChart.destroy();
  }

  const accessLevelCounts = {};
  adminsData.forEach((admin) => {
    accessLevelCounts[admin.accessLevel] =
      (accessLevelCounts[admin.accessLevel] || 0) + 1;
  });

  const labels = Object.keys(accessLevelCounts).map((level) =>
    level.replace('_', ' ')
  );
  const data = Object.values(accessLevelCounts);
  const isDark = document.body.classList.contains('dark-mode');

  const colors = [
    '#1e3a8a',
    '#3b82f6',
    '#60a5fa',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
  ];

  accessLevelChart = new Chart(ctx, {
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

function createActivityLineChart() {
  const ctx = document.getElementById('activityLineChart');
  if (!ctx) return;

  if (activityLineChart) {
    activityLineChart.destroy();
  }

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const data = [12, 19, 15, 25, 22, 30];
  const isDark = document.body.classList.contains('dark-mode');

  activityLineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Active Admins',
          data: data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3b82f6',
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
            stepSize: 5,
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
              return `Active: ${context.parsed.y} admins`;
            },
          },
        },
      },
    },
  });
}

function createDepartmentComparisonChart() {
  const ctx = document.getElementById('departmentComparisonChart');
  if (!ctx) return;

  if (departmentComparisonChart) {
    departmentComparisonChart.destroy();
  }

  const departmentCounts = {};
  adminsData.forEach((admin) => {
    departmentCounts[admin.department] =
      (departmentCounts[admin.department] || 0) + 1;
  });

  const labels = Object.keys(departmentCounts);
  const data = Object.values(departmentCounts);
  const isDark = document.body.classList.contains('dark-mode');

  departmentComparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Admin Count',
          data: data,
          backgroundColor: 'rgba(30, 58, 138, 0.85)',
          borderColor: '#1e3a8a',
          borderWidth: 2,
          borderRadius: 8,
          barThickness: 50,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
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
        y: {
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
              return `${context.parsed.x} Admin${context.parsed.x !== 1 ? 's' : ''}`;
            },
          },
        },
      },
    },
  });
}

function generateAdminReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('UVT Admin Summary Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Overview', 14, 40);

  doc.setFontSize(10);
  const stats = [
    `Total Admins: ${adminsData.length}`,
    `Active Admins: ${adminsData.filter((a) => a.isActive).length}`,
    `Departments: ${[...new Set(adminsData.map((a) => a.department))].length}`,
    `Access Levels: ${[...new Set(adminsData.map((a) => a.accessLevel))].length}`,
  ];

  stats.forEach((stat, index) => {
    doc.text(stat, 14, 50 + index * 8);
  });

  const tableData = adminsData.map((admin) => [
    admin.employeeId,
    `${admin.firstName} ${admin.lastName}`,
    admin.department,
    admin.accessLevel.replace('_', ' '),
    admin.isActive ? 'Active' : 'Inactive',
  ]);

  doc.autoTable({
    startY: 85,
    head: [['Employee ID', 'Name', 'Department', 'Access Level', 'Status']],
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

  doc.save('admin-summary-report.pdf');
  showNotification('Admin report generated successfully', 'success');
}

function generateDepartmentReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Department Distribution Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  const departmentCounts = {};
  adminsData.forEach((admin) => {
    departmentCounts[admin.department] =
      (departmentCounts[admin.department] || 0) + 1;
  });

  const tableData = Object.entries(departmentCounts).map(([dept, count]) => {
    const percentage = ((count / adminsData.length) * 100).toFixed(1);
    return [dept, count, `${percentage}%`];
  });

  doc.autoTable({
    startY: 40,
    head: [['Department', 'Admin Count', 'Percentage']],
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

  doc.save('department-report.pdf');
  showNotification('Department report generated successfully', 'success');
}

function generateAccessLevelReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Access Level Distribution Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  const accessLevelCounts = {};
  adminsData.forEach((admin) => {
    accessLevelCounts[admin.accessLevel] =
      (accessLevelCounts[admin.accessLevel] || 0) + 1;
  });

  const tableData = Object.entries(accessLevelCounts).map(([level, count]) => {
    const percentage = ((count / adminsData.length) * 100).toFixed(1);
    return [level.replace('_', ' '), count, `${percentage}%`];
  });

  doc.autoTable({
    startY: 40,
    head: [['Access Level', 'Admin Count', 'Percentage']],
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

  doc.save('access-level-report.pdf');
  showNotification('Access level report generated successfully', 'success');
}

function generateCustomReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('UVT Comprehensive Admin Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Executive Summary', 14, 40);

  const departmentCounts = {};
  const accessLevelCounts = {};

  adminsData.forEach((admin) => {
    departmentCounts[admin.department] =
      (departmentCounts[admin.department] || 0) + 1;
    accessLevelCounts[admin.accessLevel] =
      (accessLevelCounts[admin.accessLevel] || 0) + 1;
  });

  doc.setFontSize(10);
  doc.text(`Total Administrators: ${adminsData.length}`, 14, 50);
  doc.text(
    `Active: ${adminsData.filter((a) => a.isActive).length} | Inactive: ${adminsData.filter((a) => !a.isActive).length}`,
    14,
    57
  );
  doc.text(`Departments: ${Object.keys(departmentCounts).length}`, 14, 64);
  doc.text(`Access Levels: ${Object.keys(accessLevelCounts).length}`, 14, 71);

  const tableData = adminsData.map((admin) => [
    admin.employeeId,
    `${admin.firstName} ${admin.lastName}`,
    admin.email,
    admin.department,
    admin.accessLevel.replace('_', ' '),
    formatDate(admin.hireDate),
    admin.isActive ? 'Active' : 'Inactive',
  ]);

  doc.autoTable({
    startY: 85,
    head: [
      [
        'Employee ID',
        'Name',
        'Email',
        'Department',
        'Access Level',
        'Hire Date',
        'Status',
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
    margin: { top: 10 },
  });

  doc.save('comprehensive-admin-report.pdf');
  showNotification('Comprehensive report generated successfully', 'success');
}

function saveSettings() {
  const apiUrl = document.getElementById('apiBaseUrl');
  if (apiUrl) {
    localStorage.setItem('apiBaseUrl', apiUrl.value);
    showNotification('Settings saved successfully', 'success');
  }
}

function loadCourseContentData() {
  console.log('Course content page loaded');
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
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
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function t(key) {
  const translations = {
    en: {
      languageChanged: 'Language changed successfully',
      dashboard: 'Dashboard',
      admins: 'Admin Management',
    },
    fr: {
      languageChanged: 'Langue modifiée avec succès',
      dashboard: 'Tableau de bord',
      admins: 'Gestion des administrateurs',
    },
  };

  return translations[currentLanguage]?.[key] || key;
}

function updatePageTranslations() {
  const currentPage = document.querySelector('.nav-item.active')?.dataset.page;
  if (currentPage) {
    const pageTitles = {
      en: {
        dashboard: 'Dashboard',
        admins: 'Admin Management',
        reports: 'Reports',
        analytics: 'Analytics',
        settings: 'Settings',
      },
      fr: {
        dashboard: 'Tableau de bord',
        admins: 'Gestion des administrateurs',
        reports: 'Rapports',
        analytics: 'Analytique',
        settings: 'Paramètres',
      },
    };

    const title = pageTitles[currentLanguage]?.[currentPage];
    const pageTitle = document.getElementById('pageTitle');
    if (title && pageTitle) {
      pageTitle.textContent = title;
    }
  }
}

function changeLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);

  document.querySelectorAll('.language-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  const englishBtn = document.getElementById('englishBtn');
  const frenchBtn = document.getElementById('frenchBtn');

  if (lang === 'en' && englishBtn) {
    englishBtn.classList.add('active');
  } else if (lang === 'fr' && frenchBtn) {
    frenchBtn.classList.add('active');
  }

  updatePageTranslations();
  showNotification(t('languageChanged'), 'success');
}

function initializeLanguage() {
  const savedLang = localStorage.getItem('language') || 'en';
  currentLanguage = savedLang;

  const englishBtn = document.getElementById('englishBtn');
  const frenchBtn = document.getElementById('frenchBtn');

  if (savedLang === 'fr') {
    if (englishBtn) englishBtn.classList.remove('active');
    if (frenchBtn) frenchBtn.classList.add('active');
  }

  updatePageTranslations();
}

window.changeLanguage = changeLanguage;
window.editAdmin = editAdmin;
window.deleteAdmin = deleteAdmin;
window.loadDepartments = loadDepartments;