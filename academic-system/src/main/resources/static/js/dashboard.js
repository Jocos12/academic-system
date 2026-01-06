// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Get current user from session
let currentUser = null;
let currentAcademicYear = null;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.getElementById('mainContent');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const dropdownLogout = document.getElementById('dropdownLogout');
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  initializeApp();
  setupEventListeners();
  checkDarkMode();
});

// Initialize Application
function initializeApp() {
  // Check if user is logged in
  const user = sessionStorage.getItem('user');

  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  currentUser = JSON.parse(user);

  // Check if user is a student
  if (currentUser.role !== 'STUDENT') {
    alert('Access denied. This dashboard is for students only.');
    sessionStorage.clear();
    window.location.href = '/login.html';
    return;
  }

  // Load user data
  loadUserData();

  // Load dashboard data
  loadDashboardData();
}

// Setup Event Listeners
function setupEventListeners() {
  // Sidebar toggle
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    lucide.createIcons();
  });

  // Mobile sidebar
  if (window.innerWidth <= 768) {
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });

    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Theme toggle
  themeToggle.addEventListener('click', toggleDarkMode);

  // Logout buttons
  logoutBtn.addEventListener('click', logout);
  dropdownLogout.addEventListener('click', logout);

  // User menu dropdown
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('active');
    lucide.createIcons();
  });

  document.addEventListener('click', (e) => {
    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.remove('active');
    }
  });

  // Navigation
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      navigateTo(page);
    });
  });

  // View all links
  document.querySelectorAll('.view-all').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigateTo(page);
    });
  });

  // Download transcript
  const downloadTranscript = document.getElementById('downloadTranscript');
  if (downloadTranscript) {
    downloadTranscript.addEventListener('click', generateTranscriptPDF);
  }
}

