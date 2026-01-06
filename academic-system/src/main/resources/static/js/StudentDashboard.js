 // Configuration de l'API
    const API_BASE_URL = 'http://localhost:8080/api';

// Variables globales
let currentUser = null;
let currentStudent = null;
let currentAcademicYears = [];
let currentAcademicYear = null;
let enrollCourseId = null;

// Éléments DOM - Utiliser querySelector pour éviter les erreurs null
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const mainContent = document.querySelector('.main-content');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const dropdownLogout = document.getElementById('dropdownLogout');
const userMenuBtn = document.getElementById('userMenuBtn');
const userDropdown = document.getElementById('userDropdown');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const studentNameHeader = document.getElementById('studentNameHeader');
const notificationCount = document.getElementById('notificationCount');
const notificationBadge = document.querySelector('.notification-badge');

    // Initialisation
    document.addEventListener('DOMContentLoaded', () => {
        initializeApp();
        setupEventListeners();
        checkDarkMode();
    });






// Fonction pour initialiser les écouteurs d'événements du sidebar
function initializeSidebar() {
    // Toggle du sidebar
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Navigation items
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateTo(page);
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
}

// Modifiez votre fonction initializeApp pour inclure l'initialisation du sidebar
async function initializeApp() {
    try {
        // Vérifier si l'utilisateur est connecté
        const user = sessionStorage.getItem('user');

        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        currentUser = JSON.parse(user);

        // Vérifier si l'utilisateur est un étudiant
        if (currentUser.role !== 'STUDENT') {
            alert('Accès refusé. Ce tableau de bord est réservé aux étudiants.');
            sessionStorage.clear();
            window.location.href = '/login.html';
            return;
        }

        // Initialiser le sidebar
        initializeSidebar();

        // Charger les données de l'étudiant
        await loadStudentData();

        // Initialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Charger les données du tableau de bord
        await loadDashboard();

        // Charger le compteur de notifications
        await loadNotificationCount();

        // Charger les années académiques pour les paiements
        await loadAcademicYearsForPayment();

    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showError('Échec du chargement de l\'application');
    }
}

// Fonction pour basculer le mode sombre
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);

    // Mettre à jour les icônes si nécessaire
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Fonction pour vérifier le mode sombre
function checkDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    checkDarkMode();
});


// Configurer les écouteurs d'événements
function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('onclick')?.replace("showSection('", "").replace("')", "");
            if (page) {
                navigateTo(page);
            }
        });
    });

    // Notification badge
    if (notificationBadge) {
        notificationBadge.addEventListener('click', () => {
            showSection('notifications');
        });
    }

    // Bouton de déconnexion
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Boutons de téléchargement
    const downloadButtons = document.querySelectorAll('[onclick*="download"]');
    downloadButtons.forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        btn.removeAttribute('onclick');
        btn.addEventListener('click', () => {
            if (onclick && onclick.includes('downloadTimetablePDF')) {
                downloadTimetablePDF();
            } else if (onclick && onclick.includes('generateTranscriptPDF')) {
                generateTranscriptPDF();
            }
        });
    });

    // Boutons de modal
    const paymentModalBtn = document.querySelector('[onclick="showPaymentModal()"]');
    if (paymentModalBtn) {
        paymentModalBtn.removeAttribute('onclick');
        paymentModalBtn.addEventListener('click', showPaymentModal);
    }

    const markAllReadBtn = document.querySelector('[onclick="markAllNotificationsRead()"]');
    if (markAllReadBtn) {
        markAllReadBtn.removeAttribute('onclick');
        markAllReadBtn.addEventListener('click', markAllNotificationsRead);
    }

    // Fermer les modales
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Gestion responsive - CORRECTION de l'erreur "Cannot read properties of null"
    if (window.innerWidth <= 768) {
        const sidebarElement = document.querySelector('.sidebar');
        const sidebarToggleElement = document.getElementById('sidebarToggle');

        if (sidebarElement) {
            document.addEventListener('click', (e) => {
                if (!sidebarElement.contains(e.target) &&
                    (!sidebarToggleElement || !sidebarToggleElement.contains(e.target))) {
                    sidebarElement.classList.remove('active');
                }
            });
        }
    }
}



// Fonction pour gérer la navigation entre les pages
function navigateTo(page) {
    // Mettre à jour l'élément de navigation actif
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const dataPage = item.getAttribute('data-page');
        if (dataPage === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Mettre à jour le titre de la page
    const titles = {
        'dashboard': 'Dashboard',
        'academic-years': 'Academic Years',
        'courses': 'My Courses',
        'available-courses': 'Available Courses',
        'course-content': 'Course Materials',
        'timetable': 'My Timetable',
        'departments': 'Departments',
        'payments': 'Payments',
        'notifications': 'Notifications',
        'parents': 'Parent Information',
        'profile': 'My Profile'
    };

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = titles[page] || 'Dashboard';

    // Masquer toutes les sections
    const sections = document.querySelectorAll('.page-content');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Afficher la section sélectionnée
    const selectedSection = document.getElementById(page);
    if (selectedSection) {
        selectedSection.classList.add('active');
        loadSectionData(page);
    }

    // Fermer le sidebar sur mobile
    if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('active');
    }
}






    function showSection(sectionId) {
        navigateTo(sectionId);
    }

    function getPageSubtitle(page) {
        const subtitles = {
            'dashboard': 'Welcome back to your student portal',
            'academic-years': 'Manage your academic years',
            'courses': 'View and manage your enrolled courses',
            'available-courses': 'Browse and enroll in available courses',
            'course-content': 'Access your course materials',
            'timetable': 'View your class schedule',
            'departments': 'Explore academic departments',
            'payments': 'Manage your payments and fees',
            'notifications': 'View your notifications',
            'parents': 'Parent and guardian information',
            'profile': 'Manage your personal information'
        };
        return subtitles[page] || '';
    }



// Charger les données de l'étudiant
async function loadStudentData() {
    try {
        // Utiliser l'endpoint correct avec l'ID de l'utilisateur
        const response = await fetch(`${API_BASE_URL}/students/${currentUser.id}`);
        if (!response.ok) {
            // Si l'endpoint /students/{id} ne fonctionne pas, essayer de chercher par email
            const allStudentsResponse = await fetch(`${API_BASE_URL}/students`);
            const allStudents = await allStudentsResponse.json();
            currentStudent = allStudents.find(s => s.email === currentUser.email);

            if (!currentStudent) {
                throw new Error('Student not found');
            }
        } else {
            currentStudent = await response.json();
        }

        // Mettre à jour l'interface utilisateur
        if (userName) userName.textContent = `${currentStudent.firstName} ${currentStudent.lastName}`;
        if (studentNameHeader) studentNameHeader.textContent = `${currentStudent.firstName} ${currentStudent.lastName}`;
        if (userAvatar) {
            userAvatar.textContent = currentStudent.firstName.charAt(0);
            userAvatar.style.background = getAvatarBackground(currentStudent.firstName);
        }

        // Charger l'année académique actuelle
        await loadCurrentAcademicYear();

    } catch (error) {
        console.error('Error loading student data:', error);
        showError('Failed to load student information');
    }
}






