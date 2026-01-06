// ============================================
// PARENT.JS - COMPLETE FIXED VERSION
// ============================================

const API_BASE_URL = 'http://localhost:8080/api';

let currentUser = null;
let currentStudent = null;
let allCourses = [];
let allPayments = [];
let allNotifications = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Parent Dashboard initializing...');
    initializeApp();
    setupEventListeners();
    loadTheme();
});

// ============================================
// INITIALIZATION
// ============================================
function initializeApp() {
    let parentId = localStorage.getItem('parentId') ||
                   localStorage.getItem('unt_userId') ||
                   sessionStorage.getItem('userId');

    const userRole = localStorage.getItem('unt_userRole') ||
                     sessionStorage.getItem('userRole');

    console.log('🔍 Login check:', { parentId, userRole });

    if (!parentId || userRole !== 'PARENT') {
        console.log('❌ Not a parent, redirecting...');
        window.location.href = '../index.html';
        return;
    }

    console.log('✅ Parent authenticated, loading data...');
    loadParentData(parentId);
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);

    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const notificationToggle = document.getElementById('notificationToggle');
    if (notificationToggle) notificationToggle.addEventListener('click', toggleNotificationDropdown);

    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) markAllReadBtn.addEventListener('click', markAllNotificationsRead);

    const markAllRead = document.getElementById('markAllRead');
    if (markAllRead) markAllRead.addEventListener('click', markAllNotificationsRead);

    const exportCoursesBtn = document.getElementById('exportCoursesBtn');
    if (exportCoursesBtn) exportCoursesBtn.addEventListener('click', exportCoursesPDF);

    const exportPaymentsPdfBtn = document.getElementById('exportPaymentsPdfBtn');
    if (exportPaymentsPdfBtn) exportPaymentsPdfBtn.addEventListener('click', exportPaymentsPDF);

    const searchPayment = document.getElementById('searchPayment');
    if (searchPayment) searchPayment.addEventListener('input', filterPayments);

    const paymentStatusFilter = document.getElementById('paymentStatusFilter');
    if (paymentStatusFilter) paymentStatusFilter.addEventListener('change', filterPayments);

    const searchNotification = document.getElementById('searchNotification');
    if (searchNotification) searchNotification.addEventListener('input', filterNotifications);

    const notificationStatusFilter = document.getElementById('notificationStatusFilter');
    if (notificationStatusFilter) notificationStatusFilter.addEventListener('change', filterNotifications);

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificationDropdown');
        const toggle = document.getElementById('notificationToggle');
        if (dropdown && toggle && !dropdown.contains(e.target) && !toggle.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// ============================================
// DATA LOADING
// ============================================
async function loadParentData(parentId) {
    try {
        console.log('📡 Fetching parent data...');
        const response = await fetch(`${API_BASE_URL}/parents/${parentId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to load parent data');
        }

        currentUser = await response.json();
        console.log('✅ Parent loaded:', currentUser);

        document.getElementById('parentName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        document.getElementById('parentEmail').textContent = currentUser.email;

        if (currentUser.children && currentUser.children.length > 0) {
            currentStudent = currentUser.children[0];

            if (currentStudent.enrollments) allCourses = currentStudent.enrollments;
            if (currentStudent.payments) allPayments = currentStudent.payments;

            await loadAllData();
        } else {
            showError('No student linked to this parent account');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showError('Failed to load parent data: ' + error.message);
        setTimeout(() => window.location.href = '../index.html', 3000);
    }
}

async function loadAllData() {
    await Promise.all([
        loadStudentInfo(),
        loadTimetable(),
        loadNotifications()
    ]);

    updateDashboardStats();
    renderCharts();
    renderCourses();
    renderPayments();
}

async function loadStudentInfo() {
    try {
        if (!currentStudent?.id) return;

        const response = await fetch(`${API_BASE_URL}/students/${currentStudent.id}`);
        if (response.ok) {
            const studentData = await response.json();
            currentStudent = { ...currentStudent, ...studentData };
            renderStudentInfo();
            renderParentProfile();
        }
    } catch (error) {
        console.error('❌ Error loading student:', error);
    }
}

async function loadTimetable() {
    try {
        if (!currentStudent?.id) return;
        const response = await fetch(`${API_BASE_URL}/timetable/student/${currentStudent.id}`);
        if (response.ok) {
            const timetable = await response.json();
            renderTimetable(timetable);
        }
    } catch (error) {
        console.error('❌ Error loading timetable:', error);
    }
}

async function loadNotifications() {
    try {
        if (!currentStudent?.id) return;
        const response = await fetch(`${API_BASE_URL}/notifications/user/${currentStudent.id}`);
        if (response.ok) {
            allNotifications = await response.json();
            renderNotifications();
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
    }
}

// ============================================
// RENDERING FUNCTIONS
// ============================================
function renderStudentInfo() {
    if (!currentStudent) return;

    const personalInfo = `
        <div class="info-item">
            <span class="info-label">Full Name:</span>
            <span class="info-value">${currentStudent.firstName} ${currentStudent.lastName}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Student ID:</span>
            <span class="info-value">${currentStudent.studentId}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${currentStudent.email}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Phone:</span>
            <span class="info-value">${currentStudent.phoneNumber || 'N/A'}</span>
        </div>
    `;

    const academicInfo = `
        <div class="info-item">
            <span class="info-label">Faculty:</span>
            <span class="info-value">${currentStudent.faculty}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Program:</span>
            <span class="info-value">${currentStudent.program}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Year:</span>
            <span class="info-value">${currentStudent.currentYear}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Semester:</span>
            <span class="info-value">${currentStudent.currentSemester}</span>
        </div>
    `;

    const studentPersonalInfo = document.getElementById('studentPersonalInfo');
    if (studentPersonalInfo) studentPersonalInfo.innerHTML = personalInfo;

    const studentAcademicInfo = document.getElementById('studentAcademicInfo');
    if (studentAcademicInfo) studentAcademicInfo.innerHTML = academicInfo;
}

function renderCourses() {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;

    if (allCourses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9">No courses enrolled</td></tr>';
        return;
    }

    const rows = allCourses.map(enrollment => {
        const course = enrollment.course || {};
        const status = enrollment.status || 'ACTIVE';

        return `
            <tr>
                <td>${course.courseCode || 'N/A'}</td>
                <td>${course.courseName || 'N/A'}</td>
                <td>${course.credits || 'N/A'}</td>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
                <td>${enrollment.midtermGrade || '-'}</td>
                <td>${enrollment.finalGrade || '-'}</td>
                <td>${enrollment.totalGrade || '-'}</td>
                <td><span class="grade-badge">${enrollment.letterGrade || '-'}</span></td>
                <td>${enrollment.attendancePercentage ? enrollment.attendancePercentage.toFixed(1) + '%' : 'N/A'}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

function renderPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (allPayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No payment records found</td></tr>';
        return;
    }

    const rows = allPayments.map(payment => {
        const status = payment.paymentStatus || 'PENDING';
        const method = payment.paymentMethod || 'N/A';

        return `
            <tr>
                <td>${payment.transactionReference || 'N/A'}</td>
                <td>$${(payment.amount || 0).toFixed(2)}</td>
                <td>${payment.academicYear || 'N/A'}</td>
                <td>${payment.semester || 'N/A'}</td>
                <td>${method}</td>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
                <td>${formatDate(payment.paymentDate)}</td>
                <td>
                    <button class="btn-icon" onclick="viewPaymentReceipt(${payment.id})" title="View Receipt">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

function renderTimetable(timetableData) {
    const container = document.getElementById('timetableContent');
    if (!container) return;

    if (!timetableData || timetableData.length === 0) {
        container.innerHTML = '<div class="empty-state">No timetable entries found</div>';
        return;
    }

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const timeSlots = [...new Set(timetableData.map(t => t.timeSlot))].sort();

    const grouped = {};
    days.forEach(day => {
        grouped[day] = {};
        timeSlots.forEach(slot => grouped[day][slot] = null);
    });

    timetableData.forEach(entry => {
        if (grouped[entry.dayOfWeek]) grouped[entry.dayOfWeek][entry.timeSlot] = entry;
    });

    let html = '<table class="timetable-table"><thead><tr><th>Time</th>';
    days.forEach(day => html += `<th>${day}</th>`);
    html += '</tr></thead><tbody>';

    timeSlots.forEach(slot => {
        html += `<tr><td class="time-slot">${slot}</td>`;
        days.forEach(day => {
            const entry = grouped[day][slot];
            if (entry) {
                html += `<td class="timetable-cell filled">
                    <div class="course-code">${entry.courseCode}</div>
                    <div class="course-name">${entry.courseName}</div>
                    <div class="course-room">${entry.classroom}</div>
                    <div class="course-lecturer">${entry.lecturerName}</div>
                </td>`;
            } else {
                html += '<td class="timetable-cell"></td>';
            }
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderNotifications() {
    const container = document.getElementById('notificationsListContent');
    if (!container || allNotifications.length === 0) {
        if (container) container.innerHTML = '<div class="empty-state">No notifications</div>';
        return;
    }

    const sorted = [...allNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    container.innerHTML = sorted.map(n => `
        <div class="notification-item ${!n.isRead ? 'unread' : ''}" data-id="${n.id}">
            <div class="notification-content">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <span class="notification-time">${formatTimeAgo(n.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

function renderParentProfile() {
    if (!currentUser || !currentStudent) return;

    const parentInfo = `
        <div class="info-item">
            <span class="info-label">Full Name:</span>
            <span class="info-value">${currentUser.firstName} ${currentUser.lastName}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Email:</span>
            <span class="info-value">${currentUser.email}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Relationship:</span>
            <span class="info-value">${currentUser.relationship}</span>
        </div>
    `;

    const parentInfoEl = document.getElementById('parentInfo');
    if (parentInfoEl) parentInfoEl.innerHTML = parentInfo;
}

function updateDashboardStats() {
    if (!currentStudent) return;

    const enrolledCount = allCourses.length;
    const pendingPayments = allPayments.filter(p => (p.paymentStatus || p.status) === 'PENDING').length;

    setTextContent('totalCourses', enrolledCount);
    setTextContent('pendingPayments', pendingPayments);
}

function renderCharts() {
    // Add chart rendering if needed
}

function updateNotificationBadge() {
    const unreadCount = allNotifications.filter(n => !n.isRead).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

// ============================================
// FILTERS
// ============================================
function filterPayments() {
    const searchInput = document.getElementById('searchPayment');
    const statusFilter = document.getElementById('paymentStatusFilter');
    if (!searchInput || !statusFilter) return;

    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;

    const filtered = allPayments.filter(payment => {
        const status = payment.paymentStatus || payment.status;
        const matchesSearch = payment.transactionReference?.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusValue || status === statusValue;
        return matchesSearch && matchesStatus;
    });

    renderFilteredPayments(filtered);
}

function renderFilteredPayments(filtered) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No payments found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(payment => {
        const status = payment.paymentStatus || 'PENDING';
        const method = payment.paymentMethod || 'N/A';

        return `
            <tr>
                <td>${payment.transactionReference || 'N/A'}</td>
                <td>$${(payment.amount || 0).toFixed(2)}</td>
                <td>${payment.academicYear || 'N/A'}</td>
                <td>${payment.semester || 'N/A'}</td>
                <td>${method}</td>
                <td><span class="status-badge status-${status.toLowerCase()}">${status}</span></td>
                <td>${formatDate(payment.paymentDate)}</td>
                <td>
                    <button class="btn-icon" onclick="viewPaymentReceipt(${payment.id})">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterNotifications() {
    // Add notification filtering if needed
}

// ============================================
// ACTIONS
// ============================================
function viewPaymentReceipt(paymentId) {
    const payment = allPayments.find(p => p.id === paymentId);
    if (!payment) return;

    alert(`Payment Receipt\n\nReference: ${payment.transactionReference}\nAmount: $${payment.amount.toFixed(2)}\nStatus: ${payment.paymentStatus}`);
}

async function markNotificationRead(notificationId) {
    try {
        await fetch(`${API_BASE_URL}/notifications/${notificationId}/mark-read`, { method: 'PUT' });
        const notification = allNotifications.find(n => n.id == notificationId);
        if (notification) notification.isRead = true;
        renderNotifications();
        updateNotificationBadge();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsRead() {
    if (!currentStudent) return;
    try {
        await fetch(`${API_BASE_URL}/notifications/user/${currentStudent.id}/mark-all-read`, { method: 'PUT' });
        allNotifications.forEach(n => n.isRead = true);
        renderNotifications();
        updateNotificationBadge();
        showSuccess('All notifications marked as read');
    } catch (error) {
        console.error('Error:', error);
    }
}

function exportCoursesPDF() {
    showSuccess('PDF export feature coming soon');
}

function exportPaymentsPDF() {
    showSuccess('PDF export feature coming soon');
}

// ============================================
// NAVIGATION & UI
// ============================================
function handleNavigation(e) {
    e.preventDefault();
    const targetPage = this.dataset.page;

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    this.classList.add('active');

    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    const targetElement = document.getElementById(`${targetPage}Page`);
    if (targetElement) targetElement.classList.add('active');

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const titles = {
            'dashboard': 'Dashboard',
            'student-info': 'Student Information',
            'courses': 'Courses',
            'timetable': 'Timetable',
            'payments': 'Payments',
            'notifications': 'Notifications',
            'profile': 'Parent Profile'
        };
        pageTitle.textContent = titles[targetPage] || 'Dashboard';
    }

    if (targetPage === 'profile') renderParentProfile();
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../index.html';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

// ============================================
// UTILITIES
// ============================================
function setTextContent(id, content) {
    const el = document.getElementById(id);
    if (el) el.textContent = content;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function formatTimeAgo(dateString) {
    const diffMs = Date.now() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
}

function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    alert(message);
}

// Export for global access
window.viewPaymentReceipt = viewPaymentReceipt;
window.markNotificationRead = markNotificationRead;