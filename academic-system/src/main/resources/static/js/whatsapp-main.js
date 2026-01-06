// ============================================================================
// UNT STAFF CHAT - WHATSAPP-MAIN.JS
// Complete WhatsApp-like Chat System with Group Support
// ============================================================================

// ==================== GLOBAL CONFIGURATION ====================
const CONFIG = {
    API_BASE_URL: 'http://localhost:8080/api',
    WS_URL: 'http://localhost:8080/ws',
    ALLOWED_ROLES: ['ADMIN', 'LECTURER', 'PARENT', 'STUDENT'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ],
    MESSAGE_LOAD_SIZE: 50,
    TYPING_TIMEOUT: 3000,
    RECONNECT_INTERVAL: 5000
};

// ==================== GLOBAL STATE ====================
const STATE = {
    currentUser: null,
    selectedContact: null,
    selectedGroup: null,
    contacts: [],
    groups: [],
    messages: new Map(), // contactEmail -> messages[]
    groupMessages: new Map(), // groupId -> messages[]
    unreadCounts: new Map(),
    groupUnreadCounts: new Map(),
    onlineUsers: new Set(),
    stompClient: null,
    typingTimeouts: new Map(),
    theme: localStorage.getItem('chat-theme') || 'light',
    currentTab: 'chats',
    searchQuery: '',
    notifications: []
};

// ==================== EMOJI COLLECTION ====================
const EMOJIS = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '😋'],
    people: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉'],
    food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽'],
    activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣'],
    travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺'],
    objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️']
};





// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 UNT Staff Chat initializing...');

    try {
        // Vérifier l'authentification
        if (!checkAuthentication()) {
            console.error('❌ Authentication failed');
            return;
        }

        // Charger l'utilisateur courant
        await loadCurrentUser();

        // ✅ IMPORTANT: Vérifier et récupérer le token si nécessaire
        console.log('🔐 Checking authentication token...');
        const token = getAuthToken();

        if (!token) {
            console.log('🔄 No token found, attempting to retrieve from server...');
            await retrieveTokenFromServer();

            // Vérifier à nouveau
            const newToken = getAuthToken();
            if (!newToken) {
                console.warn('⚠️ Could not retrieve token, some features may be limited');
                showToast('Warning', 'Authentication token missing. Some features may not work.', 'warning');
            } else {
                console.log('✅ Token retrieved successfully');
            }
        } else {
            console.log('✅ Token found, validating...');
            if (!validateToken(token)) {
                console.warn('⚠️ Token is invalid or expired, attempting refresh...');
                await retrieveTokenFromServer();
            }
        }

        // Initialiser le thème
        initializeTheme();

        // Initialiser l'UI
        initializeUI();

        // Charger les contacts et groupes
        await Promise.all([
            loadContacts(),
            loadGroups()
        ]);

        // Connecter WebSocket
        connectWebSocket();

        // Charger les notifications
        await loadNotifications();

        // Cacher l'écran de chargement
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 500);

        console.log('✅ UNT Staff Chat initialized successfully');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('Error', 'Failed to initialize chat application', 'error');
    }
});






// ==================== AUTHENTICATION ====================
function checkAuthentication() {
    try {
        const sessionHandler = UserSessionHandler.getInstance();
        const currentUser = sessionHandler.getCurrentUser();

        if (!currentUser) {
            console.error('No user session found');
            alert('You must be logged in to access this page');
            window.location.href = '/login.html';
            return false;
        }

        // Check if user has allowed role
        if (!CONFIG.ALLOWED_ROLES.includes(currentUser.role)) {
            console.error('User does not have permission to access chat');
            alert('You do not have permission to access staff chat.');
            window.location.href = '/dashboard.html';
            return false;
        }

        STATE.currentUser = currentUser;
        return true;
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '/login.html';
        return false;
    }
}



async function loadCurrentUser() {
    try {
        const sessionHandler = UserSessionHandler.getInstance();
        const user = sessionHandler.getCurrentUser();

        if (user) {
            // Update sidebar user info
            const currentUserName = document.getElementById('current-user-name');
            const currentUserRole = document.getElementById('current-user-role');
            const currentUserAvatar = document.getElementById('current-user-avatar');

            if (currentUserName) currentUserName.textContent = user.fullName;
            if (currentUserRole) currentUserRole.textContent = formatRole(user.role);

            // ✅ FIXED: Utiliser la vraie photo de profil
            if (currentUserAvatar) {
                if (user.profileImageUrl && user.profileImageUrl.trim() !== '' && user.profileImageUrl !== 'images/unt-logo.png') {
                    currentUserAvatar.src = user.profileImageUrl;
                    currentUserAvatar.style.display = 'block';
                    currentUserAvatar.onerror = function() {
                        this.style.display = 'none';
                        this.parentElement.innerHTML += `<div class="avatar-initials current-user-avatar">${getInitials(user.fullName)}</div>`;
                    };
                } else {
                    currentUserAvatar.style.display = 'none';
                    currentUserAvatar.parentElement.innerHTML += `<div class="avatar-initials current-user-avatar">${getInitials(user.fullName)}</div>`;
                }
            }

            // Update profile modal
            const profileName = document.getElementById('profile-full-name');
            const profileEmail = document.getElementById('profile-email');
            const profileRole = document.getElementById('profile-role-badge');
            const profilePhone = document.getElementById('profile-phone');
            const profileDepartment = document.getElementById('profile-department');
            const profileEmployeeId = document.getElementById('profile-employee-id');
            const profilePhotoLarge = document.getElementById('profile-photo-large');

            if (profileName) profileName.textContent = user.fullName;
            if (profileEmail) profileEmail.textContent = user.email;
            if (profileRole) {
                profileRole.textContent = formatRole(user.role);
                profileRole.className = `role-badge ${user.role.toLowerCase()}`;
            }
            if (profilePhone) profilePhone.textContent = user.phoneNumber || 'N/A';
            if (profileDepartment) profileDepartment.textContent = user.department || 'N/A';
            if (profileEmployeeId) profileEmployeeId.textContent = user.employeeId || user.studentId || 'N/A';

            // ✅ FIXED: Utiliser la vraie photo de profil dans le modal
            if (profilePhotoLarge) {
                if (user.profileImageUrl && user.profileImageUrl.trim() !== '' && user.profileImageUrl !== 'images/unt-logo.png') {
                    profilePhotoLarge.src = user.profileImageUrl;
                    profilePhotoLarge.style.display = 'block';
                    profilePhotoLarge.onerror = function() {
                        this.style.display = 'none';
                        this.parentElement.innerHTML = `<div class="avatar-initials" style="width: 150px; height: 150px; font-size: 48px;">${getInitials(user.fullName)}</div>`;
                    };
                } else {
                    profilePhotoLarge.style.display = 'none';
                    profilePhotoLarge.parentElement.innerHTML = `<div class="avatar-initials" style="width: 150px; height: 150px; font-size: 48px;">${getInitials(user.fullName)}</div>`;
                }
            }
        }
    } catch (error) {
        console.error('Error loading current user:', error);
    }
}


/**
 * Generate initials from full name
 * @param {string} fullName - User's full name
 * @returns {string} Initials (max 2 characters)
 */
function getInitials(fullName) {
    if (!fullName) return '?';

    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    } else if (names.length === 1) {
        return names[0].substring(0, 2).toUpperCase();
    }
    return '?';
}


// ==================== UI INITIALIZATION ====================
function initializeUI() {
    console.log('🎨 Initializing UI...');

    // Theme toggle
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => openModal('settings-modal'));
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            showToast('Info', 'Refreshing...', 'info');
            await Promise.all([loadContacts(), loadGroups()]);
            if (STATE.selectedContact) {
                await loadChatHistory(STATE.selectedContact.email);
            }
            if (STATE.selectedGroup) {
                await loadGroupMessages(STATE.selectedGroup.id);
            }
        });
    }

    // Create group button
    const createGroupBtn = document.getElementById('create-group-btn');
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', () => openCreateGroupModal());
    }

    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    const searchClearBtn = document.getElementById('search-clear-btn');
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            STATE.searchQuery = '';
            searchClearBtn.style.display = 'none';
            filterCurrentView();
        });
    }

    // Navigation tabs
    initializeTabs();

    // Message input
    initializeMessageInput();

    // File handling
    initializeFileHandling();

    // Emoji picker
    initializeEmojiPicker();

    // Profile modal
    initializeProfileModal();

    // Group creation modal
    initializeGroupCreationModal();

    // Settings modal
    initializeSettingsModal();

    // Context menu
    initializeContextMenu();

    // Back button for mobile
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', showSidebar);
    }

    console.log('✅ UI initialized');
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    STATE.currentTab = tabName;

    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update visible content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const activeContent = document.getElementById(`${tabName}-content`);
    if (activeContent) {
        activeContent.classList.add('active');
    }

    // Clear search and filter
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
        STATE.searchQuery = '';
    }

    filterCurrentView();
}

function initializeMessageInput() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');

    if (messageInput) {
        messageInput.addEventListener('input', handleMessageInput);
        messageInput.addEventListener('keydown', handleMessageKeydown);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
}

function initializeFileHandling() {
    const attachBtn = document.getElementById('attach-file-btn');
    const fileInput = document.getElementById('file-input');

    if (attachBtn) {
        attachBtn.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

function initializeEmojiPicker() {
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const closeEmojiBtn = document.getElementById('close-emoji-picker');

    if (emojiBtn) {
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleEmojiPicker();
        });
    }

    if (closeEmojiBtn) {
        closeEmojiBtn.addEventListener('click', () => {
            if (emojiPicker) emojiPicker.style.display = 'none';
        });
    }

    // Populate emoji picker
    populateEmojiPicker();

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (emojiPicker && emojiBtn &&
            !emojiPicker.contains(e.target) &&
            !emojiBtn.contains(e.target)) {
            emojiPicker.style.display = 'none';
        }
    });

    // Emoji category buttons
    const categoryBtns = document.querySelectorAll('.emoji-category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            displayEmojiCategory(category);
        });
    });
}

function populateEmojiPicker() {
    displayEmojiCategory('smileys');
}

function displayEmojiCategory(category) {
    const emojiGrid = document.getElementById('emoji-grid');
    if (!emojiGrid) return;

    emojiGrid.innerHTML = '';
    const emojis = EMOJIS[category] || EMOJIS.smileys;

    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.className = 'emoji-item';
        span.addEventListener('click', () => insertEmoji(emoji));
        emojiGrid.appendChild(span);
    });
}

function insertEmoji(emoji) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value += emoji;
        messageInput.focus();
        handleMessageInput({ target: messageInput });
    }

    const emojiPicker = document.getElementById('emoji-picker');
    if (emojiPicker) {
        emojiPicker.style.display = 'none';
    }
}

function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    if (emojiPicker) {
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    }
}

