// ============================================================================
// UNT STAFF CHAT - COMPLETE GROUP IMPLEMENTATION
// Full WhatsApp-like Group Chat with Role-Based System Groups
// ============================================================================

// ==================== ENHANCED GLOBAL STATE ====================
const GROUP_STATE = {
    systemGroups: {
        staffGroup: null,
        adminParentGroup: null,
        allStaffGroup: null
    },
    userGroups: [],
    currentGroup: null,
    groupMessages: new Map(),
    groupUnreadCounts: new Map(),
    groupTypingUsers: new Map()
};

// ==================== SYSTEM GROUPS INITIALIZATION ====================

async function initializeSystemGroups() {
    try {
        console.log('🚀 Initializing system groups...');

        const currentUser = STATE.currentUser;
        if (!currentUser) {
            console.error('❌ No current user found');
            return;
        }

        const userRole = currentUser.role;
        console.log('👤 User role:', userRole);

        if (userRole === 'ADMIN') {
            await createSystemGroups();
        }

        await loadRoleBasedGroups();

        console.log('✅ System groups initialized successfully');

    } catch (error) {
        console.error('❌ Error initializing system groups:', error);
        showToast('Warning', 'Could not load all groups', 'warning');
    }
}

async function createSystemGroups() {
    try {
        console.log('📦 Creating system groups...');

        const token = await getAuthTokenWithFallback();
        if (!token) {
            console.error('❌ No authentication token available');
            return;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/initialize-system-groups`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.log('ℹ️ Not an admin - skipping system group creation');
                return;
            }
            throw new Error('Failed to initialize system groups');
        }

        const result = await response.json();
        console.log('✅ System groups initialized:', result.message);

        showToast('Success', 'System groups initialized successfully', 'success');

    } catch (error) {
        console.error('❌ Error creating system groups:', error);
        if (!error.message.includes('403')) {
            showToast('Error', 'Failed to initialize system groups', 'error');
        }
    }
}

async function loadRoleBasedGroups() {
    try {
        console.log('📋 Loading role-based groups...');

        const token = await getAuthTokenWithFallback();
        if (!token) {
            console.error('❌ No token available');
            return;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/groups`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load groups');
        }

        const groups = await response.json();
        console.log(`✅ Loaded ${groups.length} groups`);

        STATE.groups = groups;
        GROUP_STATE.userGroups = groups;

        categorizeSystemGroups(groups);

        renderGroups();
        updateBadges();

    } catch (error) {
        console.error('❌ Error loading groups:', error);
        showToast('Error', 'Failed to load groups', 'error');
    }
}

function categorizeSystemGroups(groups) {
    groups.forEach(group => {
        switch (group.type) {
            case 'ADMIN_LECTURER':
                GROUP_STATE.systemGroups.staffGroup = group;
                break;
            case 'ADMIN_PARENT':
                GROUP_STATE.systemGroups.adminParentGroup = group;
                break;
            case 'DEPARTMENT':
                GROUP_STATE.systemGroups.allStaffGroup = group;
                break;
        }
    });

    console.log('📂 System groups categorized:', {
        staffGroup: !!GROUP_STATE.systemGroups.staffGroup,
        adminParentGroup: !!GROUP_STATE.systemGroups.adminParentGroup,
        allStaffGroup: !!GROUP_STATE.systemGroups.allStaffGroup
    });
}

// ==================== GROUP SELECTION & DISPLAY ====================

async function selectGroup(group) {
    try {
        console.log('👥 Selecting group:', group.name);

        STATE.selectedGroup = group;
        STATE.selectedContact = null;
        GROUP_STATE.currentGroup = group;

        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.group-item').forEach(el => el.classList.remove('active'));

        const groupEl = document.querySelector(`[data-group-id="${group.id}"]`);
        if (groupEl) groupEl.classList.add('active');

        showChatArea();

        updateGroupChatHeader(group);

        await loadGroupMessages(group.id);

        await markAllGroupMessagesAsRead(group.id);

        STATE.groupUnreadCounts.set(group.id, 0);
        renderGroups();
        updateBadges();

        const messageInput = document.getElementById('message-input');
        if (messageInput) messageInput.focus();

        if (window.innerWidth <= 768) {
            hideSidebar();
        }

        console.log('✅ Group selected successfully');

    } catch (error) {
        console.error('❌ Error selecting group:', error);
        showToast('Error', 'Failed to open group chat', 'error');
    }
}

