// lecturer.js - Complete Implementation

// ===== API CONFIGURATION =====
const API_BASE_URL = 'http://localhost:8080/api';

// ===== GLOBAL STATE =====
let currentLecturer = null;
let allCourses = [];
let allContent = [];
let allEnrollments = [];
let allTimetable = [];
let charts = {};


// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
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
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatTime(timeString) {
    if (!timeString) return 'N/A';

    // Handle array format [hour, minute, second] or [hour, minute]
    if (Array.isArray(timeString)) {
        const [hour, minute] = timeString;
        const h = String(hour).padStart(2, '0');
        const m = String(minute).padStart(2, '0');
        return `${h}:${m}`;
    }

    // Handle string format "HH:mm:ss" or "HH:mm"
    if (typeof timeString === 'string') {
        // Extract HH:mm from "HH:mm:ss"
        return timeString.substring(0, 5);
    }

    // Handle object format {hour: X, minute: Y}
    if (typeof timeString === 'object' && timeString.hour !== undefined) {
        const h = String(timeString.hour).padStart(2, '0');
        const m = String(timeString.minute || 0).padStart(2, '0');
        return `${h}:${m}`;
    }

    return 'N/A';
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function calculateGrade(midterm, finalGrade) {
    if (!midterm || !finalGrade) return 'N/A';
    const total = (parseFloat(midterm) + parseFloat(finalGrade)) / 2;
    if (total >= 90) return 'A';
    if (total >= 80) return 'B';
    if (total >= 70) return 'C';
    if (total >= 60) return 'D';
    return 'F';
}





async function checkAuthentication() {
    try {
        const userId = sessionStorage.getItem('userId');
        const userRole = sessionStorage.getItem('userRole');

        console.log('🔐 Checking authentication:', { userId, userRole });

        if (!userId || userRole !== 'LECTURER') {
            console.warn('⚠️ User not authenticated or wrong role - redirecting to login');
            window.location.href = '../html/login.html'; // ✅ Vérifiez ce chemin
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Authentication check error:', error);
        return false;
    }
}





async function loadLecturerProfile() {
    try {
        const userId = sessionStorage.getItem('userId');
        const userEmail = sessionStorage.getItem('userEmail');

        if (!userEmail) {
            throw new Error('No email found in session');
        }

        // Get lecturer by email
        const response = await fetch(`${API_BASE_URL}/lecturers`);
        if (!response.ok) throw new Error('Failed to fetch lecturers');

        const lecturers = await response.json();
        currentLecturer = lecturers.find(l => l.email === userEmail);

        if (!currentLecturer) {
            throw new Error('Lecturer profile not found');
        }

        // Update UI
        document.getElementById('lecturerName').textContent =
            `${currentLecturer.firstName} ${currentLecturer.lastName}`;
        document.getElementById('lecturerEmail').textContent = currentLecturer.email;

        if (currentLecturer.profilePicture) {
            document.getElementById('profileAvatar').src = currentLecturer.profilePicture;
        }

        return currentLecturer;
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile', 'error');
        return null;
    }
}

// ===== LECTURER API METHODS =====
async function getLecturerById(id) {
    const response = await fetch(`${API_BASE_URL}/lecturers/${id}`);
    if (!response.ok) throw new Error('Failed to fetch lecturer');
    return await response.json();
}

async function getLecturerByEmployeeId(employeeId) {
    const response = await fetch(`${API_BASE_URL}/lecturers/employee/${employeeId}`);
    if (!response.ok) throw new Error('Failed to fetch lecturer');
    return await response.json();
}

async function getAllLecturers() {
    const response = await fetch(`${API_BASE_URL}/lecturers`);
    if (!response.ok) throw new Error('Failed to fetch lecturers');
    return await response.json();
}

async function getLecturersByDepartment(department) {
    const response = await fetch(`${API_BASE_URL}/lecturers/department/${department}`);
    if (!response.ok) throw new Error('Failed to fetch lecturers');
    return await response.json();
}

async function getLecturersByQualification(qualification) {
    const response = await fetch(`${API_BASE_URL}/lecturers/qualification/${qualification}`);
    if (!response.ok) throw new Error('Failed to fetch lecturers');
    return await response.json();
}

async function updateLecturer(id, data) {
    const response = await fetch(`${API_BASE_URL}/lecturers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update lecturer');
    return await response.json();
}

async function assignCourseToLecturer(lecturerId, courseId) {
    const response = await fetch(`${API_BASE_URL}/lecturers/${lecturerId}/assign-course/${courseId}`, {
        method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to assign course');
    return await response.text();
}

// ===== COURSE API METHODS =====
async function getAllCourses() {
    const response = await fetch(`${API_BASE_URL}/courses`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
}

async function getCourseById(id) {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);
    if (!response.ok) throw new Error('Failed to fetch course');
    return await response.json();
}

async function getCourseByCode(code) {
    const response = await fetch(`${API_BASE_URL}/courses/code/${code}`);
    if (!response.ok) throw new Error('Failed to fetch course');
    return await response.json();
}

async function getCoursesByFaculty(faculty) {
    const response = await fetch(`${API_BASE_URL}/courses/faculty/${faculty}`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
}

async function getCoursesByDepartment(department) {
    const response = await fetch(`${API_BASE_URL}/courses/department/${department}`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
}

async function getActiveCourses() {
    const response = await fetch(`${API_BASE_URL}/courses/active`);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return await response.json();
}

// ===== COURSE CONTENT API METHODS =====
async function getAllContent() {
    const response = await fetch(`${API_BASE_URL}/course-content`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return await response.json();
}

async function getContentById(id) {
    const response = await fetch(`${API_BASE_URL}/course-content/${id}`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return await response.json();
}

async function getContentByCourse(courseId) {
    const response = await fetch(`${API_BASE_URL}/course-content/course/${courseId}`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return await response.json();
}

async function getContentByLecturer(lecturerId) {
    const response = await fetch(`${API_BASE_URL}/course-content/lecturer/${lecturerId}`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return await response.json();
}

async function getPendingContent() {
    const response = await fetch(`${API_BASE_URL}/course-content/pending`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return await response.json();
}

async function getApprovedContentForCourse(courseId) {
    const response = await fetch(`${API_BASE_URL}/course-content/course/${courseId}/approved`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return await response.json();
}

async function uploadContent(formData) {
    const response = await fetch(`${API_BASE_URL}/course-content/upload`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) throw new Error('Failed to upload content');
    return await response.json();
}

async function deleteContent(id) {
    const response = await fetch(`${API_BASE_URL}/course-content/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete content');
    return await response.text();
}

// ===== ENROLLMENT API METHODS =====
async function getAllEnrollments() {
    const response = await fetch(`${API_BASE_URL}/enrollments`);
    if (!response.ok) throw new Error('Failed to fetch enrollments');
    return await response.json();
}

async function getEnrollmentById(id) {
    const response = await fetch(`${API_BASE_URL}/enrollments/${id}`);
    if (!response.ok) throw new Error('Failed to fetch enrollment');
    return await response.json();
}

async function getStudentEnrollments(studentId) {
    const response = await fetch(`${API_BASE_URL}/enrollments/student/${studentId}`);
    if (!response.ok) throw new Error('Failed to fetch enrollments');
    return await response.json();
}

async function getCourseEnrollments(courseId) {
    const response = await fetch(`${API_BASE_URL}/enrollments/course/${courseId}`);
    if (!response.ok) throw new Error('Failed to fetch enrollments');
    return await response.json();
}

async function getEnrollmentsByStatus(status) {
    const response = await fetch(`${API_BASE_URL}/enrollments/status/${status}`);
    if (!response.ok) throw new Error('Failed to fetch enrollments');
    return await response.json();
}

async function updateEnrollment(id, data) {
    const response = await fetch(`${API_BASE_URL}/enrollments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update enrollment');
    return await response.json();
}

async function updateGrade(id, midterm, finalGrade) {
    const response = await fetch(`${API_BASE_URL}/enrollments/${id}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ midterm, finalGrade })
    });
    if (!response.ok) throw new Error('Failed to update grade');
    return await response.text();
}