function initializeProfileModal() {
    const currentUserProfile = document.getElementById('current-user-profile');
    const closeProfileModal = document.getElementById('close-profile-modal');
    const profileModalOverlay = document.getElementById('profile-modal-overlay');
    const changePhotoBtn = document.getElementById('change-photo-btn');
    const profilePhotoInput = document.getElementById('profile-photo-input');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentUserProfile) {
        currentUserProfile.addEventListener('click', () => openModal('profile-modal'));
    }

    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => closeModal('profile-modal'));
    }

    if (profileModalOverlay) {
        profileModalOverlay.addEventListener('click', () => closeModal('profile-modal'));
    }

    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => {
            if (profilePhotoInput) profilePhotoInput.click();
        });
    }

    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', handleProfilePhotoChange);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function initializeGroupCreationModal() {
    const closeCreateGroupModal = document.getElementById('close-create-group-modal');
    const createGroupModalOverlay = document.getElementById('create-group-modal-overlay');
    const cancelGroupStep1 = document.getElementById('cancel-group-step-1');
    const nextGroupStep1 = document.getElementById('next-group-step-1');
    const backGroupStep2 = document.getElementById('back-group-step-2');
    const createGroupSubmitBtn = document.getElementById('create-group-submit-btn');
    const groupNameInput = document.getElementById('group-name-input');
    const groupDescriptionInput = document.getElementById('group-description-input');
    const searchMembersInput = document.getElementById('search-members-input');
    const uploadGroupIconBtn = document.getElementById('upload-group-icon-btn');
    const groupIconInput = document.getElementById('group-icon-input');

    if (closeCreateGroupModal) {
        closeCreateGroupModal.addEventListener('click', () => closeModal('create-group-modal'));
    }

    if (createGroupModalOverlay) {
        createGroupModalOverlay.addEventListener('click', () => closeModal('create-group-modal'));
    }

    if (cancelGroupStep1) {
        cancelGroupStep1.addEventListener('click', () => closeModal('create-group-modal'));
    }

    if (nextGroupStep1) {
        nextGroupStep1.addEventListener('click', () => goToGroupStep2());
    }

    if (backGroupStep2) {
        backGroupStep2.addEventListener('click', () => goToGroupStep1());
    }

    if (createGroupSubmitBtn) {
        createGroupSubmitBtn.addEventListener('click', createGroup);
    }

    if (groupNameInput) {
        groupNameInput.addEventListener('input', (e) => {
            const count = document.getElementById('group-name-count');
            if (count) count.textContent = `${e.target.value.length}/50`;
            validateGroupStep1();
        });
    }

    if (groupDescriptionInput) {
        groupDescriptionInput.addEventListener('input', (e) => {
            const count = document.getElementById('group-description-count');
            if (count) count.textContent = `${e.target.value.length}/200`;
        });
    }

    if (searchMembersInput) {
        searchMembersInput.addEventListener('input', filterAvailableMembers);
    }

    if (uploadGroupIconBtn) {
        uploadGroupIconBtn.addEventListener('click', () => {
            if (groupIconInput) groupIconInput.click();
        });
    }

    if (groupIconInput) {
        groupIconInput.addEventListener('change', handleGroupIconChange);
    }

    // Member filter buttons
    const filterBtns = document.querySelectorAll('.members-filter .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterAvailableMembers();
        });
    });
}

function initializeSettingsModal() {
    const closeSettingsModal = document.getElementById('close-settings-modal');
    const settingsModalOverlay = document.getElementById('settings-modal-overlay');

    if (closeSettingsModal) {
        closeSettingsModal.addEventListener('click', () => closeModal('settings-modal'));
    }

    if (settingsModalOverlay) {
        settingsModalOverlay.addEventListener('click', () => closeModal('settings-modal'));
    }

    // Settings toggles
    const toggles = {
        'message-notifications-toggle': 'messageNotifications',
        'sound-notifications-toggle': 'soundNotifications',
        'desktop-notifications-toggle': 'desktopNotifications',
        'read-receipts-toggle': 'readReceipts',
        'typing-indicator-toggle': 'typingIndicator',
        'online-status-toggle': 'onlineStatus',
        'enter-send-toggle': 'enterSend',
        'auto-download-toggle': 'autoDownload'
    };

    Object.entries(toggles).forEach(([id, setting]) => {
        const toggle = document.getElementById(id);
        if (toggle) {
            const saved = localStorage.getItem(`chat-setting-${setting}`);
            if (saved !== null) {
                toggle.checked = saved === 'true';
            }

            toggle.addEventListener('change', (e) => {
                localStorage.setItem(`chat-setting-${setting}`, e.target.checked);
            });
        }
    });

    // Theme select
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = STATE.theme;
        themeSelect.addEventListener('change', (e) => {
            STATE.theme = e.target.value;
            document.body.setAttribute('data-theme', STATE.theme);
            localStorage.setItem('chat-theme', STATE.theme);
        });
    }

    // Font size select
    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSizeSelect) {
        const savedSize = localStorage.getItem('chat-font-size') || 'medium';
        fontSizeSelect.value = savedSize;
        document.body.setAttribute('data-font-size', savedSize);

        fontSizeSelect.addEventListener('change', (e) => {
            document.body.setAttribute('data-font-size', e.target.value);
            localStorage.setItem('chat-font-size', e.target.value);
        });
    }

    // Clear cache button
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the cache?')) {
                STATE.messages.clear();
                STATE.groupMessages.clear();
                showToast('Success', 'Cache cleared successfully', 'success');
            }
        });
    }
}

function initializeContextMenu() {
    const contextMenu = document.getElementById('context-menu');

    document.addEventListener('click', () => {
        if (contextMenu) contextMenu.style.display = 'none';
    });

    if (contextMenu) {
        const items = contextMenu.querySelectorAll('.context-menu-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.dataset.action;
                handleContextMenuAction(action);
                contextMenu.style.display = 'none';
            });
        });
    }
}

// ==================== THEME MANAGEMENT ====================
function initializeTheme() {
    document.body.setAttribute('data-theme', STATE.theme);
    updateThemeIcon();
}

