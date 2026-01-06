const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editProfileForm = document.getElementById('editProfileForm');
const logoutBtn = document.getElementById('logoutBtn');
const logoutNavBtn = document.getElementById('logoutNavBtn');

const currentDateElement = document.getElementById('currentDate');

let currentUser = null;
let lecturerData = null;

function initTheme() {
  const savedTheme = sessionStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  sessionStorage.setItem('theme', newTheme);
}

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  sessionStorage.setItem(
    'sidebarCollapsed',
    sidebar.classList.contains('collapsed')
  );
}

function toggleMobileSidebar() {
  sidebar.classList.toggle('mobile-open');
}

function openModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function formatDate(date) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

function updateCurrentDate() {
  const now = new Date();
  currentDateElement.textContent = formatDate(now);
}

async function loadUserProfile() {
  try {
    const response = await fetch('/api/lecturers/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const mockLecturerData = await response.json();
    lecturerData = mockLecturerData;

    document.getElementById('lecturerName').textContent =
      `${mockLecturerData.firstName} ${mockLecturerData.lastName}`;
    document.getElementById('lecturerEmail').textContent =
      mockLecturerData.email;
    document.getElementById('welcomeName').textContent =
      mockLecturerData.firstName;

    const initials =
      (mockLecturerData.firstName?.charAt(0) || '') +
      (mockLecturerData.lastName?.charAt(0) || '');
    document.getElementById('lecturerInitials').textContent =
      initials.toUpperCase();

    document.getElementById('employeeId').textContent =
      mockLecturerData.employeeId;
    document.getElementById('department').textContent =
      mockLecturerData.department;
    document.getElementById('qualification').textContent =
      mockLecturerData.qualification;
    document.getElementById('specialization').textContent =
      mockLecturerData.specialization;
    document.getElementById('hireDate').textContent = new Date(
      mockLecturerData.hireDate
    ).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    document.getElementById('phoneNumber').textContent =
      mockLecturerData.phoneNumber;
    document.getElementById('officeHours').textContent =
      mockLecturerData.officeHours;
    document.getElementById('officeLocation').textContent =
      mockLecturerData.officeLocation;
  } catch (error) {
    console.error('Error loading profile:', error);
    showNotification('Failed to load profile. Please login again.', 'error');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 2000);
  }
}

function loadStatistics() {
  const mockStats = {
    totalCourses: 5,
    totalStudents: 247,
    pendingGrades: 12,
    totalEnrollments: 247,
    avgEnrollments: 49,
    maxEnrollments: 67,
  };

  document.getElementById('totalCourses').textContent = mockStats.totalCourses;
  document.getElementById('totalStudents').textContent =
    mockStats.totalStudents;
  document.getElementById('pendingGrades').textContent =
    mockStats.pendingGrades;
  document.getElementById('totalEnrollments').textContent =
    mockStats.totalEnrollments;
  document.getElementById('avgEnrollments').textContent =
    mockStats.avgEnrollments;
  document.getElementById('maxEnrollments').textContent =
    mockStats.maxEnrollments;
}

function loadCourses() {
  const mockCourses = [
    {
      id: 1,
      code: 'CS101',
      name: 'Introduction to Programming',
      students: 67,
      schedule: 'Mon, Wed 10:00-12:00',
    },
    {
      id: 2,
      code: 'CS201',
      name: 'Data Structures',
      students: 45,
      schedule: 'Tue, Thu 14:00-16:00',
    },
    {
      id: 3,
      code: 'CS301',
      name: 'Artificial Intelligence',
      students: 52,
      schedule: 'Mon, Wed 14:00-16:00',
    },
  ];

  const coursesList = document.getElementById('coursesList');

  if (mockCourses.length === 0) {
    return;
  }

  coursesList.innerHTML = mockCourses
    .map(
      (course) => `
        <div class="course-item" style="padding: 1rem; background-color: var(--bg-tertiary); border-radius: 0.5rem; cursor: pointer; transition: all 0.2s;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${course.code}</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary);">${course.name}</p>
                </div>
                <span style="background-color: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">${course.students} students</span>
            </div>
            <p style="font-size: 0.813rem; color: var(--text-tertiary);">
                <svg style="display: inline-block; width: 14px; height: 14px; vertical-align: middle; margin-right: 0.25rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                </svg>
                ${course.schedule}
            </p>
        </div>
    `
    )
    .join('');

  const courseItems = coursesList.querySelectorAll('.course-item');
  courseItems.forEach((item) => {
    item.addEventListener('mouseenter', function () {
      this.style.backgroundColor = 'var(--bg-secondary)';
      this.style.boxShadow = 'var(--shadow-md)';
      this.style.transform = 'translateY(-2px)';
    });
    item.addEventListener('mouseleave', function () {
      this.style.backgroundColor = 'var(--bg-tertiary)';
      this.style.boxShadow = 'none';
      this.style.transform = 'translateY(0)';
    });
  });
}

