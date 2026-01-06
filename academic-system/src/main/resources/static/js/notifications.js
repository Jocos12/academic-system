const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080/api';

let notificationsData = [];
let currentAdminUserId = null;
let allUsers = [];

document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 Notifications module initializing...');
  initializeNotifications();
});

function initializeNotifications() {
  currentAdminUserId = localStorage.getItem('adminUserId') || localStorage.getItem('userId') || 1;
  console.log('👤 Current Admin User ID:', currentAdminUserId);

  setupNotificationEventListeners();
  loadAllUsers();
  loadNotifications();

  setInterval(() => {
    console.log('🔄 Polling for new notifications...');
    loadNotifications();
  }, 30000);
}

function setupNotificationEventListeners() {
  console.log('📌 Setting up notification event listeners...');

  const notificationToggle = document.getElementById('notificationToggle');
  if (notificationToggle) {
    notificationToggle.addEventListener('click', toggleNotificationDropdown);
  }

  const markAllReadBtn = document.getElementById('markAllReadBtn');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
  }

  const sendNotificationBtn = document.getElementById('sendNotificationBtn');
  if (sendNotificationBtn) {
    sendNotificationBtn.addEventListener('click', openSendNotificationModal);
  }

  const broadcastNotificationBtn = document.getElementById('broadcastNotificationBtn');
  if (broadcastNotificationBtn) {
    broadcastNotificationBtn.addEventListener('click', openBroadcastModal);
  }

  const closeNotificationModal = document.getElementById('closeNotificationModal');
  if (closeNotificationModal) {
    closeNotificationModal.addEventListener('click', closeSendNotificationModal);
  }

  const notificationCancelBtn = document.getElementById('notificationCancelBtn');
  if (notificationCancelBtn) {
    notificationCancelBtn.addEventListener('click', closeSendNotificationModal);
  }

  const closeBroadcastModal = document.getElementById('closeBroadcastModal');
  if (closeBroadcastModal) {
    closeBroadcastModal.addEventListener('click', closeBroadcastModalFn);
  }

  const broadcastCancelBtn = document.getElementById('broadcastCancelBtn');
  if (broadcastCancelBtn) {
    broadcastCancelBtn.addEventListener('click', closeBroadcastModalFn);
  }

  const notificationForm = document.getElementById('notificationForm');
  if (notificationForm) {
    notificationForm.addEventListener('submit', handleSendNotification);
  }

  const broadcastForm = document.getElementById('broadcastForm');
  if (broadcastForm) {
    broadcastForm.addEventListener('submit', handleBroadcastNotification);
  }

  const searchNotification = document.getElementById('searchNotification');
  if (searchNotification) {
    searchNotification.addEventListener('input', filterNotifications);
  }

  const notificationTypeFilter = document.getElementById('notificationTypeFilter');
  if (notificationTypeFilter) {
    notificationTypeFilter.addEventListener('change', filterNotifications);
  }

  const notificationStatusFilter = document.getElementById('notificationStatusFilter');
  if (notificationStatusFilter) {
    notificationStatusFilter.addEventListener('change', filterNotifications);
  }

  const notificationPriorityFilter = document.getElementById('notificationPriorityFilter');
  if (notificationPriorityFilter) {
    notificationPriorityFilter.addEventListener('change', filterNotifications);
  }

  document.addEventListener('click', (e) => {
    const notificationContainer = document.querySelector('.notification-container');
    const notificationDropdown = document.getElementById('notificationDropdown');

    if (notificationContainer && !notificationContainer.contains(e.target)) {
      if (notificationDropdown) {
        notificationDropdown.classList.remove('active');
      }
    }

    const notificationModal = document.getElementById('notificationModal');
    if (e.target === notificationModal) {
      closeSendNotificationModal();
    }

    const broadcastModal = document.getElementById('broadcastModal');
    if (e.target === broadcastModal) {
      closeBroadcastModalFn();
    }
  });

  console.log('✅ All notification event listeners setup complete');
}