function toggleTheme() {
    STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', STATE.theme);
    localStorage.setItem('chat-theme', STATE.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('#theme-toggle-btn i');
    if (themeIcon) {
        themeIcon.className = STATE.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}







// ==================== CONTACTS MANAGEMENT ====================
async function loadContacts() {
    try {
        console.log('📇 Loading contacts...');

        const token = await getAuthTokenWithFallback();
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.log('⚠️ No token available, using session-based authentication');
            // We'll try without token, server might use session
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/users`, {
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('⚠️ Unauthorized, attempting to refresh session...');
                // Try to get new token
                const newToken = await retrieveTokenFromServer();
                if (newToken) {
                    return await loadContacts(); // Retry with new token
                }
            }
            throw new Error('Failed to load contacts');
        }

        const users = await response.json();

        // Filter users (exclude current user)
        STATE.contacts = users.filter(user =>
            CONFIG.ALLOWED_ROLES.includes(user.role) &&
            user.id !== STATE.currentUser.id
        );

        console.log(`✅ Loaded ${STATE.contacts.length} contacts`);
        renderContacts();
        updateBadges();
    } catch (error) {
        console.error('Error loading contacts:', error);
        showToast('Error', 'Failed to load contacts', 'error');
    }
}





function renderGroups() {
    const groupsList = document.getElementById('groups-list');
    if (!groupsList) return;

    const filteredGroups = STATE.groups.filter(group => {
        if (!STATE.searchQuery) return true;
        const query = STATE.searchQuery.toLowerCase();
        return group.name.toLowerCase().includes(query) ||
               (group.description && group.description.toLowerCase().includes(query));
    });

    if (filteredGroups.length === 0) {
        groupsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No groups found</p>
                <span>${STATE.searchQuery ? 'Try a different search' : 'Create or join a group to start'}</span>
            </div>
        `;
        return;
    }

    groupsList.innerHTML = '';
    filteredGroups.forEach(group => {
        const groupElement = createGroupElement(group);
        groupsList.appendChild(groupElement);
    });
}

function createGroupElement(group) {
    const div = document.createElement('div');
    div.className = 'group-item';
    div.dataset.groupId = group.id;

    const unreadCount = STATE.groupUnreadCounts.get(group.id) || 0;

    div.innerHTML = `
        <div class="group-avatar-wrapper">
            <img src="${group.iconUrl || 'images/unt-logo.png'}"
                 alt="${escapeHtml(group.name)}"
                 class="group-avatar">
        </div>
        <div class="group-details">
            <div class="group-header">
                <h4 class="group-name">${escapeHtml(group.name)}</h4>
                <span class="group-time"></span>
            </div>
            <div class="group-footer">
                <span class="group-members">${group.memberCount || 0} members</span>
                ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
            </div>
        </div>
    `;

    div.addEventListener('click', () => selectGroup(group));

    return div;
}

async function selectGroup(group) {
    console.log('👥 Selecting group:', group.name);

    STATE.selectedGroup = group;
    STATE.selectedContact = null;

    // Update active state
    document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.group-item').forEach(el => el.classList.remove('active'));

    const groupEl = document.querySelector(`[data-group-id="${group.id}"]`);
    if (groupEl) groupEl.classList.add('active');

    // Show chat area
    showChatArea();

    // Update chat header for group
    updateGroupChatHeader(group);

    // Load group messages
    await loadGroupMessages(group.id);

    // Mark messages as read
    STATE.groupUnreadCounts.set(group.id, 0);
    renderGroups();
    updateBadges();

    // Focus message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) messageInput.focus();

    // Mobile: hide sidebar
    if (window.innerWidth <= 768) {
        hideSidebar();
    }
}

function updateGroupChatHeader(group) {
    const chatPartnerName = document.getElementById('chat-partner-name');
    const chatPartnerAvatar = document.getElementById('chat-partner-avatar');
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');

    if (chatPartnerName) chatPartnerName.textContent = group.name;
    if (chatPartnerAvatar) {
        chatPartnerAvatar.src = group.iconUrl || 'images/unt-logo.png';
    }

    if (statusText) statusText.textContent = `${group.memberCount || 0} members`;
    if (statusIndicator) {
        statusIndicator.style.display = 'none';
    }
}

function openCreateGroupModal() {
    openModal('create-group-modal');
    resetGroupCreationForm();
    loadAvailableMembers();
}

function resetGroupCreationForm() {
    const groupNameInput = document.getElementById('group-name-input');
    const groupDescriptionInput = document.getElementById('group-description-input');
    const groupTypeSelect = document.getElementById('group-type-select');
    const groupIconPreview = document.getElementById('group-icon-preview');

    if (groupNameInput) groupNameInput.value = '';
    if (groupDescriptionInput) groupDescriptionInput.value = '';
    if (groupTypeSelect) groupTypeSelect.value = '';
    if (groupIconPreview) groupIconPreview.innerHTML = '<i class="fas fa-users"></i>';

    document.getElementById('group-name-count').textContent = '0/50';
    document.getElementById('group-description-count').textContent = '0/200';

    goToGroupStep1();
}

function goToGroupStep1() {
    const step1 = document.getElementById('group-step-1');
    const step2 = document.getElementById('group-step-2');

    if (step1) {
        step1.style.display = 'block';
        step1.classList.add('active');
    }
    if (step2) {
        step2.style.display = 'none';
        step2.classList.remove('active');
    }
}

function goToGroupStep2() {
    if (!validateGroupStep1()) return;

    const step1 = document.getElementById('group-step-1');
    const step2 = document.getElementById('group-step-2');

    if (step1) {
        step1.style.display = 'none';
        step1.classList.remove('active');
    }
    if (step2) {
        step2.style.display = 'block';
        step2.classList.add('active');
    }

    loadAvailableMembers();
}

function validateGroupStep1() {
    const groupNameInput = document.getElementById('group-name-input');
    const groupName = groupNameInput ? groupNameInput.value.trim() : '';

    if (!groupName) {
        showToast('Error', 'Group name is required', 'error');
        return false;
    }

    if (groupName.length < 3) {
        showToast('Error', 'Group name must be at least 3 characters', 'error');
        return false;
    }

    return true;
}


function loadAvailableMembers() {
    const availableMembersList = document.getElementById('available-members-list');
    if (!availableMembersList) return;

    availableMembersList.innerHTML = '';

    const searchQuery = document.getElementById('search-members-input')?.value.toLowerCase() || '';
    const activeFilter = document.querySelector('.members-filter .filter-btn.active')?.dataset.filter || 'all';

    let filteredContacts = STATE.contacts.filter(contact => {
        if (activeFilter !== 'all' && contact.role !== activeFilter) return false;
        if (searchQuery) {
            return contact.fullName.toLowerCase().includes(searchQuery) ||
                   contact.email.toLowerCase().includes(searchQuery) ||
                   contact.role.toLowerCase().includes(searchQuery);
        }
        return true;
    });

    filteredContacts.forEach(contact => {
        const memberItem = document.createElement('div');
        memberItem.className = 'member-item';
        memberItem.dataset.userId = contact.id;
        memberItem.dataset.userEmail = contact.email;

        // ✅ FIXED: Utiliser la vraie photo de profil ou générer des initiales
        const avatarContent = contact.profileImageUrl && contact.profileImageUrl.trim() !== '' && contact.profileImageUrl !== 'images/unt-logo.png'
            ? `<img src="${contact.profileImageUrl}" alt="${escapeHtml(contact.fullName)}" class="avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="avatar-initials" style="display: none; width: 40px; height: 40px; font-size: 16px;">${getInitials(contact.fullName)}</div>`
            : `<div class="avatar-initials" style="width: 40px; height: 40px; font-size: 16px;">${getInitials(contact.fullName)}</div>`;

        memberItem.innerHTML = `
            <div class="member-avatar">
                ${avatarContent}
            </div>
            <div class="member-info">
                <div class="member-name">${escapeHtml(contact.fullName)}</div>
                <div class="member-role">${formatRole(contact.role)}</div>
            </div>
            <label class="member-checkbox">
                <input type="checkbox" data-user-id="${contact.id}" data-user-email="${contact.email}">
                <span class="checkmark"></span>
            </label>
        `;

        const checkbox = memberItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', updateSelectedMembers);

        availableMembersList.appendChild(memberItem);
    });
}





function filterAvailableMembers() {
    loadAvailableMembers();
}






function updateSelectedMembers() {
    const selectedMembersList = document.getElementById('selected-members-list');
    const selectedCount = document.getElementById('selected-count');
    const createGroupSubmitBtn = document.getElementById('create-group-submit-btn');

    const checkboxes = document.querySelectorAll('.available-members-list input[type="checkbox"]:checked');
    const count = checkboxes.length;

    if (selectedCount) selectedCount.textContent = count;

    if (selectedMembersList) {
        selectedMembersList.innerHTML = '';

        checkboxes.forEach(checkbox => {
            const userId = checkbox.dataset.userId;
            const contact = STATE.contacts.find(c => c.id == userId);

            if (contact) {
                const chip = document.createElement('div');
                chip.className = 'selected-member-chip';
                chip.innerHTML = `
                    <img src="${contact.profileImageUrl || 'images/unt-logo.png'}" alt="${escapeHtml(contact.fullName)}">
                    <span>${escapeHtml(contact.fullName)}</span>
                    <button class="remove-member" data-user-id="${contact.id}">
                        <i class="fas fa-times"></i>
                    </button>
                `;

                const removeBtn = chip.querySelector('.remove-member');
                removeBtn.addEventListener('click', () => {
                    checkbox.checked = false;
                    updateSelectedMembers();
                });

                selectedMembersList.appendChild(chip);
            }
        });
    }

    if (createGroupSubmitBtn) {
        createGroupSubmitBtn.disabled = count === 0;
    }
}

async function createGroup() {
    try {
        const groupNameInput = document.getElementById('group-name-input');
        const groupDescriptionInput = document.getElementById('group-description-input');
        const groupTypeSelect = document.getElementById('group-type-select');

        const groupName = groupNameInput.value.trim();
        const groupDescription = groupDescriptionInput.value.trim();
        const groupType = groupTypeSelect.value;

        const selectedCheckboxes = document.querySelectorAll('.available-members-list input[type="checkbox"]:checked');
        const memberEmails = Array.from(selectedCheckboxes).map(cb => cb.dataset.userEmail);

        if (memberEmails.length === 0) {
            showToast('Error', 'Please select at least one member', 'error');
            return;
        }

        const token = getAuthToken();
        const response = await fetch(`${CONFIG.API_BASE_URL}/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: groupName,
                description: groupDescription,
                type: groupType,
                memberEmails: memberEmails
            })
        });

        if (!response.ok) throw new Error('Failed to create group');

        const group = await response.json();

        showToast('Success', 'Group created successfully', 'success');
        closeModal('create-group-modal');

        await loadGroups();
        selectGroup(group);

    } catch (error) {
        console.error('Error creating group:', error);
        showToast('Error', 'Failed to create group', 'error');
    }
}

function handleGroupIconChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Error', 'Please select an image file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const groupIconPreview = document.getElementById('group-icon-preview');
        if (groupIconPreview) {
            groupIconPreview.innerHTML = `<img src="${e.target.result}" alt="Group Icon">`;
        }
    };
    reader.readAsDataURL(file);
}







































// DANS whatsapp-main.js - MODIFIER la fonction connectWebSocket

function connectWebSocket() {
    // Vérifier si déjà connecté
    if (STATE.stompClient && STATE.stompClient.connected) {
        console.log('✅ WebSocket already connected');
        return;
    }

    console.log('🔌 Connecting to WebSocket at:', CONFIG.WS_URL);

    try {
        // Récupérer le token JWT
        const token = getAuthToken();
        const userEmail = STATE.currentUser ? STATE.currentUser.email : null;

        // Créer la connexion SockJS
        const socket = new SockJS(CONFIG.WS_URL);
        STATE.stompClient = Stomp.over(socket);

        // Désactiver les logs de débogage en production
        STATE.stompClient.debug = () => {}; // Pas de logs

        // Headers de connexion
        const headers = {};

        if (token && token.trim() !== '') {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('✅ Using JWT token for WebSocket auth');
        }

        if (userEmail && userEmail.trim() !== '') {
            headers['X-User-Email'] = userEmail;
            console.log('✅ Adding user email to headers:', userEmail);
        }

        // Connecter avec timeout
        const connectPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000); // 10 secondes timeout

            STATE.stompClient.connect(
                headers,
                (frame) => {
                    clearTimeout(timeout);
                    console.log('✅ WebSocket connected successfully');
                    console.log('   Session:', frame.headers['session']);
                    console.log('   User:', frame.headers['user-name']);

                    // Mettre à jour l'état
                    STATE.isConnecting = false;
                    STATE.reconnectAttempts = 0;

                    // Mettre à jour l'UI
                    updateConnectionStatus(true);

                    // S'abonner aux canaux
                    subscribeToChannels();

                    // Envoyer le statut en ligne
                    sendUserStatus('ONLINE');

                    // Démarrer le heartbeat
                    startHeartbeat();

                    resolve(frame);
                },
                (error) => {
                    clearTimeout(timeout);
                    console.error('❌ WebSocket connection error:', error);
                    STATE.isConnecting = false;
                    STATE.reconnectAttempts++;

                    updateConnectionStatus(false);

                    // Réessayer si moins de 5 tentatives
                    if (STATE.reconnectAttempts < 5) {
                        const delay = Math.min(5000, STATE.reconnectAttempts * 2000);
                        console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${STATE.reconnectAttempts})`);

                        setTimeout(() => {
                            connectWebSocket();
                        }, delay);
                    } else {
                        console.error('❌ Max reconnection attempts reached');
                        showToast('Error', 'Cannot connect to chat server. Please refresh the page.', 'error');
                    }

                    reject(error);
                }
            );
        });

        // Gérer la fermeture
        socket.onclose = (event) => {
            console.warn('⚠️ WebSocket connection closed:', event.code, event.reason);
            updateConnectionStatus(false);

            // Reconnexion automatique si ce n'est pas une fermeture intentionnelle
            if (event.code !== 1000 && STATE.reconnectAttempts < 5) {
                console.log('🔄 Attempting to reconnect...');
                setTimeout(() => {
                    connectWebSocket();
                }, 3000);
            }
        };

        return connectPromise;

    } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        STATE.isConnecting = false;

        showToast('Warning', 'WebSocket connection failed. Some features may be limited.', 'warning');

        // Mode dégradé : utiliser les API REST
        console.log('⚠️ Falling back to REST API mode');

        return Promise.reject(error);
    }
}

// AJOUTER heartbeat
function startHeartbeat() {
    if (!STATE.stompClient || !STATE.stompClient.connected) return;

    STATE.heartbeatInterval = setInterval(() => {
        if (STATE.stompClient && STATE.stompClient.connected) {
            STATE.stompClient.send('/app/chat.heartbeat', {}, JSON.stringify({
                userId: STATE.currentUser.email,
                timestamp: Date.now()
            }));
        }
    }, 30000); // Toutes les 30 secondes
}

function stopHeartbeat() {
    if (STATE.heartbeatInterval) {
        clearInterval(STATE.heartbeatInterval);
        STATE.heartbeatInterval = null;
    }
}


// AJOUTER dans whatsapp-main.js
function cleanupExpiredTokens() {
    try {
        // Vérifier tous les tokens dans localStorage
        const tokenKeys = ['unt_jwt_token', 'agriguard_jwt_token', 'jwt_token'];

        tokenKeys.forEach(key => {
            const token = localStorage.getItem(key);
            if (token) {
                try {
                    // Vérifier si le token est valide
                    const parts = token.split('.');
                    if (parts.length !== 3) {
                        localStorage.removeItem(key);
                        console.log(`🧹 Removed invalid token: ${key}`);
                        return;
                    }

                    const payload = JSON.parse(atob(parts[1]));
                    const expiryTime = payload.exp * 1000;
                    const currentTime = Date.now();

                    if (currentTime >= expiryTime) {
                        localStorage.removeItem(key);
                        console.log(`🧹 Removed expired token: ${key}`);
                    }
                } catch (error) {
                    localStorage.removeItem(key);
                    console.log(`🧹 Removed malformed token: ${key}`);
                }
            }
        });

        // Nettoyer aussi les tokens spécifiques utilisateur
        const userKeys = Object.keys(localStorage).filter(key =>
            key.startsWith('token_') || key.includes('jwt')
        );

        userKeys.forEach(key => {
            try {
                const token = localStorage.getItem(key);
                if (token) {
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1]));
                        const expiryTime = payload.exp * 1000;
                        const currentTime = Date.now();

                        if (currentTime >= expiryTime) {
                            localStorage.removeItem(key);
                            console.log(`🧹 Removed expired user token: ${key}`);
                        }
                    }
                }
            } catch (error) {
                // Ignorer les erreurs
            }
        });

    } catch (error) {
        console.error('Error cleaning expired tokens:', error);
    }
}

// Exécuter au démarrage
document.addEventListener('DOMContentLoaded', () => {
    cleanupExpiredTokens();
    startTokenRefreshCheck();
});
// ✅ Subscribe to all necessary channels
function subscribeToChannels() {
    if (!STATE.stompClient || !STATE.stompClient.connected) {
        console.error('❌ Cannot subscribe: WebSocket not connected');
        return;
    }

    try {
        // Subscribe to private messages
        STATE.stompClient.subscribe(`/user/queue/private`, (message) => {
            handleIncomingMessage(JSON.parse(message.body));
        });
        console.log('✅ Subscribed to private messages');

        // Subscribe to group messages
        STATE.stompClient.subscribe(`/user/queue/group`, (message) => {
            handleIncomingGroupMessage(JSON.parse(message.body));
        });
        console.log('✅ Subscribed to group messages');

        // Subscribe to message status updates
        STATE.stompClient.subscribe(`/user/queue/message.status`, (message) => {
            handleMessageStatus(JSON.parse(message.body));
        });
        console.log('✅ Subscribed to message status');

        // Subscribe to typing indicators
        STATE.stompClient.subscribe(`/user/queue/typing`, (message) => {
            handleTypingIndicator(JSON.parse(message.body));
        });
        console.log('✅ Subscribed to typing indicators');

        // Subscribe to user status updates
        STATE.stompClient.subscribe(`/topic/user.status`, (message) => {
            handleUserStatus(JSON.parse(message.body));
        });
        console.log('✅ Subscribed to user status');

    } catch (error) {
        console.error('❌ Error subscribing to channels:', error);
    }
}