function loadRecentActivity() {
  const mockActivities = [
    {
      id: 1,
      type: 'grade',
      description: 'Graded assignment for CS101',
      timestamp: '2 hours ago',
    },
    {
      id: 2,
      type: 'announcement',
      description: 'Posted announcement in CS201',
      timestamp: '5 hours ago',
    },
    {
      id: 3,
      type: 'material',
      description: 'Uploaded lecture notes for CS301',
      timestamp: '1 day ago',
    },
  ];

  const activityList = document.getElementById('activityList');

  if (mockActivities.length === 0) {
    return;
  }

  activityList.innerHTML = mockActivities
    .map((activity) => {
      let icon = '';
      let color = '';

      switch (activity.type) {
        case 'grade':
          icon =
            '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>';
          color = 'var(--primary-light)';
          break;
        case 'announcement':
          icon =
            '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>';
          color = 'var(--info-color)';
          break;
        case 'material':
          icon =
            '<path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" fill="currentColor"/>';
          color = 'var(--success-color)';
          break;
      }

      return `
            <div class="activity-item" style="display: flex; gap: 1rem; padding: 1rem; background-color: var(--bg-tertiary); border-radius: 0.5rem;">
                <div style="width: 36px; height: 36px; background-color: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <svg style="width: 20px; height: 20px; color: white;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        ${icon}
                    </svg>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500; margin-bottom: 0.25rem;">${activity.description}</p>
                    <p style="font-size: 0.75rem; color: var(--text-tertiary);">${activity.timestamp}</p>
                </div>
            </div>
        `;
    })
    .join('');
}

function loadTodaySchedule() {
  const mockSchedule = [
    {
      id: 1,
      course: 'CS101',
      time: '10:00 - 12:00',
      room: 'Room A305',
      type: 'Lecture',
    },
    {
      id: 2,
      course: 'CS301',
      time: '14:00 - 16:00',
      room: 'Lab B202',
      type: 'Lab Session',
    },
  ];

  const scheduleList = document.getElementById('scheduleList');

  if (mockSchedule.length === 0) {
    return;
  }

  scheduleList.innerHTML = mockSchedule
    .map(
      (schedule) => `
        <div class="schedule-item" style="padding: 1rem; background-color: var(--bg-tertiary); border-radius: 0.5rem; border-left: 4px solid var(--primary-light);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${schedule.course} - ${schedule.type}</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary);">
                        <svg style="display: inline-block; width: 14px; height: 14px; vertical-align: middle; margin-right: 0.25rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
                        </svg>
                        ${schedule.time}
                    </p>
                </div>
                <span style="background-color: var(--accent-color); color: white; padding: 0.25rem 0.75rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">${schedule.room}</span>
            </div>
        </div>
    `
    )
    .join('');
}

function populateEditForm() {
  if (!lecturerData) return;

  document.getElementById('editFirstName').value = lecturerData.firstName;
  document.getElementById('editLastName').value = lecturerData.lastName;
  document.getElementById('editPhoneNumber').value = lecturerData.phoneNumber;
  document.getElementById('editDepartment').value = lecturerData.department;
  document.getElementById('editQualification').value =
    lecturerData.qualification;
  document.getElementById('editSpecialization').value =
    lecturerData.specialization;
  document.getElementById('editOfficeLocation').value =
    lecturerData.officeLocation;
  document.getElementById('editOfficeHours').value = lecturerData.officeHours;
}