async function loadCurrentAcademicYear() {
    try {
        const response = await fetch(`${API_BASE_URL}/academic-years/current`);
        if (response.ok) {
            currentAcademicYear = await response.json();
            console.log('Current academic year loaded:', currentAcademicYear);
        } else if (response.status === 404) {
            console.warn('No current academic year found, using default');
            currentAcademicYear = createDefaultAcademicYear();
        } else {
            throw new Error(`Unexpected status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading academic year:', error);
        currentAcademicYear = createDefaultAcademicYear();
    }
}

function createDefaultAcademicYear() {
    const currentYear = new Date().getFullYear();
    return {
        yearCode: currentYear.toString(),
        yearName: `${currentYear}-${currentYear + 1}`,
        semester: 1,
        isCurrent: true,
        isActive: true
    };
}




    // Charger les données de section
    async function loadSectionData(sectionId) {
        try {
            switch(sectionId) {
                case 'dashboard':
                    await loadDashboard();
                    break;
                case 'academic-years':
                    await loadAcademicYears();
                    break;
                case 'courses':
                    await loadMyCourses();
                    break;
                case 'available-courses':
                    await loadAvailableCourses();
                    break;
                case 'course-content':
                    await loadCourseContent();
                    break;
                case 'timetable':
                    await loadTimetable();
                    break;
                case 'departments':
                    await loadDepartments();
                    break;
                case 'payments':
                    await loadPayments();
                    break;
                case 'notifications':
                    await loadNotifications();
                    break;
                case 'parents':
                    await loadParents();
                    break;
                case 'profile':
                    await loadProfile();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${sectionId}:`, error);
            showError(`Failed to load ${sectionId} data`);
        }
    }













// ============================================================================
// SECTION 1: DASHBOARD WITH CHARTS AND STATISTICS (FIXED - NO DUPLICATION)
// ============================================================================

async function loadDashboard() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) {
        console.error('❌ statsGrid element not found');
        return;
    }

    try {
        // Show loading
        statsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        `;

        console.log('🔄 Starting dashboard load...');
        console.log('📍 Current Student:', currentStudent);

        // Fetch all necessary data
        const [enrollmentsRes, paymentsRes, notificationsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/enrollments/student/${currentStudent.id}`),
            fetch(`${API_BASE_URL}/payments/student/${currentStudent.id}`),
            fetch(`${API_BASE_URL}/notifications/user/${currentStudent.id}`)
        ]);

        if (!enrollmentsRes.ok) {
            throw new Error(`Failed to load enrollments: ${enrollmentsRes.status}`);
        }

        const enrollments = await enrollmentsRes.json();
        const payments = await paymentsRes.json();
        const notifications = await notificationsRes.json();

        console.log('✅ Dashboard data loaded successfully!');
        console.log('📊 Enrollments Count:', enrollments.length);

        // Calculate statistics
        const unreadNotifications = notifications.filter(n => !n.isRead).length;

        // Active enrollments (all active statuses)
        const currentEnrollments = enrollments.filter(e =>
            e.status === 'REGISTERED' ||
            e.status === 'IN_PROGRESS'
        );

        console.log('📊 Current Active Enrollments:', currentEnrollments.length);

        // Calculate total number of courses
        const totalCoursesCount = enrollments.length;

        // Calculate grades statistics
        const enrollmentsWithGrades = enrollments.filter(e =>
            e.totalGrade !== null &&
            e.totalGrade !== undefined &&
            e.totalGrade > 0
        );

        const averageGrade = enrollmentsWithGrades.length > 0
            ? enrollmentsWithGrades.reduce((sum, e) => sum + e.totalGrade, 0) / enrollmentsWithGrades.length
            : 0;

        // Calculate total credits from completed courses
        const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');
        let totalCredits = 0;

        for (const enrollment of completedEnrollments) {
            try {
                if (enrollment.course && enrollment.course.credits) {
                    totalCredits += enrollment.course.credits;
                } else if (enrollment.courseId) {
                    const courseRes = await fetch(`${API_BASE_URL}/courses/${enrollment.courseId}`);
                    if (courseRes.ok) {
                        const course = await courseRes.json();
                        totalCredits += course.credits || 0;
                    }
                }
            } catch (error) {
                console.error(`Error fetching credits for enrollment ${enrollment.id}:`, error);
            }
        }

        console.log('📊 Total Credits:', totalCredits);

        // ✅ CRITICAL FIX: Render ONLY ONCE - Clear any existing content first
        statsGrid.innerHTML = '';

        // Create the complete dashboard HTML structure
        const dashboardHTML = `
            <!-- Statistics Cards -->
            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${currentEnrollments.length}</div>
                        <div class="stat-label">Active Courses</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">
                            ${totalCoursesCount} total enrollments
                        </div>
                    </div>
                    <div class="stat-icon primary">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${totalCredits}</div>
                        <div class="stat-label">Total Credits</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">
                            ${completedEnrollments.length} completed courses
                        </div>
                    </div>
                    <div class="stat-icon success">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${averageGrade.toFixed(1)}%</div>
                        <div class="stat-label">Average Grade</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">
                            ${enrollmentsWithGrades.length} graded courses
                        </div>
                    </div>
                    <div class="stat-icon warning">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-header">
                    <div>
                        <div class="stat-value">${unreadNotifications}</div>
                        <div class="stat-label">Unread Notifications</div>
                        <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">
                            ${notifications.length} total
                        </div>
                    </div>
                    <div class="stat-icon danger">
                        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="chart-section" style="grid-column: 1 / -1; margin-top: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Academic Performance Overview</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                            <!-- Grades Chart -->
                            <div>
                                <h4 style="margin-bottom: 16px; color: var(--text-primary); font-size: 14px;">Course Grades</h4>
                                <canvas id="gradesChart"></canvas>
                            </div>
                            <!-- Status Chart -->
                            <div>
                                <h4 style="margin-bottom: 16px; color: var(--text-primary); font-size: 14px;">Enrollment Status</h4>
                                <canvas id="statusChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Courses Section -->
            <div class="recent-courses" style="grid-column: 1 / -1; margin-top: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Recent Courses</h3>
                        <button class="btn btn-primary" onclick="showSection('courses')">View All Courses</button>
                    </div>
                    <div class="card-body" id="recentCoursesContainer">
                        <div class="loading">
                            <div class="spinner"></div>
                            <p>Loading recent courses...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // ✅ Set innerHTML ONCE
        statsGrid.innerHTML = dashboardHTML;

        console.log('✅ Statistics cards rendered');

        // Render charts (destroy existing ones first to prevent duplication)
        console.log('📊 Rendering charts...');
        await renderCharts(enrollments);

        // Load recent courses
        console.log('📚 Loading recent courses...');
        const recentEnrollments = enrollments
            .sort((a, b) => (b.id || 0) - (a.id || 0))
            .slice(0, 3);
        await loadRecentCourses(recentEnrollments);

        console.log('✅ Dashboard loaded successfully!');

    } catch (error) {
        console.error('❌ FATAL ERROR loading dashboard:', error);
        statsGrid.innerHTML = `
            <div class="alert alert-error" style="grid-column: 1 / -1;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Failed to load dashboard. Please refresh the page.
                <br><small style="color: #666;">Error: ${error.message}</small>
            </div>
        `;
    }
}

// ============================================================================
// SECTION 2: CHARTS RENDERING (FIXED - DESTROY EXISTING CHARTS)
// ============================================================================

async function renderCharts(enrollments) {
    try {
        // Prepare data for grades chart
        const enrollmentsWithGrades = [];

        for (const enrollment of enrollments) {
            if (enrollment.totalGrade !== null && enrollment.totalGrade !== undefined && enrollment.totalGrade > 0) {
                try {
                    let course;
                    if (enrollment.course) {
                        course = enrollment.course;
                    } else if (enrollment.courseId) {
                        const courseRes = await fetch(`${API_BASE_URL}/courses/${enrollment.courseId}`);
                        if (courseRes.ok) {
                            course = await courseRes.json();
                        }
                    }

                    if (course) {
                        enrollmentsWithGrades.push({
                            courseName: course.courseCode || course.courseName,
                            grade: enrollment.totalGrade
                        });
                    }
                } catch (error) {
                    console.error('Error fetching course for chart:', error);
                }
            }
        }

        // ✅ RENDER GRADES CHART (with proper cleanup)
        const gradesCtx = document.getElementById('gradesChart');
        if (gradesCtx) {
            // Destroy existing chart to prevent duplication
            const existingGradesChart = Chart.getChart(gradesCtx);
            if (existingGradesChart) {
                existingGradesChart.destroy();
            }

            if (enrollmentsWithGrades.length > 0) {
                new Chart(gradesCtx, {
                    type: 'bar',
                    data: {
                        labels: enrollmentsWithGrades.map(e => e.courseName),
                        datasets: [{
                            label: 'Grade (%)',
                            data: enrollmentsWithGrades.map(e => e.grade),
                            backgroundColor: 'rgba(37, 99, 235, 0.6)',
                            borderColor: 'rgba(37, 99, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        },
                        plugins: {
                            legend: {
                                display: true
                            }
                        }
                    }
                });
            } else {
                gradesCtx.parentElement.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No graded courses available</p>';
            }
        }

        // Prepare data for status chart (exclude PENDING)
        const statusCounts = {
            'REGISTERED': enrollments.filter(e => e.status === 'REGISTERED').length,
            'IN_PROGRESS': enrollments.filter(e => e.status === 'IN_PROGRESS').length,
            'COMPLETED': enrollments.filter(e => e.status === 'COMPLETED').length,
            'DROPPED': enrollments.filter(e => e.status === 'DROPPED').length
        };

        // ✅ RENDER STATUS CHART (with proper cleanup)
        const statusCtx = document.getElementById('statusChart');
        if (statusCtx) {
            // Destroy existing chart to prevent duplication
            const existingStatusChart = Chart.getChart(statusCtx);
            if (existingStatusChart) {
                existingStatusChart.destroy();
            }

            new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Registered', 'In Progress', 'Completed', 'Dropped'],
                    datasets: [{
                        data: [
                            statusCounts.REGISTERED,
                            statusCounts.IN_PROGRESS,
                            statusCounts.COMPLETED,
                            statusCounts.DROPPED
                        ],
                        backgroundColor: [
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(37, 99, 235, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ],
                        borderColor: [
                            'rgba(251, 191, 36, 1)',
                            'rgba(37, 99, 235, 1)',
                            'rgba(16, 185, 129, 1)',
                            'rgba(239, 68, 68, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error rendering charts:', error);
    }
}

// ============================================================================
// SECTION 3: RECENT COURSES DISPLAY (NO CHANGES NEEDED)
// ============================================================================

async function loadRecentCourses(recentEnrollments) {
    const container = document.getElementById('recentCoursesContainer');
    if (!container) return;

    if (recentEnrollments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No recent courses to display</p>
                <button class="btn btn-primary" onclick="showSection('available-courses')" style="margin-top: 16px;">
                    Browse Available Courses
                </button>
            </div>
        `;
        return;
    }

    try {
        let html = '<div class="grid-3">';

        for (const enrollment of recentEnrollments) {
            try {
                let course;
                if (enrollment.course) {
                    course = enrollment.course;
                } else if (enrollment.courseId) {
                    const courseRes = await fetch(`${API_BASE_URL}/courses/${enrollment.courseId}`);
                    if (!courseRes.ok) continue;
                    course = await courseRes.json();
                } else {
                    continue;
                }

                const statusClass =
                    enrollment.status === 'COMPLETED' ? 'badge-success' :
                    enrollment.status === 'IN_PROGRESS' ? 'badge-primary' :
                    enrollment.status === 'REGISTERED' ? 'badge-warning' :
                    'badge-danger';

                html += `
                    <div class="course-card">
                        <div class="course-header">
                            <span class="course-code">${course.courseCode}</span>
                            <span class="badge ${statusClass}">${enrollment.status}</span>
                        </div>
                        <div class="course-title">${course.courseName}</div>
                        <div class="course-info">
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                ${course.credits} Credits
                            </span>
                        </div>
                        ${enrollment.totalGrade !== null && enrollment.totalGrade !== undefined && enrollment.totalGrade > 0 ? `
                            <div style="margin-top: 12px;">
                                <div style="font-size: 12px; color: var(--gray); margin-bottom: 4px;">Current Grade</div>
                                <div style="font-size: 20px; font-weight: 700; color: var(--primary);">
                                    ${enrollment.totalGrade.toFixed(1)}%
                                </div>
                            </div>
                        ` : ''}
                        <div class="course-actions" style="margin-top: 12px;">
                            <button class="btn btn-primary" onclick="viewCourseDetails(${course.id})" style="width: 100%;">
                                View Details
                            </button>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error loading course details:', error);
            }
        }

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading recent courses:', error);
        container.innerHTML = `
            <div class="alert alert-error">Failed to load recent courses</div>
        `;
    }
}






// ============================================================================
// SECTION 2: CHARTS RENDERING
// ============================================================================

async function renderCharts(enrollments) {
    try {
        // Prepare data for grades chart
        const enrollmentsWithGrades = [];

        for (const enrollment of enrollments) {
            if (enrollment.totalGrade !== null && enrollment.totalGrade !== undefined && enrollment.totalGrade > 0) {
                try {
                    let course;
                    if (enrollment.course) {
                        course = enrollment.course;
                    } else if (enrollment.courseId) {
                        const courseRes = await fetch(`${API_BASE_URL}/courses/${enrollment.courseId}`);
                        if (courseRes.ok) {
                            course = await courseRes.json();
                        }
                    }

                    if (course) {
                        enrollmentsWithGrades.push({
                            courseName: course.courseCode || course.courseName,
                            grade: enrollment.totalGrade
                        });
                    }
                } catch (error) {
                    console.error('Error fetching course for chart:', error);
                }
            }
        }

        // Render Grades Chart
        const gradesCtx = document.getElementById('gradesChart');
        if (gradesCtx) {
            // Destroy existing chart if it exists
            const existingChart = Chart.getChart(gradesCtx);
            if (existingChart) {
                existingChart.destroy();
            }

            if (enrollmentsWithGrades.length > 0) {
                new Chart(gradesCtx, {
                    type: 'bar',
                    data: {
                        labels: enrollmentsWithGrades.map(e => e.courseName),
                        datasets: [{
                            label: 'Grade (%)',
                            data: enrollmentsWithGrades.map(e => e.grade),
                            backgroundColor: 'rgba(37, 99, 235, 0.6)',
                            borderColor: 'rgba(37, 99, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        },
                        plugins: {
                            legend: {
                                display: true
                            }
                        }
                    }
                });
            } else {
                gradesCtx.parentElement.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">No graded courses available</p>';
            }
        }

        // Prepare data for status chart
        const statusCounts = {
            'REGISTERED': enrollments.filter(e => e.status === 'REGISTERED').length,
            'IN_PROGRESS': enrollments.filter(e => e.status === 'IN_PROGRESS').length,
            'COMPLETED': enrollments.filter(e => e.status === 'COMPLETED').length,
            'DROPPED': enrollments.filter(e => e.status === 'DROPPED').length
        };

        // Render Status Chart
        const statusCtx = document.getElementById('statusChart');
        if (statusCtx) {
            // Destroy existing chart if it exists
            const existingChart = Chart.getChart(statusCtx);
            if (existingChart) {
                existingChart.destroy();
            }

            new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Registered', 'In Progress', 'Completed', 'Dropped'],
                    datasets: [{
                        data: [
                            statusCounts.REGISTERED,
                            statusCounts.IN_PROGRESS,
                            statusCounts.COMPLETED,
                            statusCounts.DROPPED
                        ],
                        backgroundColor: [
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(37, 99, 235, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ],
                        borderColor: [
                            'rgba(251, 191, 36, 1)',
                            'rgba(37, 99, 235, 1)',
                            'rgba(16, 185, 129, 1)',
                            'rgba(239, 68, 68, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error rendering charts:', error);
    }
}

// ============================================================================
// SECTION 3: RECENT COURSES DISPLAY
// ============================================================================

async function loadRecentCourses(recentEnrollments) {
    const container = document.getElementById('recentCoursesContainer');
    if (!container) return;

    if (recentEnrollments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No recent courses to display</p>
                <button class="btn btn-primary" onclick="showSection('available-courses')" style="margin-top: 16px;">
                    Browse Available Courses
                </button>
            </div>
        `;
        return;
    }

    try {
        let html = '<div class="grid-3">';

        for (const enrollment of recentEnrollments) {
            try {
                let course;
                if (enrollment.course) {
                    course = enrollment.course;
                } else if (enrollment.courseId) {
                    const courseRes = await fetch(`${API_BASE_URL}/courses/${enrollment.courseId}`);
                    if (!courseRes.ok) continue;
                    course = await courseRes.json();
                } else {
                    continue;
                }

                const statusClass =
                    enrollment.status === 'COMPLETED' ? 'badge-success' :
                    enrollment.status === 'IN_PROGRESS' ? 'badge-primary' :
                    enrollment.status === 'REGISTERED' ? 'badge-warning' :
                    'badge-danger';

                html += `
                    <div class="course-card">
                        <div class="course-header">
                            <span class="course-code">${course.courseCode}</span>
                            <span class="badge ${statusClass}">${enrollment.status}</span>
                        </div>
                        <div class="course-title">${course.courseName}</div>
                        <div class="course-info">
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                ${course.credits} Credits
                            </span>
                        </div>
                        ${enrollment.totalGrade !== null && enrollment.totalGrade !== undefined && enrollment.totalGrade > 0 ? `
                            <div style="margin-top: 12px;">
                                <div style="font-size: 12px; color: var(--gray); margin-bottom: 4px;">Current Grade</div>
                                <div style="font-size: 20px; font-weight: 700; color: var(--primary);">
                                    ${enrollment.totalGrade.toFixed(1)}%
                                </div>
                            </div>
                        ` : ''}
                        <div class="course-actions" style="margin-top: 12px;">
                            <button class="btn btn-primary" onclick="viewCourseDetails(${course.id})" style="width: 100%;">
                                View Details
                            </button>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error loading course details:', error);
            }
        }

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading recent courses:', error);
        container.innerHTML = `
            <div class="alert alert-error">Failed to load recent courses</div>
        `;
    }
}










    // Années académiques
    async function loadAcademicYears() {
        const content = document.getElementById('academicYearsContent');
        if (!content) return;

        try {
            const response = await fetch(`${API_BASE_URL}/academic-years`);
            const academicYears = await response.json();

            if (academicYears.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <h3>No Academic Years</h3>
                        <p>No academic years have been created yet.</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="table-container"><table><thead><tr>';
            html += '<th>Year Code</th><th>Name</th><th>Start Date</th><th>End Date</th><th>Status</th>';
            html += '</tr></thead><tbody>';

            academicYears.forEach(year => {
                const statusClass = year.isCurrent ? 'badge-success' : (year.isActive ? 'badge-primary' : 'badge-danger');
                const statusText = year.isCurrent ? 'Current' : (year.isActive ? 'Active' : 'Inactive');

                html += `
                    <tr>
                        <td><strong>${year.yearCode}</strong></td>
                        <td>${year.yearName}</td>
                        <td>${new Date(year.startDate).toLocaleDateString()}</td>
                        <td>${new Date(year.endDate).toLocaleDateString()}</td>
                        <td><span class="badge ${statusClass}">${statusText}</span></td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            content.innerHTML = html;
        } catch (error) {
            console.error('Error loading academic years:', error);
            content.innerHTML = '<div class="alert alert-error">Failed to load academic years</div>';
        }
    }






// ============================================================================
// SECTION 4: ENHANCED MY COURSES VIEW
// ============================================================================

async function loadMyCourses() {
    const content = document.getElementById('coursesContent');
    if (!content) return;

    try {
        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading your courses...</p>
            </div>
        `;

        const response = await fetch(`${API_BASE_URL}/enrollments/student/${currentStudent.id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const enrollments = await response.json();
        console.log('All enrollments:', enrollments);

        if (enrollments.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                    <h3>No Enrolled Courses</h3>
                    <p>You are not enrolled in any courses yet.</p>
                    <button class="btn btn-primary" onclick="showSection('available-courses')" style="margin-top: 16px;">
                        Browse Available Courses
                    </button>
                </div>
            `;
            return;
        }

        let html = '<div class="grid-2">';

        for (const enrollment of enrollments) {
            try {
                // Check if course is already in enrollment object
                let course;
                if (enrollment.course) {
                    course = enrollment.course;
                } else if (enrollment.courseId) {
                    const courseRes = await fetch(`${API_BASE_URL}/courses/${enrollment.courseId}`);
                    if (!courseRes.ok) {
                        console.warn('Course not found:', enrollment.courseId);
                        continue;
                    }
                    course = await courseRes.json();
                } else {
                    console.warn('No course information in enrollment:', enrollment);
                    continue;
                }

                const statusClass =
                    enrollment.status === 'COMPLETED' ? 'badge-success' :
                    enrollment.status === 'IN_PROGRESS' ? 'badge-primary' :
                    enrollment.status === 'REGISTERED' ? 'badge-warning' :
                    'badge-danger';

                let progressHtml = '';
                if (enrollment.totalGrade !== null && enrollment.totalGrade !== undefined) {
                    const progressPercent = Math.min(100, enrollment.totalGrade);
                    const progressColor =
                        progressPercent >= 70 ? '#10b981' :
                        progressPercent >= 50 ? '#f59e0b' :
                        '#ef4444';

                    progressHtml = `
                        <div style="margin-top: 16px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="font-size: 12px; color: var(--gray);">Overall Progress</span>
                                <span style="font-size: 14px; font-weight: 600; color: ${progressColor};">
                                    ${enrollment.totalGrade.toFixed(1)}%
                                </span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                                <div style="width: ${progressPercent}%; height: 100%; background: ${progressColor}; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    `;
                }

                html += `
                    <div class="course-card">
                        <div class="course-header">
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <span class="course-code">${course.courseCode}</span>
                                <span style="font-size: 11px; color: var(--gray);">
                                    ${enrollment.academicYear || 'N/A'} - Semester ${enrollment.semester || 'N/A'}
                                </span>
                            </div>
                            <span class="badge ${statusClass}">${enrollment.status}</span>
                        </div>

                        <div class="course-title">${course.courseName}</div>

                        <div class="course-info">
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                ${course.credits} Credits
                            </span>
                            ${course.lecturer ? `
                                <span>
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                    ${course.lecturer.firstName} ${course.lecturer.lastName}
                                </span>
                            ` : ''}
                        </div>

                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                                <div>
                                    <div style="font-size: 12px; color: var(--gray); margin-bottom: 4px;">Midterm</div>
                                    <div style="font-size: 16px; font-weight: 600;">
                                        ${enrollment.midtermGrade !== null && enrollment.midtermGrade !== undefined ? enrollment.midtermGrade.toFixed(1) + '%' : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--gray); margin-bottom: 4px;">Final</div>
                                    <div style="font-size: 16px; font-weight: 600;">
                                        ${enrollment.finalGrade !== null && enrollment.finalGrade !== undefined ? enrollment.finalGrade.toFixed(1) + '%' : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            ${progressHtml}

                            ${enrollment.letterGrade ? `
                                <div style="margin-top: 12px; text-align: center; padding: 12px; background: #f3f4f6; border-radius: 8px;">
                                    <div style="font-size: 12px; color: var(--gray); margin-bottom: 4px;">Letter Grade</div>
                                    <div style="font-size: 24px; font-weight: 700; color: var(--primary);">
                                        ${enrollment.letterGrade}
                                    </div>
                                </div>
                            ` : ''}
                        </div>

                        <div class="course-actions" style="margin-top: 16px; display: flex; gap: 8px;">
                            <button class="btn btn-primary" onclick="viewCourseDetails(${course.id})" style="flex: 1;">
                                View Details
                            </button>
                            ${enrollment.status === 'REGISTERED' ? `
                                <button class="btn btn-danger" onclick="dropCourse(${enrollment.id})">
                                    Drop
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error processing enrollment:', enrollment, error);
            }
        }

        html += '</div>';
        content.innerHTML = html;

    } catch (error) {
        console.error('Error loading courses:', error);
        content.innerHTML = `
            <div class="alert alert-error">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Failed to load your courses. Please try again later.
            </div>
        `;
    }
}






// Fonction pour voir les détails du cours
async function viewCourseDetails(courseId) {
    try {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
        const course = await response.json();

        // Créer une vraie modal au lieu d'une alerte
        const modalHtml = `
            <div class="modal active" id="courseDetailsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Course Details</h3>
                        <button class="modal-close" onclick="closeCourseDetailsModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <h3 style="margin-bottom: 16px; color: var(--primary);">${course.courseName}</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Course Code</div>
                                <div class="info-value">${course.courseCode}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Credits</div>
                                <div class="info-value">${course.credits}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Faculty</div>
                                <div class="info-value">${course.faculty}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Year/Semester</div>
                                <div class="info-value">Year ${course.year} - Sem ${course.semester}</div>
                            </div>
                        </div>
                        ${course.description ? `
                            <div style="margin-top: 16px;">
                                <div class="info-label">Description</div>
                                <p style="color: var(--dark); margin-top: 8px;">
                                    ${course.description}
                                </p>
                            </div>
                        ` : ''}
                        ${course.lecturer ? `
                            <div style="margin-top: 16px;">
                                <div class="info-label">Lecturer</div>
                                <p style="color: var(--dark); margin-top: 8px; font-weight: 600;">
                                    ${course.lecturer.firstName} ${course.lecturer.lastName}
                                </p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeCourseDetailsModal()">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Ajouter la modal au body
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHtml;
        document.body.appendChild(modalDiv.firstElementChild);

    } catch (error) {
        console.error('Error loading course details:', error);
        showError('Failed to load course details');
    }
}

// Fonction pour fermer la modal de détails
function closeCourseDetailsModal() {
    const modal = document.getElementById('courseDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Fonction pour abandonner un cours
async function dropCourse(enrollmentId) {
    if (!confirm('Are you sure you want to drop this course?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}/drop`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to drop course');
        }

        showSuccess('Course dropped successfully');
        loadMyCourses();
        loadDashboard();
    } catch (error) {
        console.error('Error dropping course:', error);
        showError('Failed to drop course: ' + error.message);
    }
}

// Rendre les fonctions accessibles globalement
window.viewCourseDetails = viewCourseDetails;
window.closeCourseDetailsModal = closeCourseDetailsModal;
window.dropCourse = dropCourse;




    // Cours disponibles
    async function loadAvailableCourses() {
        const content = document.getElementById('availableCoursesContent');
        if (!content) return;

        try {
            // Récupérer les cours disponibles pour l'année et le semestre de l'étudiant
            const response = await fetch(`${API_BASE_URL}/courses/year/${currentStudent.currentYear}/semester/${currentStudent.currentSemester}`);
            const courses = await response.json();

            // Récupérer les cours déjà inscrits
            const enrollmentsResponse = await fetch(`${API_BASE_URL}/enrollments/student/${currentStudent.id}`);
            const enrollments = await enrollmentsResponse.json();
            const enrolledCourseIds = enrollments.map(e => e.courseId);

            // Filtrer les cours non inscrits
            const availableCourses = courses.filter(c =>
                !enrolledCourseIds.includes(c.id) &&
                c.faculty === currentStudent.faculty &&
                c.isActive
            );

            if (availableCourses.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <h3>No Available Courses</h3>
                        <p>There are no courses available for enrollment at this time.</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="course-list">';

            availableCourses.forEach(course => {
                html += `
                    <div class="course-item">
                        <div class="course-header">
                            <span class="course-code">${course.courseCode}</span>
                            <span class="course-credits">${course.credits} Credits - ${course.price || 0} FCFA</span>
                        </div>
                        <div class="course-name">${course.courseName}</div>
                        <div class="course-details">
                            <p>${course.description || 'No description available'}</p>
                            <p><strong>Faculty:</strong> ${course.faculty}</p>
                        </div>
                        <button class="btn btn-primary" onclick="enrollInCourse(${course.id})">
                            <i data-lucide="plus-circle"></i> Enroll Now
                        </button>
                    </div>
                `;
            });

            html += '</div>';
            content.innerHTML = html;

            // Initialiser les icônes
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } catch (error) {
            console.error('Error loading available courses:', error);
            content.innerHTML = '<div class="alert alert-error">Failed to load available courses</div>';
        }
    }

    // Inscription à un cours
    async function enrollInCourse(courseId) {
        enrollCourseId = courseId;

        try {
            const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);
            const course = await response.json();

            const modalContent = document.getElementById('enrollModalContent');
            modalContent.innerHTML = `
                <div class="alert alert-info">
                    <i data-lucide="info"></i>
                    You are about to enroll in the following course:
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Course Code</div>
                        <div class="info-value">${course.courseCode}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Course Name</div>
                        <div class="info-value">${course.courseName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Credits</div>
                        <div class="info-value">${course.credits}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Fee</div>
                        <div class="info-value">${course.price || 0} FCFA</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Faculty</div>
                        <div class="info-value">${course.faculty}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Year/Semester</div>
                        <div class="info-value">Year ${course.year} - Semester ${course.semester}</div>
                    </div>
                </div>
            `;

            // Initialiser les icônes
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            document.getElementById('enrollModal').classList.add('active');
        } catch (error) {
            console.error('Error loading course details:', error);
            showError('Failed to load course details');
        }
    }

    // Confirmer l'inscription
    async function confirmEnrollment() {
        if (!enrollCourseId || !currentStudent || !currentAcademicYear) {
            showError('Missing required information');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/enrollments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    studentId: currentStudent.id,
                    courseId: enrollCourseId,
                    academicYear: currentAcademicYear.yearCode,
                    semester: currentAcademicYear.semester,
                    status: 'REGISTERED'
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            showSuccess('Successfully enrolled in the course!');
            closeEnrollModal();
            loadAvailableCourses();
            loadMyCourses();
            loadDashboard();
        } catch (error) {
            console.error('Error enrolling in course:', error);
            showError('Failed to enroll in course: ' + error.message);
        }
    }

    // Fermer la modal d'inscription
    function closeEnrollModal() {
        document.getElementById('enrollModal').classList.remove('active');
        enrollCourseId = null;
    }








// ============================================================================
// COURSE CONTENT DISPLAY - WITH STATUS INDICATORS (SHOWS ALL CONTENT)
// ============================================================================

async function loadCourseContent() {
    const content = document.getElementById('courseContentList');
    if (!content) return;

    try {
        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading course materials...</p>
            </div>
        `;

        console.log('🔄 Starting to load course content...');
        console.log('📍 Current Student ID:', currentStudent.id);

        // ✅ STEP 1: Fetch student enrollments
        const enrollmentsResponse = await fetch(`${API_BASE_URL}/enrollments/student/${currentStudent.id}`);

        if (!enrollmentsResponse.ok) {
            throw new Error('Failed to fetch enrollments');
        }

        const enrollments = await enrollmentsResponse.json();
        console.log('✅ Enrollments loaded:', enrollments.length);

        if (enrollments.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <h3>No Course Materials</h3>
                    <p>Enroll in courses to access their materials.</p>
                    <button class="btn btn-primary" onclick="showSection('available-courses')" style="margin-top: 16px;">
                        Browse Available Courses
                    </button>
                </div>
            `;
            return;
        }

        // ✅ STEP 2: Extract unique course IDs from enrollments
        const courseIds = [...new Set(enrollments.map(e => {
            return e.courseId || e.course?.id || e.course_id;
        }).filter(id => id !== undefined && id !== null))];

        console.log('📚 Raw enrollments:', enrollments);
        console.log('📚 Unique Course IDs:', courseIds);

        if (courseIds.length === 0) {
            console.error('❌ No valid course IDs found in enrollments!');
            console.error('📋 Enrollment structure:', enrollments[0]);
            content.innerHTML = `
                <div class="alert alert-error">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <strong>Data Structure Error</strong><br>
                    Unable to extract course IDs from enrollments. This is likely a backend API issue.
                    <br><small style="color: #666; margin-top: 8px; display: block;">
                        Please check the browser console for details and contact your administrator.
                    </small>
                </div>
            `;
            return;
        }

        let allContent = [];

        // ✅ STEP 3: Fetch ALL content for each course (not just approved)
        for (const courseId of courseIds) {
            try {
                console.log(`🔍 Fetching ALL content for course ID: ${courseId}`);

                // ✅ CHANGED: Fetch ALL content (not just approved)
                const contentResponse = await fetch(
                    `${API_BASE_URL}/course-content/course/${courseId}`
                );

                if (!contentResponse.ok) {
                    console.warn(`⚠️ Failed to fetch content for course ${courseId}: ${contentResponse.status}`);
                    continue;
                }

                const courseContent = await contentResponse.json();

                if (!Array.isArray(courseContent)) {
                    console.warn(`⚠️ Invalid content format for course ${courseId}:`, courseContent);
                    continue;
                }

                console.log(`✅ Loaded ${courseContent.length} materials for course ${courseId}`);
                console.log(`📊 Content breakdown:`, {
                    total: courseContent.length,
                    approved: courseContent.filter(c => c.approvalStatus === 'APPROVED').length,
                    pending: courseContent.filter(c => c.approvalStatus === 'PENDING').length,
                    rejected: courseContent.filter(c => c.approvalStatus === 'REJECTED').length
                });

                // Add all content (students only see APPROVED, but we show status for debugging)
                courseContent.forEach(item => {
                    allContent.push(item);
                });

            } catch (error) {
                console.error(`❌ Error loading content for course ${courseId}:`, error);
            }
        }

        console.log('📊 Total content items loaded:', allContent.length);

        // ✅ STEP 4: Filter to show only APPROVED content to students
        const approvedContent = allContent.filter(item => item.approvalStatus === 'APPROVED');

        console.log(`🔍 Content status breakdown:
            - Total: ${allContent.length}
            - Approved: ${approvedContent.length}
            - Pending: ${allContent.filter(c => c.approvalStatus === 'PENDING').length}
            - Rejected: ${allContent.filter(c => c.approvalStatus === 'REJECTED').length}
        `);

        if (approvedContent.length === 0) {
            const pendingCount = allContent.filter(c => c.approvalStatus === 'PENDING').length;

            content.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <h3>No Materials Available</h3>
                    <p>No approved course materials are available yet for your enrolled courses.</p>
                    <p style="margin-top: 8px; font-size: 0.875rem; color: var(--text-tertiary);">
                        You are enrolled in ${enrollments.length} course${enrollments.length !== 1 ? 's' : ''}
                    </p>
                    ${pendingCount > 0 ? `
                        <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                            <strong style="color: #92400e;">ℹ️ ${pendingCount} material${pendingCount !== 1 ? 's are' : ' is'} awaiting approval</strong>
                            <p style="margin-top: 4px; font-size: 0.875rem; color: #78350f;">
                                Once approved by an administrator, they will appear here.
                            </p>
                        </div>
                    ` : ''}
                </div>
            `;
            return;
        }

        // Sort by upload date (newest first)
        approvedContent.sort((a, b) => {
            const dateA = new Date(a.uploadedAt || 0);
            const dateB = new Date(b.uploadedAt || 0);
            return dateB - dateA;
        });

        // ✅ STEP 5: Render table with approved content
        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Upload Date</th>
                            <th>Size</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        approvedContent.forEach(item => {
            const fileSize = item.fileSize ? (item.fileSize / 1024 / 1024).toFixed(2) : 'N/A';

            let uploadDate = 'N/A';
            if (item.uploadedAt) {
                try {
                    const dateParts = item.uploadedAt.split(' ')[0].split('-');
                    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                    uploadDate = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    console.warn('Failed to parse date:', item.uploadedAt);
                }
            }

            const contentType = item.contentType ?
                item.contentType.replace(/_/g, ' ').toLowerCase()
                    .replace(/\b\w/g, c => c.toUpperCase()) :
                'Unknown';

            html += `
                <tr>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span class="course-code" style="font-weight: 600; color: var(--primary-color);">
                                ${item.courseCode || 'N/A'}
                            </span>
                            <small style="color: var(--text-tertiary);">
                                ${item.courseName || 'Unknown Course'}
                            </small>
                        </div>
                    </td>
                    <td><strong>${item.title}</strong></td>
                    <td><span class="badge badge-primary">${contentType}</span></td>
                    <td>${uploadDate}</td>
                    <td style="font-weight: 600;">${fileSize} ${fileSize !== 'N/A' ? 'MB' : ''}</td>
                    <td>
                        <button
                            class="btn btn-primary"
                            onclick="downloadContent('${item.filePath}', '${item.fileName}')"
                            style="width: 100%;"
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            Download
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; font-size: 0.875rem; color: var(--text-secondary);">
                <strong>📚 Total:</strong> ${approvedContent.length} approved material${approvedContent.length !== 1 ? 's' : ''} available across ${courseIds.length} course${courseIds.length !== 1 ? 's' : ''}
            </div>
        `;

        content.innerHTML = html;
        console.log('✅ Course content loaded successfully!');

    } catch (error) {
        console.error('❌ FATAL ERROR loading course content:', error);
        content.innerHTML = `
            <div class="alert alert-error">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 8px;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Failed to load course materials. Please try again later.
                <br><small style="color: #666;">Error: ${error.message}</small>
            </div>
        `;
    }
}

// ✅ HELPER: Download content
function downloadContent(filePath, fileName) {
    if (!filePath || filePath === 'undefined' || filePath === 'null') {
        showError('File path not available');
        console.error('Invalid file path:', filePath);
        return;
    }

    console.log('📥 Downloading file:', fileName);
    console.log('📍 File path:', filePath);

    const link = document.createElement('a');
    link.href = filePath;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Make functions globally accessible
window.loadCourseContent = loadCourseContent;
window.downloadContent = downloadContent;


// ============================================================================
// SECTION 6: FIXED TIMETABLE - UTILISE VRAIMENT LES DONNÉES DE LA DATABASE
// ============================================================================

async function loadTimetable() {
    const content = document.getElementById('timetableContent');
    if (!content) return;

    try {
        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading your class schedule...</p>
            </div>
        `;

        console.log('🔄 Fetching timetable for student:', currentStudent.id);

        const response = await fetch(`${API_BASE_URL}/timetable/student/${currentStudent.id}`);

        if (!response.ok) {
            if (response.status === 404) {
                content.innerHTML = getEmptyTimetableHTML();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const timetableData = await response.json();
        console.log('✅ Timetable data received from API:', timetableData);

        if (!timetableData || timetableData.length === 0) {
            content.innerHTML = getEmptyTimetableHTML();
            return;
        }

        // ✅ FIX: Générer le HTML directement depuis les vraies données
        content.innerHTML = generateTimetableFromRealData(timetableData);
        console.log('✅ Timetable rendered with', timetableData.length, 'classes');

    } catch (error) {
        console.error('❌ Error loading timetable:', error);
        content.innerHTML = getTimetableErrorHTML(error);
    }
}




// ✅ NOUVELLE FONCTION: Génère le timetable SANS colonne Time
function generateTimetableFromRealData(timetableData) {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const dayNames = {
        'MONDAY': 'Monday',
        'TUESDAY': 'Tuesday',
        'WEDNESDAY': 'Wednesday',
        'THURSDAY': 'Thursday',
        'FRIDAY': 'Friday',
        'SATURDAY': 'Saturday',
        'SUNDAY': 'Sunday'
    };

    console.log('📊 Generating timetable from data:', timetableData);

    // ✅ ÉTAPE 1: Créer une map des classes par jour
    const scheduleMap = {};

    timetableData.forEach(entry => {
        const day = entry.dayOfWeek?.toUpperCase();

        if (!day) {
            console.warn('⚠️ Skipping entry with missing day:', entry);
            return;
        }

        if (!scheduleMap[day]) {
            scheduleMap[day] = [];
        }

        scheduleMap[day].push({
            courseCode: entry.courseCode || 'N/A',
            courseName: entry.courseName || 'Unknown Course',
            classroom: entry.classroom || 'TBA',
            lecturer: entry.lecturerName || 'TBA',
            startTime: entry.startTime ? entry.startTime.substring(0, 5) : '',
            endTime: entry.endTime ? entry.endTime.substring(0, 5) : '',
            color: getCourseColor(entry.courseCode)
        });
    });

    console.log('🗓️ Schedule map created:', scheduleMap);

    // ✅ ÉTAPE 2: Générer le HTML
    let html = '<div class="timetable-container"><div class="timetable-grid">';

    // Header: Days only (NO Time column)
    days.forEach(day => {
        html += `<div class="timetable-header">${dayNames[day]}</div>`;
    });

    // Body: One cell per day
    days.forEach(day => {
        const classes = scheduleMap[day] || [];

        if (classes.length === 0) {
            // Empty cell
            html += `
                <div class="timetable-cell empty">
                    <span class="timetable-empty-cell">No classes</span>
                </div>
            `;
        } else {
            // Cell with classes
            html += `<div class="timetable-cell has-class" style="border-left-color: ${classes[0].color};">`;

            classes.forEach((classInfo, index) => {
                if (index > 0) html += '<hr style="margin: 0.75rem 0; border-color: var(--border-color);">';

                html += `
                    <div style="width: 100%;">
                        <div class="timetable-course" style="color: ${classInfo.color};">
                            ${classInfo.courseCode}
                        </div>
                        <div class="timetable-course-name" title="${classInfo.courseName}">
                            ${classInfo.courseName}
                        </div>

                        <div class="timetable-time-badge">
                            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            ${classInfo.startTime}${classInfo.endTime ? ' - ' + classInfo.endTime : ''}
                        </div>

                        <div class="timetable-info-row">
                            <div class="timetable-room">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                                </svg>
                                ${classInfo.classroom}
                            </div>
                        </div>

                        <div class="timetable-info-row">
                            <div class="timetable-teacher">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                </svg>
                                ${truncateText(classInfo.lecturer, 20)}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
        }
    });

    html += '</div></div>';

    // Summary
    html += `
        <div style="margin-top: 1.5rem; padding: 1.25rem; background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(16, 185, 129, 0.08)); border-radius: 12px; border-left: 4px solid var(--primary-color);">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600;">
                        📚 Total Classes This Week
                    </div>
                    <div style="font-size: 1.75rem; font-weight: 700; color: var(--primary-color);">
                        ${timetableData.length} ${timetableData.length === 1 ? 'Class' : 'Classes'}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.25rem;">
                        Last Updated
                    </div>
                    <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-secondary);">
                        ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    `;

    return html;
}







// Helper functions
function getCourseColor(courseCode) {
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6'
    ];
    if (!courseCode) return colors[0];
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) {
        hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

function getEmptyTimetableHTML() {
    return `
        <div class="empty-state" style="padding: 3rem 2rem;">
            <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 80px; height: 80px; margin: 0 auto 1.5rem; opacity: 0.3;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 style="font-size: 1.5rem; color: var(--text-primary); margin-bottom: 0.75rem;">📅 No Schedule Yet</h3>
            <p style="margin: 1rem 0; color: var(--text-secondary); font-size: 1rem;">
                Your class schedule hasn't been created yet. Once enrolled and timetable is set, it will appear here.
            </p>
            <button class="btn btn-primary" onclick="showSection('courses')" style="margin-top: 1.5rem; padding: 0.875rem 1.75rem;">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 0.5rem;">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                View My Courses
            </button>
        </div>
    `;
}

function getTimetableErrorHTML(error) {
    return `
        <div class="alert alert-error" style="margin: 2rem 0;">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 0.75rem;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div style="flex: 1;">
                <strong style="display: block; margin-bottom: 0.5rem;">Failed to Load Timetable</strong>
                <p style="font-size: 0.875rem; margin-bottom: 1rem;">Could not load your schedule. Please try again.</p>
                <small style="font-size: 0.75rem; color: var(--text-tertiary);">Error: ${error.message}</small>
                <button class="btn btn-primary" onclick="loadTimetable()" style="margin-top: 1rem; padding: 0.625rem 1.25rem;">
                    Try Again
                </button>
            </div>
        </div>
    `;
}





    async function loadDepartments() {
        const content = document.getElementById('departmentsContent');
        if (!content) return;

        try {
            const response = await fetch(`${API_BASE_URL}/departments`);
            const departments = await response.json();

            if (departments.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <h3>No Departments</h3>
                        <p>No departments have been created yet.</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="department-grid">';

            departments.forEach(dept => {
                html += `
                    <div class="department-card">
                        <div class="department-header">
                            <span class="department-code">${dept.code}</span>
                            <span class="badge ${dept.isActive ? 'badge-success' : 'badge-danger'}">
                                ${dept.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <h3 class="department-name">${dept.name}</h3>
                        <p class="department-description">${dept.description || 'No description available'}</p>
                        ${dept.facultyName ? `
                            <div class="department-faculty">
                                <span>Faculty:</span>
                                <strong>${dept.facultyName}</strong>
                            </div>
                        ` : ''}
                    </div>
                `;
            });

            html += '</div>';
            content.innerHTML = html;
        } catch (error) {
            console.error('Error loading departments:', error);
            content.innerHTML = '<div class="alert alert-error">Failed to load departments</div>';
        }
    }


// ============================================================================
// PAYMENT MODULE - FIXED VERSION WITH STUDENT'S ACADEMIC YEAR & SEMESTER
// ============================================================================

let paymentSummary = null;
let studentEnrollments = [];

/**
 * ✅ FIXED: Show payment modal with student's academic year (READ-ONLY)
 */
async function showPaymentModal() {
    console.log('💳 ========== OPENING PAYMENT MODAL ==========');
    console.log('⏰ Time:', new Date().toLocaleTimeString());

    try {
        // ✅ STEP 1: Verify student data is loaded
        console.log('🔍 STEP 1: Checking currentStudent object...');

        if (!currentStudent || !currentStudent.id) {
            console.error('❌ FATAL: Student information not available');
            showError('Student information not available. Please refresh the page.');
            return;
        }

        console.log('✅ Student verified:');
        console.log('   - ID:', currentStudent.id);
        console.log('   - Name:', currentStudent.firstName, currentStudent.lastName);
        console.log('   - Academic Year:', currentStudent.academicYear);
        console.log('   - Current Semester:', currentStudent.currentSemester);

        // ✅ STEP 2: Load student enrollments for current semester
        console.log('📚 STEP 2: Fetching enrollments...');
        const enrollmentUrl = `${API_BASE_URL}/enrollments/student/${currentStudent.id}`;

        const enrollmentsResponse = await fetch(enrollmentUrl);
        console.log('📥 Response status:', enrollmentsResponse.status);

        if (!enrollmentsResponse.ok) {
            console.error('❌ Failed to load enrollments');
            throw new Error('Failed to load enrollments');
        }

        const allEnrollments = await enrollmentsResponse.json();
        console.log('📊 Total Enrollments fetched:', allEnrollments.length);

        // ✅ STEP 3: Filter enrollments for current academic year and semester
        console.log('🔍 Filtering enrollments...');
        studentEnrollments = allEnrollments.filter(e => {
            return e.academicYear === currentStudent.academicYear &&
                   e.semester === currentStudent.currentSemester;
        });

        console.log('✅ Filtered Enrollments (current semester):', studentEnrollments.length);

        // ✅ STEP 4: Generate unique transaction reference FIRST
        const txnRef = generateTransactionReference();
        console.log('🔑 Transaction reference generated:', txnRef);

        // ✅ STEP 5: Show modal FIRST before manipulating fields
        const modal = document.getElementById('paymentModal');
        if (!modal) {
            console.error('❌ Payment modal element NOT FOUND in DOM');
            showError('Payment modal not found');
            return;
        }

        modal.classList.add('active');
        console.log('✅ Modal opened');

        // ✅ STEP 6: Wait for DOM to be fully rendered, then fill fields
        setTimeout(() => {
            console.log('📝 STEP 6: Setting form fields after DOM render...');

            // ✅ Set Academic Year (READ-ONLY) - Display student's academic year
            const yearInput = document.getElementById('paymentAcademicYear');
            if (yearInput) {
                yearInput.value = currentStudent.academicYear || 'N/A';
                yearInput.readOnly = true;
                yearInput.style.background = '#f3f4f6';
                yearInput.style.cursor = 'not-allowed';
                yearInput.style.color = '#6b7280';
                console.log('✅ Academic Year set to:', currentStudent.academicYear, '(READ-ONLY)');
            } else {
                console.error('❌ Academic Year input NOT FOUND!');
            }

            // ✅ Set Semester (READ-ONLY with hidden value)
            const semesterInput = document.getElementById('paymentSemester');
            if (semesterInput) {
                semesterInput.value = `Semester ${currentStudent.currentSemester || 'N/A'}`;
                semesterInput.readOnly = true;
                semesterInput.style.background = '#f3f4f6';
                semesterInput.style.cursor = 'not-allowed';
                semesterInput.style.color = '#6b7280';

                // Create/update hidden field with actual semester number
                let semesterHidden = document.getElementById('paymentSemesterValue');
                if (!semesterHidden) {
                    semesterHidden = document.createElement('input');
                    semesterHidden.type = 'hidden';
                    semesterHidden.id = 'paymentSemesterValue';
                    semesterInput.parentNode.appendChild(semesterHidden);
                }
                semesterHidden.value = currentStudent.currentSemester || 1;
                console.log('✅ Semester set to:', currentStudent.currentSemester, '(READ-ONLY)');
            } else {
                console.error('❌ Semester input NOT FOUND!');
            }

            // ✅ Set Transaction Reference
            const referenceInput = document.getElementById('paymentReference');
            if (referenceInput) {
                referenceInput.value = txnRef;
                console.log('✅ Transaction reference set to:', txnRef);
            } else {
                console.error('❌ Reference input NOT FOUND!');
            }

            // ✅ Populate course dropdown
            populateCourseDropdown();

        }, 150); // Increased delay to ensure DOM is ready

        console.log('💳 ========== MODAL OPENING COMPLETE ==========\n');

    } catch (error) {
        console.error('❌ ========== FATAL ERROR ==========');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        showError('Failed to load payment options: ' + error.message);
    }
}

/**
 * ✅ Populate course dropdown with enrolled courses
 */
async function populateCourseDropdown() {
    console.log('📚 Populating course dropdown...');

    const courseSelect = document.getElementById('paymentCourse');
    if (!courseSelect) {
        console.error('❌ Course select NOT FOUND!');
        return;
    }

    courseSelect.innerHTML = '<option value="">Select Course (Optional)</option>';

    if (studentEnrollments.length === 0) {
        console.warn('⚠️ No enrollments found for current semester');
        courseSelect.innerHTML = '<option value="">No enrolled courses for this semester</option>';
        courseSelect.disabled = true;
        courseSelect.style.background = '#f3f4f6';
        return;
    }

    console.log(`🔄 Loading ${studentEnrollments.length} course details...`);
    let addedCount = 0;

    for (const enrollment of studentEnrollments) {
        try {
            let course;
            let coursePrice = 0;

            if (enrollment.course) {
                course = enrollment.course;
                coursePrice = course.price || 0;
            } else if (enrollment.courseId) {
                const courseUrl = `${API_BASE_URL}/courses/${enrollment.courseId}`;
                const courseRes = await fetch(courseUrl);

                if (courseRes.ok) {
                    course = await courseRes.json();
                    coursePrice = course.price || 0;
                } else {
                    continue;
                }
            } else {
                continue;
            }

            const option = document.createElement('option');
            option.value = course.id;
            option.setAttribute('data-price', coursePrice);
            option.textContent = `${course.courseCode} - ${course.courseName} (${coursePrice.toLocaleString()} FCFA)`;
            courseSelect.appendChild(option);
            addedCount++;

        } catch (error) {
            console.error('❌ Error loading course:', error);
        }
    }

    console.log(`✅ Course dropdown populated with ${addedCount} courses`);
    courseSelect.disabled = false;
}

/**
 * ✅ Generate unique transaction reference
 */
function generateTransactionReference() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${timestamp}-${random}`;
}

/**
 * ✅ Handle course selection and auto-update amount
 */
function onCourseSelectionChange() {
    console.log('💰 Course selection changed');
    const courseSelect = document.getElementById('paymentCourse');
    const amountInput = document.getElementById('paymentAmount');

    if (courseSelect && amountInput) {
        const selectedOption = courseSelect.options[courseSelect.selectedIndex];
        const price = selectedOption.getAttribute('data-price');

        if (price && price !== '0' && price !== 'null') {
            amountInput.value = price;
            console.log('✅ Amount auto-updated to:', price, 'FCFA');
        } else {
            amountInput.value = '';
            console.log('💰 Amount cleared');
        }
    }
}

/**
 * ✅ FIXED: Submit payment with proper validation and data collection
 */
async function submitPayment() {
    console.log('💳 ========== SUBMITTING PAYMENT ==========');

    const form = document.getElementById('paymentForm');
    if (!form) {
        console.error('❌ Payment form not found');
        showError('Payment form not found');
        return;
    }

    // Basic HTML5 validation
    if (!form.checkValidity()) {
        console.warn('⚠️ Form validation failed');
        form.reportValidity();
        return;
    }

    try {
        // ✅ Verify student is loaded
        if (!currentStudent || !currentStudent.id) {
            console.error('❌ Student information not available');
            throw new Error('Student information not available');
        }

        console.log('📝 Collecting form data...');

        // ✅ Get form elements
        const paymentTypeSelect = document.getElementById('paymentType');
        const amountInput = document.getElementById('paymentAmount');
        const yearInput = document.getElementById('paymentAcademicYear');
        const semesterHidden = document.getElementById('paymentSemesterValue');
        const methodSelect = document.getElementById('paymentMethod');
        const referenceInput = document.getElementById('paymentReference');
        const notesInput = document.getElementById('paymentNotes');
        const courseSelect = document.getElementById('paymentCourse');

        // ✅ Validate all required fields exist
        if (!paymentTypeSelect || !amountInput || !yearInput || !semesterHidden ||
            !methodSelect || !referenceInput) {
            throw new Error('Required form fields are missing');
        }

        // ✅ Validate required values are not empty
        const academicYear = yearInput.value.trim();
        const semester = parseInt(semesterHidden.value);
        const transactionReference = referenceInput.value.trim();
        const amount = parseFloat(amountInput.value);

        console.log('🔍 Validating collected data:');
        console.log('   - Academic Year:', academicYear);
        console.log('   - Semester:', semester);
        console.log('   - Transaction Reference:', transactionReference);
        console.log('   - Amount:', amount);

        // ✅ Additional validation
        if (!academicYear) {
            throw new Error('Academic year is required');
        }
        if (!semester || isNaN(semester)) {
            throw new Error('Semester is required and must be a valid number');
        }
        if (!transactionReference) {
            throw new Error('Transaction reference is required');
        }
        if (!amount || isNaN(amount) || amount <= 0) {
            throw new Error('Amount must be a positive number');
        }

        // ✅ Build payment data object
        const paymentData = {
            studentId: currentStudent.id,
            paymentType: paymentTypeSelect.value,
            amount: amount,
            academicYear: academicYear,
            semester: semester,
            paymentMethod: methodSelect.value,
            transactionReference: transactionReference,
            paymentStatus: 'PENDING',
            notes: notesInput?.value?.trim() || ''
        };

        // ✅ Add course if selected
        if (courseSelect && courseSelect.value && courseSelect.value !== '') {
            paymentData.courseId = parseInt(courseSelect.value);
            console.log('📚 Course selected:', courseSelect.value);
        }

        console.log('📤 Payment data to submit:', JSON.stringify(paymentData, null, 2));

        // ✅ Submit payment to API
        console.log('🌐 Sending POST request to API...');
        const response = await fetch(`${API_BASE_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);

            // Try to parse error message
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || errorJson.error || 'Payment submission failed');
            } catch (e) {
                throw new Error(errorText || 'Payment submission failed');
            }
        }

        const result = await response.json();
        console.log('✅ Payment submitted successfully:', result);

        showSuccess('Payment submitted successfully! It is pending approval.');
        closePaymentModal();

        // ✅ Reload data
        console.log('🔄 Reloading payment data...');
        await loadPayments();
        await loadDashboard();

        console.log('💳 ========== PAYMENT SUBMISSION COMPLETE ==========');

    } catch (error) {
        console.error('❌ ========== PAYMENT SUBMISSION FAILED ==========');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        showError('Failed to submit payment: ' + error.message);
    }
}

/**
 * ✅ Close payment modal and reset form
 */
function closePaymentModal() {
    console.log('🚪 Closing payment modal...');

    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.remove('active');
    }

    const form = document.getElementById('paymentForm');
    if (form) {
        form.reset();
    }

    // Remove hidden semester field
    const semesterHidden = document.getElementById('paymentSemesterValue');
    if (semesterHidden) {
        semesterHidden.remove();
    }

    console.log('✅ Payment modal closed and form reset');
}

/**
 * ✅ Load payment summary for current semester
 */
async function loadPaymentSummary() {
    try {
        console.log('📊 Fetching payment summary...');

        if (!currentStudent || !currentStudent.academicYear || !currentStudent.currentSemester) {
            console.warn('⚠️ Student data not fully loaded for summary');
            paymentSummary = {
                requiredAmount: 0,
                paidAmount: 0,
                pendingAmount: 0,
                remainingAmount: 0,
                paymentStatus: 'UNPAID'
            };
            return;
        }

        const summaryUrl = `${API_BASE_URL}/payments/student/${currentStudent.id}/summary/${currentStudent.academicYear}/${currentStudent.currentSemester}`;
        console.log('🌐 Fetching from:', summaryUrl);

        const response = await fetch(summaryUrl);

        if (!response.ok) {
            console.warn('⚠️ Payment summary not available (status:', response.status, ')');
            paymentSummary = {
                requiredAmount: 0,
                paidAmount: 0,
                pendingAmount: 0,
                remainingAmount: 0,
                paymentStatus: 'UNPAID'
            };
            return;
        }

        paymentSummary = await response.json();
        console.log('✅ Payment summary loaded:', paymentSummary);

    } catch (error) {
        console.error('❌ Error loading payment summary:', error);
        paymentSummary = {
            requiredAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            remainingAmount: 0,
            paymentStatus: 'UNPAID'
        };
    }
}

/**
 * ✅ Load payments section
 */
async function loadPayments() {
    const content = document.getElementById('paymentsContent');
    if (!content) return;

    try {
        console.log('💳 Loading payments for student:', currentStudent.id);

        content.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading your payments...</p>
            </div>
        `;

        // Load payment summary
        await loadPaymentSummary();

        // Fetch all payments
        const response = await fetch(`${API_BASE_URL}/payments/student/${currentStudent.id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch payments');
        }

        const payments = await response.json();
        console.log('✅ Payments loaded:', payments.length);

        let html = '';

        // Payment Summary Card - USING STUDENT'S ACADEMIC YEAR AND SEMESTER
        if (paymentSummary) {
            html += renderPaymentSummaryCard(paymentSummary);
        }

        // Payments Table
        if (payments.length === 0) {
            html += `
                <div class="empty-state" style="margin-top: 24px;">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                    <h3>No Payments Yet</h3>
                    <p>You have not made any payments yet.</p>
                    <button class="btn btn-primary" onclick="showPaymentModal()" style="margin-top: 16px;">
                        Make Your First Payment
                    </button>
                </div>
            `;
        } else {
            html += `
                <div class="card" style="margin-top: 24px;">
                    <div class="card-header">
                        <h3 class="card-title">Payment History</h3>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Reference</th>
                                    <th>Type</th>
                                    <th>Course</th>
                                    <th>Amount</th>
                                    <th>Academic Year</th>
                                    <th>Semester</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            payments.forEach(payment => {
                const statusClass =
                    payment.paymentStatus === 'APPROVED' ? 'badge-success' :
                    payment.paymentStatus === 'PENDING' ? 'badge-warning' :
                    payment.paymentStatus === 'REJECTED' ? 'badge-danger' : 'badge-secondary';

                const paymentDate = payment.paymentDate ?
                    new Date(payment.paymentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }) : 'N/A';

                html += `
                    <tr>
                        <td><strong>${payment.transactionReference}</strong></td>
                        <td>${payment.paymentType}</td>
                        <td>${payment.course ? payment.course.courseCode : 'General'}</td>
                        <td><strong style="color: var(--primary-color);">${payment.amount.toLocaleString()} FCFA</strong></td>
                        <td>${payment.academicYear}</td>
                        <td>Semester ${payment.semester}</td>
                        <td>${paymentDate}</td>
                        <td><span class="badge ${statusClass}">${payment.paymentStatus}</span></td>
                        <td>
                            <button class="btn btn-secondary" onclick="viewPaymentDetails(${payment.id})"
                                    style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                                Details
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        content.innerHTML = html;
        console.log('✅ Payments section rendered successfully');

    } catch (error) {
        console.error('❌ Error loading payments:', error);
        content.innerHTML = `
            <div class="alert alert-error">
                Failed to load payments. Please try again.
                <br><small>Error: ${error.message}</small>
            </div>
        `;
    }
}

/**
 * ✅ Render payment summary card WITH STUDENT'S ACADEMIC YEAR
 */
function renderPaymentSummaryCard(summary) {
    const percentage = summary.requiredAmount > 0
        ? (summary.paidAmount / summary.requiredAmount * 100).toFixed(1)
        : 0;

    const statusColor = summary.paymentStatus === 'PAID' ? 'var(--success-color)' : 'var(--warning-color)';

    // ✅ USING CURRENT STUDENT'S ACADEMIC YEAR AND SEMESTER
    const studentAcademicYear = currentStudent.academicYear || 'N/A';
    const studentSemester = currentStudent.currentSemester || 'N/A';

    return `
        <div class="card" style="border-left: 4px solid ${statusColor};">
            <div class="card-header" style="background: linear-gradient(135deg, ${statusColor}15, ${statusColor}05);">
                <h3 class="card-title" style="color: ${statusColor};">
                    💰 Payment Summary - ${studentAcademicYear} Semester ${studentSemester}
                </h3>
                <span class="badge ${summary.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}"
                      style="font-size: 1rem; padding: 0.5rem 1rem;">
                    ${summary.paymentStatus}
                </span>
            </div>
            <div class="card-body" style="padding: 2rem;">
                <div class="info-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="info-item" style="text-align: center; padding: 1.5rem; background: var(--bg-tertiary); border-radius: 12px;">
                        <div class="info-label" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Required Amount</div>
                        <div class="info-value" style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary);">
                            ${summary.requiredAmount.toLocaleString()} FCFA
                        </div>
                    </div>
                    <div class="info-item" style="text-align: center; padding: 1.5rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
                        <div class="info-label" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Paid Amount</div>
                        <div class="info-value" style="font-size: 1.75rem; font-weight: 700; color: var(--success-color);">
                            ${summary.paidAmount.toLocaleString()} FCFA
                        </div>
                    </div>
                    <div class="info-item" style="text-align: center; padding: 1.5rem; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">
                        <div class="info-label" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Pending Amount</div>
                        <div class="info-value" style="font-size: 1.75rem; font-weight: 700; color: var(--warning-color);">
                            ${summary.pendingAmount.toLocaleString()} FCFA
                        </div>
                    </div>
                    <div class="info-item" style="text-align: center; padding: 1.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 12px;">
                        <div class="info-label" style="font-size: 0.875rem; margin-bottom: 0.5rem;">Remaining Amount</div>
                        <div class="info-value" style="font-size: 1.75rem; font-weight: 700; color: var(--error-color);">
                            ${summary.remainingAmount.toLocaleString()} FCFA
                        </div>
                    </div>
                </div>

                <div style="margin-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="font-weight: 600; color: var(--text-primary);">Payment Progress</span>
                        <span style="font-weight: 700; color: ${statusColor};">${percentage}%</span>
                    </div>
                    <div style="width: 100%; height: 12px; background: var(--bg-tertiary); border-radius: 6px; overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: ${statusColor}; transition: width 0.5s ease;"></div>
                    </div>
                </div>

                ${summary.remainingAmount > 0 ? `
                    <div style="margin-top: 1.5rem; text-align: center;">
                        <button class="btn btn-primary" onclick="showPaymentModal()" style="padding: 0.875rem 2rem; font-size: 1rem;">
                            Make Payment
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * ✅ View payment details
 */
function viewPaymentDetails(paymentId) {
    alert(`View details for payment ID: ${paymentId}\n\nThis feature will show full payment information.`);
}

// ============================================================================
// MAKE FUNCTIONS GLOBALLY ACCESSIBLE
// ============================================================================

window.showPaymentModal = showPaymentModal;
window.submitPayment = submitPayment;
window.closePaymentModal = closePaymentModal;
window.onCourseSelectionChange = onCourseSelectionChange;
window.loadPayments = loadPayments;
window.viewPaymentDetails = viewPaymentDetails;

console.log('✅ Payment module (FIXED - DISPLAYS STUDENT ACADEMIC YEAR) loaded successfully');




















    // Voir le reçu
    function viewReceipt(reference) {
        // Implémenter la logique pour afficher le reçu
        alert(`View receipt for transaction: ${reference}\n\nThis feature would typically generate or display a PDF receipt.`);
    }



    // Notifications
async function loadNotifications() {
    const content = document.getElementById('notificationsContent');
    if (!content) return;

    try {
        if (!currentUser || !currentUser.id) {
            content.innerHTML = `
                <div class="alert alert-error">User information not available</div>
            `;
            return;
        }

        const response = await fetch(`${API_BASE_URL}/notifications/user/${currentUser.id}`);

        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const notifications = await response.json();

        if (notifications.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h3>No Notifications</h3>
                    <p>You have no notifications at this time.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="notification-list">';

        notifications.forEach(notification => {
            const unreadClass = notification.isRead ? '' : 'unread';
            const timeAgo = getTimeAgo(new Date(notification.createdAt));
            const icon = getNotificationIcon(notification.type);

            html += `
                <div class="notification-item ${unreadClass}" onclick="markNotificationRead(${notification.id})">
                    <div class="notification-icon">
                        <i data-lucide="${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-header">
                            <span class="notification-title">${notification.title}</span>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                        <div class="notification-message">${notification.message}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        content.innerHTML = html;

        // Initialiser les icônes
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        content.innerHTML = '<div class="alert alert-error">Failed to load notifications</div>';
    }
}




// Marquer une notification comme lue
async function markNotificationRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/mark-read`, {
            method: 'PUT'
        });

        if (!response.ok) {
            console.error('Failed to mark notification as read');
            return;
        }

        await loadNotifications();
        await loadNotificationCount();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}





// Marquer toutes les notifications comme lues
async function markAllNotificationsRead() {
    try {
        if (!currentUser || !currentUser.id) {
            showError('User information not available');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/notifications/user/${currentUser.id}/mark-all-read`, {
            method: 'PUT'
        });

        if (!response.ok) {
            throw new Error('Failed to mark all notifications as read');
        }

        await loadNotifications();
        await loadNotificationCount();
        showSuccess('All notifications marked as read');
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        showError('Failed to mark notifications as read');
    }
}






    // Informations des parents
    async function loadParents() {
        const content = document.getElementById('parentsContent');
        if (!content) return;

        try {
            if (!currentStudent.parentId) {
                content.innerHTML = `
                    <div class="empty-state">
                        <h3>No Parent Linked</h3>
                        <p>No parent information has been linked to your account.</p>
                    </div>
                `;
                return;
            }

            const response = await fetch(`${API_BASE_URL}/parents/${currentStudent.parentId}`);
            const parent = await response.json();

            content.innerHTML = `
                <div class="parent-info">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Full Name</div>
                            <div class="info-value">${parent.firstName} ${parent.lastName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Relationship</div>
                            <div class="info-value">${parent.relationship}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${parent.email}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Phone</div>
                            <div class="info-value">${parent.phoneNumber}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Occupation</div>
                            <div class="info-value">${parent.occupation || 'N/A'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Address</div>
                            <div class="info-value">${parent.address || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading parent information:', error);
            content.innerHTML = '<div class="alert alert-error">Failed to load parent information</div>';
        }
    }



// Profil
async function loadProfile() {
    const content = document.getElementById('profileContent');
    if (!content) return;

    try {
        content.innerHTML = `
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar-large">
                        ${currentStudent.firstName.charAt(0)}
                    </div>
                    <div class="profile-info">
                        <h2>${currentStudent.firstName} ${currentStudent.lastName}</h2>
                        <p class="profile-id">Student ID: ${currentStudent.studentId}</p>
                        <p class="profile-email">${currentStudent.email}</p>
                    </div>
                </div>

                <div class="profile-sections">
                    <div class="profile-section">
                        <h3><i data-lucide="user"></i> Personal Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Date of Birth</div>
                                <div class="info-value">${currentStudent.dateOfBirth ? new Date(currentStudent.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Gender</div>
                                <div class="info-value">${currentStudent.gender || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Phone</div>
                                <div class="info-value">${currentStudent.phoneNumber || 'N/A'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Address</div>
                                <div class="info-value">${currentStudent.address || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3><i data-lucide="graduation-cap"></i> Academic Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Faculty</div>
                                <div class="info-value">${currentStudent.faculty}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Program</div>
                                <div class="info-value">${currentStudent.program}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Current Year</div>
                                <div class="info-value">Year ${currentStudent.currentYear}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Current Semester</div>
                                <div class="info-value">Semester ${currentStudent.currentSemester}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Enrollment Date</div>
                                <div class="info-value">${currentStudent.enrollmentDate ? new Date(currentStudent.enrollmentDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3><i data-lucide="award"></i> Academic Performance</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">GPA</div>
                                <div class="info-value">${currentStudent.cumulativeGPA ? currentStudent.cumulativeGPA.toFixed(2) : '0.00'}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Total Credits</div>
                                <div class="info-value">${currentStudent.totalCreditsEarned || 0}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Status</div>
                                <div class="info-value">
                                    <span class="badge ${currentStudent.isActive ? 'badge-success' : 'badge-danger'}">
                                        ${currentStudent.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialiser les icônes
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        content.innerHTML = '<div class="alert alert-error">Failed to load profile</div>';
    }
}






// Charger le compteur de notifications
async function loadNotificationCount() {
    try {
        if (!currentUser || !currentUser.id) {
            console.warn('User not loaded yet');
            return;
        }
        const response = await fetch(`${API_BASE_URL}/notifications/user/${currentUser.id}/count-unread`);
        if (!response.ok) {
            console.error('Failed to load notification count');
            return;
        }
        const data = await response.json();
        if (notificationCount) {
            notificationCount.textContent = data.count || 0;
            // Afficher ou masquer le badge selon le nombre
            if (data.count > 0 && notificationBadge) {
                notificationBadge.style.display = 'flex';
            } else if (notificationBadge) {
                notificationBadge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}




    // Charger les années académiques pour les paiements
    async function loadAcademicYearsForPayment() {
        try {
            const response = await fetch(`${API_BASE_URL}/academic-years/active`);
            const years = await response.json();
            currentAcademicYears = years;

            const select = document.getElementById('paymentAcademicYear');
            if (select) {
                select.innerHTML = '<option value="">Select Academic Year</option>';
                years.forEach(year => {
                    select.innerHTML += `<option value="${year.yearCode}">${year.yearName}</option>`;
                });
            }
        } catch (error) {
            console.error('Error loading academic years:', error);
        }
    }

    // Afficher la modal de paiement
    function showPaymentModal() {
        document.getElementById('paymentModal').classList.add('active');
        const form = document.getElementById('paymentForm');
        if (form) form.reset();
    }

    // Fermer la modal de paiement
    function closePaymentModal() {
        document.getElementById('paymentModal').classList.remove('active');
    }

    // Soumettre un paiement
    async function submitPayment() {
        const form = document.getElementById('paymentForm');
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return;
        }

        const paymentData = {
            studentId: currentStudent.id,
            paymentType: document.getElementById('paymentType').value,
            amount: parseFloat(document.getElementById('paymentAmount').value),
            academicYear: document.getElementById('paymentAcademicYear').value,
            semester: parseInt(document.getElementById('paymentSemester').value),
            paymentMethod: document.getElementById('paymentMethod').value,
            transactionReference: document.getElementById('paymentReference').value,
            paymentStatus: 'PENDING',
            paymentDate: new Date().toISOString()
        };

        try {
            const response = await fetch(`${API_BASE_URL}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            showSuccess('Payment submitted successfully! It is pending approval.');
            closePaymentModal();
            loadPayments();
            loadDashboard();
        } catch (error) {
            console.error('Error submitting payment:', error);
            showError('Failed to submit payment: ' + error.message);
        }
    }

    // Télécharger l'emploi du temps en PDF
    function downloadTimetablePDF() {
        // Implémenter la logique de génération PDF
        alert('PDF generation functionality would be implemented here. This requires a library like jsPDF or a backend endpoint.');
    }

    // Générer le relevé de notes PDF
    function generateTranscriptPDF() {
        // Implémenter la logique de génération PDF
        alert('Transcript PDF generation feature coming soon!');
    }

    // Fonctions utilitaires
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';

        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';

        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';

        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';

        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';

        return Math.floor(seconds) + ' seconds ago';
    }

    function getNotificationIcon(type) {
        const icons = {
            'REGISTRATION_DEADLINE': 'calendar',
            'PAYMENT_REMINDER': 'credit-card',
            'GRADE_RELEASED': 'bar-chart',
            'COURSE_APPROVED': 'check-circle',
            'MATERIAL_UPLOADED': 'book',
            'ANNOUNCEMENT': 'megaphone',
            'SYSTEM_UPDATE': 'bell',
            'DEFAULT': 'bell'
        };
        return icons[type] || icons.DEFAULT;
    }

    function getAvatarBackground(name) {
        const colors = [
            'linear-gradient(135deg, #FF8C42 0%, #FF9C62 100%)',
            'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
            'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    function showError(message) {
        alert('Error: ' + message);
    }

    function showSuccess(message) {
        alert('Success: ' + message);
    }

    // Mode sombre
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function checkDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
        }
    }

    // Déconnexion
    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.clear();
            localStorage.removeItem('studentId');
            window.location.href = '/login.html';
        }
    }

    // Rendre les fonctions accessibles globalement
    window.enrollInCourse = enrollInCourse;
    window.confirmEnrollment = confirmEnrollment;
    window.closeEnrollModal = closeEnrollModal;
    window.showPaymentModal = showPaymentModal;
    window.closePaymentModal = closePaymentModal;
    window.submitPayment = submitPayment;
    window.markAllNotificationsRead = markAllNotificationsRead;
    window.markNotificationRead = markNotificationRead;
    window.downloadTimetablePDF = downloadTimetablePDF;
    window.generateTranscriptPDF = generateTranscriptPDF;
    window.viewReceipt = viewReceipt;
    window.downloadContent = downloadContent;
    window.logout = logout;
    window.showSection = showSection;
    window.toggleDarkMode = toggleDarkMode;