// ✅ Update connection status in UI
function updateConnectionStatus(isConnected) {
    const statusIndicator = document.getElementById('connection-status');
    const statusText = document.getElementById('connection-status-text');

    if (statusIndicator) {
        if (isConnected) {
            statusIndicator.className = 'connection-status online';
            statusIndicator.title = 'Connected';
        } else {
            statusIndicator.className = 'connection-status offline';
            statusIndicator.title = 'Disconnected';
        }
    }

    if (statusText) {
        statusText.textContent = isConnected ? 'Connected' : 'Disconnected';
    }
}








function handleIncomingMessage(message) {
    console.log('📨 Received message via WebSocket:');
    console.log('   From:', message.senderId);
    console.log('   To:', message.recipientId);
    console.log('   Content:', message.content);

    // ✅ Add to local state
    addMessageToLocal(message);

    // ✅ Update unread count if not current conversation
    if (!STATE.selectedContact || STATE.selectedContact.email !== message.senderId) {
        const sender = STATE.contacts.find(c => c.email === message.senderId);
        if (sender) {
            showDesktopNotification(sender.fullName, message.content);

            const currentCount = STATE.unreadCounts.get(message.senderId) || 0;
            STATE.unreadCounts.set(message.senderId, currentCount + 1);
            renderContacts();
            updateBadges();
        }
    }
}






function handleIncomingGroupMessage(message) {
    console.log('📨 Received group message:', message);

    addMessageToLocal(message);

    // Show notification if not currently viewing this group
    if (!STATE.selectedGroup || STATE.selectedGroup.id !== message.groupId) {
        const group = STATE.groups.find(g => g.id === message.groupId);
        if (group) {
            showDesktopNotification(group.name, `${message.senderName}: ${message.content}`);

            // Increment unread count
            const currentCount = STATE.groupUnreadCounts.get(message.groupId) || 0;
            STATE.groupUnreadCounts.set(message.groupId, currentCount + 1);
            renderGroups();
            updateBadges();
        }
    }
}

function handleMessageStatus(status) {
    console.log('📊 Message status update:', status);

    if (STATE.selectedContact) {
        const messages = STATE.messages.get(STATE.selectedContact.email) || [];
        const message = messages.find(m => m.id === status.messageId);

        if (message) {
            message.status = status.status;
            message.read = status.status === 'READ';
            renderMessages();
        }
    }
}

function handleTypingIndicator(data) {
    const typingContainer = document.getElementById('typing-indicator-container');

    if (STATE.selectedContact && STATE.selectedContact.email === data.senderId) {
        if (data.isTyping) {
            if (typingContainer) typingContainer.style.display = 'block';
            scrollToBottom();
        } else {
            if (typingContainer) typingContainer.style.display = 'none';
        }
    } else if (STATE.selectedGroup && STATE.selectedGroup.id === data.groupId) {
        if (data.isTyping) {
            if (typingContainer) {
                typingContainer.style.display = 'block';
                typingContainer.querySelector('.typing-text').textContent = `${data.senderName} is typing...`;
            }
            scrollToBottom();
        } else {
            if (typingContainer) typingContainer.style.display = 'none';
        }
    }
}

function handleUserStatus(data) {
    if (data.status === 'ONLINE') {
        STATE.onlineUsers.add(data.userId);
    } else {
        STATE.onlineUsers.delete(data.userId);
    }

    renderContacts();

    // Update chat header if currently viewing this contact
    if (STATE.selectedContact && STATE.selectedContact.email === data.userId) {
        updateChatHeader(STATE.selectedContact);
    }
}

// ==================== NOTIFICATIONS ====================
async function loadNotifications() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${CONFIG.API_BASE_URL}/chat/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        STATE.notifications = await response.json();
        renderNotifications();
        updateBadges();

    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function renderNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;

    if (STATE.notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell"></i>
                <p>No notifications</p>
                <span>You're all caught up!</span>
            </div>
        `;
        return;
    }

    notificationsList.innerHTML = '';
    STATE.notifications.forEach(notif => {
        const notifElement = createNotificationElement(notif);
        notificationsList.appendChild(notifElement);
    });
}

function createNotificationElement(notif) {
    const div = document.createElement('div');
    div.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
    div.dataset.notificationId = notif.id;

    div.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${escapeHtml(notif.title)}</div>
            <div class="notification-message">${escapeHtml(notif.message)}</div>
            <div class="notification-time">${formatMessageTime(notif.timestamp)}</div>
        </div>
        ${!notif.read ? '<span class="notification-badge"></span>' : ''}
    `;

    div.addEventListener('click', () => markNotificationAsRead(notif.id));

    return div;
}

function getNotificationIcon(type) {
    const iconMap = {
        'MESSAGE': 'comment',
        'GROUP': 'users',
        'SYSTEM': 'info-circle',
        'WARNING': 'exclamation-triangle',
        'SUCCESS': 'check-circle'
    };
    return iconMap[type] || 'bell';
}

async function markNotificationAsRead(notificationId) {
    try {
        const token = getAuthToken();
        await fetch(`${CONFIG.API_BASE_URL}/chat/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const notif = STATE.notifications.find(n => n.id === notificationId);
        if (notif) {
            notif.read = true;
            renderNotifications();
            updateBadges();
        }

    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

function showDesktopNotification(title, body) {
    const desktopNotificationsEnabled = localStorage.getItem('chat-setting-desktopNotifications') === 'true';

    if (!desktopNotificationsEnabled) return;

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'images/unt-logo.png',
            badge: 'images/unt-logo.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: 'images/unt-logo.png'
                });
            }
        });
    }
}

// ==================== SEARCH & FILTER ====================
function handleSearch(event) {
    STATE.searchQuery = event.target.value;

    const searchClearBtn = document.getElementById('search-clear-btn');
    if (searchClearBtn) {
        searchClearBtn.style.display = STATE.searchQuery ? 'block' : 'none';
    }

    filterCurrentView();
}

function filterCurrentView() {
    switch (STATE.currentTab) {
        case 'chats':
            renderContacts();
            break;
        case 'groups':
            renderGroups();
            break;
        case 'notifications':
            // Notifications don't need filtering for now
            break;
    }
}

// ==================== UI HELPERS ====================
function showChatArea() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const activeChat = document.getElementById('active-chat');

    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (activeChat) activeChat.style.display = 'flex';
}

function hideChatArea() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const activeChat = document.getElementById('active-chat');

    if (welcomeScreen) welcomeScreen.style.display = 'flex';
    if (activeChat) activeChat.style.display = 'none';
}

function showSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backBtn = document.getElementById('back-btn');

    if (sidebar) sidebar.classList.remove('hide-mobile');
    if (backBtn) backBtn.style.display = 'none';
}

function hideSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backBtn = document.getElementById('back-btn');

    if (sidebar) sidebar.classList.add('hide-mobile');
    if (backBtn) backBtn.style.display = 'block';
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function updateBadges() {
    // Update chats badge
    const chatsBadge = document.getElementById('chats-badge');
    const totalUnread = Array.from(STATE.unreadCounts.values()).reduce((a, b) => a + b, 0);
    if (chatsBadge) {
        chatsBadge.textContent = totalUnread;
        chatsBadge.style.display = totalUnread > 0 ? 'flex' : 'none';
    }

    // Update groups badge
    const groupsBadge = document.getElementById('groups-badge');
    const totalGroupUnread = Array.from(STATE.groupUnreadCounts.values()).reduce((a, b) => a + b, 0);
    if (groupsBadge) {
        groupsBadge.textContent = totalGroupUnread;
        groupsBadge.style.display = totalGroupUnread > 0 ? 'flex' : 'none';
    }

    // Update notifications badge
    const notificationsBadge = document.getElementById('notifications-badge');
    const unreadNotifications = STATE.notifications.filter(n => !n.read).length;
    if (notificationsBadge) {
        notificationsBadge.textContent = unreadNotifications;
        notificationsBadge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    }
}

// ==================== MODALS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ==================== CONTEXT MENU ====================
function showContextMenu(event, message) {
    event.preventDefault();

    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;

    contextMenu.style.display = 'block';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';

    contextMenu.dataset.messageId = message.id;
}

function handleContextMenuAction(action) {
    const contextMenu = document.getElementById('context-menu');
    const messageId = contextMenu?.dataset.messageId;

    if (!messageId) return;

    switch (action) {
        case 'reply':
            replyToMessage(messageId);
            break;
        case 'forward':
            forwardMessage(messageId);
            break;
        case 'copy':
            copyMessage(messageId);
            break;
        case 'star':
            starMessage(messageId);
            break;
        case 'info':
            showMessageInfo(messageId);
            break;
        case 'delete':
            deleteMessage(messageId);
            break;
    }
}

function replyToMessage(messageId) {
    // TODO: Implement reply functionality
    console.log('Reply to message:', messageId);
    showToast('Info', 'Reply feature coming soon', 'info');
}

function forwardMessage(messageId) {
    // TODO: Implement forward functionality
    console.log('Forward message:', messageId);
    showToast('Info', 'Forward feature coming soon', 'info');
}

function copyMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    const messageText = messageEl?.querySelector('.message-text')?.textContent;

    if (messageText) {
        navigator.clipboard.writeText(messageText).then(() => {
            showToast('Success', 'Message copied to clipboard', 'success');
        }).catch(() => {
            showToast('Error', 'Failed to copy message', 'error');
        });
    }
}

function starMessage(messageId) {
    // TODO: Implement star functionality
    console.log('Star message:', messageId);
    showToast('Info', 'Star feature coming soon', 'info');
}

function showMessageInfo(messageId) {
    // TODO: Implement message info
    console.log('Show message info:', messageId);
    showToast('Info', 'Message info feature coming soon', 'info');
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
        const token = getAuthToken();
        const response = await fetch(`${CONFIG.API_BASE_URL}/chat/message/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete message');

        // Remove from local state
        if (STATE.selectedContact) {
            const messages = STATE.messages.get(STATE.selectedContact.email) || [];
            const filtered = messages.filter(m => m.id !== messageId);
            STATE.messages.set(STATE.selectedContact.email, filtered);
        } else if (STATE.selectedGroup) {
            const messages = STATE.groupMessages.get(STATE.selectedGroup.id) || [];
            const filtered = messages.filter(m => m.id !== messageId);
            STATE.groupMessages.set(STATE.selectedGroup.id, filtered);
        }

        renderMessages();
        showToast('Success', 'Message deleted', 'success');

    } catch (error) {
        console.error('Error deleting message:', error);
        showToast('Error', 'Failed to delete message', 'error');
    }
}

// ==================== MEDIA VIEWER ====================
function viewMedia(url, type) {
    // TODO: Implement full media viewer
    window.open(url, '_blank');
}

async function downloadFile(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error('Error downloading file:', error);
        showToast('Error', 'Failed to download file', 'error');
    }
}

// ==================== LOGOUT ====================
function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        // Send offline status
        sendUserStatus('OFFLINE');

        // Disconnect WebSocket
        if (STATE.stompClient) {
            STATE.stompClient.disconnect();
        }

        // Clear session
        const sessionHandler = UserSessionHandler.getInstance();
        sessionHandler.logout();

        // Clear local state
        STATE.messages.clear();
        STATE.groupMessages.clear();

        // Redirect to login
        window.location.href = '/login.html';

    } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = '/login.html';
    }
}







