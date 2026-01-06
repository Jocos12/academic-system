// ============================================================================
// USER SESSION HANDLER - FIXED VERSION FOR UNT ACADEMIC SYSTEM
// Properly handles OTP login and session management
// ============================================================================

class UserSessionHandler {
    static instance = null;

    constructor() {
        if (UserSessionHandler.instance) {
            return UserSessionHandler.instance;
        }

        this.config = {
            apiBaseUrl: 'http://localhost:8080/api',
            defaultAvatarPath: '/assets/images/default-avatar.png',
            storageKeys: {
                token: 'unt_jwt_token',
                userInfo: 'unt_user_info',
                role: 'unt_userRole',
                userId: 'unt_userId',
                userEmail: 'unt_userEmail',
                lastActivity: 'unt_last_activity'
            },
            sessionTimeout: 30 * 60 * 1000 // 30 minutes
        };

        this.session = null;
        this.sessionKey = 'unt_userSession';

        this.initializeActivityTracker();
        UserSessionHandler.instance = this;

        console.log('✅ UserSessionHandler initialized');
    }

    // ==================== SINGLETON ====================
    static getInstance() {
        if (!UserSessionHandler.instance) {
            UserSessionHandler.instance = new UserSessionHandler();
        }
        return UserSessionHandler.instance;
    }


saveUserSession(userData) {
    if (!userData) {
        console.error('❌ No user data provided to saveUserSession');
        return false;
    }

    try {
        console.log('💾 Saving user session for:', userData.email);

        // Token handling (votre code existant)
        if (userData.token && userData.token.trim() !== '') {
            console.log('🔐 Saving JWT token from user data');
            localStorage.setItem('unt_jwt_token', userData.token);
            sessionStorage.setItem('unt_jwt_token', userData.token);
            console.log('✅ Token saved to storage');
        }

        // Build complete user info object (votre code existant)
        const userInfo = {
            userId: userData.id,
            id: userData.id,
            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            username: userData.username || userData.email,
            email: userData.email,
            phoneNumber: userData.phoneNumber || '',
            role: userData.role || 'USER',
            photo: userData.photo || userData.profileImageUrl || null,
            photoBase64: userData.photoBase64 || userData.photo || null,
            profileImageUrl: userData.profileImageUrl || userData.photo || null,
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            lastLogin: new Date().toISOString(),
            sessionTimestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            token: userData.token || null
        };

        // ✅ AJOUTER CE CODE QUI MANQUAIT :

        // Save to all storage locations
        localStorage.setItem(this.config.storageKeys.userInfo, JSON.stringify(userInfo));
        localStorage.setItem(this.config.storageKeys.userId, userInfo.userId.toString());
        localStorage.setItem(this.config.storageKeys.userEmail, userInfo.email);
        localStorage.setItem(this.config.storageKeys.role, userInfo.role);
        localStorage.setItem(this.sessionKey, JSON.stringify(userInfo));

        // Save to sessionStorage
        sessionStorage.setItem('user', JSON.stringify(userInfo));
        sessionStorage.setItem('userRole', userInfo.role);
        sessionStorage.setItem('userId', userInfo.userId.toString());
        sessionStorage.setItem('userEmail', userInfo.email);

        // Update session in memory
        this.session = userInfo;

        // Update last activity
        this.updateLastActivity();

        console.log('✅ User session saved successfully');
        console.log('📊 Session data:', {
            userId: userInfo.userId,
            email: userInfo.email,
            role: userInfo.role,
            hasToken: !!userInfo.token
        });

        return true;
    } catch (error) {
        console.error('❌ Error saving session:', error);
        return false;
    }
}



getUserSession() {
    if (this.session && this.isSessionValid(this.session)) {
        return this.session;
    }

    try {
        // Try sessionStorage first (most recent)
        const sessionStorageUser = sessionStorage.getItem('user');
        if (sessionStorageUser) {
            const parsedUser = JSON.parse(sessionStorageUser);
            if (this.isSessionValid(parsedUser)) {
                this.session = parsedUser;
                return this.session;
            }
        }

        // Try sessionKey in localStorage
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
            const parsedSession = JSON.parse(sessionData);
            if (this.isSessionValid(parsedSession)) {
                this.session = parsedSession;
                return this.session;
            }
        }

        // Try userInfo in localStorage
        const userInfoData = localStorage.getItem(this.config.storageKeys.userInfo);
        if (userInfoData) {
            const parsedInfo = JSON.parse(userInfoData);
            if (this.isSessionValid(parsedInfo)) {
                this.session = parsedInfo;
                return this.session;
            }
        }

        // ❌ SUPPRIMER CES DEUX LIGNES - C'EST LE PROBLÈME !
        // this.clearUserSession();
        // return null;

        // ✅ REMPLACER PAR :
        return null;

    } catch (error) {
        console.error('❌ Error retrieving user session:', error);
        // ❌ SUPPRIMER : this.clearUserSession();
        return null;
    }
}



