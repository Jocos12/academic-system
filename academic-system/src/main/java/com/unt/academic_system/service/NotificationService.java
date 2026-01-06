package com.unt.academic_system.service;

import com.unt.academic_system.model.ChatNotification;
import com.unt.academic_system.model.Notification;
import com.unt.academic_system.model.NotificationType;

import java.util.List;
import java.util.Optional;

public interface NotificationService {

    // Existing methods for Notification entity
    Notification createNotification(Notification notification);
    Optional<Notification> findById(Long id);
    List<Notification> getUserNotifications(Long userId);
    List<Notification> getUnreadNotifications(Long userId);
    long countUnreadNotifications(Long userId);

    List<Notification> findAll();
    void markAsRead(Long notificationId);
    void markAllAsRead(Long userId);
    void deleteNotification(Long notificationId);
    void sendNotificationToUser(Long userId, String title, String message, NotificationType type);
    void sendNotificationToAllStudents(String title, String message, NotificationType type);

    // NEW: Chat notification methods
    ChatNotification createNotification(String senderId, String recipientId, String content, ChatNotification.NotificationType type);
    List<ChatNotification> getUnreadNotifications(String username);
    void markNotificationAsRead(Long notificationId, String username);
}