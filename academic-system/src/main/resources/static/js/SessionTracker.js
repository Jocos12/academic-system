// ============================================================================
// SESSION TRACKER - COMPLETE IMPLEMENTATION FOR UNT ACADEMIC SYSTEM
// Tracks user login sessions, activity, and authentication state
// ============================================================================

(function() {
    'use strict';

    // Prevent redefinition if already loaded
    if (typeof window !== 'undefined' && window.SessionTracker) {
        console.log('SessionTracker already exists, skipping redefinition');
        return;
    }

    class SessionTracker {
        constructor() {
            // Storage keys for different data types
            this.storage = {
                loginHistory: 'unt_loginHistory',
                activeSessions: 'unt_activeSessions',
                failedAttempts: 'unt_failedAttempts',
                userPhotos: 'unt_userPhotos',
                sessionData: 'unt_sessionData',
                sessionLog: 'unt_sessionLog'
            };

            // Session tracking properties
            this.sessionLog = [];
            this.maxLogEntries = 100;
            this.memoryStorage = {}; // Fallback for localStorage

            // Initialize
            this.initializeStorage();
            this.loadExistingLog();
            this.setupPeriodicCleanup();
        }

        // ==================== INITIALIZATION ====================

        initializeStorage() {
            const storageKeys = Object.values(this.storage);
            storageKeys.forEach(key => {
                if (!this.getStorageItem(key)) {
                    this.setStorageItem(key, JSON.stringify(
                        key === this.storage.sessionData ? {} : []
                    ));
                }
            });
        }

        loadExistingLog() {
            try {
                const existingLog = this.getStorageItem(this.storage.sessionLog);
                if (existingLog) {
                    this.sessionLog = JSON.parse(existingLog);
                    if (!Array.isArray(this.sessionLog)) {
                        this.sessionLog = [];
                    }
                } else {
                    this.sessionLog = [];
                }
            } catch (e) {
                console.error('Error loading session log:', e);
                this.sessionLog = [];
            }
        }

        // ==================== LOGIN RECORDING ====================

        recordLogin(userData, success) {
            try {
                if (!userData || (!userData.email && !userData.id)) {
                    console.error('Invalid user data provided - missing identifier');
                    return false;
                }

                const userId = userData.id || userData.email;
                const email = userData.email;
                const fullName = userData.fullName || userData.username || email;
                const role = userData.role || 'USER';
                const sessionId = success ? this.generateSessionId() : null;

                // Get current data from storage
                const loginHistory = this.getStorageData(this.storage.loginHistory);
                const activeSessions = this.getStorageData(this.storage.activeSessions);
                const failedAttempts = this.getStorageData(this.storage.failedAttempts);
                const userPhotos = this.getStorageData(this.storage.userPhotos);

                const loginRecord = {
                    timestamp: new Date().toISOString(),
                    userId: userId,
                    email: email,
                    fullName: fullName,
                    role: role,
                    success: success,
                    deviceInfo: this.getDeviceInfo(),
                    sessionId: sessionId
                };

                // Enhanced logging entry
                const enhancedLogEntry = {
                    timestamp: new Date().toISOString(),
                    email: email || 'unknown',
                    userId: userId,
                    fullName: fullName,
                    role: role,
                    success: success,
                    userAgent: navigator.userAgent,
                    sessionId: sessionId,
                    deviceInfo: this.getDeviceInfo()
                };

                // Add to login history
                loginHistory.push(loginRecord);
                this.saveStorageData(this.storage.loginHistory, loginHistory);

                // Add to enhanced session log
                this.sessionLog.push(enhancedLogEntry);

                // Trim log if too large
                if (this.sessionLog.length > this.maxLogEntries) {
                    this.sessionLog = this.sessionLog.slice(-this.maxLogEntries);
                }

                // Save enhanced session log
                this.setStorageItem(this.storage.sessionLog, JSON.stringify(this.sessionLog));

                if (success) {
                    this.handleSuccessfulLogin(userData, loginRecord, activeSessions, userPhotos);
                } else {
                    this.handleFailedLogin(loginRecord, failedAttempts);
                }

                console.log('✅ Login recorded successfully:', {
                    userId: userId,
                    email: email,
                    success: success,
                    timestamp: loginRecord.timestamp,
                    sessionId: sessionId
                });

                return enhancedLogEntry;
            } catch (error) {
                console.error('❌ Error recording login:', error);
                return false;
            }
        }

        handleSuccessfulLogin(userData, loginRecord, activeSessions, userPhotos) {
            const userId = userData.id || userData.email;

            // Remove existing active session for this user (prevent duplicates)
            const filteredSessions = activeSessions.filter(session => session.userId !== userId);

            // Create new session record
            const sessionRecord = {
                userId: userId,
                email: userData.email,
                fullName: userData.fullName || userData.username || userData.email,
                role: userData.role || 'USER',
                loginTime: loginRecord.timestamp,
                sessionId: loginRecord.sessionId,
                deviceInfo: loginRecord.deviceInfo,
                lastActivity: new Date().toISOString()
            };

            filteredSessions.push(sessionRecord);
            this.saveStorageData(this.storage.activeSessions, filteredSessions);

            // Store user photo if available
            if (userData.photo || userData.profileImageUrl) {
                const photoData = {
                    userId: userId,
                    photo: userData.photo || userData.profileImageUrl,
                    updatedAt: new Date().toISOString()
                };

                // Remove existing photo data for this user
                const filteredPhotos = userPhotos.filter(photo => photo.userId !== userId);
                filteredPhotos.push(photoData);
                this.saveStorageData(this.storage.userPhotos, filteredPhotos);
            }

            // Update session data
            this.updateSessionData(userId, {
                email: userData.email,
                fullName: sessionRecord.fullName,
                role: userData.role,
                photo: userData.photo || userData.profileImageUrl,
                loginTime: loginRecord.timestamp,
                sessionId: loginRecord.sessionId
            });
        }

        handleFailedLogin(loginRecord, failedAttempts) {
            const failedAttempt = {
                timestamp: loginRecord.timestamp,
                userId: loginRecord.userId,
                email: loginRecord.email,
                fullName: loginRecord.fullName,
                role: loginRecord.role,
                deviceInfo: loginRecord.deviceInfo
            };

            failedAttempts.push(failedAttempt);
            this.saveStorageData(this.storage.failedAttempts, failedAttempts);
        }

        // ==================== SESSION MANAGEMENT ====================

        updateSessionData(userId, sessionInfo) {
            try {
                const sessionData = this.getStorageData(this.storage.sessionData) || {};
                sessionData[userId] = {
                    ...sessionInfo,
                    lastUpdated: new Date().toISOString()
                };
                this.saveStorageData(this.storage.sessionData, sessionData);
            } catch (error) {
                console.error('Error updating session data:', error);
            }
        }

        getCurrentSession(userId) {
            try {
                const activeSessions = this.getStorageData(this.storage.activeSessions);
                return activeSessions.find(session => session.userId === userId) || null;
            } catch (error) {
                console.error('Error getting current session:', error);
                return null;
            }
        }

        updateLastActivity(userId) {
            try {
                const activeSessions = this.getStorageData(this.storage.activeSessions);
                const sessionIndex = activeSessions.findIndex(session => session.userId === userId);

                if (sessionIndex !== -1) {
                    activeSessions[sessionIndex].lastActivity = new Date().toISOString();
                    this.saveStorageData(this.storage.activeSessions, activeSessions);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Error updating last activity:', error);
                return false;
            }
        }

        endSession(userId) {
            try {
                const activeSessions = this.getStorageData(this.storage.activeSessions);
                const filteredSessions = activeSessions.filter(session => session.userId !== userId);
                this.saveStorageData(this.storage.activeSessions, filteredSessions);

                // Also remove from session data
                const sessionData = this.getStorageData(this.storage.sessionData) || {};
                delete sessionData[userId];
                this.saveStorageData(this.storage.sessionData, sessionData);

                console.log('✅ Session ended for user:', userId);
                return true;
            } catch (error) {
                console.error('❌ Error ending session:', error);
                return false;
            }
        }

        // ==================== QUERY METHODS ====================

        getRecentAttempts(email, minutes = 5) {
            const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
            return this.sessionLog.filter(entry =>
                entry.email === email &&
                new Date(entry.timestamp) > cutoffTime
            );
        }

        getRecentFailedAttempts(email, minutes = 5) {
            return this.getRecentAttempts(email, minutes).filter(entry => !entry.success);
        }

        getRecentSuccessfulAttempts(email, minutes = 5) {
            return this.getRecentAttempts(email, minutes).filter(entry => entry.success);
        }

        getUserPhoto(userId) {
            try {
                const userPhotos = this.getStorageData(this.storage.userPhotos);
                const photoData = userPhotos.find(photo => photo.userId === userId);
                return photoData ? photoData.photo : null;
            } catch (error) {
                console.error('Error getting user photo:', error);
                return null;
            }
        }

        getActiveSessions() {
            return this.getStorageData(this.storage.activeSessions);
        }

        getLoginHistory(limit = 50) {
            const loginHistory = this.getStorageData(this.storage.loginHistory);
            return loginHistory
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        }

        getFailedAttempts(limit = 20) {
            const failedAttempts = this.getStorageData(this.storage.failedAttempts);
            return failedAttempts
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        }

        getSessionLog(limit = 50, filterOptions = {}) {
            let filteredLog = [...this.sessionLog];

            // Apply filters
            if (filterOptions.email) {
                filteredLog = filteredLog.filter(entry => entry.email === filterOptions.email);
            }
            if (filterOptions.success !== undefined) {
                filteredLog = filteredLog.filter(entry => entry.success === filterOptions.success);
            }
            if (filterOptions.fromDate) {
                const fromDate = new Date(filterOptions.fromDate);
                filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) >= fromDate);
            }
            if (filterOptions.toDate) {
                const toDate = new Date(filterOptions.toDate);
                filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) <= toDate);
            }

            return filteredLog
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        }

        // ==================== STATISTICS ====================

        getLoginStats() {
            try {
                const loginHistory = this.getStorageData(this.storage.loginHistory);
                const activeSessions = this.getStorageData(this.storage.activeSessions);
                const failedAttempts = this.getStorageData(this.storage.failedAttempts);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const successfulLogins = loginHistory.filter(login => login.success);
                const todaySuccessfulLogins = successfulLogins.filter(login =>
                    new Date(login.timestamp) >= today
                );

                return {
                    totalUsers: new Set(successfulLogins.map(login => login.userId)).size,
                    todayLogins: todaySuccessfulLogins.length,
                    activeSessions: activeSessions.length,
                    failedAttempts: failedAttempts.length,
                    totalLogins: loginHistory.length,
                    successfulLogins: successfulLogins.length,
                    roleDistribution: this.calculateRoleDistribution(successfulLogins),
                    recentActivity: this.getRecentActivity(loginHistory, 10),
                    todayFailedAttempts: failedAttempts.filter(attempt =>
                        new Date(attempt.timestamp) >= today
                    ).length,
                    enhancedLogEntries: this.sessionLog.length
                };
            } catch (error) {
                console.error('Error getting login stats:', error);
                return {
                    totalUsers: 0,
                    todayLogins: 0,
                    activeSessions: 0,
                    failedAttempts: 0,
                    totalLogins: 0,
                    successfulLogins: 0,
                    roleDistribution: {},
                    recentActivity: [],
                    todayFailedAttempts: 0,
                    enhancedLogEntries: 0
                };
            }
        }

        calculateRoleDistribution(loginHistory) {
            return loginHistory.reduce((acc, login) => {
                if (login.role) {
                    acc[login.role] = (acc[login.role] || 0) + 1;
                }
                return acc;
            }, {});
        }

        getRecentActivity(loginHistory, limit = 10) {
            return loginHistory
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        }

        // ==================== CLEANUP ====================

        setupPeriodicCleanup() {
            // Clean expired sessions every 10 minutes
            setInterval(() => {
                this.clearExpiredSessions();
                this.cleanOldData();
            }, 10 * 60 * 1000);
        }

        clearExpiredSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
            try {
                const activeSessions = this.getStorageData(this.storage.activeSessions);
                const now = new Date();

                const validSessions = activeSessions.filter(session => {
                    const lastActivity = new Date(session.lastActivity || session.loginTime);
                    const sessionAge = now - lastActivity;
                    return sessionAge < maxAge;
                });

                if (validSessions.length !== activeSessions.length) {
                    this.saveStorageData(this.storage.activeSessions, validSessions);
                    console.log(`🧹 Cleaned ${activeSessions.length - validSessions.length} expired sessions`);
                }
            } catch (error) {
                console.error('Error clearing expired sessions:', error);
            }
        }

        cleanOldData(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
            try {
                const now = new Date();

                // Clean old login history
                const loginHistory = this.getStorageData(this.storage.loginHistory);
                const recentLoginHistory = loginHistory.filter(login => {
                    const loginDate = new Date(login.timestamp);
                    return (now - loginDate) < maxAge;
                });

                if (recentLoginHistory.length !== loginHistory.length) {
                    this.saveStorageData(this.storage.loginHistory, recentLoginHistory);
                }

                // Clean old failed attempts
                const failedAttempts = this.getStorageData(this.storage.failedAttempts);
                const recentFailedAttempts = failedAttempts.filter(attempt => {
                    const attemptDate = new Date(attempt.timestamp);
                    return (now - attemptDate) < maxAge;
                });

                if (recentFailedAttempts.length !== failedAttempts.length) {
                    this.saveStorageData(this.storage.failedAttempts, recentFailedAttempts);
                }

                // Clean old session log
                const recentSessionLog = this.sessionLog.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    return (now - entryDate) < maxAge;
                });

                if (recentSessionLog.length !== this.sessionLog.length) {
                    this.sessionLog = recentSessionLog;
                    this.setStorageItem(this.storage.sessionLog, JSON.stringify(this.sessionLog));
                }
            } catch (error) {
                console.error('Error cleaning old data:', error);
            }
        }

        clearAllData() {
            Object.values(this.storage).forEach(key => {
                try {
                    localStorage.removeItem(key);
                } catch (error) {
                    if (this.memoryStorage) {
                        delete this.memoryStorage[key];
                    }
                }
            });
            this.sessionLog = [];
            this.initializeStorage();
            console.log('🧹 All session tracking data cleared');
        }

        // ==================== UTILITY METHODS ====================

        getDeviceInfo() {
            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenResolution: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                cookieEnabled: navigator.cookieEnabled
            };
        }

        generateSessionId() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            return `session_${timestamp}_${random}`;
        }

        // ==================== STORAGE METHODS ====================

        getStorageItem(key) {
            try {
                return localStorage.getItem(key);
            } catch (error) {
                console.warn('localStorage not available, using memory storage');
                return this.memoryStorage && this.memoryStorage[key];
            }
        }

        setStorageItem(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (error) {
                console.warn('localStorage not available, using memory storage');
                if (!this.memoryStorage) this.memoryStorage = {};
                this.memoryStorage[key] = value;
            }
        }

        getStorageData(key) {
            try {
                const data = this.getStorageItem(key);
                return data ? JSON.parse(data) : (key === this.storage.sessionData ? {} : []);
            } catch (error) {
                console.error(`Error parsing storage data for key ${key}:`, error);
                return key === this.storage.sessionData ? {} : [];
            }
        }

        saveStorageData(key, data) {
            try {
                this.setStorageItem(key, JSON.stringify(data));
            } catch (error) {
                console.error(`Error saving storage data for key ${key}:`, error);
            }
        }

        // ==================== EXPORT/IMPORT ====================

        exportData() {
            const data = {};
            Object.entries(this.storage).forEach(([name, key]) => {
                data[name] = this.getStorageData(key);
            });
            return data;
        }

        importData(data) {
            try {
                Object.entries(data).forEach(([name, value]) => {
                    if (this.storage[name]) {
                        this.saveStorageData(this.storage[name], value);
                    }
                });

                // Reload session log after import
                this.loadExistingLog();

                console.log('✅ Data imported successfully');
                return true;
            } catch (error) {
                console.error('❌ Error importing data:', error);
                return false;
            }
        }
    }

    // ==================== GLOBAL INITIALIZATION ====================

    // Expose SessionTracker to the global scope (browser environment)
    if (typeof window !== 'undefined') {
        window.SessionTracker = SessionTracker;

        // Initialize global instance if it doesn't exist
        if (!window.sessionTracker) {
            window.sessionTracker = new SessionTracker();
            console.log('✅ SessionTracker initialized successfully for UNT Academic System');
        }
    }

    // Export for Node.js environments
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SessionTracker };
    }

    // Return the class for other module systems
    return SessionTracker;

})();