isSessionValid(session) {
    if (!session || !session.userId || !session.email) {
        return false;
    }

    // Check expiration if expiresAt is present
    if (session.expiresAt) {
        const expirationTime = new Date(session.expiresAt);
        const currentTime = new Date();
        if (currentTime >= expirationTime) {
            console.warn('⚠️ Session expired');
            return false;
        }
    }

    return true;
}



    // ==================== GET CURRENT USER ====================
    getCurrentUser() {
        const session = this.getUserSession();
        if (session) {
            return session;
        }

        // Fallback to sessionStorage
        try {
            const sessionStorageUser = sessionStorage.getItem('user');
            if (sessionStorageUser) {
                const userData = JSON.parse(sessionStorageUser);
                if (userData.userId && userData.email) {
                    return userData;
                }
            }
        } catch (error) {
            console.error('❌ Error getting current user:', error);
        }

        return null;
    }

    // ==================== AUTHENTICATION ====================
    isAuthenticated() {
        const session = this.getUserSession();
        return session !== null && this.isSessionValid(session);
    }

    isLoggedIn() {
        return this.isAuthenticated();
    }

    // ==================== ACTIVITY TRACKING ====================
    updateLastActivity() {
        const timestamp = Date.now().toString();
        localStorage.setItem(this.config.storageKeys.lastActivity, timestamp);

        const currentUser = this.getCurrentUser();
        if (currentUser && window.sessionTracker) {
            window.sessionTracker.updateLastActivity(currentUser.userId);
        }
    }

initializeActivityTracker() {
    const events = ['click', 'keypress', 'mousemove', 'touchstart', 'scroll'];

    events.forEach(eventType => {
        document.addEventListener(eventType, () => {
            if (this.isAuthenticated()) {
                this.updateLastActivity();
            }
        }, { passive: true });
    });
}


    // ==================== UI UPDATES ====================
    updateProfileUI() {
        const userProfile = this.getCurrentUser();
        if (!userProfile) {
            console.warn('⚠️ No user profile found for UI update');
            return;
        }

        console.log('🎨 Updating profile UI for:', userProfile.fullName);

        // Update profile images
        const profileImages = document.querySelectorAll(
            '.profile-image img, .user-avatar, .profile-avatar, #current-user-avatar, #profile-photo-large, #profileAvatar'
        );

        profileImages.forEach(img => {
            if (userProfile.photo || userProfile.photoBase64 || userProfile.profileImageUrl) {
                const photoData = userProfile.photo || userProfile.photoBase64 || userProfile.profileImageUrl;

                if (photoData.startsWith('data:image/') || photoData.startsWith('http')) {
                    img.src = photoData;
                } else {
                    img.src = `data:image/jpeg;base64,${photoData}`;
                }

                img.onerror = () => {
                    console.warn('⚠️ Failed to load profile image, using default');
                    img.src = this.config.defaultAvatarPath;
                };
            } else {
                img.src = this.config.defaultAvatarPath;
            }
        });

        // Update name elements
        const nameElements = document.querySelectorAll(
            '.user-name, .profile-name, .staff-name, #current-user-name, #profile-full-name, #lecturerName'
        );
        nameElements.forEach(element => {
            element.textContent = userProfile.fullName || `${userProfile.firstName} ${userProfile.lastName}`;
        });

        // Update email elements
        const emailElements = document.querySelectorAll(
            '.user-email, .profile-email, .staff-email, #profile-email, #lecturerEmail'
        );
        emailElements.forEach(element => {
            element.textContent = userProfile.email;
        });

        // Update role elements
        const roleElements = document.querySelectorAll(
            '.user-role, .profile-role, .staff-role, #current-user-role, #profile-role-badge'
        );
        roleElements.forEach(element => {
            const formattedRole = this.formatRole(userProfile.role);
            element.textContent = formattedRole;
        });

        console.log('✅ Profile UI updated successfully');
    }

    formatRole(role) {
        if (!role) return 'User';

        const roleMap = {
            'ADMIN': 'Administrator',
            'LECTURER': 'Lecturer',
            'STUDENT': 'Student',
            'PARENT': 'Parent'
        };

        return roleMap[role] || role.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // ==================== ROLE MANAGEMENT ====================
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    }

    hasRole(role) {
        return this.getUserRole() === role;
    }

    isAdmin() {
        return this.hasRole('ADMIN');
    }

    isLecturer() {
        return this.hasRole('LECTURER');
    }

    isStudent() {
        return this.hasRole('STUDENT');
    }

    isParent() {
        return this.hasRole('PARENT');
    }

    // ==================== SESSION CLEANUP ====================
    clearUserSession() {
        console.log('🧹 Clearing user session');

        // Clear localStorage
        Object.values(this.config.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        localStorage.removeItem(this.sessionKey);

        // Clear sessionStorage
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userEmail');

        this.session = null;

        console.log('✅ Session cleared');
    }

    logout() {
        const currentUser = this.getCurrentUser();

        if (currentUser && window.sessionTracker) {
            window.sessionTracker.endSession(currentUser.userId);
        }

        this.clearUserSession();

        // Redirect to login
        window.location.href = '/login.html';
    }

    // ==================== PROFILE UPDATES ====================
    updateUserProfile(updates) {
        try {
            const currentProfile = this.getCurrentUser();
            if (!currentProfile) {
                console.error('❌ No current profile to update');
                return false;
            }

            const updatedProfile = { ...currentProfile, ...updates };

            // Update in all storage locations
            localStorage.setItem(this.config.storageKeys.userInfo, JSON.stringify(updatedProfile));
            localStorage.setItem(this.sessionKey, JSON.stringify(updatedProfile));
            sessionStorage.setItem('user', JSON.stringify(updatedProfile));

            this.session = updatedProfile;
            this.updateProfileUI();

            console.log('✅ Profile updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            return false;
        }
    }
}

// ==================== HELPER FUNCTIONS ====================

function showError(message) {
    const errorElement = document.getElementById('error-message') ||
                         document.getElementById('errorMessage');

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('active');

        setTimeout(() => {
            errorElement.style.display = 'none';
            errorElement.classList.remove('active');
        }, 5000);
    } else {
        console.error('❌ Error:', message);
        alert(message);
    }
}