function updateGroupChatHeader(group) {
    const chatPartnerName = document.getElementById('chat-partner-name');
    const chatPartnerAvatar = document.getElementById('chat-partner-avatar');
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');

    if (chatPartnerName) {
        chatPartnerName.textContent = group.name;
    }

    if (chatPartnerAvatar) {
        const logoUrl = group.iconUrl || 'images/unt-logo.png';
        chatPartnerAvatar.src = logoUrl;
        chatPartnerAvatar.onerror = function() {
            this.src = 'images/unt-logo.png';
        };
    }

    if (statusText) {
        const memberText = group.memberCount === 1 ? '1 member' : `${group.memberCount} members`;
        statusText.textContent = memberText;
    }

    if (statusIndicator) {
        statusIndicator.style.display = 'none';
    }
}

// ==================== ENHANCED GROUP RENDERING ====================

function renderGroups() {
    const groupsList = document.getElementById('groups-list');
    if (!groupsList) return;

    const currentUser = STATE.currentUser;
    if (!currentUser) {
        groupsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>Loading groups...</p>
            </div>
        `;
        return;
    }

    let filteredGroups = STATE.groups.filter(group => {
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
                <span>${STATE.searchQuery ? 'Try a different search' : 'No groups available'}</span>
            </div>
        `;
        return;
    }

    groupsList.innerHTML = '';

    filteredGroups.sort((a, b) => {
        const systemGroupsOrder = ['ADMIN_LECTURER', 'ADMIN_PARENT', 'DEPARTMENT'];
        const aIndex = systemGroupsOrder.indexOf(a.type);
        const bIndex = systemGroupsOrder.indexOf(b.type);

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        return a.name.localeCompare(b.name);
    });

    filteredGroups.forEach(group => {
        const groupElement = createEnhancedGroupElement(group);
        groupsList.appendChild(groupElement);
    });
}

function createEnhancedGroupElement(group) {
    const div = document.createElement('div');
    div.className = 'group-item';
    div.dataset.groupId = group.id;

    const unreadCount = STATE.groupUnreadCounts.get(group.id) || 0;
    const isSystemGroup = ['ADMIN_LECTURER', 'ADMIN_PARENT', 'DEPARTMENT'].includes(group.type);

    const groupIcon = group.iconUrl || 'images/unt-logo.png';

    div.innerHTML = `
        <div class="group-avatar-wrapper">
            <img src="${groupIcon}"
                 alt="${escapeHtml(group.name)}"
                 class="group-avatar"
                 onerror="this.src='images/unt-logo.png'">
            ${isSystemGroup ? '<span class="system-group-badge"><i class="fas fa-shield-alt"></i></span>' : ''}
        </div>
        <div class="group-details">
            <div class="group-header">
                <h4 class="group-name">${escapeHtml(group.name)}</h4>
                <span class="group-time">${formatGroupTime(group)}</span>
            </div>
            <div class="group-footer">
                <span class="group-description">${escapeHtml(group.description || '')}</span>
                <div class="group-meta">
                    <span class="group-members">
                        <i class="fas fa-users"></i> ${group.memberCount || 0}
                    </span>
                    ${unreadCount > 0 ? `<span class="unread-count">${unreadCount}</span>` : ''}
                </div>
            </div>
        </div>
    `;

    div.addEventListener('click', () => selectGroup(group));

    return div;
}

function formatGroupTime(group) {
    if (!group.updatedAt && !group.createdAt) return '';

    const timestamp = group.updatedAt || group.createdAt;
    return formatMessageTime(timestamp);
}

// ==================== GROUP MESSAGE LOADING ====================