function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 day
    if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    // More than 7 days
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(title, message, type = 'info') {
    const container = document.getElementById('notification-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${iconMap[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ==================== EXPORTS (for testing) ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STATE,
        CONFIG,
        loadContacts,
        loadGroups,
        sendMessage,
        formatMessageTime,
        formatFileSize,
        escapeHtml
    };
}










function renderContacts() {
    const contactsList = document.getElementById('contacts-list');
    if (!contactsList) return;

    const filteredContacts = STATE.contacts.filter(contact => {
        if (!STATE.searchQuery) return true;
        const query = STATE.searchQuery.toLowerCase();
        return contact.fullName.toLowerCase().includes(query) ||
               contact.email.toLowerCase().includes(query) ||
               contact.role.toLowerCase().includes(query);
    });

    if (filteredContacts.length === 0) {
        contactsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <p>No contacts found</p>
                <span>${STATE.searchQuery ? 'Try a different search' : 'Start chatting with your colleagues'}</span>
            </div>
        `;
        return;
    }

    contactsList.innerHTML = '';
    filteredContacts.forEach(contact => {
        const contactElement = createContactElement(contact);
        contactsList.appendChild(contactElement);
    });
}



function createContactElement(contact) {
    const div = document.createElement('div');
    div.className = 'contact';
    div.dataset.userId = contact.id;
    div.dataset.userEmail = contact.email;

    const isOnline = STATE.onlineUsers.has(contact.email);
    const unreadCount = STATE.unreadCounts.get(contact.email) || 0;

    // ✅ FIXED: Utiliser la vraie photo de profil ou générer des initiales
    const avatarContent = contact.profileImageUrl && contact.profileImageUrl.trim() !== '' && contact.profileImageUrl !== 'images/unt-logo.png'
        ? `<img src="${contact.profileImageUrl}" alt="${escapeHtml(contact.fullName)}" class="avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="avatar-initials" style="display: none;">${getInitials(contact.fullName)}</div>`
        : `<div class="avatar-initials">${getInitials(contact.fullName)}</div>`;

    div.innerHTML = `
        <div class="contact-avatar-container">
            ${avatarContent}
            <span class="online-indicator ${isOnline ? 'online' : 'offline'}"></span>
        </div>
        <div class="contact-info">
            <div class="contact-header">
                <h4 class="contact-name">${escapeHtml(contact.fullName)}</h4>
                <span class="contact-time"></span>
            </div>
            <div class="contact-footer">
                <span class="contact-role-badge ${contact.role.toLowerCase()}">${formatRole(contact.role)}</span>
                ${unreadCount > 0 ? `<span class="contact-unread">${unreadCount}</span>` : ''}
            </div>
        </div>
    `;

    div.addEventListener('click', () => selectContact(contact));
    return div;
}



async function selectContact(contact) {
    console.log('👤 Selecting contact:', contact.fullName);

    STATE.selectedContact = contact;
    STATE.selectedGroup = null;

    // Update active state
    document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.group-item').forEach(el => el.classList.remove('active'));

    const contactEl = document.querySelector(`[data-user-email="${contact.email}"]`);
    if (contactEl) contactEl.classList.add('active');

    // Show chat area
    showChatArea();

    // Update chat header
    updateChatHeader(contact);

    // Load chat history
    await loadChatHistory(contact.email);

    // Mark messages as read
    STATE.unreadCounts.set(contact.email, 0);
    renderContacts();
    updateBadges();

    // Focus message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) messageInput.focus();

    // Mobile: hide sidebar
    if (window.innerWidth <= 768) {
        hideSidebar();
    }
}



function updateChatHeader(contact) {
    const chatPartnerName = document.getElementById('chat-partner-name');
    const chatPartnerAvatar = document.getElementById('chat-partner-avatar');
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');

    if (chatPartnerName) chatPartnerName.textContent = contact.fullName;

    // ✅ FIXED: Utiliser la vraie photo de profil
    if (chatPartnerAvatar) {
        if (contact.profileImageUrl && contact.profileImageUrl.trim() !== '' && contact.profileImageUrl !== 'images/unt-logo.png') {
            chatPartnerAvatar.src = contact.profileImageUrl;
            chatPartnerAvatar.style.display = 'block';
            chatPartnerAvatar.onerror = function() {
                this.style.display = 'none';
                this.parentElement.innerHTML = `<div class="avatar-initials chat-partner-avatar">${getInitials(contact.fullName)}</div>`;
            };
        } else {
            chatPartnerAvatar.style.display = 'none';
            chatPartnerAvatar.parentElement.innerHTML = `<div class="avatar-initials chat-partner-avatar">${getInitials(contact.fullName)}</div>`;
        }
    }

    const isOnline = STATE.onlineUsers.has(contact.email);
    if (statusText) statusText.textContent = isOnline ? 'online' : 'offline';
    if (statusIndicator) {
        statusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
    }
}






// ==================== GROUPS MANAGEMENT ====================
async function loadGroups() {
    try {
        console.log('👥 Loading groups...');

        const token = await getAuthTokenWithFallback();
        const headers = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/groups`, {
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401 && token) {
                console.warn('⚠️ Token expired, attempting refresh...');
                const newToken = await retrieveTokenFromServer();
                if (newToken) {
                    return await loadGroups(); // Retry with new token
                }
            }
            throw new Error('Failed to load groups');
        }

        STATE.groups = await response.json();
        console.log(`✅ Loaded ${STATE.groups.length} groups`);
        renderGroups();
        updateBadges();
    } catch (error) {
        console.error('Error loading groups:', error);
        showToast('Error', 'Failed to load groups', 'error');
    }
}








// ==================== MESSAGES MANAGEMENT ====================
async function loadChatHistory(recipientEmail) {
    try {
        console.log('💬 Loading chat history with:', recipientEmail);

        const token = getAuthToken();
        if (!token) return;

        const url = `${CONFIG.API_BASE_URL}/chat/history/${recipientEmail}?page=0&size=${CONFIG.MESSAGE_LOAD_SIZE}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load chat history');

        const messages = await response.json();
        STATE.messages.set(recipientEmail, messages);

        console.log(`✅ Loaded ${messages.length} messages`);
        renderMessages();

    } catch (error) {
        console.error('Error loading chat history:', error);
        showToast('Error', 'Failed to load chat history', 'error');
    }
}



async function loadChatHistory(recipientEmail) {
    try {
        console.log('💬 Loading chat history with:', recipientEmail);

        // Get current user email
        const currentUserEmail = STATE.currentUser.email;
        if (!currentUserEmail) {
            console.error('❌ No current user found');
            return;
        }

        console.log('👤 Current user:', currentUserEmail);
        console.log('👤 Recipient:', recipientEmail);

        // Get token
        const token = getAuthToken();
        if (!token) {
            console.warn('⚠️ No authentication token found');
            showToast('Warning', 'Please login again', 'warning');
            return;
        }

        // Build URL - IMPORTANT: Use current user as sender and recipientEmail as recipient
        const url = `${CONFIG.API_BASE_URL}/chat/history/${encodeURIComponent(recipientEmail)}?page=0&size=${CONFIG.MESSAGE_LOAD_SIZE}`;

        console.log('📡 Request URL:', url);
        console.log('📡 Headers:', {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        // Make request
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Request failed:', response.status, errorText);

            if (response.status === 401) {
                showToast('Error', 'Session expired. Please refresh.', 'error');
                return;
            }

            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Parse response
        const messages = await response.json();
        console.log(`✅ Loaded ${messages.length} messages`);

        // ✅ CRITICAL: Save messages for BOTH directions
        // Store with recipientEmail as key (conversation identifier)
        STATE.messages.set(recipientEmail, messages);

        // Also store in reverse direction for consistency
        STATE.messages.set(currentUserEmail, messages);

        console.log('💾 Messages stored for conversation:', recipientEmail);

        // Render messages
        renderMessages();

    } catch (error) {
        console.error('❌ Error loading chat history:', error);
        showToast('Error', 'Could not load messages. Please try again.', 'error');

        // Initialize empty chat anyway
        if (recipientEmail) {
            STATE.messages.set(recipientEmail, []);
            renderMessages();
        }
    }
}






function renderMessages() {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) {
        console.error('❌ Messages container not found');
        return;
    }

    console.log('🎨 Rendering messages...');

    let messages = [];
    let conversationKey = '';

    if (STATE.selectedContact) {
        conversationKey = STATE.selectedContact.email;
        messages = STATE.messages.get(conversationKey) || [];
        console.log('   Contact conversation:', conversationKey);
        console.log('   Messages found:', messages.length);
    } else if (STATE.selectedGroup) {
        conversationKey = STATE.selectedGroup.id.toString();
        messages = STATE.groupMessages.get(conversationKey) || [];
        console.log('   Group conversation:', conversationKey);
        console.log('   Messages found:', messages.length);
    } else {
        console.warn('⚠️ No conversation selected');
        messagesContainer.innerHTML = `
            <div class="empty-messages">
                <i class="fas fa-comments"></i>
                <p>Select a conversation</p>
                <span>Choose a contact or group to start messaging</span>
            </div>
        `;
        return;
    }

    // Clear container
    messagesContainer.innerHTML = '';

    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-messages">
                <i class="fas fa-comments"></i>
                <p>No messages yet</p>
                <span>Start the conversation!</span>
            </div>
        `;
        return;
    }

    // ✅ Sort messages by timestamp (oldest to newest)
    const sortedMessages = [...messages].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const timeB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return timeA - timeB; // Ascending order for display
    });

    console.log(`   Rendering ${sortedMessages.length} sorted messages`);

    // Group messages by date
    const groupedMessages = groupMessagesByDate(sortedMessages);

    // Render each day's messages
    Object.keys(groupedMessages).forEach(date => {
        // Add date separator
        const dateDiv = document.createElement('div');
        dateDiv.className = 'message-date-separator';
        dateDiv.textContent = formatDateForDisplay(date);
        messagesContainer.appendChild(dateDiv);

        // Render messages for this date
        groupedMessages[date].forEach((message, index) => {
            const messageElement = createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
    });

    console.log('✅ Messages rendered successfully');

    // Scroll to bottom after a short delay
    setTimeout(() => {
        scrollToBottom();
    }, 100);
}

function groupMessagesByDate(messages) {
    const grouped = {};

    messages.forEach(message => {
        if (!message.timestamp) return;

        const date = new Date(message.timestamp);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }

        grouped[dateKey].push(message);
    });

    return grouped;
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}






function createMessageElement(message) {
    const div = document.createElement('div');

    // Determine if message is sent by current user
    const isSent = message.senderId === STATE.currentUser.email;

    div.className = `message ${isSent ? 'sent' : 'received'}`;
    div.dataset.messageId = message.id;
    div.dataset.senderId = message.senderId;
    div.dataset.timestamp = message.timestamp;

    // Format content based on message type
    let contentHtml = '';

    if (message.type === 'IMAGE' && message.fileUrl) {
        contentHtml = `
            <div class="message-media">
                <img src="${message.fileUrl}"
                     alt="Image"
                     class="message-image"
                     onclick="viewMedia('${message.fileUrl}', 'image')"
                     onerror="this.src='images/default-image.png'">
            </div>
        `;
    } else if (message.type === 'FILE' && message.fileUrl) {
        const fileIcon = getFileIcon(message.fileName);
        contentHtml = `
            <div class="message-file" onclick="downloadFile('${message.fileUrl}', '${message.fileName}')">
                <div class="file-icon">
                    <i class="fas fa-${fileIcon}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${escapeHtml(message.fileName || 'File')}</div>
                    <div class="file-size">${formatFileSize(message.fileSize)}</div>
                </div>
                <button class="download-btn">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `;
    } else {
        // Regular text message
        contentHtml = `<div class="message-text">${escapeHtml(message.content || '')}</div>`;
    }

    // Format time
    const time = message.timestamp ? formatMessageTime(message.timestamp) : 'Just now';

    // Status indicator for sent messages
    let statusHtml = '';
    if (isSent) {
        if (message.read) {
            statusHtml = '<span class="message-status read"><i class="fas fa-check-double"></i></span>';
        } else if (message.status === 'DELIVERED') {
            statusHtml = '<span class="message-status delivered"><i class="fas fa-check-double"></i></span>';
        } else {
            statusHtml = '<span class="message-status sent"><i class="fas fa-check"></i></span>';
        }
    }

    // If group message, show sender name
    let senderHtml = '';
    if (STATE.selectedGroup && !isSent) {
        const senderName = message.senderName ||
                          message.senderId.split('@')[0] ||
                          'Unknown User';
        senderHtml = `<div class="message-sender">${escapeHtml(senderName)}</div>`;
    }

    div.innerHTML = `
        ${senderHtml}
        <div class="message-content">
            ${contentHtml}
            <div class="message-footer">
                <span class="message-time">${time}</span>
                ${statusHtml}
            </div>
        </div>
    `;

    // Add context menu
    div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, message);
    });

    return div;
}





function getMessageStatus(message) {
    if (message.read) {
        return '<span class="message-status read"><i class="fas fa-check-double"></i></span>';
    } else if (message.status === 'DELIVERED') {
        return '<span class="message-status delivered"><i class="fas fa-check-double"></i></span>';
    } else {
        return '<span class="message-status sent"><i class="fas fa-check"></i></span>';
    }
}

function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'xls': 'excel',
        'xlsx': 'excel',
        'ppt': 'powerpoint',
        'pptx': 'powerpoint',
        'txt': 'alt',
        'zip': 'archive',
        'rar': 'archive'
    };
    return iconMap[ext] || 'alt';
}

async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    const content = messageInput.value.trim();
    if (!content) return;

    if (!STATE.selectedContact && !STATE.selectedGroup) {
        showToast('Error', 'Please select a contact or group', 'error');
        return;
    }

    try {
        const message = {
            content: content,
            senderId: STATE.currentUser.email,
            timestamp: new Date().toISOString(),
            type: 'CHAT',
            read: false
        };

        if (STATE.selectedContact) {
            message.recipientId = STATE.selectedContact.email;
        } else if (STATE.selectedGroup) {
            message.groupId = STATE.selectedGroup.id;
        }

        // Send via WebSocket if connected
        if (STATE.stompClient && STATE.stompClient.connected) {
            const destination = STATE.selectedGroup ? '/app/chat.group' : '/app/chat.private';
            STATE.stompClient.send(destination, {}, JSON.stringify(message));
        } else {
            // Fallback to REST API
            await sendMessageViaAPI(message);
        }

        // Clear input
        messageInput.value = '';
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) sendBtn.disabled = true;
        messageInput.style.height = 'auto';

        // Add to local messages optimistically
        addMessageToLocal(message);

        // Stop typing indicator
        sendTypingIndicator(false);

    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Error', 'Failed to send message', 'error');
    }
}

async function sendMessageViaAPI(message) {
    const token = getAuthToken();
    if (!token) return;

    const endpoint = message.groupId ?
        `${CONFIG.API_BASE_URL}/groups/${message.groupId}/messages` :
        `${CONFIG.API_BASE_URL}/chat/send`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(message)
    });

    if (!response.ok) throw new Error('Failed to send message');

    return await response.json();
}






function addMessageToLocal(message) {
    console.log('📥 Adding message to local state:', {
        id: message.id,
        sender: message.senderId,
        recipient: message.recipientId,
        content: message.content?.substring(0, 50),
        type: message.type
    });

    try {
        let conversationKey = '';
        let isCurrentConversation = false;

        // Determine conversation type and key
        if (STATE.selectedContact) {
            const currentUserEmail = STATE.currentUser.email;
            const contactEmail = STATE.selectedContact.email;

            // Check if message belongs to current conversation
            const isFromContactToUser = message.senderId === contactEmail && message.recipientId === currentUserEmail;
            const isFromUserToContact = message.senderId === currentUserEmail && message.recipientId === contactEmail;

            isCurrentConversation = isFromContactToUser || isFromUserToContact;
            conversationKey = contactEmail;

        } else if (STATE.selectedGroup && message.groupId) {
            isCurrentConversation = message.groupId === STATE.selectedGroup.id;
            conversationKey = STATE.selectedGroup.id.toString();
        }

        // If message belongs to current conversation, add it
        if (isCurrentConversation && conversationKey) {
            let messages = [];

            if (STATE.selectedContact) {
                messages = STATE.messages.get(conversationKey) || [];
            } else if (STATE.selectedGroup) {
                messages = STATE.groupMessages.get(conversationKey) || [];
            }

            // Check for duplicates
            const isDuplicate = messages.some(m =>
                m.id === message.id ||
                (m.senderId === message.senderId &&
                 m.recipientId === message.recipientId &&
                 m.content === message.content &&
                 Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 1000)
            );

            if (!isDuplicate) {
                messages.push(message);

                // Sort by timestamp
                messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                // Store updated messages
                if (STATE.selectedContact) {
                    STATE.messages.set(conversationKey, messages);
                } else if (STATE.selectedGroup) {
                    STATE.groupMessages.set(conversationKey, messages);
                }

                console.log('✅ Message added to local state');

                // Re-render messages
                renderMessages();

                // Update unread count
                updateMessageReadStatus(message);
            } else {
                console.log('ℹ️ Message already exists, skipping');
            }
        } else {
            console.log('⚠️ Message not for current conversation, storing for later');
            // Store for future reference
            storeMessageForLater(message);
        }

    } catch (error) {
        console.error('❌ Error adding message to local state:', error);
    }
}

function updateMessageReadStatus(message) {
    // If message is received and not read, increment unread count
    if (message.senderId !== STATE.currentUser.email && !message.read) {
        const unreadCount = STATE.unreadCounts.get(message.senderId) || 0;
        STATE.unreadCounts.set(message.senderId, unreadCount + 1);
        updateBadges();
        renderContacts();
    }
}

function storeMessageForLater(message) {
    // Store messages from other conversations for quick access
    const key = message.groupId ? `group_${message.groupId}` : message.senderId;
    const stored = JSON.parse(localStorage.getItem('unt_chat_storage') || '{}');

    if (!stored[key]) {
        stored[key] = [];
    }

    // Keep only last 50 messages per conversation
    stored[key].push(message);
    if (stored[key].length > 50) {
        stored[key] = stored[key].slice(-50);
    }

    localStorage.setItem('unt_chat_storage', JSON.stringify(stored));
}

function handleMessageInput(event) {
    const input = event.target;
    const sendBtn = document.getElementById('send-btn');

    // Enable/disable send button
    if (sendBtn) {
        sendBtn.disabled = input.value.trim() === '';
    }

    // Auto-resize textarea
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';

    // Send typing indicator
    if (input.value.trim()) {
        sendTypingIndicator(true);

        // Clear previous timeout
        if (STATE.typingTimeouts.has('typing')) {
            clearTimeout(STATE.typingTimeouts.get('typing'));
        }

        // Set new timeout to stop typing indicator
        const timeout = setTimeout(() => {
            sendTypingIndicator(false);
        }, CONFIG.TYPING_TIMEOUT);

        STATE.typingTimeouts.set('typing', timeout);
    } else {
        sendTypingIndicator(false);
    }
}

function handleMessageKeydown(event) {
    const enterSendEnabled = localStorage.getItem('chat-setting-enterSend') !== 'false';

    if (event.key === 'Enter' && !event.shiftKey && enterSendEnabled) {
        event.preventDefault();
        sendMessage();
    }
}

function sendTypingIndicator(isTyping) {
    if (!STATE.stompClient || !STATE.stompClient.connected) return;

    if (STATE.selectedContact) {
        STATE.stompClient.send('/app/message.typing', {}, JSON.stringify({
            senderId: STATE.currentUser.email,
            recipientId: STATE.selectedContact.email,
            isTyping: isTyping
        }));
    } else if (STATE.selectedGroup) {
        STATE.stompClient.send('/app/group.typing', {}, JSON.stringify({
            senderId: STATE.currentUser.email,
            groupId: STATE.selectedGroup.id,
            isTyping: isTyping
        }));
    }
}

// ==================== FILE HANDLING ====================
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showToast('Error', 'File size must be less than 10MB', 'error');
        return;
    }

    // Validate file type
    if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
        showToast('Error', 'File type not supported', 'error');
        return;
    }

    if (!STATE.selectedContact && !STATE.selectedGroup) {
        showToast('Error', 'Please select a contact or group', 'error');
        return;
    }

    try {
        showToast('Info', 'Uploading file...', 'info');

        const formData = new FormData();
        formData.append('file', file);

        if (STATE.selectedContact) {
            formData.append('recipientId', STATE.selectedContact.email);
        } else if (STATE.selectedGroup) {
            formData.append('groupId', STATE.selectedGroup.id);
        }

        const token = getAuthToken();
        const endpoint = STATE.selectedGroup ?
            `${CONFIG.API_BASE_URL}/groups/${STATE.selectedGroup.id}/upload-media` :
            `${CONFIG.API_BASE_URL}/chat/upload-media`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload file');

        const message = await response.json();
        addMessageToLocal(message);

        showToast('Success', 'File sent successfully', 'success');

    } catch (error) {
        console.error('Error uploading file:', error);
        showToast('Error', 'Failed to upload file', 'error');
    } finally {
        event.target.value = '';
    }
}

async function handleProfilePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Error', 'Please select an image file', 'error');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showToast('Error', 'Image size must be less than 2MB', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const token = getAuthToken();
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/users/upload-profile-image/${STATE.currentUser.id}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }
        );

        if (!response.ok) throw new Error('Failed to upload photo');

        const result = await response.json();

        // Update UI
        document.getElementById('current-user-avatar').src = result.imageUrl;
        document.getElementById('profile-photo-large').src = result.imageUrl;

        // Update session
        STATE.currentUser.profileImageUrl = result.imageUrl;
        const sessionHandler = UserSessionHandler.getInstance();
        sessionHandler.updateUserProfile({ profileImageUrl: result.imageUrl });

        showToast('Success', 'Profile photo updated', 'success');

    } catch (error) {
        console.error('Error uploading profile photo:', error);
        showToast('Error', 'Failed to update profile photo', 'error');
    } finally {
        event.target.value = '';
    }
}

// ✅ Send user online/offline status
function sendUserStatus(status) {
    if (!STATE.stompClient || !STATE.stompClient.connected) {
        console.warn('⚠️ Cannot send status: WebSocket not connected');
        return;
    }

    try {
        STATE.stompClient.send(
            '/app/user.' + status.toLowerCase(),
            {},
            JSON.stringify({
                userId: STATE.currentUser.email,
                status: status,
                timestamp: new Date().toISOString()
            })
        );
        console.log(`✅ Sent user status: ${status}`);
    } catch (error) {
        console.error('❌ Error sending user status:', error);
    }
}

// ✅ Graceful disconnect
function disconnectWebSocket() {
    if (STATE.stompClient) {
        try {
            sendUserStatus('OFFLINE');
            STATE.stompClient.disconnect(() => {
                console.log('👋 WebSocket disconnected');
                updateConnectionStatus(false);
            });
        } catch (error) {
            console.error('❌ Error disconnecting WebSocket:', error);
        }
    }
}

// ✅ Handle beforeunload
window.addEventListener('beforeunload', () => {
    disconnectWebSocket();
})






// ==================== NOTIFICATIONS ====================
async function loadNotifications() {
    try {
        const token = await getAuthTokenWithFallback();
        if (!token) {
            console.log('⚠️ Skipping notifications - no token available');
            return;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/chat/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        STATE.notifications = await response.json();
        renderNotifications();
        updateBadges();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function renderNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) return;

    if (STATE.notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell"></i>
                <p>No notifications</p>
                <span>You're all caught up!</span>
            </div>
        `;
        return;
    }

    notificationsList.innerHTML = '';
    STATE.notifications.forEach(notif => {
        const notifElement = createNotificationElement(notif);
        notificationsList.appendChild(notifElement);
    });
}

function createNotificationElement(notif) {
    const div = document.createElement('div');
    div.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
    div.dataset.notificationId = notif.id;

    div.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${escapeHtml(notif.title)}</div>
            <div class="notification-message">${escapeHtml(notif.message)}</div>
            <div class="notification-time">${formatMessageTime(notif.timestamp)}</div>
        </div>
        ${!notif.read ? '<span class="notification-badge"></span>' : ''}
    `;

    div.addEventListener('click', () => markNotificationAsRead(notif.id));

    return div;
}

function getNotificationIcon(type) {
    const iconMap = {
        'MESSAGE': 'comment',
        'GROUP': 'users',
        'SYSTEM': 'info-circle',
        'WARNING': 'exclamation-triangle',
        'SUCCESS': 'check-circle'
    };
    return iconMap[type] || 'bell';
}

async function markNotificationAsRead(notificationId) {
    try {
        const token = getAuthToken();
        await fetch(`${CONFIG.API_BASE_URL}/chat/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const notif = STATE.notifications.find(n => n.id === notificationId);
        if (notif) {
            notif.read = true;
            renderNotifications();
            updateBadges();
        }

    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

function showDesktopNotification(title, body) {
    const desktopNotificationsEnabled = localStorage.getItem('chat-setting-desktopNotifications') === 'true';

    if (!desktopNotificationsEnabled) return;

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'images/unt-logo.png',
            badge: 'images/unt-logo.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: 'images/unt-logo.png'
                });
            }
        });
    }
}