// Load User Data
function loadUserData() {
  // Update user info in sidebar
  document.getElementById('sidebarUserName').textContent =
    `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('sidebarUserEmail').textContent = currentUser.email;

  // Update user avatars
  const avatarUrl = `https://ui-avatars.com/api/?name=${currentUser.firstName}+${currentUser.lastName}&background=FF8C42&color=fff`;
  document.getElementById('sidebarAvatar').src = avatarUrl;
  document.getElementById('userAvatar').src = avatarUrl;

  // Update dropdown
  document.getElementById('dropdownName').textContent =
    `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('dropdownEmail').textContent = currentUser.email;
  document.querySelector('.dropdown-avatar').src = avatarUrl;
}

// Load Dashboard Data
async function loadDashboardData() {
  try {
    // Get current academic year
    await loadCurrentAcademicYear();

    // Load all dashboard components
    await Promise.all([
      loadStudentStats(),
      loadCurrentCourses(),
      loadTodaySchedule(),
      loadRecentNotifications(),
      loadGrades(),
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showError('Failed to load dashboard data');
  }
}

// Load Current Academic Year
async function loadCurrentAcademicYear() {
  try {
    const response = await fetch(`${API_BASE_URL}/academic-years/current`);
    if (response.ok) {
      currentAcademicYear = await response.json();
    } else {
      // Default to current year if not set
      currentAcademicYear = {
        yearCode: new Date().getFullYear().toString(),
        semester: 1,
      };
    }
  } catch (error) {
    console.error('Error loading academic year:', error);
  }
}

// Load Student Stats
async function loadStudentStats() {
  try {
    // Load student details
    const studentResponse = await fetch(
      `${API_BASE_URL}/students/${currentUser.id}`
    );
    const student = await studentResponse.json();

    // Update stats
    document.getElementById('currentGPA').textContent =
      student.cumulativeGPA.toFixed(2);
    document.getElementById('totalCredits').textContent =
      student.totalCreditsEarned;

    // Load enrollments count
    const enrollmentsResponse = await fetch(
      `${API_BASE_URL}/enrollments/student/${currentUser.id}`
    );
    const enrollments = await enrollmentsResponse.json();

    // Count current semester enrollments
    const currentEnrollments = enrollments.filter(
      (e) =>
        e.academicYear === currentAcademicYear.yearCode &&
        e.semester === currentAcademicYear.semester
    );
    document.getElementById('totalCourses').textContent =
      currentEnrollments.length;

    // Check payment status
    const paymentResponse = await fetch(
      `${API_BASE_URL}/payments/student/${currentUser.id}/check/${currentAcademicYear.yearCode}/${currentAcademicYear.semester}`
    );
    const paymentStatus = await paymentResponse.json();

    const statusElement = document.getElementById('paymentStatus');
    if (paymentStatus.hasPaid) {
      statusElement.textContent = 'Paid';
      statusElement.style.color = '#4CAF89';
    } else {
      statusElement.textContent = 'Unpaid';
      statusElement.style.color = '#ef4444';
    }

    // Update completion rate
    updateCompletionRate(student);

    // Reinitialize icons
    lucide.createIcons();
  } catch (error) {
    console.error('Error loading student stats:', error);
  }
}

// Update Completion Rate
function updateCompletionRate(student) {
  // Assuming 120 credits for bachelor's degree
  const totalCreditsRequired = 120;
  const percentage = Math.min(
    (student.totalCreditsEarned / totalCreditsRequired) * 100,
    100
  );

  document.getElementById('completionPercent').textContent =
    `${Math.round(percentage)}%`;

  // Update circular progress
  const circle = document.getElementById('progressCircle');
  const circumference = 2 * Math.PI * 90; // radius = 90
  const offset = circumference - (percentage / 100) * circumference;
  circle.style.strokeDashoffset = offset;

  // Add gradient
  if (!document.getElementById('progressGradient')) {
    const svg = circle.parentElement;
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'linearGradient'
    );
    gradient.id = 'gradient';
    gradient.innerHTML = `
            <stop offset="0%" stop-color="#FF8C42"/>
            <stop offset="100%" stop-color="#FF9C62"/>
        `;
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
  }
}

// Load Current Courses
async function loadCurrentCourses() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/enrollments/student/${currentUser.id}`
    );
    const enrollments = await response.json();

    // Filter current semester
    const currentEnrollments = enrollments.filter(
      (e) =>
        e.academicYear === currentAcademicYear.yearCode &&
        e.semester === currentAcademicYear.semester &&
        (e.status === 'REGISTERED' || e.status === 'IN_PROGRESS')
    );

    const container = document.getElementById('currentCoursesList');

    if (currentEnrollments.length === 0) {
      container.innerHTML = '<div class="loading">No courses enrolled</div>';
      return;
    }

    container.innerHTML = currentEnrollments
      .map(
        (enrollment) => `
            <div class="course-item">
                <div class="course-header">
                    <span class="course-code">${enrollment.course.courseCode}</span>
                    <span class="course-credits">${enrollment.course.credits} Credits</span>
                </div>
                <div class="course-name">${enrollment.course.courseName}</div>
            </div>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading courses:', error);
    document.getElementById('currentCoursesList').innerHTML =
      '<div class="loading">Failed to load courses</div>';
  }
}

// Load Today's Schedule
async function loadTodaySchedule() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/timetable/student/${currentUser.id}`
    );
    const timetable = await response.json();

    // Get today's day
    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const today = days[new Date().getDay()];

    // Filter today's classes
    const todayClasses = timetable.filter((t) => t.dayOfWeek === today);

    const container = document.getElementById('todaySchedule');

    if (todayClasses.length === 0) {
      container.innerHTML = '<div class="loading">No classes today</div>';
      return;
    }

    // Sort by start time
    todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

    container.innerHTML = todayClasses
      .map(
        (cls) => `
            <div class="schedule-item">
                <div class="schedule-time">${formatTime(cls.startTime)} - ${formatTime(cls.endTime)}</div>
                <div class="schedule-course">${cls.course.courseName}</div>
                <div class="schedule-room">${cls.building} - ${cls.classroom}</div>
            </div>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading schedule:', error);
    document.getElementById('todaySchedule').innerHTML =
      '<div class="loading">Failed to load schedule</div>';
  }
}

// Load Recent Notifications
async function loadRecentNotifications() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/user/${currentUser.id}`
    );
    const notifications = await response.json();

    // Get unread count
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    document.getElementById('notifBadge').textContent = unreadCount;

    // Show recent 5 notifications
    const recent = notifications.slice(0, 5);

    const container = document.getElementById('recentNotifications');

    if (recent.length === 0) {
      container.innerHTML = '<div class="loading">No notifications</div>';
      return;
    }

    container.innerHTML = recent
      .map(
        (notif) => `
            <div class="notification-item ${notif.isRead ? '' : 'unread'}">
                <div class="notification-icon">
                    <i data-lucide="${getNotificationIcon(notif.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${formatDate(notif.createdAt)}</div>
                </div>
            </div>
        `
      )
      .join('');

    lucide.createIcons();
  } catch (error) {
    console.error('Error loading notifications:', error);
    document.getElementById('recentNotifications').innerHTML =
      '<div class="loading">Failed to load notifications</div>';
  }
}