function showSuccess(message) {
    const successElement = document.getElementById('success-message') ||
                          document.getElementById('successMessage');

    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        successElement.classList.add('active');

        setTimeout(() => {
            successElement.style.display = 'none';
            successElement.classList.remove('active');
        }, 3000);
    } else {
        console.log('✅ Success:', message);
    }
}

// Handle successful login with OTP verification
async function handleSuccessfulLogin(userData) {
    try {
        console.log('🔐 Processing successful login for:', userData.email);

        if (!userData || !userData.id) {
            throw new Error('Invalid user data received from server');
        }

        // Initialize session handler
        const sessionHandler = UserSessionHandler.getInstance();

        // Save session
        const sessionSaved = sessionHandler.saveUserSession(userData);

        if (!sessionSaved) {
            throw new Error('Failed to save session data');
        }

        // Update UI if on dashboard
        sessionHandler.updateProfileUI();

        // Show success message
        showSuccess('Login successful! Redirecting...');

        // Determine redirect URL based on role
        const redirectUrls = {
            'STUDENT': '/student/StudentDashboard.html',
            'LECTURER': '/lecturer/LectureDashboard.html',
            'ADMIN': '/admin/admin.html',
            'PARENT': '/parent/ParentDashboard.html'
        };

        const redirectPage = redirectUrls[userData.role] || '/dashboard.html';

        console.log('🔄 Redirecting to:', redirectPage);

        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = redirectPage;
        }, 1000);

        return true;
    } catch (error) {
        console.error('❌ Login process error:', error);

        // Record failed login
        if (window.sessionTracker && userData) {
            window.sessionTracker.recordLogin(userData, false);
        }

        showError(error.message || 'Login failed. Please try again.');
        return false;
    }
}

// ==================== PAGE PROTECTION ====================

async function checkAuthentication() {
    const sessionHandler = UserSessionHandler.getInstance();

    if (!sessionHandler.isAuthenticated()) {
        console.warn('⚠️ User not authenticated - redirecting to login');
        window.location.href = '/login.html';
        return false;
    }

    return true;
}

async function loadUserProfile() {
    const sessionHandler = UserSessionHandler.getInstance();
    const user = sessionHandler.getCurrentUser();

    if (!user) {
        console.warn('⚠️ No user profile found');
        return null;
    }

    // Update UI
    sessionHandler.updateProfileUI();

    return user;
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing UserSessionHandler...');

    const sessionHandler = UserSessionHandler.getInstance();

    // Update profile UI if user is logged in
    if (sessionHandler.isAuthenticated()) {
        sessionHandler.updateProfileUI();
        console.log('✅ User authenticated, profile UI updated');
    } else {
        console.log('ℹ️ User not authenticated');
    }

    // Set up logout buttons
    const logoutButtons = document.querySelectorAll(
        '.logout-btn, .btn-logout, #logout-btn, #logoutBtn'
    );

    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚪 Logout button clicked');
            sessionHandler.logout();
        });
    });

    console.log('✅ UserSessionHandler initialized successfully');
});

// ==================== GLOBAL SCOPE ====================

if (typeof window !== 'undefined') {
    window.UserSessionHandler = UserSessionHandler;
    window.handleSuccessfulLogin = handleSuccessfulLogin;
    window.checkAuthentication = checkAuthentication;
    window.loadUserProfile = loadUserProfile;
    window.showError = showError;
    window.showSuccess = showSuccess;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UserSessionHandler,
        handleSuccessfulLogin,
        checkAuthentication,
        loadUserProfile,
        showError,
        showSuccess
    };
}



