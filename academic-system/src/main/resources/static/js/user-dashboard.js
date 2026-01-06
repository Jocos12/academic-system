const API_BASE_URL = 'http://localhost:8080/api';

let currentUser = null;
let allUsers = [];
let statistics = {
  totalUsers: 0,
  activeStudents: 0,
  activeLecturers: 0,
  totalAdmins: 0,
  usersByRole: {},
  monthlyRegistrations: Array(12).fill(0),
};

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  loadDashboardData();
});

function initializeApp() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  checkAuthentication();
}

function checkAuthentication() {
  const userEmail = sessionStorage.getItem('userEmail');
  const userRole = sessionStorage.getItem('userRole');

  if (userEmail && userRole === 'ADMIN') {
    document.getElementById('profileEmail').textContent = userEmail;
    document.getElementById('profileName').textContent =
      sessionStorage.getItem('userName') || 'Admin User';
  }
}

function setupEventListeners() {
  document
    .getElementById('sidebarToggle')
    .addEventListener('click', toggleSidebar);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      navigateToPage(page);
    });
  });

  document.querySelectorAll('.view-all').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.getAttribute('data-page');
      navigateToPage(page);
    });
  });

  document
    .getElementById('addUserBtn')
    .addEventListener('click', () => openUserModal());
  document
    .getElementById('closeModal')
    .addEventListener('click', closeUserModal);
  document
    .getElementById('cancelBtn')
    .addEventListener('click', closeUserModal);
  document
    .getElementById('userForm')
    .addEventListener('submit', handleUserFormSubmit);

  document.getElementById('roleFilter').addEventListener('change', filterUsers);
  document
    .getElementById('statusFilter')
    .addEventListener('change', filterUsers);

  document
    .getElementById('exportStudentsPdf')
    .addEventListener('click', () => exportUsersPdf('STUDENT'));
  document
    .getElementById('exportLecturersPdf')
    .addEventListener('click', () => exportUsersPdf('LECTURER'));

  document
    .getElementById('generateFullReport')
    .addEventListener('click', generateFullReport);
  document
    .getElementById('generateUserReport')
    .addEventListener('click', generateUserReport);
  document
    .getElementById('generateStudentReport')
    .addEventListener('click', () => generateRoleReport('STUDENT'));
  document
    .getElementById('generateLecturerReport')
    .addEventListener('click', () => generateRoleReport('LECTURER'));

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('userModal');
    if (e.target === modal) {
      closeUserModal();
    }
  });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const theme = document.body.classList.contains('dark-mode')
    ? 'dark'
    : 'light';
  localStorage.setItem('theme', theme);
}