// Load Grades
async function loadGrades() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/enrollments/student/${currentUser.id}/transcript`
    );
    const completedCourses = await response.json();

    const container = document.getElementById('gradesGrid');

    if (completedCourses.length === 0) {
      container.innerHTML =
        '<div class="loading" style="grid-column: 1/-1;">No grades available yet</div>';
      return;
    }

    // Show recent 8 courses
    const recentGrades = completedCourses.slice(-8);

    container.innerHTML = recentGrades
      .map((enrollment) => {
        const percentage = (enrollment.totalGrade / 100) * 100;
        return `
                <div class="grade-item">
                    <span class="grade-subject">${enrollment.course.courseName}</span>
                    <div class="grade-bar">
                        <div class="grade-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="grade-score">${enrollment.totalGrade.toFixed(1)}%</span>
                </div>
            `;
      })
      .join('');

    // Generate courses chart
    generateCoursesChart();
  } catch (error) {
    console.error('Error loading grades:', error);
  }
}

// Generate Courses Chart (Bar Chart)
function generateCoursesChart() {
  const container = document.getElementById('coursesChart');

  // Sample data - you can make this dynamic based on actual data
  const months = [
    'Sept',
    'Oct',
    'Nov',
    'Dec',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
  ];
  const values = [5, 5, 6, 6, 7, 7, 8, 8, 6, 5]; // Sample course counts

  const maxValue = Math.max(...values);

  container.innerHTML = months
    .map((month, index) => {
      const height = (values[index] / maxValue) * 100;
      return `
            <div class="bar" style="height: ${height}%" title="${month}: ${values[index]} courses">
                <div class="bar-label">${month}</div>
            </div>
        `;
    })
    .join('');
}

// Navigation
function navigateTo(page) {
  // Update active nav item
  navItems.forEach((item) => {
    if (item.getAttribute('data-page') === page) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update page title
  const titles = {
    overview: 'Dashboard',
    courses: 'My Courses',
    register: 'Course Registration',
    progress: 'Study Progress',
    grades: 'My Grades',
    transcript: 'Transcript',
    timetable: 'Timetable',
    payments: 'Payments',
    enrollments: 'Enrollments',
    notifications: 'Notifications',
    announcements: 'Announcements',
    settings: 'Settings',
    profile: 'My Profile',
  };

  pageTitle.textContent = titles[page] || 'Dashboard';

  // Hide all pages
  document.querySelectorAll('.page-content').forEach((p) => {
    p.classList.remove('active');
  });

  // Show selected page
  const selectedPage = document.getElementById(`${page}Page`);
  if (selectedPage) {
    selectedPage.classList.add('active');

    // Load page-specific data
    loadPageData(page);
  }
}

// Load Page-Specific Data
async function loadPageData(page) {
  switch (page) {
    case 'courses':
      await loadCoursesPage();
      break;
    case 'register':
      await loadRegistrationPage();
      break;
    case 'grades':
      await loadGradesPage();
      break;
    case 'transcript':
      await loadTranscriptPage();
      break;
    case 'timetable':
      await loadTimetablePage();
      break;
    case 'payments':
      await loadPaymentsPage();
      break;
    case 'enrollments':
      await loadEnrollmentsPage();
      break;
    case 'notifications':
      await loadNotificationsPage();
      break;
    case 'profile':
      await loadProfilePage();
      break;
  }
}

// Load Courses Page
async function loadCoursesPage() {
  const container = document.getElementById('coursesContent');
  container.innerHTML = '<div class="loading">Loading courses...</div>';

  try {
    const response = await fetch(
      `${API_BASE_URL}/enrollments/student/${currentUser.id}`
    );
    const enrollments = await response.json();

    // Filter current semester
    const currentEnrollments = enrollments.filter(
      (e) =>
        e.academicYear === currentAcademicYear.yearCode &&
        e.semester === currentAcademicYear.semester
    );

    if (currentEnrollments.length === 0) {
      container.innerHTML = '<p>No courses enrolled for this semester.</p>';
      return;
    }

    container.innerHTML = `
            <div class="course-list">
                ${currentEnrollments
                  .map(
                    (enrollment) => `
                    <div class="course-item">
                        <div class="course-header">
                            <span class="course-code">${enrollment.course.courseCode}</span>
                            <span class="course-credits">${enrollment.course.credits} Credits</span>
                        </div>
                        <div class="course-name">${enrollment.course.courseName}</div>
                        <div class="course-details">
                            <p><strong>Lecturer:</strong> ${enrollment.course.lecturer ? enrollment.course.lecturer.firstName + ' ' + enrollment.course.lecturer.lastName : 'TBA'}</p>
                            <p><strong>Status:</strong> ${enrollment.status}</p>
                            <p><strong>Attendance:</strong> ${enrollment.attendance || 0} classes</p>
                        </div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        `;
  } catch (error) {
    console.error('Error loading courses:', error);
    container.innerHTML = '<p>Failed to load courses.</p>';
  }
}