async function loadGroupMessages(groupId, page = 0, size = 50) {
    try {
        console.log(`📨 Loading messages for group ${groupId}...`);

        const token = await getAuthTokenWithFallback();
        if (!token) {
            console.error('❌ No token available');
            return;
        }

        const url = `${CONFIG.API_BASE_URL}/groups/${groupId}/messages?page=${page}&size=${size}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load group messages');
        }

        const messages = await response.json();
        console.log(`✅ Loaded ${messages.length} group messages`);

        STATE.groupMessages.set(groupId.toString(), messages);

        renderGroupMessages();

        scrollToBottom();

    } catch (error) {
        console.error('❌ Error loading group messages:', error);
        showToast('Error', 'Failed to load messages', 'error');
    }
}

function renderGroupMessages() {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) {
        console.error('❌ Messages container not found');
        return;
    }

    console.log('🎨 Rendering group messages...');

    if (!STATE.selectedGroup) {
        console.warn('⚠️ No group selected');
        return;
    }

    const groupId = STATE.selectedGroup.id.toString();
    const messages = STATE.groupMessages.get(groupId) || [];

    console.log(`   Rendering ${messages.length} group messages`);

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

    const sortedMessages = [...messages].sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const timeB = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return timeA - timeB;
    });

    const groupedMessages = groupMessagesByDate(sortedMessages);

    Object.keys(groupedMessages).forEach(date => {
        const dateDiv = document.createElement('div');
        dateDiv.className = 'message-date-separator';
        dateDiv.textContent = formatDateForDisplay(date);
        messagesContainer.appendChild(dateDiv);

        groupedMessages[date].forEach((message, index) => {
            const messageElement = createGroupMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
    });

    console.log('✅ Group messages rendered successfully');

    setTimeout(() => {
        scrollToBottom();
    }, 100);
}

function createGroupMessageElement(message) {
    const div = document.createElement('div');

    const isSent = message.senderId === STATE.currentUser.email;
    const isSystem = message.senderId === 'SYSTEM';

    if (isSystem) {
        div.className = 'message system-message';
        div.innerHTML = `
            <div class="system-message-content">
                <i class="fas fa-info-circle"></i>
                <span>${escapeHtml(message.content)}</span>
            </div>
        `;
        return div;
    }

    div.className = `message group-message ${isSent ? 'sent' : 'received'}`;
    div.dataset.messageId = message.id;
    div.dataset.senderId = message.senderId;
    div.dataset.timestamp = message.timestamp;

    const senderName = message.senderName || message.senderId.split('@')[0] || 'Unknown';
    const senderInitials = getInitials(senderName);

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
        contentHtml = `<div class="message-text">${escapeHtml(message.content || '')}</div>`;
    }

    const time = message.timestamp ? formatMessageTime(message.timestamp) : 'Just now';

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

    if (isSent) {
        div.innerHTML = `
            <div class="message-content">
                ${contentHtml}
                <div class="message-footer">
                    <span class="message-time">${time}</span>
                    ${statusHtml}
                </div>
            </div>
        `;
    } else {
        div.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-circle">
                    ${senderInitials}
                </div>
            </div>
            <div class="message-wrapper">
                <div class="message-sender-name">${escapeHtml(senderName)}</div>
                <div class="message-content">
                    ${contentHtml}
                    <div class="message-footer">
                        <span class="message-time">${time}</span>
                    </div>
                </div>
            </div>
        `;
    }

    div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, message);
    });

    return div;
}

async function markAllGroupMessagesAsRead(groupId) {
    try {
        const token = await getAuthTokenWithFallback();
        if (!token) return;

        const messages = STATE.groupMessages.get(groupId.toString()) || [];

        for (const message of messages) {
            if (!message.readBy || !message.readBy.includes(STATE.currentUser.email)) {
                await markGroupMessageAsRead(groupId, message.id);
            }
        }

    } catch (error) {
        console.error('Error marking group messages as read:', error);
    }
}