async function loadAllUsers() {
  console.log('👥 Loading all users...');
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    console.log('📡 Users API response status:', response.status);

    if (response.ok) {
      allUsers = await response.json();
      console.log('✅ Users loaded successfully:', allUsers.length, 'users');
      populateUserDropdown();
    } else {
      console.error('❌ Failed to load users - Status:', response.status);
      allUsers = [];
    }
  } catch (error) {
    console.error('❌ Error loading users:', error);
    allUsers = [];
  }
}

function populateUserDropdown() {
  const select = document.getElementById('notifUserId');
  if (!select) {
    console.error('❌ notifUserId select element not found!');
    return;
  }

  console.log('🔄 Populating user dropdown...');
  select.innerHTML = '<option value="">Select Recipient</option>';

  const activeUsers = allUsers.filter(user => user.isActive);
  console.log('✅ Active users:', activeUsers.length);

  activeUsers.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`;
    select.appendChild(option);
  });

  console.log('✅ User dropdown populated with', activeUsers.length, 'active users');
}

// ✅ MODIFICATION PRINCIPALE: Charger TOUTES les notifications
async function loadNotifications() {
  console.log('📬 Loading ALL notifications for management page...');

  try {
    // ✅ CHANGEMENT: Charger toutes les notifications au lieu de seulement celles de l'utilisateur
    const url = `${API_BASE_URL}/notifications`;
    console.log('📡 Fetching from:', url);

    const response = await fetch(url);
    console.log('📡 Notifications API response status:', response.status);

    if (response.ok) {
      notificationsData = await response.json();
      console.log('✅ Notifications loaded:', notificationsData.length, 'notifications');
      console.log('📬 Notifications data:', notificationsData);
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to load notifications - Status:', response.status);
      console.error('❌ Error text:', errorText);
      notificationsData = [];
    }
  } catch (error) {
    console.error('❌ Error loading notifications:', error);
    notificationsData = [];
  }

  // Ces fonctions restent pour l'affichage personnel dans le dropdown
  updateNotificationBadge();
  updateNotificationDropdown();
  updateNotificationStats();
  displayNotificationsTable(notificationsData);
}

function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;

  // ✅ Badge affiche uniquement les notifications NON LUES de l'utilisateur courant
  const unreadCount = notificationsData.filter(
    (n) => !n.isRead && n.recipient && n.recipient.id === parseInt(currentAdminUserId)
  ).length;

  console.log('🔔 Unread notifications for current user:', unreadCount);

  badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
  badge.style.display = unreadCount > 0 ? 'flex' : 'none';
}

function updateNotificationDropdown() {
  const notificationList = document.getElementById('notificationList');
  if (!notificationList) return;

  // ✅ Dropdown affiche uniquement les notifications de l'utilisateur courant
  const userNotifications = notificationsData
    .filter(n => n.recipient && n.recipient.id === parseInt(currentAdminUserId))
    .slice(0, 5);

  console.log('📋 Displaying', userNotifications.length, 'recent notifications for current user');

  if (userNotifications.length === 0) {
    notificationList.innerHTML = '<div class="notification-empty">No notifications</div>';
    return;
  }

  const html = userNotifications
    .map(
      (notification) => `
        <div class="notification-item ${notification.isRead ? '' : 'unread'} notification-priority-${notification.priority.toLowerCase()}"
             onclick="handleNotificationClick(${notification.id})">
            <div class="notification-item-header">
                <div class="notification-item-title">${escapeHtml(notification.title)}</div>
                <div class="notification-item-time">${formatTimeAgo(notification.createdAt)}</div>
            </div>
            <div class="notification-item-message">${escapeHtml(notification.message)}</div>
            <span class="notification-item-type">${formatNotificationType(notification.type)}</span>
        </div>
    `
    )
    .join('');

  notificationList.innerHTML = html;
}

function toggleNotificationDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

async function handleNotificationClick(notificationId) {
  console.log('👆 Notification clicked:', notificationId);
  const notification = notificationsData.find((n) => n.id === notificationId);
  if (!notification) {
    console.error('❌ Notification not found:', notificationId);
    return;
  }

  if (!notification.isRead) {
    await markNotificationAsRead(notificationId);
  }

  if (notification.actionUrl) {
    window.location.href = notification.actionUrl;
  }

  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.remove('active');
  }
}

async function markNotificationAsRead(notificationId) {
  console.log('✅ Marking notification as read:', notificationId);

  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/mark-read`,
      { method: 'PUT' }
    );

    if (response.ok) {
      const notification = notificationsData.find((n) => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
      }
      updateNotificationBadge();
      updateNotificationDropdown();
      updateNotificationStats();
      displayNotificationsTable(notificationsData);
    } else {
      console.error('❌ Failed to mark notification as read');
    }
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
}