function handleEditProfile(e) {
  e.preventDefault();

  const updatedData = {
    firstName: document.getElementById('editFirstName').value,
    lastName: document.getElementById('editLastName').value,
    phoneNumber: document.getElementById('editPhoneNumber').value,
    department: document.getElementById('editDepartment').value,
    qualification: document.getElementById('editQualification').value,
    specialization: document.getElementById('editSpecialization').value,
    officeLocation: document.getElementById('editOfficeLocation').value,
    officeHours: document.getElementById('editOfficeHours').value,
  };

  lecturerData = { ...lecturerData, ...updatedData };

  document.getElementById('lecturerName').textContent =
    `${updatedData.firstName} ${updatedData.lastName}`;
  document.getElementById('welcomeName').textContent = updatedData.firstName;
  document.getElementById('department').textContent = updatedData.department;
  document.getElementById('qualification').textContent =
    updatedData.qualification;
  document.getElementById('specialization').textContent =
    updatedData.specialization;
  document.getElementById('phoneNumber').textContent = updatedData.phoneNumber;
  document.getElementById('officeHours').textContent = updatedData.officeHours;
  document.getElementById('officeLocation').textContent =
    updatedData.officeLocation;

  closeModal(editProfileModal);

  showNotification('Profile updated successfully!', 'success');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? 'var(--success-color)' : 'var(--info-color)'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        animation: slideIn 0.3s ease-out;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function handleLogout() {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('currentUser');
    showNotification('Logging out...', 'info');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1000);
  }
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach((item) => {
    item.addEventListener('click', function (e) {
      if (this.id === 'logoutNavBtn') {
        return;
      }

      e.preventDefault();

      navItems.forEach((nav) => nav.classList.remove('active'));
      this.classList.add('active');

      const page = this.dataset.page;
      if (page) {
        console.log(`Navigating to: ${page}`);
      }

      if (window.innerWidth <= 768) {
        toggleMobileSidebar();
      }
    });
  });
}

function setupQuickActions() {
  const actionButtons = {
    addGradesBtn: 'Grades Entry',
    createAnnouncementBtn: 'Create Announcement',
    viewStudentsBtn: 'Student List',
    updateScheduleBtn: 'Update Schedule',
    uploadMaterialsBtn: 'Upload Materials',
    generateReportBtn: 'Generate Report',
    viewAllCoursesBtn: 'All Courses',
    refreshStatsBtn: 'Refresh Statistics',
  };

  Object.entries(actionButtons).forEach(([id, action]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        console.log(`Action: ${action}`);
        showNotification(`Opening ${action}...`, 'info');
      });
    }
  });
}

sidebarToggle.addEventListener('click', toggleSidebar);
menuToggle.addEventListener('click', toggleMobileSidebar);
themeToggle.addEventListener('click', toggleTheme);

editProfileBtn.addEventListener('click', () => {
  populateEditForm();
  openModal(editProfileModal);
});

closeEditModal.addEventListener('click', () => closeModal(editProfileModal));
cancelEditBtn.addEventListener('click', () => closeModal(editProfileModal));

editProfileModal.addEventListener('click', (e) => {
  if (e.target === editProfileModal) {
    closeModal(editProfileModal);
  }
});

editProfileForm.addEventListener('submit', handleEditProfile);

logoutBtn.addEventListener('click', handleLogout);
logoutNavBtn.addEventListener('click', handleLogout);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editProfileModal.classList.contains('active')) {
    closeModal(editProfileModal);
  }
});

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

initTheme();
updateCurrentDate();
loadUserProfile().then(() => {
  loadStatistics();
  loadCourses();
  loadRecentActivity();
  loadTodaySchedule();
});
setupNavigation();
setupQuickActions();

const savedSidebarState = sessionStorage.getItem('sidebarCollapsed');
if (savedSidebarState === 'true') {
  sidebar.classList.add('collapsed');
}

console.log('Lecturer Dashboard initialized successfully');