function navigateToPage(page) {
  document
    .querySelectorAll('.nav-item')
    .forEach((item) => item.classList.remove('active'));
  document
    .querySelectorAll('.page-content')
    .forEach((content) => content.classList.remove('active'));

  const navItem = document.querySelector(`[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  const pageContent = document.getElementById(page);
  if (pageContent) pageContent.classList.add('active');

  const pageTitles = {
    dashboard: 'Dashboard',
    users: 'User Management',
    students: 'Students',
    lecturers: 'Lecturers',
    reports: 'Reports',
    analytics: 'Analytics',
  };

  document.getElementById('pageTitle').textContent =
    pageTitles[page] || 'Dashboard';

  if (page === 'users') {
    loadAllUsers();
  } else if (page === 'students') {
    loadUsersByRole('STUDENT');
  } else if (page === 'lecturers') {
    loadUsersByRole('LECTURER');
  } else if (page === 'analytics') {
    loadAnalytics();
  }
}

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    sessionStorage.clear();
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
}

async function loadDashboardData() {
  try {
    await loadAllUsers();
    calculateStatistics();
    updateDashboardStats();
    renderPieChart();
    renderBarChart();
    renderRecentUsers();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

async function loadAllUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Failed to fetch users');

    allUsers = await response.json();
    calculateStatistics();
    renderUsersTable(allUsers);
  } catch (error) {
    console.error('Error loading users:', error);
    showError('Failed to load users');
  }
}

function calculateStatistics() {
  statistics.totalUsers = allUsers.length;
  statistics.activeStudents = allUsers.filter(
    (u) => u.role === 'STUDENT' && u.isActive
  ).length;
  statistics.activeLecturers = allUsers.filter(
    (u) => u.role === 'LECTURER' && u.isActive
  ).length;
  statistics.totalAdmins = allUsers.filter((u) => u.role === 'ADMIN').length;

  statistics.usersByRole = {
    STUDENT: allUsers.filter((u) => u.role === 'STUDENT').length,
    LECTURER: allUsers.filter((u) => u.role === 'LECTURER').length,
    ADMIN: allUsers.filter((u) => u.role === 'ADMIN').length,
    PARENT: allUsers.filter((u) => u.role === 'PARENT').length,
  };

  statistics.monthlyRegistrations = Array(12).fill(0);
  allUsers.forEach((user) => {
    if (user.createdAt) {
      const date = new Date(user.createdAt);
      const month = date.getMonth();
      statistics.monthlyRegistrations[month]++;
    }
  });
}

function updateDashboardStats() {
  document.getElementById('totalUsers').textContent = statistics.totalUsers;
  document.getElementById('activeStudents').textContent =
    statistics.activeStudents;
  document.getElementById('activeLecturers').textContent =
    statistics.activeLecturers;
  document.getElementById('totalAdmins').textContent = statistics.totalAdmins;
}

function renderPieChart() {
  const canvas = document.getElementById('pieChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 100;

  const data = [
    {
      label: 'Students',
      value: statistics.usersByRole.STUDENT || 0,
      color: '#1e3a8a',
    },
    {
      label: 'Lecturers',
      value: statistics.usersByRole.LECTURER || 0,
      color: '#3b82f6',
    },
    {
      label: 'Admins',
      value: statistics.usersByRole.ADMIN || 0,
      color: '#60a5fa',
    },
    {
      label: 'Parents',
      value: statistics.usersByRole.PARENT || 0,
      color: '#93c5fd',
    },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let startAngle = -Math.PI / 2;

  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    startAngle += sliceAngle;
  });

  const legendY = canvas.height - 80;
  data.forEach((item, index) => {
    const x = 20 + (index % 2) * 120;
    const y = legendY + Math.floor(index / 2) * 20;

    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, 12, 12);

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--text-primary')
      .trim();
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText(`${item.label}: ${item.value}`, x + 18, y + 10);
  });
}

function renderBarChart() {
  const barChart = document.getElementById('barChart');
  if (!barChart) return;

  const maxValue = Math.max(...statistics.monthlyRegistrations, 1);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  barChart.innerHTML = statistics.monthlyRegistrations
    .map((value, index) => {
      const height = (value / maxValue) * 100;
      return `
            <div class="bar" style="height: ${height}%;" title="${months[index]}: ${value} users">
                <span class="bar-label">${months[index]}</span>
            </div>
        `;
    })
    .join('');
}

function renderRecentUsers() {
  const container = document.getElementById('recentUsersList');
  if (!container) return;

  const recentUsers = [...allUsers]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recentUsers.length === 0) {
    container.innerHTML = '<p class="loading">No users found</p>';
    return;
  }

  container.innerHTML = `
        <table class="user-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                </tr>
            </thead>
            <tbody>
                ${recentUsers
                  .map(
                    (user) => `
                    <tr>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${user.email}</td>
                        <td><span class="role-badge">${user.role}</span></td>
                        <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>${formatDate(user.createdAt)}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    `;
}

function renderUsersTable(users) {
  const container = document.getElementById('usersList');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<p class="loading">No users found</p>';
    return;
  }

  container.innerHTML = `
        <table class="user-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users
                  .map(
                    (user) => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${user.email}</td>
                        <td>${user.phoneNumber || 'N/A'}</td>
                        <td><span class="role-badge">${user.role}</span></td>
                        <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon" onclick="editUser(${user.id})" title="Edit">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                    </svg>
                                </button>
                                <button class="btn-icon" onclick="toggleUserStatus(${user.id}, ${user.isActive})" title="${user.isActive ? 'Deactivate' : 'Activate'}">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        ${
                                          user.isActive
                                            ? '<path d="M18 6L6 18"></path><path d="M6 6l12 12"></path>'
                                            : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                                        }
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    `;
}

async function loadUsersByRole(role) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/role/${role}`, {
      credentials: 'include',
    });

    if (!response.ok) throw new Error(`Failed to fetch ${role.toLowerCase()}s`);

    const users = await response.json();
    const containerId = role === 'STUDENT' ? 'studentsList' : 'lecturersList';
    renderRoleTable(users, containerId);
  } catch (error) {
    console.error(`Error loading ${role.toLowerCase()}s:`, error);
    showError(`Failed to load ${role.toLowerCase()}s`);
  }
}

function renderRoleTable(users, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<p class="loading">No users found</p>';
    return;
  }

  container.innerHTML = `
        <table class="user-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Registered</th>
                </tr>
            </thead>
            <tbody>
                ${users
                  .map(
                    (user) => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.firstName} ${user.lastName}</td>
                        <td>${user.email}</td>
                        <td>${user.phoneNumber || 'N/A'}</td>
                        <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>${formatDate(user.createdAt)}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    `;
}

function filterUsers() {
  const roleFilter = document.getElementById('roleFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;

  let filteredUsers = allUsers;

  if (roleFilter) {
    filteredUsers = filteredUsers.filter((user) => user.role === roleFilter);
  }

  if (statusFilter === 'active') {
    filteredUsers = filteredUsers.filter((user) => user.isActive);
  } else if (statusFilter === 'inactive') {
    filteredUsers = filteredUsers.filter((user) => !user.isActive);
  }

  renderUsersTable(filteredUsers);
}

function openUserModal(userId = null) {
  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');
  const title = document.getElementById('modalTitle');

  form.reset();

  if (userId) {
    title.textContent = 'Edit User';
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      document.getElementById('userId').value = user.id;
      document.getElementById('userEmail').value = user.email;
      document.getElementById('userFirstName').value = user.firstName;
      document.getElementById('userLastName').value = user.lastName;
      document.getElementById('userPhone').value = user.phoneNumber || '';
      document.getElementById('userRole').value = user.role;
      document.getElementById('userPassword').removeAttribute('required');
    }
  } else {
    title.textContent = 'Add User';
    document
      .getElementById('userPassword')
      .setAttribute('required', 'required');
  }

  modal.classList.add('active');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('active');
}

async function handleUserFormSubmit(e) {
  e.preventDefault();

  const userId = document.getElementById('userId').value;
  const userData = {
    email: document.getElementById('userEmail').value,
    password: document.getElementById('userPassword').value,
    firstName: document.getElementById('userFirstName').value,
    lastName: document.getElementById('userLastName').value,
    phoneNumber: document.getElementById('userPhone').value,
    role: document.getElementById('userRole').value,
  };

  try {
    let response;
    if (userId) {
      response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
    } else {
      response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    closeUserModal();
    await loadAllUsers();
    await loadDashboardData();
    showSuccess(
      userId ? 'User updated successfully' : 'User created successfully'
    );
  } catch (error) {
    console.error('Error saving user:', error);
    showError(error.message);
  }
}

async function editUser(userId) {
  openUserModal(userId);
}

window.editUser = editUser;

async function toggleUserStatus(userId, isActive) {
  try {
    const endpoint = isActive ? 'deactivate' : 'activate';
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/${endpoint}`,
      {
        method: 'PUT',
        credentials: 'include',
      }
    );

    if (!response.ok) throw new Error('Failed to update user status');

    await loadAllUsers();
    await loadDashboardData();
    showSuccess(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
  } catch (error) {
    console.error('Error toggling user status:', error);
    showError('Failed to update user status');
  }
}

window.toggleUserStatus = toggleUserStatus;

async function loadAnalytics() {
  const container = document.getElementById('detailedStats');
  if (!container) return;

  const activeUsers = allUsers.filter((u) => u.isActive).length;
  const inactiveUsers = allUsers.filter((u) => !u.isActive).length;

  container.innerHTML = `
        <div class="stats-list">
            <div class="stats-item">
                <div class="stats-item-label">Total Users</div>
                <div class="stats-item-value">${statistics.totalUsers}</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-label">Active Users</div>
                <div class="stats-item-value">${activeUsers}</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-label">Inactive Users</div>
                <div class="stats-item-value">${inactiveUsers}</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-label">Students</div>
                <div class="stats-item-value">${statistics.usersByRole.STUDENT || 0}</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-label">Lecturers</div>
                <div class="stats-item-value">${statistics.usersByRole.LECTURER || 0}</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-label">Admins</div>
                <div class="stats-item-value">${statistics.usersByRole.ADMIN || 0}</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-label">Parents</div>
                <div class="stats-item-value">${statistics.usersByRole.PARENT || 0}</div>
            </div>
            <div class="stats-item">
                <div class="stats-item-label">This Month</div>
                <div class="stats-item-value">${statistics.monthlyRegistrations[new Date().getMonth()]}</div>
            </div>
        </div>
    `;

  renderStatusPieChart();
  renderGrowthChart();
}

function renderStatusPieChart() {
  const canvas = document.getElementById('statusPieChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 100;

  const activeUsers = allUsers.filter((u) => u.isActive).length;
  const inactiveUsers = allUsers.filter((u) => !u.isActive).length;

  const data = [
    { label: 'Active', value: activeUsers, color: '#10b981' },
    { label: 'Inactive', value: inactiveUsers, color: '#ef4444' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let startAngle = -Math.PI / 2;

  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    startAngle += sliceAngle;
  });

  const legendY = canvas.height - 40;
  data.forEach((item, index) => {
    const x = 60 + index * 120;

    ctx.fillStyle = item.color;
    ctx.fillRect(x, legendY, 12, 12);

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--text-primary')
      .trim();
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText(`${item.label}: ${item.value}`, x + 18, legendY + 10);
  });
}

function renderGrowthChart() {
  const growthChart = document.getElementById('growthChart');
  if (!growthChart) return;

  const last6Months = statistics.monthlyRegistrations.slice(-6);
  const maxValue = Math.max(...last6Months, 1);
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  growthChart.innerHTML = last6Months
    .map((value, index) => {
      const height = (value / maxValue) * 100;
      return `
            <div class="bar" style="height: ${height}%;" title="${months[index]}: ${value} users">
                <span class="bar-label">${months[index]}</span>
            </div>
        `;
    })
    .join('');
}

function exportUsersPdf(role) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const users = allUsers.filter((u) => u.role === role);
  const title = role === 'STUDENT' ? 'Students Report' : 'Lecturers Report';

  doc.setFontSize(20);
  doc.text(title, 20, 20);

  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
  doc.text(`Total ${role.toLowerCase()}s: ${users.length}`, 20, 40);

  let yPosition = 55;
  doc.setFontSize(10);

  doc.text('ID', 20, yPosition);
  doc.text('Name', 40, yPosition);
  doc.text('Email', 100, yPosition);
  doc.text('Status', 170, yPosition);

  yPosition += 7;

  users.forEach((user, index) => {
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 20;
    }

    doc.text(user.id.toString(), 20, yPosition);
    doc.text(`${user.firstName} ${user.lastName}`, 40, yPosition);
    doc.text(user.email, 100, yPosition);
    doc.text(user.isActive ? 'Active' : 'Inactive', 170, yPosition);

    yPosition += 7;
  });

  doc.save(`${role.toLowerCase()}_report_${Date.now()}.pdf`);
  showSuccess('PDF report generated successfully');
}

function generateFullReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('Academic System - Full Report', 20, 20);

  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);

  doc.setFontSize(16);
  doc.text('System Statistics', 20, 50);

  doc.setFontSize(12);
  let yPos = 60;
  doc.text(`Total Users: ${statistics.totalUsers}`, 30, yPos);
  yPos += 10;
  doc.text(`Active Students: ${statistics.activeStudents}`, 30, yPos);
  yPos += 10;
  doc.text(`Active Lecturers: ${statistics.activeLecturers}`, 30, yPos);
  yPos += 10;
  doc.text(`Total Admins: ${statistics.totalAdmins}`, 30, yPos);
  yPos += 10;
  doc.text(`Total Parents: ${statistics.usersByRole.PARENT || 0}`, 30, yPos);

  yPos += 15;
  doc.setFontSize(16);
  doc.text('User Distribution by Role', 20, yPos);

  yPos += 10;
  doc.setFontSize(12);
  Object.entries(statistics.usersByRole).forEach(([role, count]) => {
    doc.text(`${role}: ${count}`, 30, yPos);
    yPos += 8;
  });

  yPos += 10;
  doc.setFontSize(16);
  doc.text('Monthly Registrations (2025)', 20, yPos);

  yPos += 10;
  doc.setFontSize(10);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  statistics.monthlyRegistrations.forEach((count, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(`${months[index]}: ${count} users`, 30, yPos);
    yPos += 7;
  });

  doc.save(`full_report_${Date.now()}.pdf`);
  showSuccess('Full report generated successfully');
}

function generateUserReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('User Statistics Report', 20, 20);

  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

  let yPos = 45;
  doc.setFontSize(14);
  doc.text('Overview', 20, yPos);

  yPos += 10;
  doc.setFontSize(11);
  doc.text(`Total Users: ${statistics.totalUsers}`, 30, yPos);
  yPos += 8;
  doc.text(
    `Active Users: ${allUsers.filter((u) => u.isActive).length}`,
    30,
    yPos
  );
  yPos += 8;
  doc.text(
    `Inactive Users: ${allUsers.filter((u) => !u.isActive).length}`,
    30,
    yPos
  );

  yPos += 15;
  doc.setFontSize(14);
  doc.text('By Role', 20, yPos);

  yPos += 10;
  doc.setFontSize(11);
  Object.entries(statistics.usersByRole).forEach(([role, count]) => {
    doc.text(`${role}: ${count}`, 30, yPos);
    yPos += 8;
  });

  doc.save(`user_statistics_${Date.now()}.pdf`);
  showSuccess('User statistics report generated successfully');
}

function generateRoleReport(role) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const users = allUsers.filter((u) => u.role === role);

  doc.setFontSize(20);
  doc.text(`${role} Report`, 20, 20);

  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
  doc.text(`Total: ${users.length}`, 20, 40);
  doc.text(`Active: ${users.filter((u) => u.isActive).length}`, 20, 50);

  let yPos = 70;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('ID', 20, yPos);
  doc.text('Name', 40, yPos);
  doc.text('Email', 100, yPos);
  doc.text('Phone', 150, yPos);

  yPos += 7;
  doc.setFont(undefined, 'normal');

  users.forEach((user) => {
    if (yPos > 280) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(user.id.toString(), 20, yPos);
    doc.text(`${user.firstName} ${user.lastName}`, 40, yPos);
    doc.text(user.email, 100, yPos);
    doc.text(user.phoneNumber || 'N/A', 150, yPos);

    yPos += 7;
  });

  doc.save(`${role.toLowerCase()}_report_${Date.now()}.pdf`);
  showSuccess(`${role} report generated successfully`);
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

function showSuccess(message) {
  alert(message);
}

function showError(message) {
  alert('Error: ' + message);
}