// ==================== SEARCH & FILTER ====================
function handleSearch(event) {
    STATE.searchQuery = event.target.value;

    const searchClearBtn = document.getElementById('search-clear-btn');
    if (searchClearBtn) {
        searchClearBtn.style.display = STATE.searchQuery ? 'block' : 'none';
    }

    filterCurrentView();
}

function filterCurrentView() {
    switch (STATE.currentTab) {
        case 'chats':
            renderContacts();
            break;
        case 'groups':
            renderGroups();
            break;
        case 'notifications':
            // Notifications don't need filtering for now
            break;
    }
}

// ==================== UI HELPERS ====================
function showChatArea() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const activeChat = document.getElementById('active-chat');

    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (activeChat) activeChat.style.display = 'flex';
}

function hideChatArea() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const activeChat = document.getElementById('active-chat');

    if (welcomeScreen) welcomeScreen.style.display = 'flex';
    if (activeChat) activeChat.style.display = 'none';
}

function showSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backBtn = document.getElementById('back-btn');

    if (sidebar) sidebar.classList.remove('hide-mobile');
    if (backBtn) backBtn.style.display = 'none';
}

function hideSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backBtn = document.getElementById('back-btn');

    if (sidebar) sidebar.classList.add('hide-mobile');
    if (backBtn) backBtn.style.display = 'block';
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function updateBadges() {
    // Update chats badge
    const chatsBadge = document.getElementById('chats-badge');
    const totalUnread = Array.from(STATE.unreadCounts.values()).reduce((a, b) => a + b, 0);
    if (chatsBadge) {
        chatsBadge.textContent = totalUnread;
        chatsBadge.style.display = totalUnread > 0 ? 'flex' : 'none';
    }

    // Update groups badge
    const groupsBadge = document.getElementById('groups-badge');
    const totalGroupUnread = Array.from(STATE.groupUnreadCounts.values()).reduce((a, b) => a + b, 0);
    if (groupsBadge) {
        groupsBadge.textContent = totalGroupUnread;
        groupsBadge.style.display = totalGroupUnread > 0 ? 'flex' : 'none';
    }

    // Update notifications badge
    const notificationsBadge = document.getElementById('notifications-badge');
    const unreadNotifications = STATE.notifications.filter(n => !n.read).length;
    if (notificationsBadge) {
        notificationsBadge.textContent = unreadNotifications;
        notificationsBadge.style.display = unreadNotifications > 0 ? 'flex' : 'none';
    }
}