async function markAllNotificationsAsRead() {
  console.log('✅ Marking all notifications as read');

  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/user/${currentAdminUserId}/mark-all-read`,
      { method: 'PUT' }
    );

    if (response.ok) {
      notificationsData.forEach((n) => {
        if (n.recipient && n.recipient.id === parseInt(currentAdminUserId)) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        }
      });
      updateNotificationBadge();
      updateNotificationDropdown();
      updateNotificationStats();
      displayNotificationsTable(notificationsData);
      showNotification('All notifications marked as read', 'success');
    } else {
      showNotification('Failed to mark all as read', 'error');
    }
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    showNotification('Failed to mark all as read', 'error');
  }
}

function updateNotificationStats() {
  console.log('📊 Updating notification stats...');

  const totalNotifications = document.getElementById('totalNotifications');
  const readNotifications = document.getElementById('readNotifications');
  const unreadNotifications = document.getElementById('unreadNotifications');
  const highPriorityNotifications = document.getElementById('highPriorityNotifications');

  // ✅ Stats montrent TOUTES les notifications
  const total = notificationsData.length;
  const read = notificationsData.filter((n) => n.isRead).length;
  const unread = notificationsData.filter((n) => !n.isRead).length;
  const highPriority = notificationsData.filter((n) => n.priority === 'HIGH').length;

  console.log('📊 Stats - Total:', total, 'Read:', read, 'Unread:', unread, 'High Priority:', highPriority);

  if (totalNotifications) totalNotifications.textContent = total;
  if (readNotifications) readNotifications.textContent = read;
  if (unreadNotifications) unreadNotifications.textContent = unread;
  if (highPriorityNotifications) highPriorityNotifications.textContent = highPriority;
}

function filterNotifications() {
  const searchTerm = document.getElementById('searchNotification')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('notificationTypeFilter')?.value || '';
  const statusFilter = document.getElementById('notificationStatusFilter')?.value || '';
  const priorityFilter = document.getElementById('notificationPriorityFilter')?.value || '';

  const filtered = notificationsData.filter((notification) => {
    const matchesSearch =
      !searchTerm ||
      notification.title.toLowerCase().includes(searchTerm) ||
      notification.message.toLowerCase().includes(searchTerm);

    const matchesType = !typeFilter || notification.type === typeFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'read' && notification.isRead) ||
      (statusFilter === 'unread' && !notification.isRead);
    const matchesPriority = !priorityFilter || notification.priority === priorityFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  displayNotificationsTable(filtered);
}

function displayNotificationsTable(notifications) {
  console.log('📋 Displaying notifications table with', notifications.length, 'items');

  const tbody = document.getElementById('notificationsTableBody');
  if (!tbody) {
    console.error('❌ notificationsTableBody element not found!');
    return;
  }

  if (notifications.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">No notifications found</td></tr>';
    return;
  }

  const html = notifications
    .map(
      (notification) => `
        <tr class="${notification.isRead ? '' : 'unread-row'}">
            <td>${notification.id}</td>
            <td>${notification.recipient ? escapeHtml(notification.recipient.firstName + ' ' + notification.recipient.lastName) : 'N/A'}</td>
            <td>${escapeHtml(notification.title)}</td>
            <td>${escapeHtml(notification.message.substring(0, 50))}${notification.message.length > 50 ? '...' : ''}</td>
            <td><span class="status-badge status-info">${formatNotificationType(notification.type)}</span></td>
            <td><span class="priority-badge priority-${notification.priority.toLowerCase()}">${notification.priority}</span></td>
            <td>
                <span class="status-badge ${notification.isRead ? 'status-active' : 'status-inactive'}">
                    ${notification.isRead ? 'Read' : 'Unread'}
                </span>
            </td>
            <td>${formatDateTime(notification.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    ${
                      !notification.isRead
                        ? `
                        <button class="btn-icon" onclick="window.markNotificationAsRead(${notification.id})" title="Mark as Read">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                    `
                        : ''
                    }
                    <button class="btn-icon delete" onclick="window.deleteNotification(${notification.id})" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join('');

  tbody.innerHTML = html;
  console.log('✅ Notifications table rendered successfully');
}

function openSendNotificationModal() {
  console.log('📝 Opening send notification modal');
  loadAllUsers();
  document.getElementById('notificationModal').classList.add('active');
  document.getElementById('notificationForm').reset();
}

function closeSendNotificationModal() {
  console.log('❌ Closing send notification modal');
  document.getElementById('notificationModal').classList.remove('active');
  document.getElementById('notificationForm').reset();
}

function openBroadcastModal() {
  console.log('📢 Opening broadcast modal');
  document.getElementById('broadcastModal').classList.add('active');
  document.getElementById('broadcastForm').reset();
}

function closeBroadcastModalFn() {
  console.log('❌ Closing broadcast modal');
  document.getElementById('broadcastModal').classList.remove('active');
  document.getElementById('broadcastForm').reset();
}

async function handleSendNotification(e) {
  e.preventDefault();
  console.log('📤 Sending notification...');

  const userId = document.getElementById('notifUserId').value;
  const title = document.getElementById('notifTitle').value;
  const message = document.getElementById('notifMessage').value;
  const type = document.getElementById('notifType').value;
  const priority = document.getElementById('notifPriority')?.value || 'NORMAL';
  const actionUrl = document.getElementById('notifActionUrl')?.value || null;

  if (!userId || !title || !message || !type) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  const formData = {
    userId: parseInt(userId),
    title: title.trim(),
    message: message.trim(),
    type: type,
    priority: priority,
    actionUrl: actionUrl ? actionUrl.trim() : null,
  };

  console.log('📤 Sending notification with data:', JSON.stringify(formData, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const responseText = await response.text();
    console.log('📡 Response status:', response.status, '- Body:', responseText);

    if (response.ok) {
      showNotification('Notification sent successfully', 'success');
      closeSendNotificationModal();
      setTimeout(() => loadNotifications(), 500);
    } else {
      showNotification(responseText || 'Failed to send notification', 'error');
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    showNotification('Failed to send notification. Please try again.', 'error');
  }
}

async function handleBroadcastNotification(e) {
  e.preventDefault();
  console.log('📢 Broadcasting notification...');

  const title = document.getElementById('broadcastTitle').value;
  const message = document.getElementById('broadcastMessage').value;
  const type = document.getElementById('broadcastType').value;

  if (!title || !message || !type) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  const formData = { title: title.trim(), message: message.trim(), type: type };

  try {
    const response = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const responseText = await response.text();

    if (response.ok) {
      showNotification('Notification broadcasted successfully', 'success');
      closeBroadcastModalFn();
      setTimeout(() => loadNotifications(), 500);
    } else {
      showNotification(responseText || 'Failed to broadcast notification', 'error');
    }
  } catch (error) {
    console.error('❌ Error broadcasting notification:', error);
    showNotification('Failed to broadcast notification. Please try again.', 'error');
  }
}

async function deleteNotification(notificationId) {
  console.log('🗑️ Deleting notification:', notificationId);

  if (!confirm('Are you sure you want to delete this notification?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      showNotification('Notification deleted successfully', 'success');
      await loadNotifications();
    } else {
      showNotification('Failed to delete notification', 'error');
    }
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    showNotification('Failed to delete notification. Please try again.', 'error');
  }
}

function formatNotificationType(type) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function showNotification(message, type = 'info') {
  console.log(`📣 Showing notification: [${type.toUpperCase()}] ${message}`);

  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Export functions
window.handleNotificationClick = handleNotificationClick;
window.markNotificationAsRead = markNotificationAsRead;
window.deleteNotification = deleteNotification;
window.loadNotificationsData = loadNotifications;

console.log('✅ Notifications module loaded successfully');