// Load Registration Page
async function loadRegistrationPage() {
  const container = document.getElementById('registerContent');
  container.innerHTML =
    '<div class="loading">Loading available courses...</div>';

  try {
    // Get student info for year/semester/faculty
    const studentResponse = await fetch(
      `${API_BASE_URL}/students/${currentUser.id}`
    );
    const student = await studentResponse.json();

    // Get available courses
    const coursesResponse = await fetch(
      `${API_BASE_URL}/courses/year/${student.currentYear}/semester/${student.currentSemester}`
    );
    const courses = await coursesResponse.json();

    // Filter by faculty
    const availableCourses = courses.filter(
      (c) => c.faculty === student.faculty && c.isActive
    );

    if (availableCourses.length === 0) {
      container.innerHTML = '<p>No courses available for registration.</p>';
      return;
    }

    container.innerHTML = `
            <div class="course-list">
                ${availableCourses
                  .map(
                    (course) => `
                    <div class="course-item">
                        <div class="course-header">
                            <span class="course-code">${course.courseCode}</span>
                            <span class="course-credits">${course.credits} Credits - ${course.price} FCFA</span>
                        </div>
                        <div class="course-name">${course.courseName}</div>
                        <p>${course.description || 'No description available'}</p>
                        <button class="btn-primary" onclick="enrollInCourse(${course.id})">
                            Enroll Now
                        </button>
                    </div>
                `
                  )
                  .join('')}
            </div>
        `;

    lucide.createIcons();
  } catch (error) {
    console.error('Error loading registration page:', error);
    container.innerHTML = '<p>Failed to load courses.</p>';
  }
}

// Enroll in Course
async function enrollInCourse(courseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: currentUser.id,
        courseId: courseId,
        academicYear: currentAcademicYear.yearCode,
        semester: currentAcademicYear.semester,
      }),
    });

    if (response.ok) {
      alert('Successfully enrolled in course!');
      loadRegistrationPage();
      loadDashboardData();
    } else {
      const error = await response.text();
      alert(`Enrollment failed: ${error}`);
    }
  } catch (error) {
    console.error('Error enrolling:', error);
    alert('Failed to enroll in course');
  }
}

// Load other pages (placeholder implementations)
async function loadGradesPage() {
  document.getElementById('gradesContent').innerHTML =
    '<div class="loading">Loading grades...</div>';
}

async function loadTranscriptPage() {
  document.getElementById('transcriptContent').innerHTML =
    '<div class="loading">Loading transcript...</div>';
}

async function loadTimetablePage() {
  document.getElementById('timetableContent').innerHTML =
    '<div class="loading">Loading timetable...</div>';
}

async function loadPaymentsPage() {
  document.getElementById('paymentsContent').innerHTML =
    '<div class="loading">Loading payments...</div>';
}

async function loadEnrollmentsPage() {
  document.getElementById('enrollmentsContent').innerHTML =
    '<div class="loading">Loading enrollments...</div>';
}

async function loadNotificationsPage() {
  document.getElementById('notificationsContent').innerHTML =
    '<div class="loading">Loading notifications...</div>';
}

async function loadProfilePage() {
  document.getElementById('profileContent').innerHTML =
    '<div class="loading">Loading profile...</div>';
}

// Generate Transcript PDF
function generateTranscriptPDF() {
  alert('PDF generation feature coming soon!');
}

// Dark Mode
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark);
  lucide.createIcons();
}

function checkDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
  }
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.clear();
    window.location.href = '/login.html';
  }
}

// Helper Functions
function formatTime(time) {
  // Convert "HH:MM:SS" to "HH:MM AM/PM"
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  const icons = {
    REGISTRATION_DEADLINE: 'calendar',
    PAYMENT_REMINDER: 'credit-card',
    GRADE_RELEASED: 'bar-chart',
    COURSE_APPROVED: 'check-circle',
    MATERIAL_UPLOADED: 'book',
    ANNOUNCEMENT: 'megaphone',
    SYSTEM_UPDATE: 'bell',
  };
  return icons[type] || 'bell';
}

function showError(message) {
  alert(message);
}

// Make enrollInCourse available globally
window.enrollInCourse = enrollInCourse;