// ==================== MODALS ====================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ==================== CONTEXT MENU ====================
function showContextMenu(event, message) {
    event.preventDefault();

    const contextMenu = document.getElementById('context-menu');
    if (!contextMenu) return;

    contextMenu.style.display = 'block';
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';

    contextMenu.dataset.messageId = message.id;
}

function handleContextMenuAction(action) {
    const contextMenu = document.getElementById('context-menu');
    const messageId = contextMenu?.dataset.messageId;

    if (!messageId) return;

    switch (action) {
        case 'reply':
            replyToMessage(messageId);
            break;
        case 'forward':
            forwardMessage(messageId);
            break;
        case 'copy':
            copyMessage(messageId);
            break;
        case 'star':
            starMessage(messageId);
            break;
        case 'info':
            showMessageInfo(messageId);
            break;
        case 'delete':
            deleteMessage(messageId);
            break;
    }
}

function replyToMessage(messageId) {
    console.log('Reply to message:', messageId);
    showToast('Info', 'Reply feature coming soon', 'info');
}

function forwardMessage(messageId) {
    console.log('Forward message:', messageId);
    showToast('Info', 'Forward feature coming soon', 'info');
}

function copyMessage(messageId) {
    const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
    const messageText = messageEl?.querySelector('.message-text')?.textContent;

    if (messageText) {
        navigator.clipboard.writeText(messageText).then(() => {
            showToast('Success', 'Message copied to clipboard', 'success');
        }).catch(() => {
            showToast('Error', 'Failed to copy message', 'error');
        });
    }
}

function starMessage(messageId) {
    console.log('Star message:', messageId);
    showToast('Info', 'Star feature coming soon', 'info');
}