async function markGroupMessageAsRead(groupId, messageId) {
    try {
        const token = await getAuthTokenWithFallback();
        if (!token) return;

        await fetch(`${CONFIG.API_BASE_URL}/groups/${groupId}/messages/${messageId}/read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

// ==================== SEND GROUP MESSAGE ====================

async function sendGroupMessage(content) {
    try {
        if (!content || !content.trim()) {
            showToast('Error', 'Please enter a message', 'error');
            return;
        }

        if (!STATE.selectedGroup) {
            showToast('Error', 'No group selected', 'error');
            return;
        }

        console.log('📤 Sending group message...');
        console.log('   Current group:', STATE.selectedGroup);
        console.log('   Content:', content);

        const message = {
            content: content.trim(),
            senderId: STATE.currentUser.email,
            senderName: STATE.currentUser.fullName,
            groupId: STATE.selectedGroup.id,
            group: {
                id: STATE.selectedGroup.id
            },
            timestamp: new Date().toISOString(),
            type: 'CHAT',
            status: 'SENT'
        };

        console.log('   Structured message:', message);

        if (STATE.stompClient && STATE.stompClient.connected) {
            console.log('📡 Sending via WebSocket...');
            STATE.stompClient.send('/app/chat.group', {}, JSON.stringify(message));

            const optimisticMessage = {
                ...message,
                id: Date.now(),
                timestamp: new Date().toISOString()
            };

            addGroupMessageToLocal(optimisticMessage);

        } else {
            console.log('📡 Sending via REST API...');
            const sentMessage = await sendGroupMessageViaAPI(message);
            addGroupMessageToLocal(sentMessage);
        }

        console.log('✅ Message sent successfully');

    } catch (error) {
        console.error('❌ Error sending group message:', error);
        showToast('Error', 'Failed to send message', 'error');
    }
}

async function sendGroupMessageViaAPI(message) {
    try {
        const token = await getAuthTokenWithFallback();
        if (!token) {
            throw new Error('No authentication token');
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/groups/${message.groupId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        return await response.json();

    } catch (error) {
        console.error('Error sending message via API:', error);
        throw error;
    }
}

function addGroupMessageToLocal(message) {
    console.log('➕ Adding message to local state:', message);

    if (!STATE.selectedGroup) {
        console.warn('⚠️ No selected group');
        return;
    }

    const messageGroupId = message.groupId || (message.group ? message.group.id : null);

    if (!messageGroupId) {
        console.error('❌ Message has no group ID');
        return;
    }

    if (messageGroupId !== STATE.selectedGroup.id) {
        console.log('⚠️ Message is for different group');
        return;
    }

    const groupId = STATE.selectedGroup.id.toString();
    let messages = STATE.groupMessages.get(groupId) || [];

    console.log('   Current messages count:', messages.length);

    const isDuplicate = messages.some(m => {
        if (m.id && message.id && m.id === message.id) return true;

        return m.senderId === message.senderId &&
               m.content === message.content &&
               Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 2000;
    });

    if (!isDuplicate) {
        const enrichedMessage = {
            ...message,
            groupId: messageGroupId,
            senderName: message.senderName || message.senderId,
            timestamp: message.timestamp || new Date().toISOString()
        };

        messages.push(enrichedMessage);
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        STATE.groupMessages.set(groupId, messages);

        console.log('✅ Message added. New count:', messages.length);

        renderGroupMessages();
        scrollToBottom();
    } else {
        console.log('⚠️ Duplicate message detected, skipping');
    }
}

function handleIncomingGroupMessage(message) {
    console.log('📨 Received group message:', message);

    try {
        const messageGroupId = message.groupId || (message.group ? message.group.id : null);

        if (!messageGroupId) {
            console.error('❌ Message has no group ID');
            return;
        }

        console.log('   Message group ID:', messageGroupId);
        console.log('   Current group ID:', STATE.selectedGroup ? STATE.selectedGroup.id : 'none');

        addGroupMessageToLocal(message);

        const isCurrentGroup = STATE.selectedGroup && STATE.selectedGroup.id === messageGroupId;
        const isOwnMessage = message.senderId === STATE.currentUser.email;

        if (!isCurrentGroup && !isOwnMessage) {
            const group = STATE.groups.find(g => g.id === messageGroupId);
            if (group) {
                showDesktopNotification(
                    group.name,
                    `${message.senderName}: ${message.content}`
                );

                const currentCount = STATE.groupUnreadCounts.get(messageGroupId) || 0;
                STATE.groupUnreadCounts.set(messageGroupId, currentCount + 1);
                renderGroups();
                updateBadges();
            }
        }

    } catch (error) {
        console.error('❌ Error handling incoming group message:', error);
    }
}

function sendGroupTypingIndicator(isTyping) {
    if (!STATE.stompClient || !STATE.stompClient.connected) return;
    if (!STATE.selectedGroup) return;

    try {
        STATE.stompClient.send('/app/group.typing', {}, JSON.stringify({
            groupId: STATE.selectedGroup.id,
            senderId: STATE.currentUser.email,
            senderName: STATE.currentUser.fullName,
            isTyping: isTyping
        }));

    } catch (error) {
        console.error('Error sending group typing indicator:', error);
    }
}

function handleGroupTypingIndicator(data) {
    const typingContainer = document.getElementById('typing-indicator-container');
    if (!typingContainer) return;

    if (STATE.selectedGroup && STATE.selectedGroup.id === data.groupId) {
        if (data.isTyping && data.senderId !== STATE.currentUser.email) {
            typingContainer.style.display = 'block';
            const typingText = typingContainer.querySelector('.typing-text');
            if (typingText) {
                typingText.textContent = `${data.senderName} is typing...`;
            }
            scrollToBottom();
        } else {
            typingContainer.style.display = 'none';
        }
    }
}

// ==================== OVERRIDE SEND MESSAGE ====================

if (typeof window.sendMessage !== 'undefined') {
    const originalSendMessage = window.sendMessage;
    window.sendMessage = async function() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) return;

        const content = messageInput.value.trim();
        if (!content) return;

        try {
            if (STATE.selectedGroup) {
                await sendGroupMessage(content);

                messageInput.value = '';
                const sendBtn = document.getElementById('send-btn');
                if (sendBtn) sendBtn.disabled = true;
                messageInput.style.height = 'auto';

                sendGroupTypingIndicator(false);
            } else if (STATE.selectedContact) {
                await originalSendMessage();
                return;
            } else {
                showToast('Error', 'Please select a contact or group', 'error');
                return;
            }

        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Error', 'Failed to send message', 'error');
        }
    };
} else {
    window.sendMessage = async function() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput) {
            console.error('❌ Message input not found');
            return;
        }

        const content = messageInput.value.trim();
        if (!content) {
            console.log('⚠️ Empty message');
            return;
        }

        try {
            if (STATE.selectedGroup) {
                console.log('📤 Sending to group:', STATE.selectedGroup.name);

                await sendGroupMessage(content);

                messageInput.value = '';
                const sendBtn = document.getElementById('send-btn');
                if (sendBtn) sendBtn.disabled = true;
                messageInput.style.height = 'auto';

                sendGroupTypingIndicator(false);

            } else if (STATE.selectedContact) {
                console.log('📤 Sending to contact:', STATE.selectedContact.email);

                if (typeof window.sendPrivateMessage === 'function') {
                    await window.sendPrivateMessage();
                } else {
                    console.error('❌ sendPrivateMessage function not found');
                    showToast('Error', 'Cannot send private message', 'error');
                }
            } else {
                showToast('Error', 'Please select a contact or group', 'error');
            }

        } catch (error) {
            console.error('❌ Error sending message:', error);
            showToast('Error', 'Failed to send message', 'error');
        }
    };
}

// ==================== MESSAGE INPUT HANDLER ====================

if (typeof window.handleMessageInput !== 'undefined') {
    const originalHandleMessageInput = window.handleMessageInput;
    window.handleMessageInput = function(event) {
        originalHandleMessageInput(event);

        if (STATE.selectedGroup) {
            const input = event.target;
            if (input.value.trim()) {
                sendGroupTypingIndicator(true);

                if (STATE.typingTimeouts.has('group-typing')) {
                    clearTimeout(STATE.typingTimeouts.get('group-typing'));
                }

                const timeout = setTimeout(() => {
                    sendGroupTypingIndicator(false);
                }, CONFIG.TYPING_TIMEOUT);

                STATE.typingTimeouts.set('group-typing', timeout);
            } else {
                sendGroupTypingIndicator(false);
            }
        }
    };
}

// ==================== WEBSOCKET SUBSCRIPTION ====================

window.subscribeToGroupChannels = function() {
    if (!STATE.stompClient || !STATE.stompClient.connected) {
        console.error('❌ Cannot subscribe: WebSocket not connected');
        return;
    }

    try {
        STATE.stompClient.subscribe('/user/queue/group', (message) => {
            console.log('📨 WebSocket message received on /user/queue/group');
            try {
                const groupMessage = JSON.parse(message.body);
                console.log('   Parsed message:', groupMessage);
                handleIncomingGroupMessage(groupMessage);
            } catch (e) {
                console.error('❌ Error parsing group message:', e);
            }
        });
        console.log('✅ Subscribed to /user/queue/group');

        STATE.stompClient.subscribe('/user/queue/typing', (message) => {
            try {
                const typingData = JSON.parse(message.body);
                if (typingData.groupId) {
                    handleGroupTypingIndicator(typingData);
                } else if (typeof handleTypingIndicator === 'function') {
                    handleTypingIndicator(typingData);
                }
            } catch (e) {
                console.error('❌ Error parsing typing indicator:', e);
            }
        });
        console.log('✅ Subscribed to /user/queue/typing');

    } catch (error) {
        console.error('❌ Error subscribing to group channels:', error);
    }
};

if (typeof window.subscribeToChannels !== 'undefined') {
    const originalSubscribeToChannels = window.subscribeToChannels;
    window.subscribeToChannels = function() {
        if (originalSubscribeToChannels) {
            originalSubscribeToChannels();
        }

        if (!STATE.stompClient || !STATE.stompClient.connected) {
            console.error('❌ Cannot subscribe: WebSocket not connected');
            return;
        }

        try {
            STATE.stompClient.subscribe('/user/queue/group', (message) => {
                const groupMessage = JSON.parse(message.body);
                handleIncomingGroupMessage(groupMessage);
            });
            console.log('✅ Subscribed to group messages');

            STATE.stompClient.subscribe('/user/queue/typing', (message) => {
                const typingData = JSON.parse(message.body);
                if (typingData.groupId) {
                    handleGroupTypingIndicator(typingData);
                }
            });
            console.log('✅ Subscribed to group typing indicators');

        } catch (error) {
            console.error('❌ Error subscribing to group channels:', error);
        }
    };
} else {
    window.subscribeToChannels = function() {
        if (!STATE.stompClient || !STATE.stompClient.connected) {
            console.error('❌ Cannot subscribe: WebSocket not connected');
            return;
        }

        try {
            STATE.stompClient.subscribe('/user/queue/private', (message) => {
                if (typeof handleIncomingMessage === 'function') {
                    handleIncomingMessage(JSON.parse(message.body));
                }
            });
            console.log('✅ Subscribed to private messages');

            STATE.stompClient.subscribe('/user/queue/group', (message) => {
                const groupMessage = JSON.parse(message.body);
                handleIncomingGroupMessage(groupMessage);
            });
            console.log('✅ Subscribed to group messages');

            STATE.stompClient.subscribe('/user/queue/typing', (message) => {
                const typingData = JSON.parse(message.body);
                if (typingData.groupId) {
                    handleGroupTypingIndicator(typingData);
                } else if (typeof handleTypingIndicator === 'function') {
                    handleTypingIndicator(typingData);
                }
            });
            console.log('✅ Subscribed to typing indicators');

        } catch (error) {
            console.error('❌ Error subscribing to channels:', error);
        }
    };
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing group functionality...');

    const waitForUser = setInterval(async () => {
        if (STATE.currentUser && STATE.currentUser.email) {
            clearInterval(waitForUser);

            await initializeSystemGroups();

            console.log('✅ Group functionality initialized');
        }
    }, 100);

    setTimeout(() => {
        clearInterval(waitForUser);
        if (!STATE.currentUser) {
            console.error('❌ User not loaded after 10 seconds');
        }
    }, 10000);

    console.log('🔌 Setting up WebSocket connection handlers...');

    const originalConnect = window.connectWebSocket;
    if (originalConnect) {
        window.connectWebSocket = function() {
            originalConnect();

            const checkConnection = setInterval(() => {
                if (STATE.stompClient && STATE.stompClient.connected) {
                    clearInterval(checkConnection);
                    console.log('✅ WebSocket connected, subscribing to group channels...');
                    subscribeToGroupChannels();
                }
            }, 100);

            setTimeout(() => clearInterval(checkConnection), 10000);
        };
    }
});

// ==================== UTILITY FUNCTIONS ====================

function getGroupTypeDisplayName(type) {
    const typeMap = {
        'ADMIN_LECTURER': 'Staff Communication',
        'ADMIN_PARENT': 'Parent Communication',
        'DEPARTMENT': 'Department Group',
        'CUSTOM': 'Custom Group'
    };
    return typeMap[type] || 'Group';
}

function canUserAccessGroup(group, user) {
    if (!user || !group) return false;

    if (group.memberEmails && group.memberEmails.includes(user.email)) {
        return true;
    }

    switch (group.type) {
        case 'ADMIN_LECTURER':
            return ['ADMIN', 'LECTURER'].includes(user.role);
        case 'ADMIN_PARENT':
            return ['ADMIN', 'PARENT'].includes(user.role);
        case 'DEPARTMENT':
            return ['ADMIN', 'LECTURER'].includes(user.role);
        default:
            return false;
    }
}

console.log('✅ Complete group chat implementation loaded successfully');