async function updateAttendance(id, attendance) {
    const response = await fetch(`${API_BASE_URL}/enrollments/${id}/attendance?attendance=${attendance}`, {
        method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to update attendance');
    return await response.text();
}

// ===== TIMETABLE API METHODS =====
async function getAllTimetables() {
    const response = await fetch(`${API_BASE_URL}/timetable`);
    if (!response.ok) throw new Error('Failed to fetch timetables');
    return await response.json();
}

async function getTimetableById(id) {
    const response = await fetch(`${API_BASE_URL}/timetable/${id}`);
    if (!response.ok) throw new Error('Failed to fetch timetable');
    return await response.json();
}

async function getTimetableByCourse(courseId) {
    const response = await fetch(`${API_BASE_URL}/timetable/course/${courseId}`);
    if (!response.ok) throw new Error('Failed to fetch timetable');
    return await response.json();
}

async function getLecturerTimetable(lecturerId) {
    const response = await fetch(`${API_BASE_URL}/timetable/lecturer/${lecturerId}`);
    if (!response.ok) throw new Error('Failed to fetch timetable');
    return await response.json();
}

// ===== NOTIFICATION API METHODS =====
async function getUserNotifications(userId) {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return await response.json();
}

async function getUnreadNotifications(userId) {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/unread`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return await response.json();
}

async function countUnreadNotifications(userId) {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/count-unread`);
    if (!response.ok) throw new Error('Failed to count notifications');
    const data = await response.json();
    return data.count;
}

async function markNotificationAsRead(id) {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/mark-read`, {
        method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return await response.text();
}

async function markAllNotificationsAsRead(userId) {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/mark-all-read`, {
        method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
    return await response.text();
}

async function loadDashboard() {
    try {
        if (!currentLecturer) {
            console.error('❌ No current lecturer found');
            showNotification('Please log in again', 'error');
            return;
        }

        console.log('📊 Loading dashboard for lecturer:', currentLecturer.id);
        console.log('📧 Lecturer email:', currentLecturer.email);

        // ✅ FIX: Fetch courses directly from the dedicated endpoint
        const coursesResponse = await fetch(`${API_BASE_URL}/lecturers/${currentLecturer.id}/courses`);

        if (!coursesResponse.ok) {
            throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
        }

        const coursesData = await coursesResponse.json();
        console.log('📚 Courses fetched:', coursesData);

        // ✅ FIX: Handle the response properly
        let courses = [];
        if (Array.isArray(coursesData)) {
            courses = coursesData;
        } else if (coursesData.courses && Array.isArray(coursesData.courses)) {
            courses = coursesData.courses;
        } else {
            console.warn('⚠️ Unexpected courses data format:', coursesData);
        }

        console.log('✅ Processed courses:', courses.length);

        // Store courses globally
        allCourses = courses;

        // Load other data in parallel
        const [content, timetable] = await Promise.all([
            getContentByLecturer(currentLecturer.id),
            getLecturerTimetable(currentLecturer.id)
        ]);

        allContent = content;
        allTimetable = timetable;

        console.log('📄 Content loaded:', content.length);
        console.log('📅 Timetable loaded:', timetable.length);

        // Calculate statistics
        const approvedContent = content.filter(c => c.approvalStatus === 'APPROVED').length;

        // Get all enrollments for lecturer's courses
        let allEnrollments = [];
        if (courses.length > 0) {
            const courseIds = courses.map(c => c.id);
            console.log('🔍 Fetching enrollments for course IDs:', courseIds);

            const enrollmentPromises = courseIds.map(id => getCourseEnrollments(id));
            const enrollmentArrays = await Promise.all(enrollmentPromises);
            allEnrollments = enrollmentArrays.flat();

            console.log('👥 Total enrollments:', allEnrollments.length);
        } else {
            console.warn('⚠️ No courses assigned to this lecturer');
        }

        // Store enrollments globally
        window.allEnrollments = allEnrollments;

        const uniqueStudents = new Set(allEnrollments.map(e => e.student?.id)).size;

        // ✅ UPDATE STATS - Use actual course count
        console.log('📊 Updating dashboard stats:');
        console.log('  - Total Courses:', courses.length);
        console.log('  - Total Content:', content.length);
        console.log('  - Total Students:', uniqueStudents);
        console.log('  - Approved Content:', approvedContent);

        // Update DOM elements
        const totalCoursesElement = document.getElementById('totalCourses');
        const totalContentElement = document.getElementById('totalContent');
        const totalStudentsElement = document.getElementById('totalStudents');
        const approvedContentElement = document.getElementById('approvedContent');

        if (totalCoursesElement) {
            totalCoursesElement.textContent = courses.length;
            console.log('✅ Updated totalCourses display');
        } else {
            console.error('❌ Element #totalCourses not found in DOM');
        }

        if (totalContentElement) {
            totalContentElement.textContent = content.length;
            console.log('✅ Updated totalContent display');
        } else {
            console.error('❌ Element #totalContent not found in DOM');
        }

        if (totalStudentsElement) {
            totalStudentsElement.textContent = uniqueStudents;
            console.log('✅ Updated totalStudents display');
        } else {
            console.error('❌ Element #totalStudents not found in DOM');
        }

        if (approvedContentElement) {
            approvedContentElement.textContent = approvedContent;
            console.log('✅ Updated approvedContent display');
        } else {
            console.error('❌ Element #approvedContent not found in DOM');
        }

        // Load charts
        console.log('📈 Loading dashboard charts...');
        loadDashboardCharts();

        // Load recent content
        console.log('📋 Loading recent content...');
        loadRecentContent();

        // Load today's schedule
        console.log('📅 Loading today\'s schedule...');
        loadTodaySchedule();

        console.log('✅ Dashboard loaded successfully');
        showNotification(`Dashboard loaded: ${courses.length} courses, ${uniqueStudents} students`, 'success');

    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
        console.error('Stack trace:', error.stack);
        showNotification('Failed to load dashboard data: ' + error.message, 'error');

        // Show error state in UI
        const totalCoursesElement = document.getElementById('totalCourses');
        if (totalCoursesElement) {
            totalCoursesElement.textContent = '0';
            totalCoursesElement.style.color = '#ef4444';
        }
    }
}




function loadDashboardCharts() {
    // Content by Type Chart
    const contentTypes = {};
    allContent.forEach(c => {
        contentTypes[c.contentType] = (contentTypes[c.contentType] || 0) + 1;
    });

    if (charts.contentTypeChart) charts.contentTypeChart.destroy();
    const ctxType = document.getElementById('contentTypeChart');
    if (ctxType) {
        charts.contentTypeChart = new Chart(ctxType, {
            type: 'doughnut',
            data: {
                labels: Object.keys(contentTypes),
                datasets: [{
                    data: Object.values(contentTypes),
                    backgroundColor: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Content Status Chart
    const contentStatus = {
        APPROVED: allContent.filter(c => c.approvalStatus === 'APPROVED').length,
        PENDING: allContent.filter(c => c.approvalStatus === 'PENDING').length,
        REJECTED: allContent.filter(c => c.approvalStatus === 'REJECTED').length
    };

    if (charts.contentStatusChart) charts.contentStatusChart.destroy();
    const ctxStatus = document.getElementById('contentStatusChart');
    if (ctxStatus) {
        charts.contentStatusChart = new Chart(ctxStatus, {
            type: 'bar',
            data: {
                labels: Object.keys(contentStatus),
                datasets: [{
                    label: 'Content Count',
                    data: Object.values(contentStatus),
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}





function loadRecentContent() {
    const container = document.getElementById('recentContent');
    if (!container) return;

    const recentContent = allContent
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
        .slice(0, 5);

    if (recentContent.length === 0) {
        container.innerHTML = `
            <div class="empty-content-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p>No content uploaded yet</p>
                <small>Start by uploading your first course content</small>
            </div>
        `;
        return;
    }

    container.innerHTML = recentContent.map(content => {
        const statusColor = getStatusColor(content.approvalStatus);
        const statusIcon = getStatusIcon(content.approvalStatus);

        return `
            <div class="recent-content-item">
                <div class="content-icon" style="background: ${statusColor}15; color: ${statusColor};">
                    ${statusIcon}
                </div>
                <div class="content-details">
                    <div class="content-title">${escapeHtml(content.title)}</div>
                    <div class="content-meta">
                        <span class="content-type">${content.contentType}</span>
                        <span class="content-separator">•</span>
                        <span class="content-course">${content.course?.courseName || 'N/A'}</span>
                    </div>
                </div>
                <div class="content-status">
                    <span class="status-badge status-${content.approvalStatus.toLowerCase()}">${content.approvalStatus}</span>
                    <span class="content-date">${formatDate(content.uploadDate)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Helper functions
function getStatusIcon(status) {
    const icons = {
        'APPROVED': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        'PENDING': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        'REJECTED': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    };
    return icons[status] || icons['PENDING'];
}






function loadTodaySchedule() {
    const container = document.getElementById('todaySchedule');
    if (!container) return;

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const todaySchedule = allTimetable.filter(t => t.dayOfWeek === today);

    if (todaySchedule.length === 0) {
        container.innerHTML = '<div class="loading">No classes scheduled for today</div>';
        return;
    }

    container.innerHTML = todaySchedule.map(schedule => `
        <div class="schedule-item">
            <div class="schedule-time">${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}</div>
            <div class="schedule-course">${schedule.course?.courseName || 'N/A'}</div>
            <div class="schedule-room">${schedule.classroom}, ${schedule.building || ''}</div>
        </div>
    `).join('');
}

function getStatusColor(status) {
    const colors = {
        'APPROVED': '#10b981',
        'PENDING': '#f59e0b',
        'REJECTED': '#ef4444'
    };
    return colors[status] || '#6b7280';
}

// ===== PROFILE FUNCTIONS =====
async function loadProfilePage() {
    try {
        if (!currentLecturer) return;

        const profileDetails = document.getElementById('profileDetails');
        if (profileDetails) {
            profileDetails.innerHTML = `
                <div class="profile-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                    <div class="profile-field">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Full Name</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.firstName} ${currentLecturer.lastName}</div>
                    </div>
                    <div class="profile-field">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Employee ID</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.employeeId}</div>
                    </div>
                    <div class="profile-field">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Email</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.email}</div>
                    </div>
                    <div class="profile-field">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Phone</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.phoneNumber}</div>
                    </div>
                    <div class="profile-field">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Department</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.department}</div>
                    </div>
                    <div class="profile-field">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Qualification</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.qualification}</div>
                    </div>
                    <div class="profile-field">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Hire Date</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${formatDate(currentLecturer.hireDate)}</div>
                    </div>
                    <div class="profile-field">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Office Location</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.officeLocation || 'N/A'}</div>
                    </div>
                    <div class="profile-field" style="grid-column: 1 / -1;">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Specialization</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.specialization || 'N/A'}</div>
                    </div>
                    <div class="profile-field" style="grid-column: 1 / -1;">
                        <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem; display: block; margin-bottom: 0.5rem;">Office Hours</label>
                        <div style="color: var(--text-primary); font-size: 1rem;">${currentLecturer.officeHours || 'N/A'}</div>
                    </div>
                </div>
            `;
        }

        const professionalInfo = document.getElementById('professionalInfo');
        if (professionalInfo) {
            professionalInfo.innerHTML = `
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
                    <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${allCourses.length}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">Courses Teaching</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${allContent.length}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">Content Uploaded</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: var(--bg-primary); border-radius: 8px;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${new Set(allEnrollments.map(e => e.student?.id)).size}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">Total Students</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile', 'error');
    }
}


// ===== COURSES FUNCTIONS - COMPLETE FIXED VERSION =====






// ===== COURSES FUNCTIONS - COMPLETE FIXED VERSION =====




// ===== COURSES FUNCTIONS - COMPLETE FIXED VERSION =====




// ===== COURSES FUNCTIONS - COMPLETE FIXED VERSION =====

/**
 * Load courses page with assigned courses for the current lecturer
 * This function fetches the lecturer data including assigned courses and displays them
 */
async function loadCoursesPage() {
    try {
        console.log('🔵 Loading courses page for lecturer...');

        if (!currentLecturer) {
            console.error('❌ No current lecturer found');
            showNotification('Please log in again', 'error');
            return;
        }

        console.log('📋 Current Lecturer ID:', currentLecturer.id);
        console.log('📋 Current Lecturer Email:', currentLecturer.email);

        // Show loading state
        const tbody = document.getElementById('coursesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading courses...</td></tr>';
        }

        // ✅ FIX: Fetch fresh lecturer data with courses
        const response = await fetch(`${API_BASE_URL}/lecturers/${currentLecturer.id}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch lecturer data: ${response.status}`);
        }

        const lecturerData = await response.json();
        console.log('✅ Lecturer data received:', lecturerData);

        // ✅ DEBUG: Check the complete structure
        console.log('🔍 DEBUG: Full lecturer object keys:', Object.keys(lecturerData));
        console.log('🔍 DEBUG: lecturerData.courses type:', typeof lecturerData.courses);
        console.log('🔍 DEBUG: lecturerData.courses value:', lecturerData.courses);
        console.log('🔍 DEBUG: Is courses an array?', Array.isArray(lecturerData.courses));

        // Check if courses exist in different possible formats
        console.log('🔍 DEBUG: Checking alternative course properties...');
        console.log('🔍 DEBUG: lecturerData.assignedCourses:', lecturerData.assignedCourses);
        console.log('🔍 DEBUG: lecturerData.courseDTOs:', lecturerData.courseDTOs);
        console.log('🔍 DEBUG: lecturerData.courseList:', lecturerData.courseList);

        // ✅ FIX: Extract courses with proper error handling
        let courses = [];

        // Try multiple possible property names
        if (lecturerData.courses && Array.isArray(lecturerData.courses)) {
            courses = lecturerData.courses;
            console.log('✅ Found courses in lecturerData.courses');
        } else if (lecturerData.assignedCourses && Array.isArray(lecturerData.assignedCourses)) {
            courses = lecturerData.assignedCourses;
            console.log('✅ Found courses in lecturerData.assignedCourses');
        } else if (lecturerData.courseDTOs && Array.isArray(lecturerData.courseDTOs)) {
            courses = lecturerData.courseDTOs;
            console.log('✅ Found courses in lecturerData.courseDTOs');
        } else if (lecturerData.courseList && Array.isArray(lecturerData.courseList)) {
            courses = lecturerData.courseList;
            console.log('✅ Found courses in lecturerData.courseList');
        } else if (lecturerData.courses) {
            // In case courses is not an array, try to convert it
            courses = [lecturerData.courses];
            console.log('✅ Converted single course object to array');
        } else {
            console.error('❌ No courses found in any expected property');
        }

        console.log('📚 Courses found:', courses.length);
        console.log('📚 Courses data:', courses);

        // If still no courses, try alternative API approach
        if (courses.length === 0) {
            console.log('⚠️  No courses in lecturer object, trying alternative API...');

            try {
                // Try fetching all courses and filtering by lecturer
                const allCoursesResponse = await fetch(`${API_BASE_URL}/courses`);
                if (allCoursesResponse.ok) {
                    const allCourses = await allCoursesResponse.json();
                    console.log('🔍 DEBUG: All courses fetched:', allCourses.length);

                    // Filter courses that have this lecturer assigned
                    const lecturerCourses = allCourses.filter(course => {
                        // Check if course has lecturers array
                        if (course.lecturers && Array.isArray(course.lecturers)) {
                            return course.lecturers.some(lec => lec.id === currentLecturer.id);
                        }
                        // Check if course has lecturer object
                        if (course.lecturer && course.lecturer.id === currentLecturer.id) {
                            return true;
                        }
                        // Check if course has lecturerId
                        if (course.lecturerId === currentLecturer.id) {
                            return true;
                        }
                        return false;
                    });

                    console.log('✅ Filtered courses for lecturer:', lecturerCourses.length);
                    courses = lecturerCourses;
                }
            } catch (altError) {
                console.error('❌ Alternative API approach failed:', altError);
            }
        }

        // ✅ FIX: For each course, fetch complete course details if needed
        if (courses.length > 0) {
            const enrichedCourses = await Promise.all(
                courses.map(async (course) => {
                    try {
                        // If course object is incomplete, fetch full details
                        if (!course.courseName || !course.courseCode) {
                            const courseResponse = await fetch(`${API_BASE_URL}/courses/${course.id}`);
                            if (courseResponse.ok) {
                                return await courseResponse.json();
                            }
                        }
                        return course;
                    } catch (err) {
                        console.error(`Error fetching course ${course.id}:`, err);
                        return course; // Return original if fetch fails
                    }
                })
            );

            courses = enrichedCourses;
            console.log('✅ Enriched courses:', courses);
        }

        // Store courses globally
        allCourses = courses;

        // Check if lecturer has any courses assigned
        if (courses.length === 0) {
            console.warn('⚠️  No courses assigned to this lecturer');

            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="loading">
                            <div style="text-align: center; padding: 2rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.3;">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                </svg>
                                <p style="color: var(--text-secondary); font-size: 1.125rem; margin: 0;">
                                    No courses assigned yet
                                </p>
                                <p style="color: var(--text-tertiary); font-size: 0.875rem; margin-top: 0.5rem;">
                                    Contact the administrator to assign courses to your profile
                                </p>
                            </div>
                        </td>
                    </tr>
                `;
            }

            showNotification('No courses assigned yet. Contact administrator.', 'info');
            return;
        }

        // Display the courses
        displayCourses(courses);

        showNotification(`✅ Loaded ${courses.length} assigned course(s)`, 'success');

    } catch (error) {
        console.error('❌ Error loading courses:', error);
        console.error('Stack trace:', error.stack);

        const tbody = document.getElementById('coursesTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="loading">
                        <div style="text-align: center; padding: 2rem; color: #ef4444;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <p style="font-size: 1rem; margin: 0;">Failed to load courses</p>
                            <p style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">Error: ${error.message}</p>
                            <button onclick="loadCoursesPage()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                                Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        showNotification('Failed to load courses. Please try again.', 'error');
    }
}

/**
 * Display courses in the table
 * @param {Array} courses - Array of course objects to display
 */
function displayCourses(courses) {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) {
        console.error('❌ Courses table body not found');
        return;
    }

    // Check if courses array is empty
    if (!courses || courses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="loading">
                    <div style="text-align: center; padding: 2rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.3;">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        <p style="color: var(--text-secondary); font-size: 1rem;">No courses found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    console.log('✅ Displaying', courses.length, 'courses in table');

    // Generate table rows
    tbody.innerHTML = courses.map(course => {
        // ✅ FIX: Safely extract course data with better fallbacks
        const courseCode = course.courseCode || course.code || 'N/A';
        const courseName = course.courseName || course.name || 'Untitled Course';
        const faculty = course.faculty || 'N/A';
        const department = course.department || 'N/A';
        const year = course.year !== undefined && course.year !== null ? course.year : 'N/A';
        const semester = course.semester !== undefined && course.semester !== null ? course.semester : 'N/A';
        const credits = course.credits !== undefined && course.credits !== null ? course.credits : 'N/A';
        const maxStudents = course.maxStudents !== undefined && course.maxStudents !== null ? course.maxStudents : 'N/A';
        const courseId = course.id;

        return `
            <tr>
                <td>
                    <span style="font-weight: 600; color: var(--primary-color); font-family: 'Courier New', monospace;">
                        ${escapeHtml(courseCode)}
                    </span>
                </td>
                <td style="font-weight: 600;">
                    ${escapeHtml(courseName)}
                </td>
                <td>${escapeHtml(faculty)}</td>
                <td>${escapeHtml(department)}</td>
                <td>
                    <span class="badge badge-info" style="background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2);">
                        Year ${escapeHtml(year)}
                    </span>
                </td>
                <td>
                    <span class="badge badge-success" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2);">
                        Semester ${escapeHtml(semester)}
                    </span>
                </td>
                <td>
                    <span style="font-weight: 600; color: var(--text-primary);">
                        ${escapeHtml(credits)}
                    </span>
                </td>
                <td>
                    <span style="font-weight: 600; color: var(--text-secondary);">
                        ${escapeHtml(maxStudents)}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="viewCourseDetails(${courseId})" title="View Details" style="padding: 0.375rem; border: 1px solid var(--border-color); border-radius: 5px; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    console.log('✅ Courses table rendered successfully');
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return 'N/A';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * View course details in a modal
 * @param {number} courseId - The ID of the course to view
 */
async function viewCourseDetails(courseId) {
    try {
        console.log('🔍 Viewing course details for ID:', courseId);

        // Show loading notification
        showNotification('Loading course details...', 'info');

        // Fetch course details
        const courseResponse = await fetch(`${API_BASE_URL}/courses/${courseId}`);
        if (!courseResponse.ok) {
            throw new Error('Failed to fetch course details');
        }
        const course = await courseResponse.json();
        console.log('✅ Course details loaded:', course);

        // Fetch enrollments for this course
        const enrollmentsResponse = await fetch(`${API_BASE_URL}/enrollments/course/${courseId}`);
        if (!enrollmentsResponse.ok) {
            throw new Error('Failed to fetch enrollments');
        }
        const enrollments = await enrollmentsResponse.json();
        console.log('✅ Enrollments loaded:', enrollments.length);

        // Create and display modal with course details
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'viewCourseDetailsModal';
        modal.style.cssText = 'display: flex; align-items: center; justify-content: center;';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; border-bottom: 2px solid var(--border-color);">
                    <div>
                        <h2 style="margin: 0; font-size: 1.5rem; color: var(--text-primary);">Course Details</h2>
                        <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.875rem;">Complete information about this course</p>
                    </div>
                    <button class="modal-close" onclick="closeCourseDetailsModal()" style="background: none; border: none; cursor: pointer; padding: 0.5rem; border-radius: 6px; transition: background 0.2s;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="modal-body" style="padding: 1.5rem;">
                    <!-- Course Information -->
                    <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
                        <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                            </svg>
                            Course Information
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Course Code</label>
                                <p style="margin: 0.25rem 0 0 0; font-size: 1rem; color: var(--text-primary); font-weight: 600; font-family: 'Courier New', monospace;">${escapeHtml(course.courseCode)}</p>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Course Name</label>
                                <p style="margin: 0.25rem 0 0 0; font-size: 1rem; color: var(--text-primary); font-weight: 600;">${escapeHtml(course.courseName)}</p>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Faculty</label>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.9375rem; color: var(--text-primary);">${escapeHtml(course.faculty)}</p>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Department</label>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.9375rem; color: var(--text-primary);">${escapeHtml(course.department)}</p>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Year</label>
                                <p style="margin: 0.25rem 0 0 0;"><span class="badge badge-info">Year ${course.year}</span></p>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Semester</label>
                                <p style="margin: 0.25rem 0 0 0;"><span class="badge badge-success">Semester ${course.semester}</span></p>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Credits</label>
                                <p style="margin: 0.25rem 0 0 0; font-size: 1rem; color: var(--text-primary); font-weight: 600;">${course.credits}</p>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Max Students</label>
                                <p style="margin: 0.25rem 0 0 0; font-size: 1rem; color: var(--text-primary); font-weight: 600;">${course.maxStudents}</p>
                            </div>
                        </div>
                        ${course.description ? `
                            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                                <label style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Description</label>
                                <p style="margin: 0.5rem 0 0 0; font-size: 0.9375rem; color: var(--text-primary); line-height: 1.6;">${escapeHtml(course.description)}</p>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Enrollment Statistics -->
                    <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 10px; border: 1px solid var(--border-color);">
                        <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            Enrollment Statistics
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                            <div style="text-align: center; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                                <p style="margin: 0; font-size: 2rem; font-weight: 700; color: var(--primary-color);">${enrollments.length}</p>
                                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">Enrolled Students</p>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                                <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #059669;">${course.maxStudents - enrollments.length}</p>
                                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">Available Seats</p>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px;">
                                <p style="margin: 0; font-size: 2rem; font-weight: 700; color: #d97706;">${Math.round((enrollments.length / course.maxStudents) * 100)}%</p>
                                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">Capacity</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 2px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.75rem;">
                    <button type="button" class="btn-secondary" onclick="closeCourseDetailsModal()" style="padding: 0.625rem 1.25rem;">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCourseDetailsModal();
            }
        });

        showNotification('Course details loaded', 'success');

    } catch (error) {
        console.error('❌ Error viewing course details:', error);
        showNotification('Failed to load course details: ' + error.message, 'error');
    }
}

/**
 * Close the course details modal
 */
window.closeCourseDetailsModal = function() {
    const modal = document.getElementById('viewCourseDetailsModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
};

// Make functions globally available
window.loadCoursesPage = loadCoursesPage;
window.displayCourses = displayCourses;
window.viewCourseDetails = viewCourseDetails;
window.escapeHtml = escapeHtml;





/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return 'N/A';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}




// NEW CODE
async function loadContentPage() {
    try {
        if (!currentLecturer) return;

        // Ensure we have the latest courses
        if (allCourses.length === 0) {
            const lecturerData = await getLecturerById(currentLecturer.id);
            allCourses = lecturerData.courses || [];
        }

        const content = await getContentByLecturer(currentLecturer.id);
        allContent = content;

        // Update stats
        document.getElementById('contentTotalUploads').textContent = content.length;
        document.getElementById('contentApproved').textContent = content.filter(c => c.approvalStatus === 'APPROVED').length;
        document.getElementById('contentPending').textContent = content.filter(c => c.approvalStatus === 'PENDING').length;
        document.getElementById('contentRejected').textContent = content.filter(c => c.approvalStatus === 'REJECTED').length;

        // Load course filter options - ONLY assigned courses
        const courseFilter = document.getElementById('contentCourseFilter');
        if (courseFilter) {
            if (allCourses.length > 0) {
                courseFilter.innerHTML = '<option value="">All Courses</option>' +
                    allCourses.map(c => `<option value="${c.id}">${c.courseName}</option>`).join('');
            } else {
                courseFilter.innerHTML = '<option value="">No courses assigned</option>';
            }
        }

        displayContent(content);
    } catch (error) {
        console.error('Error loading content:', error);
        showNotification('Failed to load content', 'error');
    }
}





function displayContent(content) {
    const tbody = document.getElementById('contentTableBody');
    if (!tbody) return;

    if (content.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No content found</td></tr>';
        return;
    }

    tbody.innerHTML = content.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.title}</td>
            <td>${item.course?.courseName || 'N/A'}</td>
            <td><span class="badge badge-${item.contentType.toLowerCase()}">${item.contentType}</span></td>
            <td>${item.fileName}</td>
            <td>${formatFileSize(item.fileSize)}</td>
            <td><span class="badge badge-${item.approvalStatus.toLowerCase()}">${item.approvalStatus}</span></td>
            <td>${formatDate(item.uploadDate)}</td>
            <td>
                <button class="btn-icon" onclick="downloadContent('${item.filePath}')" title="Download">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
                <button class="btn-icon" onclick="deleteContentItem(${item.id})" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function downloadContent(filePath) {
    if (filePath) {
        window.open(filePath, '_blank');
    }
}

async function deleteContentItem(id) {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
        await deleteContent(id);
        showNotification('Content deleted successfully');
        loadContentPage();
    } catch (error) {
        console.error('Error deleting content:', error);
        showNotification('Failed to delete content', 'error');
    }
}



// NEW CODE
function openUploadModal() {
    const modal = document.getElementById('uploadContentModal');
    const courseSelect = document.getElementById('uploadCourse');

    if (courseSelect) {
        if (allCourses.length > 0) {
            courseSelect.innerHTML = '<option value="">Select Course</option>' +
                allCourses.map(c => `<option value="${c.id}">${c.courseName}</option>`).join('');
        } else {
            courseSelect.innerHTML = '<option value="">No courses assigned - Contact admin</option>';
            courseSelect.disabled = true;
        }
    }

    if (modal) modal.style.display = 'flex';
}



function closeUploadModal() {
    const modal = document.getElementById('uploadContentModal');
    if (modal) modal.style.display = 'none';
    document.getElementById('uploadContentForm')?.reset();
}

async function handleUploadContent(e) {
    e.preventDefault();

    try {
        const courseId = document.getElementById('uploadCourse').value;
        const title = document.getElementById('uploadTitle').value;
        const description = document.getElementById('uploadDescription').value;
        const contentType = document.getElementById('uploadType').value;
        const file = document.getElementById('uploadFile').files[0];

        if (!file) {
            showNotification('Please select a file', 'error');
            return;
        }

        const contentData = {
            course: { id: parseInt(courseId) },
            lecturer: { id: currentLecturer.id },
            title,
            description,
            contentType
        };

        const formData = new FormData();
        formData.append('content', JSON.stringify(contentData));
        formData.append('file', file);

        await uploadContent(formData);

        showNotification('Content uploaded successfully');
        closeUploadModal();
        loadContentPage();
    } catch (error) {
        console.error('Error uploading content:', error);
        showNotification('Failed to upload content', 'error');
    }
}





// ===== TIMETABLE FUNCTIONS - FIXED VERSION =====

async function loadTimetablePage() {
    try {
        console.log('🔵 Loading timetable page...');

        if (!currentLecturer) {
            console.error('❌ No current lecturer found');
            showNotification('Please log in again', 'error');
            return;
        }

        console.log('📋 Current Lecturer ID:', currentLecturer.id);

        // Get timetable for this lecturer
        const timetable = await getLecturerTimetable(currentLecturer.id);

        console.log('📅 Timetable received:', timetable);
        console.log('📊 Number of entries:', timetable.length);

        // Store timetable globally
        allTimetable = timetable;

        // Show in UI
        if (timetable.length === 0) {
            console.warn('⚠️  No timetable entries found');

            const tbody = document.getElementById('timetableTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="loading">
                            <div style="text-align: center; padding: 2rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.3;">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <p style="color: var(--text-secondary); font-size: 1rem; margin: 0;">
                                    No timetable entries found
                                </p>
                                <p style="color: var(--text-tertiary); font-size: 0.875rem; margin-top: 0.5rem;">
                                    Contact the administrator to create your schedule
                                </p>
                            </div>
                        </td>
                    </tr>
                `;
            }

            const weeklyContainer = document.getElementById('weeklySchedule');
            if (weeklyContainer) {
                weeklyContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.2;">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <p style="font-size: 1.125rem; margin: 0;">No schedule available</p>
                        <p style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">Your weekly schedule will appear here once created</p>
                    </div>
                `;
            }

            showNotification('No timetable entries found. Contact administrator.', 'info');
            return;
        }

        // Display the timetable
        displayTimetable(timetable);
        displayWeeklySchedule(timetable);

        showNotification(`✅ Loaded ${timetable.length} timetable entries`, 'success');

    } catch (error) {
        console.error('❌ Error loading timetable:', error);
        console.error('Stack trace:', error.stack);
        showNotification('Failed to load timetable. Please try again.', 'error');

        // Show error in UI
        const tbody = document.getElementById('timetableTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading">
                        <div style="text-align: center; padding: 2rem; color: #ef4444;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <p style="font-size: 1rem; margin: 0;">Error loading timetable</p>
                            <p style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">Please refresh the page or contact support</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function displayTimetable(timetable) {
    const tbody = document.getElementById('timetableTableBody');
    if (!tbody) {
        console.error('❌ Timetable table body not found');
        return;
    }

    if (!timetable || timetable.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No timetable entries found</td></tr>';
        return;
    }

    console.log('✅ Displaying', timetable.length, 'timetable entries');

    // Sort by day and time
    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const sortedTimetable = [...timetable].sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
    });

    tbody.innerHTML = sortedTimetable.map(entry => {
        // Safely extract data with fallbacks
        const dayOfWeek = entry.dayOfWeek || 'N/A';
        const startTime = entry.startTime ? formatTime(entry.startTime) : 'N/A';
        const endTime = entry.endTime ? formatTime(entry.endTime) : 'N/A';
        const courseName = entry.course?.courseName || 'N/A';
        const courseCode = entry.course?.courseCode || '';
        const classType = entry.classType || 'N/A';
        const classroom = entry.classroom || 'N/A';
        const building = entry.building || 'N/A';
        const yearCode = entry.academicYear?.yearCode || 'N/A';

        return `
        <tr>
            <td><strong>${dayOfWeek}</strong></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${startTime} - ${endTime}</span>
                </div>
            </td>
            <td>
                <div style="font-weight: 600;">${courseName}</div>
                ${courseCode ? `<div style="font-size: 0.75rem; color: var(--text-secondary);">${courseCode}</div>` : ''}
            </td>
            <td><span class="badge badge-${classType.toLowerCase()}">${classType}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                    <span>${classroom}</span>
                </div>
            </td>
            <td>${building}</td>
            <td><span class="badge badge-info">${yearCode}</span></td>
        </tr>
        `;
    }).join('');

    console.log('✅ Timetable table rendered successfully');
}

function displayWeeklySchedule(timetable) {
    const container = document.getElementById('weeklySchedule');
    if (!container) {
        console.error('❌ Weekly schedule container not found');
        return;
    }

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const scheduleByDay = {};

    // Group by day
    days.forEach(day => {
        scheduleByDay[day] = timetable
            .filter(t => t.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Get today
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            ${days.map(day => {
                const isToday = day === today;
                const daySchedule = scheduleByDay[day];

                return `
                <div style="background: var(--bg-primary); border-radius: 12px; padding: 1.25rem; border: 2px solid ${isToday ? 'var(--primary-color)' : 'var(--border-color)'}; box-shadow: ${isToday ? '0 4px 12px rgba(30, 58, 138, 0.15)' : 'none'};">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                        <h4 style="margin: 0; color: ${isToday ? 'var(--primary-color)' : 'var(--text-primary)'}; font-size: 1.125rem; font-weight: 700;">
                            ${day.charAt(0) + day.slice(1).toLowerCase()}
                        </h4>
                        ${isToday ? '<span style="background: var(--primary-color); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Today</span>' : ''}
                    </div>

                    ${daySchedule.length === 0 ?
                        '<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 2rem 0;">No classes scheduled</p>' :
                        daySchedule.map(entry => {
                            const courseName = entry.course?.courseName || 'N/A';
                            const courseCode = entry.course?.courseCode || '';
                            const startTime = formatTime(entry.startTime);
                            const endTime = formatTime(entry.endTime);
                            const classroom = entry.classroom || 'N/A';
                            const building = entry.building || '';
                            const classType = entry.classType || 'N/A';

                            return `
                            <div style="margin-bottom: 0.75rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--primary-color); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span style="font-weight: 700; font-size: 0.875rem; color: var(--primary-color);">${startTime} - ${endTime}</span>
                                </div>
                                <div style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 0.25rem; color: var(--text-primary);">${courseName}</div>
                                ${courseCode ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${courseCode}</div>` : ''}
                                <div style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    </svg>
                                    <span>${classroom}${building ? `, ${building}` : ''}</span>
                                </div>
                                <span style="display: inline-block; padding: 0.25rem 0.5rem; background: rgba(59, 130, 246, 0.1); color: #2563eb; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-top: 0.5rem;">${classType}</span>
                            </div>
                        `;
                        }).join('')
                    }
                </div>
            `;
            }).join('')}
        </div>
    `;

    console.log('✅ Weekly schedule rendered successfully');
}






function displayTimetable(timetable) {
    const tbody = document.getElementById('timetableTableBody');
    if (!tbody) return;

    if (!timetable || timetable.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No timetable entries found</td></tr>';
        return;
    }

    // Sort by day and time
    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const sortedTimetable = [...timetable].sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
    });

    tbody.innerHTML = sortedTimetable.map(entry => {
        // Validate entry data
        const dayOfWeek = entry.dayOfWeek || 'N/A';
        const startTime = entry.startTime ? formatTime(entry.startTime) : 'N/A';
        const endTime = entry.endTime ? formatTime(entry.endTime) : 'N/A';
        const courseName = entry.course?.courseName || 'N/A';
        const courseCode = entry.course?.courseCode || '';
        const classType = entry.classType || 'N/A';
        const classroom = entry.classroom || 'N/A';
        const building = entry.building || 'N/A';
        const yearCode = entry.academicYear?.yearCode || 'N/A';

        return `
        <tr>
            <td><strong>${dayOfWeek}</strong></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${startTime} - ${endTime}</span>
                </div>
            </td>
            <td>
                <div style="font-weight: 600;">${courseName}</div>
                ${courseCode ? `<div style="font-size: 0.75rem; color: var(--text-secondary);">${courseCode}</div>` : ''}
            </td>
            <td><span class="badge badge-${classType.toLowerCase()}">${classType}</span></td>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    </svg>
                    <span>${classroom}</span>
                </div>
            </td>
            <td>${building}</td>
            <td><span class="badge badge-info">${yearCode}</span></td>
        </tr>
    `;
    }).join('');
}

function displayWeeklySchedule(timetable) {
    const container = document.getElementById('weeklySchedule');
    if (!container) return;

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const scheduleByDay = {};

    // Group by day
    days.forEach(day => {
        scheduleByDay[day] = timetable
            .filter(t => t.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Get today
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            ${days.map(day => {
                const isToday = day === today;
                const daySchedule = scheduleByDay[day];

                return `
                <div style="background: var(--bg-primary); border-radius: 12px; padding: 1.25rem; border: 2px solid ${isToday ? 'var(--primary-color)' : 'var(--border-color)'}; box-shadow: ${isToday ? '0 4px 12px rgba(30, 58, 138, 0.15)' : 'none'};">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                        <h4 style="margin: 0; color: ${isToday ? 'var(--primary-color)' : 'var(--text-primary)'}; font-size: 1.125rem; font-weight: 700;">
                            ${day.charAt(0) + day.slice(1).toLowerCase()}
                        </h4>
                        ${isToday ? '<span style="background: var(--primary-color); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Today</span>' : ''}
                    </div>

                    ${daySchedule.length === 0 ?
                        '<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 2rem 0;">No classes scheduled</p>' :
                        daySchedule.map(entry => {
                            const courseName = entry.course?.courseName || 'N/A';
                            const courseCode = entry.course?.courseCode || '';
                            const startTime = formatTime(entry.startTime);
                            const endTime = formatTime(entry.endTime);
                            const classroom = entry.classroom || 'N/A';
                            const building = entry.building || '';
                            const classType = entry.classType || 'N/A';

                            return `
                            <div style="margin-bottom: 0.75rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--primary-color); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span style="font-weight: 700; font-size: 0.875rem; color: var(--primary-color);">${startTime} - ${endTime}</span>
                                </div>
                                <div style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 0.25rem; color: var(--text-primary);">${courseName}</div>
                                ${courseCode ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${courseCode}</div>` : ''}
                                <div style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    </svg>
                                    <span>${classroom}${building ? `, ${building}` : ''}</span>
                                </div>
                                <span style="display: inline-block; padding: 0.25rem 0.5rem; background: rgba(59, 130, 246, 0.1); color: #2563eb; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-top: 0.5rem;">${classType}</span>
                            </div>
                        `;
                        }).join('')
                    }
                </div>
            `;
            }).join('')}
        </div>
    `;
}
// ===== PROFESSIONAL BLUE-STYLE TIMETABLE PDF EXPORT =====
async function exportTimetablePDF() {
    try {
        if (!currentLecturer || !allTimetable || allTimetable.length === 0) {
            showNotification('No timetable data to export', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');

        // ✅ PROFESSIONAL BLUE COLOR PALETTE
        const colors = {
            primary: [30, 58, 138],        // Navy Blue (like your sidebar)
            secondary: [59, 130, 246],     // Bright Blue
            darkBlue: [23, 37, 84],        // Dark Blue
            lightBlue: [219, 234, 254],    // Light Blue background
            text: [51, 51, 51],            // Dark gray text
            lightText: [102, 102, 102],    // Light gray text
            border: [204, 204, 204],       // Border color
            white: [255, 255, 255]
        };

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);

        // ===== LOAD LOGO =====
        let logoData = null;
        try {
            const logoSources = [
                '../images/unt-logo.png',
                './images/unt-logo.png',
                'images/unt-logo.png',
                '/images/unt-logo.png'
            ];

            for (const logoPath of logoSources) {
                try {
                    const response = await fetch(logoPath);
                    if (response.ok) {
                        const blob = await response.blob();
                        logoData = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                        console.log('✅ Logo loaded from:', logoPath);
                        break;
                    }
                } catch (e) { continue; }
            }

            if (!logoData) {
                const logoElement = document.querySelector('img[src*="unt-logo"]') ||
                                   document.querySelector('.sidebar-logo') ||
                                   document.getElementById('untLogo');

                if (logoElement && logoElement.complete) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = logoElement.naturalWidth || 200;
                    canvas.height = logoElement.naturalHeight || 200;
                    ctx.drawImage(logoElement, 0, 0);
                    logoData = canvas.toDataURL('image/png');
                    console.log('✅ Logo loaded from DOM');
                }
            }
        } catch (err) {
            console.warn('⚠️ Logo loading failed:', err);
        }

        // ===== HEADER WITH LOGO (PROFESSIONAL BLUE STYLE) =====
        let currentY = 20;

        // Add logo (circular style)
        if (logoData) {
            try {
                // White circle background
                doc.setFillColor(255, 255, 255);
                doc.circle(margin + 15, currentY + 15, 15, 'F');

                // Add logo
                doc.addImage(logoData, 'PNG', margin + 3, currentY + 3, 24, 24);

                // Blue circle border
                doc.setDrawColor(...colors.primary);
                doc.setLineWidth(2);
                doc.circle(margin + 15, currentY + 15, 15, 'S');
            } catch (err) {
                drawProfessionalBlueLogo(doc, margin, currentY, colors);
            }
        } else {
            drawProfessionalBlueLogo(doc, margin, currentY, colors);
        }

        // University name and subtitle (right side of logo)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...colors.primary);
        doc.text('Université Numérique du Tchad', margin + 35, currentY + 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.lightText);
        doc.text('Timetable Management System', margin + 35, currentY + 18);

        currentY += 40;

        // ===== REPORT TITLE =====
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...colors.text);
        doc.text('Timetable Report', pageWidth / 2, currentY, { align: 'center' });

        currentY += 8;

        // Period and generation date
        const today = new Date();
        const periodText = `Period: ${today.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} to ${today.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}`;
        const generatedText = `Generated: ${today.toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...colors.lightText);
        doc.text(periodText, pageWidth / 2, currentY, { align: 'center' });
        currentY += 5;
        doc.text(generatedText, pageWidth / 2, currentY, { align: 'center' });

        currentY += 12;

        // ===== LECTURER INFO BOX =====
        const lecturerName = `${currentLecturer.firstName || ''} ${currentLecturer.lastName || ''}`.trim() || 'N/A';
        const employeeId = currentLecturer.employeeId || 'N/A';
        const department = currentLecturer.department || 'N/A';
        const email = currentLecturer.email || 'N/A';

        // Info box background
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'F');
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'S');

        // Info content
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        doc.text('Lecturer:', margin + 5, currentY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(lecturerName, margin + 25, currentY + 7);

        doc.setFont('helvetica', 'bold');
        doc.text('Employee ID:', margin + 5, currentY + 13);
        doc.setFont('helvetica', 'normal');
        doc.text(employeeId, margin + 30, currentY + 13);

        doc.setFont('helvetica', 'bold');
        doc.text('Department:', margin + 5, currentY + 19);
        doc.setFont('helvetica', 'normal');
        doc.text(department, margin + 30, currentY + 19);

        currentY += 30;

        // ===== TIMETABLE BY DAY (TABLE STYLE WITH BLUE HEADERS) =====
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

        for (const day of days) {
            const daySchedule = allTimetable
                .filter(t => t.dayOfWeek === day)
                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

            if (daySchedule.length === 0) continue;

            // Check page break
            if (currentY > pageHeight - 60) {
                doc.addPage();
                currentY = 20;
                addBlueHeaderToNewPage(doc, pageWidth, colors);
                currentY = 40;
            }

            // Day header (with blue styling)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...colors.primary);
            doc.text(`${day.charAt(0) + day.slice(1).toLowerCase()} Schedule`, margin, currentY);
            currentY += 8;

            // Table data
            const tableData = daySchedule.map((entry, index) => [
                (index + 1).toString(),
                `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`,
                entry.course?.courseCode || 'N/A',
                entry.course?.courseName || 'N/A',
                entry.classType || 'N/A',
                entry.classroom || 'N/A'
            ]);

            // Professional table with BLUE headers
            doc.autoTable({
                startY: currentY,
                head: [['#', 'Time', 'Code', 'Course', 'Type', 'Room']],
                body: tableData,
                margin: { left: margin, right: margin },
                theme: 'grid',
                headStyles: {
                    fillColor: colors.primary,      // BLUE HEADER
                    textColor: colors.white,
                    fontSize: 9,
                    fontStyle: 'bold',
                    halign: 'center',
                    cellPadding: 3
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: colors.text,
                    cellPadding: 3
                },
                alternateRowStyles: {
                    fillColor: [250, 250, 250]
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
                    1: { cellWidth: 35, halign: 'center' },
                    2: { cellWidth: 25, halign: 'center' },
                    3: { cellWidth: 60 },
                    4: { cellWidth: 25, halign: 'center' },
                    5: { cellWidth: 15, halign: 'center' }
                }
            });

            currentY = doc.lastAutoTable.finalY + 10;
        }

        // ===== SUMMARY SECTION =====
        if (currentY > pageHeight - 50) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...colors.primary);
        doc.text('Summary', margin, currentY);
        currentY += 8;

        const totalClasses = allTimetable.length;
        const uniqueCourses = new Set(allTimetable.filter(t => t.course?.id).map(t => t.course.id)).size;
        const totalHours = allTimetable.reduce((sum, entry) => {
            const start = (entry.startTime || '').split(':');
            const end = (entry.endTime || '').split(':');
            if (start.length < 2 || end.length < 2) return sum;
            const startMin = parseInt(start[0]) * 60 + parseInt(start[1] || 0);
            const endMin = parseInt(end[0]) * 60 + parseInt(end[1] || 0);
            const duration = endMin - startMin;
            return sum + (duration > 0 ? duration : 60);
        }, 0) / 60;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        doc.text(`Total Classes: ${totalClasses}`, margin, currentY);
        currentY += 6;
        doc.text(`Total Courses: ${uniqueCourses}`, margin, currentY);
        currentY += 6;
        doc.text(`Total Hours per Week: ${totalHours.toFixed(2)}`, margin, currentY);

        // ===== FOOTER =====
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);

            // Footer line
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.5);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            // Footer text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...colors.lightText);

            doc.text('Université Numérique du Tchad', margin, pageHeight - 10);
            doc.text('Timetable Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        // ===== SAVE PDF =====
        const fileName = `UNT_Timetable_${currentLecturer.lastName || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        showNotification('✅ Professional timetable PDF downloaded!', 'success');

    } catch (error) {
        console.error('❌ PDF Export Error:', error);
        showNotification('Failed to export PDF: ' + error.message, 'error');
    }
}

// ===== HELPER FUNCTIONS =====
function drawProfessionalBlueLogo(doc, x, y, colors) {
    // Blue circle background
    doc.setFillColor(...colors.primary);
    doc.circle(x + 15, y + 15, 15, 'F');

    // White text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('UNT', x + 15, y + 18, { align: 'center' });

    // Dark blue border
    doc.setDrawColor(...colors.darkBlue);
    doc.setLineWidth(2);
    doc.circle(x + 15, y + 15, 15, 'S');
}

function addBlueHeaderToNewPage(doc, pageWidth, colors) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...colors.primary);
    doc.text('Université Numérique du Tchad', pageWidth / 2, 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...colors.lightText);
    doc.text('Timetable Report - Continued', pageWidth / 2, 22, { align: 'center' });
}

function formatTime(time) {
    if (!time) return 'N/A';
    const parts = time.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
}




async function loadStudentsPage() {
    try {
        console.log('🔵 Loading students page...');

        if (!currentLecturer) {
            console.error('❌ No current lecturer found');
            showNotification('Please log in again', 'error');
            return;
        }

        // Show loading state
        const tbody = document.getElementById('studentsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading students...</td></tr>';
        }

        // ✅ FIX: Fetch lecturer's courses first
        const coursesResponse = await fetch(`${API_BASE_URL}/lecturers/${currentLecturer.id}/courses`);
        if (!coursesResponse.ok) {
            throw new Error('Failed to fetch courses');
        }

        const coursesData = await coursesResponse.json();
        let courses = Array.isArray(coursesData) ? coursesData : (coursesData.courses || []);

        console.log('📚 Lecturer courses:', courses.length);

        if (courses.length === 0) {
            console.warn('⚠️ No courses assigned to this lecturer');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="loading">
                            <div style="text-align: center; padding: 2rem;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.3;">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <p style="color: var(--text-secondary); font-size: 1rem;">No courses assigned yet</p>
                                <p style="color: var(--text-tertiary); font-size: 0.875rem; margin-top: 0.5rem;">Contact administrator to assign courses</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
            showNotification('No courses assigned. Contact administrator.', 'info');
            return;
        }

        // Store courses globally
        allCourses = courses;

        // ✅ FIX: Get all enrollments for lecturer's courses
        const courseIds = courses.map(c => c.id);
        console.log('🔍 Fetching enrollments for course IDs:', courseIds);

        const enrollmentPromises = courseIds.map(id => getCourseEnrollments(id));
        const enrollmentArrays = await Promise.all(enrollmentPromises);
        const enrollments = enrollmentArrays.flat();

        console.log('👥 Total enrollments:', enrollments.length);

        // Store enrollments globally
        allEnrollments = enrollments;

        // Populate course filter with assigned courses
        const courseFilter = document.getElementById('studentCourseFilter');
        if (courseFilter) {
            courseFilter.innerHTML = '<option value="">All Courses</option>' +
                courses.map(c => `<option value="${c.id}">${c.courseName}</option>`).join('');
        }

        // Display students
        displayStudents(enrollments);

        showNotification(`✅ Loaded ${enrollments.length} student(s) from ${courses.length} course(s)`, 'success');

    } catch (error) {
        console.error('❌ Error loading students:', error);
        console.error('Stack trace:', error.stack);

        const tbody = document.getElementById('studentsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading">
                        <div style="text-align: center; padding: 2rem; color: #ef4444;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <p style="font-size: 1rem; margin: 0;">Error loading students</p>
                            <p style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">Error: ${error.message}</p>
                            <button onclick="loadStudentsPage()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer;">
                                Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        showNotification('Failed to load students. Please try again.', 'error');
    }
}










function displayStudents(enrollments) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) {
        console.error('❌ Students table body not found');
        return;
    }

    if (!enrollments || enrollments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="loading">
                    <div style="text-align: center; padding: 2rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.3;">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <p style="color: var(--text-secondary); font-size: 1rem;">No students found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    console.log('✅ Displaying', enrollments.length, 'students in table');

    tbody.innerHTML = enrollments.map(enrollment => {
        const student = enrollment.student;
        if (!student) return '';

        // Safely extract data with fallbacks
        const studentId = student.studentId || 'N/A';
        const firstName = student.firstName || '';
        const lastName = student.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'N/A';
        const email = student.email || 'N/A';
        const courseName = enrollment.course?.courseName || 'N/A';
        const currentYear = student.currentYear || 'N/A';
        const currentSemester = student.currentSemester || 'N/A';
        const gpa = student.gpa ? student.gpa.toFixed(2) : 'N/A';

        return `
            <tr>
                <td>
                    <span style="font-weight: 600; color: var(--primary-color); font-family: 'Courier New', monospace;">
                        ${escapeHtml(studentId)}
                    </span>
                </td>
                <td style="font-weight: 600;">
                    ${escapeHtml(fullName)}
                </td>
                <td>${escapeHtml(email)}</td>
                <td>${escapeHtml(courseName)}</td>
                <td>
                    <span class="badge badge-info" style="background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2);">
                        Year ${escapeHtml(currentYear)}
                    </span>
                </td>
                <td>
                    <span class="badge badge-success" style="background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2);">
                        Semester ${escapeHtml(currentSemester)}
                    </span>
                </td>
                <td>
                    <span style="font-weight: 600; color: var(--text-primary);">
                        ${escapeHtml(gpa)}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="viewStudentDetails(${student.id})" title="View Details" style="padding: 0.375rem; border: 1px solid var(--border-color); border-radius: 5px; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    console.log('✅ Students table rendered successfully');
}




function viewStudentDetails(studentId) {
    console.log('🔍 Viewing student details for ID:', studentId);

    const studentEnrollments = allEnrollments.filter(e => e.student?.id === studentId);
    const student = studentEnrollments[0]?.student;

    if (!student) {
        console.error('❌ Student not found');
        showNotification('Student not found', 'error');
        return;
    }

    console.log('✅ Student found:', student);

    const modal = document.getElementById('studentDetailsModal');
    const content = document.getElementById('studentDetailsContent');

    if (content) {
        content.innerHTML = `
            <div style="padding: 1.5rem;">
                <!-- Student Information -->
                <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; color: var(--text-primary);">Student Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div>
                            <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem;">Student ID</label>
                            <div style="color: var(--text-primary); font-weight: 600; font-family: 'Courier New', monospace;">${student.studentId}</div>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem;">Full Name</label>
                            <div style="color: var(--text-primary); font-weight: 600;">${student.firstName} ${student.lastName}</div>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem;">Email</label>
                            <div style="color: var(--text-primary);">${student.email}</div>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem;">GPA</label>
                            <div style="color: var(--text-primary); font-weight: 600;">${student.gpa ? student.gpa.toFixed(2) : 'N/A'}</div>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem;">Current Year</label>
                            <div><span class="badge badge-info">Year ${student.currentYear}</span></div>
                        </div>
                        <div>
                            <label style="font-weight: 600; color: var(--text-secondary); font-size: 0.875rem;">Current Semester</label>
                            <div><span class="badge badge-success">Semester ${student.currentSemester}</span></div>
                        </div>
                    </div>
                </div>

                <!-- Enrolled Courses -->
                <div style="background: var(--bg-primary); padding: 1.5rem; border-radius: 10px; border: 1px solid var(--border-color);">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; color: var(--text-primary);">Enrolled Courses (${studentEnrollments.length})</h3>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${studentEnrollments.map(e => `
                            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--primary-color);">
                                <div style="font-weight: 600; margin-bottom: 0.5rem;">${e.course?.courseName || 'N/A'}</div>
                                <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                                    <span>Code: <strong>${e.course?.courseCode || 'N/A'}</strong></span>
                                    <span>Status: <strong>${e.status}</strong></span>
                                    ${e.midtermGrade ? `<span>Midterm: <strong>${e.midtermGrade}</strong></span>` : ''}
                                    ${e.finalGrade ? `<span>Final: <strong>${e.finalGrade}</strong></span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    if (modal) {
        modal.style.display = 'flex';
    }
}







// NEW CODE
async function loadGradesPage() {
    try {
        if (!currentLecturer) return;

        // Ensure we have assigned courses
        if (allCourses.length === 0) {
            const lecturerData = await getLecturerById(currentLecturer.id);
            allCourses = lecturerData.courses || [];
        }

        const courseFilter = document.getElementById('gradeCourseFilter');
        if (courseFilter) {
            if (allCourses.length > 0) {
                courseFilter.innerHTML = '<option value="">Select Course</option>' +
                    allCourses.map(c => `<option value="${c.id}">${c.courseName}</option>`).join('');
            } else {
                courseFilter.innerHTML = '<option value="">No courses assigned</option>';
                const tbody = document.getElementById('gradesTableBody');
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="9" class="loading">No courses assigned. Contact administrator to assign courses.</td></tr>';
                }
            }
        }
    } catch (error) {
        console.error('Error loading grades page:', error);
        showNotification('Failed to load grades page', 'error');
    }
}






async function handleCourseFilterChange(e) {
    const courseId = e.target.value;
    if (!courseId) {
        document.getElementById('gradesTableBody').innerHTML = '<tr><td colspan="9" class="loading">Select a course to view grades</td></tr>';
        return;
    }

    try {
        const enrollments = await getCourseEnrollments(parseInt(courseId));
        displayGrades(enrollments);
    } catch (error) {
        console.error('Error loading grades:', error);
        showNotification('Failed to load grades', 'error');
    }
}

function displayGrades(enrollments) {
    const tbody = document.getElementById('gradesTableBody');
    if (!tbody) return;

    if (enrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading">No students enrolled</td></tr>';
        return;
    }

    tbody.innerHTML = enrollments.map(enrollment => {
        const student = enrollment.student;
        const total = enrollment.midtermGrade && enrollment.finalGrade ?
            ((parseFloat(enrollment.midtermGrade) + parseFloat(enrollment.finalGrade)) / 2).toFixed(2) : 'N/A';
        const grade = calculateGrade(enrollment.midtermGrade, enrollment.finalGrade);

        return `
            <tr>
                <td>${student?.studentId || 'N/A'}</td>
                <td>${student ? `${student.firstName} ${student.lastName}` : 'N/A'}</td>
                <td>${enrollment.course?.courseName || 'N/A'}</td>
                <td>${enrollment.midtermGrade || 'N/A'}</td>
                <td>${enrollment.finalGrade || 'N/A'}</td>
                <td>${total}</td>
                <td><span class="badge badge-${grade.toLowerCase()}">${grade}</span></td>
                <td><span class="badge badge-${enrollment.status.toLowerCase()}">${enrollment.status}</span></td>
                <td>
                    <button class="btn-icon" onclick="openUpdateGradeModal(${enrollment.id})" title="Update Grade">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function openUpdateGradeModal(enrollmentId) {
    try {
        const enrollment = await getEnrollmentById(enrollmentId);

        document.getElementById('gradeEnrollmentId').value = enrollmentId;
        document.getElementById('gradeStudentName').value = `${enrollment.student.firstName} ${enrollment.student.lastName}`;
        document.getElementById('gradeCourseName').value = enrollment.course.courseName;
        document.getElementById('gradeMidterm').value = enrollment.midtermGrade || '';
        document.getElementById('gradeFinal').value = enrollment.finalGrade || '';
        document.getElementById('gradeAttendance').value = enrollment.attendance || '';

        document.getElementById('updateGradeModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading enrollment:', error);
        showNotification('Failed to load enrollment data', 'error');
    }
}

function closeGradeModal() {
    document.getElementById('updateGradeModal').style.display = 'none';
    document.getElementById('updateGradeForm').reset();
}

async function handleUpdateGrade(e) {
    e.preventDefault();

    try {
        const enrollmentId = parseInt(document.getElementById('gradeEnrollmentId').value);
        const midterm = parseFloat(document.getElementById('gradeMidterm').value);
        const finalGrade = parseFloat(document.getElementById('gradeFinal').value);
        const attendance = parseInt(document.getElementById('gradeAttendance').value);

        // Update grade
        await updateGrade(enrollmentId, midterm, finalGrade);

        // Update attendance
        if (attendance) {
            await updateAttendance(enrollmentId, attendance);
        }

        showNotification('Grade updated successfully');
        closeGradeModal();

        // Reload grades
        const courseId = document.getElementById('gradeCourseFilter').value;
        if (courseId) {
            const enrollments = await getCourseEnrollments(parseInt(courseId));
            displayGrades(enrollments);
        }
    } catch (error) {
        console.error('Error updating grade:', error);
        showNotification('Failed to update grade', 'error');
    }
}

// ===== REPORTS FUNCTIONS =====
async function loadReportsPage() {
    const reportCourse = document.getElementById('reportCourse');
    if (reportCourse && allCourses.length > 0) {
        reportCourse.innerHTML = '<option value="">All Courses</option>' +
            allCourses.map(c => `<option value="${c.id}">${c.courseName}</option>`).join('');
    }
}




// ===== ENHANCED TEACHING SUMMARY REPORT =====
async function generateTeachingReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const colors = {
            primary: [30, 58, 138],
            secondary: [59, 130, 246],
            accent: [16, 185, 129],
            text: [30, 41, 59],
            lightBg: [241, 245, 249],
            white: [255, 255, 255]
        };

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // ===== HEADER =====
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 50, 'F');

        // Logo
        doc.setFillColor(...colors.white);
        doc.circle(20, 25, 12, 'F');
        doc.setDrawColor(...colors.secondary);
        doc.setLineWidth(1.5);
        doc.circle(20, 25, 12, 'S');
        doc.setFontSize(12);
        doc.setTextColor(...colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text('UNT', 20, 27, { align: 'center' });

        // Title
        doc.setFontSize(22);
        doc.setTextColor(...colors.white);
        doc.text('UNIVERSITY OF NORTHERN TANZANIA', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Teaching Summary Report', pageWidth / 2, 30, { align: 'center' });

        // Date Badge
        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.setFillColor(...colors.accent);
        doc.roundedRect(pageWidth - 70, 15, 60, 10, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(...colors.white);
        doc.setFont('helvetica', 'bold');
        doc.text(today, pageWidth - 40, 21, { align: 'center' });

        // ===== LECTURER INFO =====
        let currentY = 60;
        doc.setFillColor(...colors.lightBg);
        doc.roundedRect(14, currentY, pageWidth - 28, 35, 4, 4, 'F');

        doc.setFontSize(11);
        doc.setTextColor(...colors.text);
        doc.setFont('helvetica', 'bold');

        const lecturerInfo = [
            { label: 'Full Name:', value: `${currentLecturer.firstName} ${currentLecturer.lastName}` },
            { label: 'Employee ID:', value: currentLecturer.employeeId || 'N/A' },
            { label: 'Department:', value: currentLecturer.department || 'N/A' },
            { label: 'Email:', value: currentLecturer.email },
            { label: 'Phone:', value: currentLecturer.phoneNumber || 'N/A' },
            { label: 'Qualification:', value: currentLecturer.qualification || 'N/A' }
        ];

        lecturerInfo.forEach((info, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = col === 0 ? 20 : pageWidth / 2 + 10;
            const y = currentY + 10 + (row * 10);

            doc.text(info.label, x, y);
            doc.setFont('helvetica', 'normal');
            doc.text(info.value, x + 40, y);
            doc.setFont('helvetica', 'bold');
        });

        // ===== STATISTICS SECTION =====
        currentY += 45;
        doc.setFillColor(...colors.secondary);
        doc.roundedRect(14, currentY, pageWidth - 28, 12, 3, 3, 'F');
        doc.setFontSize(13);
        doc.setTextColor(...colors.white);
        doc.text('📊 TEACHING OVERVIEW', pageWidth / 2, currentY + 8, { align: 'center' });

        currentY += 18;

        const uniqueStudents = new Set(allEnrollments.map(e => e.student?.id)).size;
        const approvedContent = allContent.filter(c => c.approvalStatus === 'APPROVED').length;

        const stats = [
            { icon: '📚', label: 'Total Courses', value: allCourses.length, color: colors.primary },
            { icon: '👥', label: 'Total Students', value: uniqueStudents, color: colors.secondary },
            { icon: '📄', label: 'Content Uploaded', value: allContent.length, color: colors.accent },
            { icon: '✅', label: 'Approved Content', value: approvedContent, color: [16, 185, 129] }
        ];

        stats.forEach((stat, index) => {
            const x = 20 + (index * 45);
            const y = currentY;

            doc.setFillColor(...stat.color);
            doc.roundedRect(x, y, 40, 25, 3, 3, 'F');

            doc.setFontSize(18);
            doc.text(stat.icon, x + 20, y + 10, { align: 'center' });

            doc.setFontSize(16);
            doc.setTextColor(...colors.white);
            doc.setFont('helvetica', 'bold');
            doc.text(stat.value.toString(), x + 20, y + 20, { align: 'center' });
        });

        // Labels below boxes
        currentY += 30;
        stats.forEach((stat, index) => {
            const x = 20 + (index * 45);
            doc.setFontSize(8);
            doc.setTextColor(...colors.text);
            doc.setFont('helvetica', 'normal');
            doc.text(stat.label, x + 20, currentY, { align: 'center' });
        });

        // ===== COURSES TABLE =====
        currentY += 12;
        doc.setFillColor(...colors.primary);
        doc.roundedRect(14, currentY, pageWidth - 28, 10, 2, 2, 'F');
        doc.setFontSize(12);
        doc.setTextColor(...colors.white);
        doc.setFont('helvetica', 'bold');
        doc.text('COURSES TAUGHT', pageWidth / 2, currentY + 7, { align: 'center' });

        currentY += 12;

        doc.autoTable({
            startY: currentY,
            head: [['Code', 'Course Name', 'Year', 'Sem', 'Credits', 'Students']],
            body: allCourses.map(course => {
                const enrollments = allEnrollments.filter(e => e.course?.id === course.id);
                return [
                    course.courseCode,
                    course.courseName,
                    `Year ${course.year}`,
                    `S${course.semester}`,
                    course.credits,
                    enrollments.length
                ];
            }),
            theme: 'grid',
            headStyles: {
                fillColor: colors.primary,
                textColor: colors.white,
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: colors.text
            },
            alternateRowStyles: {
                fillColor: colors.lightBg
            },
            columnStyles: {
                0: { cellWidth: 30, fontStyle: 'bold', halign: 'center' },
                1: { cellWidth: 80 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' },
                5: { cellWidth: 25, halign: 'center' }
            }
        });

        // ===== FOOTER =====
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(...colors.secondary);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `University of Northern Tanzania | Teaching Summary Report`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        }

        doc.save(`UNT_Teaching_Report_${currentLecturer.lastName}_${new Date().getFullYear()}.pdf`);
        showNotification('✅ Teaching report generated successfully', 'success');

    } catch (error) {
        console.error('❌ Error generating teaching report:', error);
        showNotification('Failed to generate report', 'error');
    }
}







// ===== ENHANCED CONTENT REPORT =====
async function generateContentReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');

        const colors = {
            primary: [30, 58, 138],
            secondary: [59, 130, 246],
            accent: [16, 185, 129],
            warning: [245, 158, 11],
            danger: [239, 68, 68],
            text: [30, 41, 59],
            lightBg: [241, 245, 249],
            white: [255, 255, 255]
        };

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Header
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Logo
        doc.setFillColor(...colors.white);
        doc.circle(25, 20, 12, 'F');
        doc.setDrawColor(...colors.secondary);
        doc.setLineWidth(1.5);
        doc.circle(25, 20, 12, 'S');
        doc.setFontSize(12);
        doc.setTextColor(...colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text('UNT', 25, 22, { align: 'center' });

        doc.setFontSize(20);
        doc.setTextColor(...colors.white);
        doc.text('Course Content Report', pageWidth / 2, 25, { align: 'center' });

        // Statistics Cards
        let currentY = 50;
        const approved = allContent.filter(c => c.approvalStatus === 'APPROVED').length;
        const pending = allContent.filter(c => c.approvalStatus === 'PENDING').length;
        const rejected = allContent.filter(c => c.approvalStatus === 'REJECTED').length;

        const stats = [
            { icon: '📄', label: 'Total', value: allContent.length, color: colors.secondary },
            { icon: '✅', label: 'Approved', value: approved, color: colors.accent },
            { icon: '⏳', label: 'Pending', value: pending, color: colors.warning },
            { icon: '❌', label: 'Rejected', value: rejected, color: colors.danger }
        ];

        stats.forEach((stat, index) => {
            const x = 20 + (index * 65);
            doc.setFillColor(...stat.color);
            doc.roundedRect(x, currentY, 55, 22, 3, 3, 'F');
            doc.setFontSize(16);
            doc.text(stat.icon, x + 10, currentY + 12);
            doc.setFontSize(16);
            doc.setTextColor(...colors.white);
            doc.setFont('helvetica', 'bold');
            doc.text(stat.value.toString(), x + 40, currentY + 12, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(stat.label, x + 27.5, currentY + 20, { align: 'center' });
        });

        // Content Table
        currentY += 32;
        doc.autoTable({
            startY: currentY,
            head: [['Title', 'Type', 'Course', 'Size', 'Status', 'Upload Date']],
            body: allContent.map(content => [
                content.title,
                content.contentType,
                content.course?.courseName || 'N/A',
                formatFileSize(content.fileSize),
                content.approvalStatus,
                formatDate(content.uploadDate)
            ]),
            theme: 'grid',
            headStyles: {
                fillColor: colors.primary,
                textColor: colors.white,
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8,
                textColor: colors.text
            },
            alternateRowStyles: {
                fillColor: colors.lightBg
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 35, halign: 'center' },
                2: { cellWidth: 70 },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
                5: { cellWidth: 30, halign: 'center' }
            },
            didDrawCell: function(data) {
                if (data.column.index === 4 && data.section === 'body') {
                    const status = data.cell.raw;
                    if (status === 'APPROVED') {
                        doc.setTextColor(...colors.accent);
                    } else if (status === 'PENDING') {
                        doc.setTextColor(...colors.warning);
                    } else if (status === 'REJECTED') {
                        doc.setTextColor(...colors.danger);
                    }
                }
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(...colors.secondary);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Content Report | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save(`UNT_Content_Report_${new Date().getFullYear()}.pdf`);
        showNotification('✅ Content report generated successfully', 'success');

    } catch (error) {
        console.error('❌ Error generating content report:', error);
        showNotification('Failed to generate report', 'error');
    }
}

// ===== ENHANCED PERFORMANCE REPORT =====
async function generatePerformanceReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const colors = {
            primary: [30, 58, 138],
            secondary: [59, 130, 246],
            accent: [16, 185, 129],
            text: [30, 41, 59],
            lightBg: [241, 245, 249],
            white: [255, 255, 255]
        };

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Header
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, pageWidth, 45, 'F');

        doc.setFillColor(...colors.white);
        doc.circle(20, 22.5, 11, 'F');
        doc.setDrawColor(...colors.secondary);
        doc.circle(20, 22.5, 11, 'S');
        doc.setFontSize(11);
        doc.setTextColor(...colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text('UNT', 20, 24.5, { align: 'center' });

        doc.setFontSize(20);
        doc.setTextColor(...colors.white);
        doc.text('Student Performance Report', pageWidth / 2, 28, { align: 'center' });

        // Statistics
        let currentY = 55;
        const completedEnrollments = allEnrollments.filter(e =>
            e.status === 'COMPLETED' && e.midtermGrade && e.finalGrade
        );

        const avgGrade = completedEnrollments.length > 0 ?
            completedEnrollments.reduce((sum, e) =>
                sum + (parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2, 0
            ) / completedEnrollments.length : 0;

        const passedStudents = completedEnrollments.filter(e => {
            const total = (parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2;
            return total >= 60;
        }).length;

        const passRate = completedEnrollments.length > 0 ?
            (passedStudents / completedEnrollments.length * 100) : 0;

        // Stats Cards
        const stats = [
            { icon: '👥', label: 'Students', value: completedEnrollments.length },
            { icon: '📊', label: 'Avg Grade', value: avgGrade.toFixed(1) },
            { icon: '✅', label: 'Passed', value: passedStudents },
            { icon: '📈', label: 'Pass Rate', value: passRate.toFixed(1) + '%' }
        ];

        stats.forEach((stat, index) => {
            const x = 15 + (index * 47);
            doc.setFillColor(...colors.secondary);
            doc.roundedRect(x, currentY, 42, 25, 3, 3, 'F');
            doc.setFontSize(16);
            doc.text(stat.icon, x + 21, currentY + 11, { align: 'center' });
            doc.setFontSize(14);
            doc.setTextColor(...colors.white);
            doc.setFont('helvetica', 'bold');
            doc.text(stat.value.toString(), x + 21, currentY + 20, { align: 'center' });
        });

        currentY += 30;
        stats.forEach((stat, index) => {
            const x = 15 + (index * 47);
            doc.setFontSize(8);
            doc.setTextColor(...colors.text);
            doc.setFont('helvetica', 'normal');
            doc.text(stat.label, x + 21, currentY, { align: 'center' });
        });

        // Performance Table
        currentY += 10;
        doc.autoTable({
            startY: currentY,
            head: [['Student', 'Course', 'Midterm', 'Final', 'Total', 'Grade']],
            body: completedEnrollments.map(e => {
                const total = ((parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2).toFixed(1);
                return [
                    `${e.student?.firstName} ${e.student?.lastName}`,
                    e.course?.courseName || 'N/A',
                    e.midtermGrade,
                    e.finalGrade,
                    total,
                    calculateGrade(e.midtermGrade, e.finalGrade)
                ];
            }),
            theme: 'grid',
            headStyles: {
                fillColor: colors.primary,
                textColor: colors.white,
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 8,
                textColor: colors.text
            },
            alternateRowStyles: {
                fillColor: colors.lightBg
            },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 70 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(...colors.secondary);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Performance Report | Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save(`UNT_Performance_Report_${new Date().getFullYear()}.pdf`);
        showNotification('✅ Performance report generated successfully', 'success');

    } catch (error) {
        console.error('❌ Error generating performance report:', error);
        showNotification('Failed to generate report', 'error');
    }
}







async function generatePerformanceReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Student Performance Report', 14, 20);

        doc.setFontSize(12);
        doc.text(`Lecturer: ${currentLecturer.firstName} ${currentLecturer.lastName}`, 14, 30);
        doc.text(`Date: ${formatDate(new Date())}`, 14, 37);

        // Calculate statistics
        const completedEnrollments = allEnrollments.filter(e => e.status === 'COMPLETED' && e.midtermGrade && e.finalGrade);
        const avgGrade = completedEnrollments.length > 0 ?
            completedEnrollments.reduce((sum, e) => sum + (parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2, 0) / completedEnrollments.length : 0;

        doc.setFontSize(11);
        doc.text(`Average Grade: ${avgGrade.toFixed(2)}`, 14, 47);
        doc.text(`Completed Courses: ${completedEnrollments.length}`, 14, 54);

        doc.autoTable({
            startY: 60,
            head: [['Student', 'Course', 'Midterm', 'Final', 'Total', 'Grade']],
            body: completedEnrollments.map(e => {
                const total = ((parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2).toFixed(2);
                return [
                    `${e.student?.firstName} ${e.student?.lastName}`,
                    e.course?.courseName || 'N/A',
                    e.midtermGrade,
                    e.finalGrade,
                    total,
                    calculateGrade(e.midtermGrade, e.finalGrade)
                ];
            })
        });

        doc.save('performance-report.pdf');
        showNotification('Report generated successfully');
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report', 'error');
    }
}

async function generateAttendanceReport() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Attendance Report', 14, 20);

        doc.setFontSize(12);
        doc.text(`Lecturer: ${currentLecturer.firstName} ${currentLecturer.lastName}`, 14, 30);
        doc.text(`Date: ${formatDate(new Date())}`, 14, 37);

        const enrollmentsWithAttendance = allEnrollments.filter(e => e.attendance != null);
        const avgAttendance = enrollmentsWithAttendance.length > 0 ?
            enrollmentsWithAttendance.reduce((sum, e) => sum + e.attendance, 0) / enrollmentsWithAttendance.length : 0;

        doc.setFontSize(11);
        doc.text(`Average Attendance: ${avgAttendance.toFixed(2)}%`, 14, 47);

        doc.autoTable({
            startY: 54,
            head: [['Student', 'Course', 'Attendance', 'Status']],
            body: enrollmentsWithAttendance.map(e => [
                `${e.student?.firstName} ${e.student?.lastName}`,
                e.course?.courseName || 'N/A',
                `${e.attendance}%`,
                e.attendance >= 75 ? 'Good' : 'Low'
            ])
        });

        doc.save('attendance-report.pdf');
        showNotification('Report generated successfully');
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report', 'error');
    }
}

async function handleCustomReport(e) {
    e.preventDefault();

    try {
        const type = document.getElementById('reportType').value;
        const courseId = document.getElementById('reportCourse').value;
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;

        let data = [];
        let title = '';

        switch(type) {
            case 'courses':
                data = courseId ? allCourses.filter(c => c.id === parseInt(courseId)) : allCourses;
                title = 'Courses Report';
                break;
            case 'content':
                data = allContent;
                if (courseId) data = data.filter(c => c.course?.id === parseInt(courseId));
                if (startDate) data = data.filter(c => new Date(c.uploadDate) >= new Date(startDate));
                if (endDate) data = data.filter(c => new Date(c.uploadDate) <= new Date(endDate));
                title = 'Content Report';
                break;
            case 'students':
                data = allEnrollments;
                if (courseId) data = data.filter(e => e.course?.id === parseInt(courseId));
                title = 'Students Report';
                break;
            case 'grades':
                data = allEnrollments.filter(e => e.midtermGrade && e.finalGrade);
                if (courseId) data = data.filter(e => e.course?.id === parseInt(courseId));
                title = 'Grades Report';
                break;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(title, 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated: ${formatDate(new Date())}`, 14, 30);

        if (data.length === 0) {
            doc.text('No data found for the selected filters', 14, 45);
        } else {
            let tableData = [];
            let headers = [];

            switch(type) {
                case 'courses':
                    headers = [['Code', 'Name', 'Credits', 'Students']];
                    tableData = data.map(c => [
                        c.courseCode,
                        c.courseName,
                        c.credits,
                        allEnrollments.filter(e => e.course?.id === c.id).length
                    ]);
                    break;
                case 'content':
                    headers = [['Title', 'Type', 'Status', 'Date']];
                    tableData = data.map(c => [
                        c.title,
                        c.contentType,
                        c.approvalStatus,
                        formatDate(c.uploadDate)
                    ]);
                    break;
                case 'students':
                    headers = [['Student', 'Course', 'Status']];
                    tableData = data.map(e => [
                        `${e.student?.firstName} ${e.student?.lastName}`,
                        e.course?.courseName || 'N/A',
                        e.status
                    ]);
                    break;
                case 'grades':
                    headers = [['Student', 'Course', 'Midterm', 'Final', 'Grade']];
                    tableData = data.map(e => [
                        `${e.student?.firstName} ${e.student?.lastName}`,
                        e.course?.courseName || 'N/A',
                        e.midtermGrade,
                        e.finalGrade,
                        calculateGrade(e.midtermGrade, e.finalGrade)
                    ]);
                    break;
            }

            doc.autoTable({
                startY: 40,
                head: headers,
                body: tableData
            });
        }

        doc.save(`${type}-custom-report.pdf`);
        showNotification('Custom report generated successfully');
    } catch (error) {
        console.error('Error generating custom report:', error);
        showNotification('Failed to generate custom report', 'error');
    }
}

// ===== ANALYTICS FUNCTIONS =====
async function loadAnalyticsPage() {
    try {
        if (!currentLecturer) return;

        // Calculate analytics
        const activeStudents = new Set(allEnrollments.filter(e => e.status === 'IN_PROGRESS' || e.status === 'REGISTERED').map(e => e.student?.id)).size;
        const enrollmentsWithAttendance = allEnrollments.filter(e => e.attendance != null);
        const avgAttendance = enrollmentsWithAttendance.length > 0 ?
            enrollmentsWithAttendance.reduce((sum, e) => sum + e.attendance, 0) / enrollmentsWithAttendance.length : 0;

        const completedEnrollments = allEnrollments.filter(e => e.status === 'COMPLETED' && e.midtermGrade && e.finalGrade);
        const avgGrade = completedEnrollments.length > 0 ?
            completedEnrollments.reduce((sum, e) => sum + (parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2, 0) / completedEnrollments.length : 0;

        const passedStudents = completedEnrollments.filter(e => {
            const total = (parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2;
            return total >= 60;
        }).length;
        const passRate = completedEnrollments.length > 0 ? (passedStudents / completedEnrollments.length * 100) : 0;

        // Update stats
        document.getElementById('analyticsActiveStudents').textContent = activeStudents;
        document.getElementById('analyticsAvgAttendance').textContent = `${avgAttendance.toFixed(1)}%`;
        document.getElementById('analyticsAvgGrade').textContent = avgGrade.toFixed(2);
        document.getElementById('analyticsPassRate').textContent = `${passRate.toFixed(1)}%`;

        // Load charts
        loadAnalyticsCharts();
        loadPerformanceByCourse();
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('Failed to load analytics', 'error');
    }
}

function loadAnalyticsCharts() {
    // Grade Distribution Chart
    const gradeRanges = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (<60)': 0 };
    allEnrollments.forEach(e => {
        if (e.midtermGrade && e.finalGrade) {
            const total = (parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2;
            if (total >= 90) gradeRanges['A (90-100)']++;
            else if (total >= 80) gradeRanges['B (80-89)']++;
            else if (total >= 70) gradeRanges['C (70-79)']++;
            else if (total >= 60) gradeRanges['D (60-69)']++;
            else gradeRanges['F (<60)']++;
        }
    });

    if (charts.gradeDistributionChart) charts.gradeDistributionChart.destroy();
    const ctxGrade = document.getElementById('gradeDistributionChart');
    if (ctxGrade) {
        charts.gradeDistributionChart = new Chart(ctxGrade, {
            type: 'bar',
            data: {
                labels: Object.keys(gradeRanges),
                datasets: [{
                    label: 'Number of Students',
                    data: Object.values(gradeRanges),
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Performance Trend Chart
    const monthlyPerformance = {};
    allEnrollments.forEach(e => {
        if (e.enrollmentDate && e.midtermGrade && e.finalGrade) {
            const month = new Date(e.enrollmentDate).toLocaleDateString('en-US', { month: 'short' });
            if (!monthlyPerformance[month]) monthlyPerformance[month] = [];
            monthlyPerformance[month].push((parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2);
        }
    });

    const avgByMonth = {};
    Object.keys(monthlyPerformance).forEach(month => {
        const grades = monthlyPerformance[month];
        avgByMonth[month] = grades.reduce((a, b) => a + b, 0) / grades.length;
    });

    if (charts.performanceTrendChart) charts.performanceTrendChart.destroy();
    const ctxTrend = document.getElementById('performanceTrendChart');
    if (ctxTrend) {
        charts.performanceTrendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: Object.keys(avgByMonth),
                datasets: [{
                    label: 'Average Grade',
                    data: Object.values(avgByMonth),
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    // Attendance Trend Chart
    const monthlyAttendance = {};
    allEnrollments.forEach(e => {
        if (e.enrollmentDate && e.attendance != null) {
            const month = new Date(e.enrollmentDate).toLocaleDateString('en-US', { month: 'short' });
            if (!monthlyAttendance[month]) monthlyAttendance[month] = [];
            monthlyAttendance[month].push(e.attendance);
        }
    });

    const avgAttendanceByMonth = {};
    Object.keys(monthlyAttendance).forEach(month => {
        const attendance = monthlyAttendance[month];
        avgAttendanceByMonth[month] = attendance.reduce((a, b) => a + b, 0) / attendance.length;
    });

    if (charts.attendanceTrendChart) charts.attendanceTrendChart.destroy();
    const ctxAttendance = document.getElementById('attendanceTrendChart');
    if (ctxAttendance) {
        charts.attendanceTrendChart = new Chart(ctxAttendance, {
            type: 'line',
            data: {
                labels: Object.keys(avgAttendanceByMonth),
                datasets: [{
                    label: 'Average Attendance (%)',
                    data: Object.values(avgAttendanceByMonth),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    // Content Activity Chart
    const contentByMonth = {};
    allContent.forEach(c => {
        if (c.uploadDate) {
            const month = new Date(c.uploadDate).toLocaleDateString('en-US', { month: 'short' });
            contentByMonth[month] = (contentByMonth[month] || 0) + 1;
        }
    });

    if (charts.contentActivityChart) charts.contentActivityChart.destroy();
    const ctxContent = document.getElementById('contentActivityChart');
    if (ctxContent) {
        charts.contentActivityChart = new Chart(ctxContent, {
            type: 'bar',
            data: {
                labels: Object.keys(contentByMonth),
                datasets: [{
                    label: 'Content Uploads',
                    data: Object.values(contentByMonth),
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

function loadPerformanceByCourse() {
    const tbody = document.getElementById('performanceByCourseBody');
    if (!tbody) return;

    const courseStats = allCourses.map(course => {
        const courseEnrollments = allEnrollments.filter(e => e.course?.id === course.id);
        const completedEnrollments = courseEnrollments.filter(e => e.status === 'COMPLETED' && e.midtermGrade && e.finalGrade);

        const avgGrade = completedEnrollments.length > 0 ?
            completedEnrollments.reduce((sum, e) => sum + (parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2, 0) / completedEnrollments.length : 0;

        const passedStudents = completedEnrollments.filter(e => {
            const total = (parseFloat(e.midtermGrade) + parseFloat(e.finalGrade)) / 2;
            return total >= 60;
        }).length;
        const passRate = completedEnrollments.length > 0 ? (passedStudents / completedEnrollments.length * 100) : 0;

        const enrollmentsWithAttendance = courseEnrollments.filter(e => e.attendance != null);
        const avgAttendance = enrollmentsWithAttendance.length > 0 ?
            enrollmentsWithAttendance.reduce((sum, e) => sum + e.attendance, 0) / enrollmentsWithAttendance.length : 0;

        return {
            course,
            students: courseEnrollments.length,
            avgGrade,
            passRate,
            avgAttendance
        };
    });

    tbody.innerHTML = courseStats.map(stat => `
        <tr>
            <td>${stat.course.courseName}</td>
            <td>${stat.students}</td>
            <td>${stat.avgGrade.toFixed(2)}</td>
            <td>${stat.passRate.toFixed(1)}%</td>
            <td>${stat.avgAttendance.toFixed(1)}%</td>
        </tr>
    `).join('');
}

// ===== SETTINGS FUNCTIONS =====
function loadSettingsPage() {
    if (!currentLecturer) return;

    document.getElementById('settingsFirstName').value = currentLecturer.firstName;
    document.getElementById('settingsLastName').value = currentLecturer.lastName;
    document.getElementById('settingsEmail').value = currentLecturer.email;
    document.getElementById('settingsPhone').value = currentLecturer.phoneNumber;
}

async function handleAccountSettings(e) {
    e.preventDefault();

    try {
        const updatedData = {
            ...currentLecturer,
            firstName: document.getElementById('settingsFirstName').value,
            lastName: document.getElementById('settingsLastName').value,
            email: document.getElementById('settingsEmail').value,
            phoneNumber: document.getElementById('settingsPhone').value
        };

        await updateLecturer(currentLecturer.id, updatedData);
        currentLecturer = updatedData;

        showNotification('Account settings updated successfully');
    } catch (error) {
        console.error('Error updating settings:', error);
        showNotification('Failed to update settings', 'error');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();

    const current = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (newPassword !== confirm) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        // Implement password change logic here
        showNotification('Password changed successfully');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Failed to change password', 'error');
    }
}

// ===== EDIT PROFILE MODAL =====
function openEditProfileModal() {
    if (!currentLecturer) return;

    document.getElementById('editFirstName').value = currentLecturer.firstName;
    document.getElementById('editLastName').value = currentLecturer.lastName;
    document.getElementById('editEmail').value = currentLecturer.email;
    document.getElementById('editPhone').value = currentLecturer.phoneNumber;
    document.getElementById('editDepartment').value = currentLecturer.department;
    document.getElementById('editQualification').value = currentLecturer.qualification;
    document.getElementById('editSpecialization').value = currentLecturer.specialization || '';
    document.getElementById('editOfficeLocation').value = currentLecturer.officeLocation || '';
    document.getElementById('editOfficeHours').value = currentLecturer.officeHours || '';

    document.getElementById('editProfileModal').style.display = 'flex';
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

async function handleEditProfile(e) {
    e.preventDefault();

    try {
        const updatedData = {
            ...currentLecturer,
            firstName: document.getElementById('editFirstName').value,
            lastName: document.getElementById('editLastName').value,
            email: document.getElementById('editEmail').value,
            phoneNumber: document.getElementById('editPhone').value,
            department: document.getElementById('editDepartment').value,
            qualification: document.getElementById('editQualification').value,
            specialization: document.getElementById('editSpecialization').value,
            officeLocation: document.getElementById('editOfficeLocation').value,
            officeHours: document.getElementById('editOfficeHours').value
        };

        await updateLecturer(currentLecturer.id, updatedData);
        currentLecturer = updatedData;

        showNotification('Profile updated successfully');
        closeEditProfileModal();
        loadProfilePage();
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile', 'error');
    }
}

// ===== NOTIFICATIONS =====
async function loadNotifications() {
    try {
        const userId = sessionStorage.getItem('userId');
        if (!userId) return;

        const notifications = await getUnreadNotifications(parseInt(userId));
        const count = await countUnreadNotifications(parseInt(userId));

        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }

        const list = document.getElementById('notificationList');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<div class="loading">No new notifications</div>';
            return;
        }

        list.innerHTML = notifications.slice(0, 5).map(notif => `
            <div class="notification-item ${notif.isRead ? '' : 'unread'}" onclick="markNotificationRead(${notif.id})">
                <div class="notification-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${formatDate(notif.createdAt)}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function markNotificationRead(id) {
    try {
        await markNotificationAsRead(id);
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllRead() {
    try {
        const userId = sessionStorage.getItem('userId');
        if (!userId) return;

        await markAllNotificationsAsRead(parseInt(userId));
        loadNotifications();
        showNotification('All notifications marked as read');
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

// ===== THEME & UI FUNCTIONS =====
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

function changeLanguage(lang) {
    // Implement language change logic here
    localStorage.setItem('language', lang);

    // Update button states
    document.getElementById('englishBtn').classList.toggle('active', lang === 'en');
    document.getElementById('frenchBtn').classList.toggle('active', lang === 'fr');

    showNotification(`Language changed to ${lang === 'en' ? 'English' : 'French'}`);
}

// ===== FILTER FUNCTIONS =====
function setupFilters() {
    // Search filters
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', handleSearch);
    });

    // Dropdown filters
    const filters = document.querySelectorAll('.filter-select');
    filters.forEach(filter => {
        filter.addEventListener('change', handleFilterChange);
    });

    // Grade course filter
    const gradeCourseFilter = document.getElementById('gradeCourseFilter');
    if (gradeCourseFilter) {
        gradeCourseFilter.addEventListener('change', handleCourseFilterChange);
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const pageId = document.querySelector('.page-content.active')?.id;

    // Implement search logic based on active page
    switch(pageId) {
        case 'coursesPage':
            const filteredCourses = allCourses.filter(c =>
                c.courseName.toLowerCase().includes(searchTerm) ||
                c.courseCode.toLowerCase().includes(searchTerm)
            );
            displayCourses(filteredCourses);
            break;
        case 'contentPage':
            const filteredContent = allContent.filter(c =>
                c.title.toLowerCase().includes(searchTerm)
            );
            displayContent(filteredContent);
            break;
        case 'studentsPage':
            const filteredEnrollments = allEnrollments.filter(e =>
                e.student?.firstName.toLowerCase().includes(searchTerm) ||
                e.student?.lastName.toLowerCase().includes(searchTerm) ||
                e.student?.studentId.toLowerCase().includes(searchTerm)
            );
            displayStudents(filteredEnrollments);
            break;
    }
}

function handleFilterChange(e) {
    const pageId = document.querySelector('.page-content.active')?.id;

    // Get all active filters for current page
    const filters = {};
    document.querySelectorAll('.filter-select').forEach(select => {
        if (select.value) {
            filters[select.id] = select.value;
        }
    });

    // Apply filters based on active page
    switch(pageId) {
        case 'coursesPage':
            let filtered = [...allCourses];
            if (filters.courseYearFilter) filtered = filtered.filter(c => c.year === parseInt(filters.courseYearFilter));
            if (filters.courseSemesterFilter) filtered = filtered.filter(c => c.semester === parseInt(filters.courseSemesterFilter));
            displayCourses(filtered);
            break;
        case 'contentPage':
            let filteredContent = [...allContent];
            if (filters.contentTypeFilter) filteredContent = filteredContent.filter(c => c.contentType === filters.contentTypeFilter);
            if (filters.contentStatusFilter) filteredContent = filteredContent.filter(c => c.approvalStatus === filters.contentStatusFilter);
            if (filters.contentCourseFilter) filteredContent = filteredContent.filter(c => c.course?.id === parseInt(filters.contentCourseFilter));
            displayContent(filteredContent);
            break;
        case 'studentsPage':
            let filteredStudents = [...allEnrollments];
            if (filters.studentCourseFilter) filteredStudents = filteredStudents.filter(e => e.course?.id === parseInt(filters.studentCourseFilter));
            if (filters.studentYearFilter) filteredStudents = filteredStudents.filter(e => e.student?.currentYear === parseInt(filters.studentYearFilter));
            displayStudents(filteredStudents);
            break;
        case 'timetablePage':
            let filteredTimetable = [...allTimetable];
            if (filters.timetableDayFilter) filteredTimetable = filteredTimetable.filter(t => t.dayOfWeek === filters.timetableDayFilter);
            if (filters.timetableTypeFilter) filteredTimetable = filteredTimetable.filter(t => t.classType === filters.timetableTypeFilter);
            displayTimetable(filteredTimetable);
            break;
    }
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            // ✅ Ignorer WhatsApp
            if (item.id === 'whatsappNavLink' || item.getAttribute('href') === '../WhatsApp.html') {
                return; // Laisser le lien fonctionner normalement
            }

            e.preventDefault();
            const page = item.getAttribute('data-page');

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Hide all pages
            document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));

            // Show selected page
            const pageElement = document.getElementById(`${page}Page`);
            if (pageElement) {
                pageElement.classList.add('active');

                // Update page title
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) {
                    pageTitle.textContent = item.querySelector('.text').textContent;
                }

                // Load page-specific data
                await loadPageData(page);
            }
        });
    });
}

async function loadPageData(page) {
    switch(page) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'profile':
            await loadProfilePage();
            break;
        case 'courses':
            await loadCoursesPage();
            break;
        case 'content':
            await loadContentPage();
            break;
        case 'timetable':
            await loadTimetablePage();
            break;
        case 'students':
            await loadStudentsPage();
            break;
        case 'grades':
            await loadGradesPage();
            break;
        case 'reports':
            await loadReportsPage();
            break;
        case 'analytics':
            await loadAnalyticsPage();
            break;
        case 'settings':
            loadSettingsPage();
            break;
    }
}




// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '../html/login.html';
    });

    // Theme toggle
    document.getElementById('lightThemeBtn')?.addEventListener('click', () => {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    });

    document.getElementById('darkThemeBtn')?.addEventListener('click', () => {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    });

    // Upload content modal
    document.getElementById('uploadContentBtn')?.addEventListener('click', openUploadModal);
    document.getElementById('closeUploadModal')?.addEventListener('click', closeUploadModal);
    document.getElementById('uploadCancelBtn')?.addEventListener('click', closeUploadModal);
    document.getElementById('uploadContentForm')?.addEventListener('submit', handleUploadContent);

    // Edit profile modal
    document.getElementById('editProfileBtn')?.addEventListener('click', openEditProfileModal);
    document.getElementById('closeEditProfileModal')?.addEventListener('click', closeEditProfileModal);
    document.getElementById('editProfileCancelBtn')?.addEventListener('click', closeEditProfileModal);
    document.getElementById('editProfileForm')?.addEventListener('submit', handleEditProfile);

    // Grade modal
    document.getElementById('closeGradeModal')?.addEventListener('click', closeGradeModal);
    document.getElementById('gradeCancelBtn')?.addEventListener('click', closeGradeModal);
    document.getElementById('updateGradeForm')?.addEventListener('submit', handleUpdateGrade);

    // Student details modal
    document.getElementById('closeStudentDetailsModal')?.addEventListener('click', () => {
        document.getElementById('studentDetailsModal').style.display = 'none';
    });

    // Settings forms
    document.getElementById('accountSettingsForm')?.addEventListener('submit', handleAccountSettings);
    document.getElementById('changePasswordForm')?.addEventListener('submit', handleChangePassword);

    // Reports
    document.getElementById('generateTeachingReportBtn')?.addEventListener('click', generateTeachingReport);
    document.getElementById('generateContentReportBtn')?.addEventListener('click', generateContentReport);
    document.getElementById('generatePerformanceReportBtn')?.addEventListener('click', generatePerformanceReport);
    document.getElementById('generateAttendanceReportBtn')?.addEventListener('click', generateAttendanceReport);
    document.getElementById('customReportForm')?.addEventListener('submit', handleCustomReport);

    // Notifications
    document.getElementById('notificationToggle')?.addEventListener('click', () => {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
    });
    document.getElementById('markAllReadBtn')?.addEventListener('click', markAllRead);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-container')) {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown) dropdown.style.display = 'none';
        }
    });

    // Export buttons
    document.getElementById('exportCoursesBtn')?.addEventListener('click', () => {
        // Implement export functionality
        showNotification('Export feature coming soon');
    });

    document.getElementById('exportContentBtn')?.addEventListener('click', () => {
        showNotification('Export feature coming soon');
    });
document.getElementById('exportTimetableBtn')?.addEventListener('click', exportTimetablePDF);

    document.getElementById('exportStudentsBtn')?.addEventListener('click', () => {
        showNotification('Export feature coming soon');
    });

    document.getElementById('exportGradesBtn')?.addEventListener('click', () => {
        showNotification('Export feature coming soon');
    });
}





async function initialize() {
    try {
        console.log('🚀 Starting lecturer dashboard initialization...');

        // Check authentication
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            console.error('❌ Authentication failed');
            return;
        }

        // Load theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        // Load lecturer profile FIRST
        console.log('📋 Loading lecturer profile...');
        await loadLecturerProfile();

        if (!currentLecturer) {
            throw new Error('Failed to load lecturer profile');
        }

        console.log('✅ Lecturer profile loaded:', currentLecturer.id);

        // Setup navigation
        setupNavigation();

        // Setup event listeners
        setupEventListeners();

        // Setup filters
        setupFilters();

        // Load initial dashboard
        console.log('📊 Loading initial dashboard...');
        await loadDashboard();

        // ✅ CORRECTION: Charger les notifications APRÈS avoir chargé le profil
        console.log('🔔 Loading notifications...');
        await loadNotifications();

        // Refresh notifications every 30 seconds
        setInterval(() => {
            if (currentLecturer) {
                loadNotifications();
            }
        }, 30000);

        console.log('✅ Initialization complete!');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        showNotification('Failed to initialize application: ' + error.message, 'error');
    }
}






// Start the application
document.addEventListener('DOMContentLoaded', initialize);