function showMessageInfo(messageId) {
    console.log('Show message info:', messageId);
    showToast('Info', 'Message info feature coming soon', 'info');
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
        const token = getAuthToken();
        const response = await fetch(`${CONFIG.API_BASE_URL}/chat/message/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to delete message');

        // Remove from local state
        if (STATE.selectedContact) {
            const messages = STATE.messages.get(STATE.selectedContact.email) || [];
            const filtered = messages.filter(m => m.id !== messageId);
            STATE.messages.set(STATE.selectedContact.email, filtered);
        } else if (STATE.selectedGroup) {
            const messages = STATE.groupMessages.get(STATE.selectedGroup.id) || [];
            const filtered = messages.filter(m => m.id !== messageId);
            STATE.groupMessages.set(STATE.selectedGroup.id, filtered);
        }

        renderMessages();
        showToast('Success', 'Message deleted', 'success');

    } catch (error) {
        console.error('Error deleting message:', error);
        showToast('Error', 'Failed to delete message', 'error');
    }
}

// ==================== MEDIA VIEWER ====================
function viewMedia(url, type) {
    window.open(url, '_blank');
}

async function downloadFile(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error('Error downloading file:', error);
        showToast('Error', 'Failed to download file', 'error');
    }
}

// ==================== LOGOUT ====================
function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
        // Send offline status
        sendUserStatus('OFFLINE');

        // Disconnect WebSocket
        if (STATE.stompClient) {
            STATE.stompClient.disconnect();
        }

        // Clear session
        const sessionHandler = UserSessionHandler.getInstance();
        sessionHandler.logout();

        // Clear local state
        STATE.messages.clear();
        STATE.groupMessages.clear();

        // Redirect to login
        window.location.href = '/login.html';

    } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = '/login.html';
    }
}







// ==================== ENHANCED AUTHENTICATION TOKEN RETRIEVAL ====================

/**
 * Get authentication token from various storage locations
 * Priority order:
 * 1. JWT token from localStorage (unt_jwt_token)
 * 2. JWT token from sessionStorage
 * 3. Token from UserSessionHandler
 * 4. Fallback tokens (agriguard_jwt_token)
 * @returns {string|null} Authentication token or null if not found
 */
function getAuthToken() {
    try {
        console.log('🔍 Searching for authentication token...');

        // Priority 1: Check localStorage for UNT JWT token
        const untToken = localStorage.getItem('unt_jwt_token');
        if (untToken && untToken.trim() !== '') {
            console.log('✅ Found UNT JWT token in localStorage');
            return untToken.trim();
        }

        // Priority 2: Check sessionStorage for JWT token
        const sessionToken = sessionStorage.getItem('unt_jwt_token');
        if (sessionToken && sessionToken.trim() !== '') {
            console.log('✅ Found UNT JWT token in sessionStorage');
            return sessionToken.trim();
        }

        // Priority 3: Try to get token from UserSessionHandler
        try {
            const sessionHandler = UserSessionHandler.getInstance();
            const currentUser = sessionHandler.getCurrentUser();

            if (currentUser && currentUser.token && currentUser.token.trim() !== '') {
                console.log('✅ Found token in UserSessionHandler');
                return currentUser.token.trim();
            }

            // Check if token is stored separately in session
            if (currentUser && currentUser.userId) {
                const userToken = localStorage.getItem(`token_${currentUser.userId}`);
                if (userToken && userToken.trim() !== '') {
                    console.log('✅ Found user-specific token in localStorage');
                    return userToken.trim();
                }
            }
        } catch (sessionError) {
            console.warn('⚠️ Error accessing UserSessionHandler:', sessionError);
        }

        // Priority 4: Check for fallback tokens (AgriGuard compatibility)
        const agriguardToken = localStorage.getItem('agriguard_jwt_token');
        if (agriguardToken && agriguardToken.trim() !== '') {
            console.log('✅ Found AgriGuard JWT token in localStorage');
            return agriguardToken.trim();
        }

        // Priority 5: Check for generic JWT token
        const genericToken = localStorage.getItem('jwt_token') ||
                            sessionStorage.getItem('jwt_token');
        if (genericToken && genericToken.trim() !== '') {
            console.log('✅ Found generic JWT token');
            return genericToken.trim();
        }

        // Priority 6: Check for token in cookies
        const cookieToken = getTokenFromCookies();
        if (cookieToken && cookieToken.trim() !== '') {
            console.log('✅ Found token in cookies');
            return cookieToken.trim();
        }

        // Log all storage keys for debugging
        console.log('📦 Storage contents for debugging:');
        console.log('  localStorage keys:', Object.keys(localStorage));
        console.log('  sessionStorage keys:', Object.keys(sessionStorage));

        console.warn('⚠️ No authentication token found in any storage location');
        return null;

    } catch (error) {
        console.error('❌ Error retrieving authentication token:', error);
        return null;
    }
}

/**
 * Get token from cookies
 */
function getTokenFromCookies() {
    try {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith('unt_jwt_token=')) {
                return cookie.substring('unt_jwt_token='.length);
            } else if (cookie.startsWith('jwt_token=')) {
                return cookie.substring('jwt_token='.length);
            }
        }
        return null;
    } catch (error) {
        console.error('Error reading cookies:', error);
        return null;
    }
}

/**
 * Set authentication token in storage
 * Saves token to multiple locations for redundancy
 * @param {string} token - JWT authentication token
 */
function setAuthToken(token) {
    if (!token || !token.trim()) {
        console.error('❌ Cannot set empty token');
        return false;
    }

    try {
        const trimmedToken = token.trim();
        console.log('💾 Saving authentication token...');

        // Save to localStorage
        localStorage.setItem('unt_jwt_token', trimmedToken);
        console.log('  ✅ Saved to localStorage');

        // Save to sessionStorage
        sessionStorage.setItem('unt_jwt_token', trimmedToken);
        console.log('  ✅ Saved to sessionStorage');

        // Save to UserSessionHandler if available
        try {
            const sessionHandler = UserSessionHandler.getInstance();
            const currentUser = sessionHandler.getCurrentUser();

            if (currentUser) {
                // Update user profile with token
                sessionHandler.updateUserProfile({ token: trimmedToken });
                console.log('  ✅ Updated UserSessionHandler');

                // Also save user-specific token
                localStorage.setItem(`token_${currentUser.userId}`, trimmedToken);
                console.log('  ✅ Saved user-specific token');
            }
        } catch (sessionError) {
            console.warn('⚠️ Could not update token in UserSessionHandler:', sessionError);
        }

        // Save to cookie for compatibility
        document.cookie = `unt_jwt_token=${trimmedToken}; path=/; max-age=86400; samesite=lax`;
        console.log('  ✅ Saved to cookies');

        console.log('🎉 Authentication token saved successfully to all storage locations');
        return true;

    } catch (error) {
        console.error('❌ Error setting authentication token:', error);
        return false;
    }
}

/**
 * Retrieve token from server using current user credentials
 */
async function retrieveTokenFromServer() {
    try {
        console.log('🔐 Attempting to retrieve token from server...');

        const sessionHandler = UserSessionHandler.getInstance();
        const currentUser = sessionHandler.getCurrentUser();

        if (!currentUser || !currentUser.email) {
            console.error('❌ No current user found');
            return null;
        }

        console.log('👤 Current user email:', currentUser.email);

        // Try to get token from /api/auth/token endpoint
        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: currentUser.email
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.token) {
                console.log('✅ Token retrieved from server');
                setAuthToken(data.token);
                return data.token;
            }
        }

        console.warn('⚠️ Could not retrieve token from server');
        return null;

    } catch (error) {
        console.error('❌ Error retrieving token from server:', error);
        return null;
    }
}

/**
 * Get authentication token with fallback
 */
async function getAuthTokenWithFallback() {
    let token = getAuthToken();

    if (!token) {
        console.log('🔄 No token found, attempting to retrieve from server...');
        token = await retrieveTokenFromServer();
    }

    if (!token) {
        console.log('🔄 Still no token, checking if we can work without it...');

        // Check if we have user session
        const sessionHandler = UserSessionHandler.getInstance();
        const currentUser = sessionHandler.getCurrentUser();

        if (currentUser && currentUser.email) {
            console.log('✅ User session exists, WebSocket will use email header');
            return null; // Return null but allow WebSocket to use email header
        }
    }

    return token;
}
/**
 * Clear authentication token from all storage locations
 */
function clearAuthToken() {
    try {
        // Clear from localStorage
        localStorage.removeItem('unt_jwt_token');
        localStorage.removeItem('agriguard_jwt_token');
        localStorage.removeItem('jwt_token');

        // Clear from sessionStorage
        sessionStorage.removeItem('unt_jwt_token');
        sessionStorage.removeItem('jwt_token');

        // Clear user-specific tokens
        try {
            const sessionHandler = UserSessionHandler.getInstance();
            const currentUser = sessionHandler.getCurrentUser();

            if (currentUser && currentUser.userId) {
                localStorage.removeItem(`token_${currentUser.userId}`);
            }
        } catch (error) {
            console.warn('⚠️ Could not clear user-specific token:', error);
        }

        console.log('✅ Authentication token cleared successfully');
        return true;

    } catch (error) {
        console.error('❌ Error clearing authentication token:', error);
        return false;
    }
}

/**
 * Validate if token exists and is not expired
 * @param {string} token - JWT token to validate
 * @returns {boolean} True if token is valid
 */
function validateToken(token) {
    if (!token || !token.trim()) {
        return false;
    }

    try {
        // Basic JWT structure validation (header.payload.signature)
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid JWT token structure');
            return false;
        }

        // Decode payload to check expiration
        const payload = JSON.parse(atob(parts[1]));

        // Check if token has expiration
        if (payload.exp) {
            const expirationTime = payload.exp * 1000; // Convert to milliseconds
            const currentTime = Date.now();

            if (currentTime >= expirationTime) {
                console.error('❌ Token has expired');
                return false;
            }
        }

        return true;

    } catch (error) {
        console.error('❌ Error validating token:', error);
        return false;
    }
}

/**
 * Get token payload (decoded)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null
 */
function getTokenPayload(token) {
    try {
        if (!token) {
            token = getAuthToken();
        }

        if (!token) {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = JSON.parse(atob(parts[1]));
        return payload;

    } catch (error) {
        console.error('❌ Error decoding token payload:', error);
        return null;
    }
}

/**
 * Check if user is authenticated by validating token
 * @returns {boolean} True if user has valid authentication
 */
function isAuthenticated() {
    const token = getAuthToken();

    if (!token) {
        return false;
    }

    // Validate token structure and expiration
    if (!validateToken(token)) {
        // Clear invalid token
        clearAuthToken();
        return false;
    }

    // Also check UserSessionHandler
    try {
        const sessionHandler = UserSessionHandler.getInstance();
        return sessionHandler.isAuthenticated();
    } catch (error) {
        console.warn('⚠️ Could not check UserSessionHandler authentication:', error);
        // If session handler check fails, rely on token validation
        return true;
    }
}

/**
 * Enhanced authentication check with automatic redirect
 * @param {string} redirectUrl - URL to redirect to if not authenticated
 * @returns {boolean} True if authenticated
 */
function checkAuthenticationWithRedirect(redirectUrl = '/login.html') {
    if (!isAuthenticated()) {
        console.warn('⚠️ User not authenticated - redirecting to login');
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

/**
 * Get authorization header for API requests
 * @returns {object} Headers object with Authorization
 */
function getAuthHeaders() {
    const token = getAuthToken();

    if (!token) {
        console.error('❌ No token available for authorization header');
        return {};
    }

    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

/**
 * Make authenticated API request
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    // Merge authorization header with existing headers
    const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    // Handle 401 Unauthorized responses
    if (response.status === 401) {
        console.error('❌ Authentication failed - clearing token and redirecting');
        clearAuthToken();
        window.location.href = '/login.html';
        throw new Error('Authentication failed');
    }

    return response;
}



// ==================== UTILITY FUNCTIONS ====================

/**
 * Format user role for display
 * @param {string} role - User role enum value
 * @returns {string} Formatted role name
 */
function formatRole(role) {
    if (!role) return 'Unknown';

    const roleMap = {
        'ADMIN': 'Administrator',
        'LECTURER': 'Lecturer',
        'PARENT': 'Parent',
        'STUDENT': 'Student'
    };

    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

// ==================== EXPORT FUNCTIONS ====================

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.getAuthToken = getAuthToken;
    window.setAuthToken = setAuthToken;
    window.clearAuthToken = clearAuthToken;
    window.validateToken = validateToken;
    window.getTokenPayload = getTokenPayload;
    window.isAuthenticated = isAuthenticated;
    window.checkAuthenticationWithRedirect = checkAuthenticationWithRedirect;
    window.getAuthHeaders = getAuthHeaders;
    window.authenticatedFetch = authenticatedFetch;
}

console.log('✅ Enhanced authentication functions loaded successfully');

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 day
    if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    // More than 7 days
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(title, message, type = 'info') {
    const container = document.getElementById('notification-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${iconMap[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ==================== EXPORTS (for testing) ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STATE,
        CONFIG,
        loadContacts,
        loadGroups,
        sendMessage,
        formatMessageTime,
        formatFileSize,
        escapeHtml
    };
}

console.log('📱 WhatsApp-main.js loaded successfully');




function getFileIcon(fileName) {
    if (!fileName) return 'file';

    const extension = fileName.toLowerCase().split('.').pop();

    const iconMap = {
        'pdf': 'file-pdf',
        'doc': 'file-word',
        'docx': 'file-word',
        'xls': 'file-excel',
        'xlsx': 'file-excel',
        'ppt': 'file-powerpoint',
        'pptx': 'file-powerpoint',
        'txt': 'file-alt',
        'zip': 'file-archive',
        'rar': 'file-archive',
        'jpg': 'file-image',
        'jpeg': 'file-image',
        'png': 'file-image',
        'gif': 'file-image',
        'mp3': 'file-audio',
        'wav': 'file-audio',
        'mp4': 'file-video',
        'avi': 'file-video',
        'mov': 'file-video'
    };

    return iconMap[extension] || 'file';
}

function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else if (date.getFullYear() === today.getFullYear()) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    } else {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialization helper
async function initializeChat() {
    try {
        // Wait for user session to load
        while (!STATE.currentUser || !STATE.currentUser.email) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('✅ Chat initialized for user:', STATE.currentUser.email);

        // Load initial data
        await Promise.all([
            loadContacts(),
            loadGroups()
        ]);

        // Connect WebSocket
        connectWebSocket();

    } catch (error) {
        console.error('❌ Chat initialization error:', error);
    }
}

// Call this after DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await initializeChat();
});


// Ajouter à whatsapp-main.js
function diagnoseAuthentication() {
    console.log('🔍 DIAGNOSTIC D\'AUTHENTIFICATION');
    console.log('================================');

    // 1. Check UserSessionHandler
    try {
        const sessionHandler = UserSessionHandler.getInstance();
        const currentUser = sessionHandler.getCurrentUser();

        console.log('👤 UserSessionHandler:');
        console.log('  - User exists:', !!currentUser);
        if (currentUser) {
            console.log('  - Email:', currentUser.email);
            console.log('  - ID:', currentUser.id);
            console.log('  - Token in session:', !!currentUser.token);
            console.log('  - Role:', currentUser.role);
        }
    } catch (error) {
        console.error('  ❌ Error accessing UserSessionHandler:', error);
    }

    // 2. Check localStorage
    console.log('📦 localStorage:');
    const localStorageKeys = Object.keys(localStorage);
    console.log('  - Total keys:', localStorageKeys.length);

    const tokenKeys = localStorageKeys.filter(key =>
        key.includes('jwt') || key.includes('token') || key.includes('unt_')
    );

    console.log('  - Token-related keys:', tokenKeys);
    tokenKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`    - ${key}: ${value ? 'Exists' : 'Empty'} (${value?.length || 0} chars)`);
        if (value && key.includes('jwt')) {
            try {
                const parts = value.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    console.log(`      - Payload:`, {
                        email: payload.email || payload.sub,
                        exp: payload.exp ? new Date(payload.exp * 1000) : 'No expiration'
                    });
                }
            } catch (e) {
                console.log(`      - Invalid JWT format`);
            }
        }
    });

    // 3. Check sessionStorage
    console.log('💾 sessionStorage:');
    const sessionStorageKeys = Object.keys(sessionStorage);
    console.log('  - Total keys:', sessionStorageKeys.length);

    const sessionTokenKeys = sessionStorageKeys.filter(key =>
        key.includes('jwt') || key.includes('token') || key.includes('unt_')
    );

    console.log('  - Token-related keys:', sessionTokenKeys);

    // 4. Check cookies
    console.log('🍪 Cookies:');
    console.log('  - Document cookie:', document.cookie);

    // 5. Test API connection
    console.log('🌐 API Connection Test:');
    fetch(`${CONFIG.API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: STATE.currentUser?.email || 'test@test.com' })
    })
    .then(response => {
        console.log('  - Token endpoint status:', response.status);
        return response.text();
    })
    .then(text => {
        console.log('  - Response:', text.substring(0, 100) + '...');
    })
    .catch(error => {
        console.log('  - Error:', error.message);
    });

    console.log('================================');
}

// Appeler cette fonction pour déboguer
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        diagnoseAuthentication();
    }, 2000);
});