package com.unt.academic_system.service;

import com.unt.academic_system.model.*;
import com.unt.academic_system.repository.ChatNotificationRepository;
import com.unt.academic_system.repository.NotificationRepository;
import com.unt.academic_system.repository.StudentRepository;
import com.unt.academic_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final ChatNotificationRepository chatNotificationRepository; // NEW

    @Override
    public Notification createNotification(Notification notification) {
        notification.setIsRead(false);
        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> findAll() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public Optional<Notification> findById(Long id) {
        return notificationRepository.findById(id);
    }

    @Override
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    @Override
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Override
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setIsRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = getUnreadNotifications(userId);

        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
        }

        notificationRepository.saveAll(unreadNotifications);
    }

    @Override
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    @Override
    public void sendNotificationToUser(Long userId, String title, String message, NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = new Notification();
        notification.setRecipient(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setPriority(NotificationPriority.NORMAL);
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }

    @Override
    public void sendNotificationToAllStudents(String title, String message, NotificationType type) {
        List<Student> students = studentRepository.findAll();

        for (Student student : students) {
            Notification notification = new Notification();
            notification.setRecipient(student);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType(type);
            notification.setPriority(NotificationPriority.NORMAL);
            notification.setIsRead(false);

            notificationRepository.save(notification);
        }
    }

    // NEW: Chat notification methods
    @Override
    public ChatNotification createNotification(String senderId, String recipientId, String content, ChatNotification.NotificationType type) {
        ChatNotification notification = new ChatNotification();
        notification.setSenderId(senderId);
        notification.setRecipientId(recipientId);
        notification.setContent(content);
        notification.setType(type);
        notification.setRead(false);
        notification.setTimestamp(LocalDateTime.now());

        return chatNotificationRepository.save(notification);
    }

    @Override
    public List<ChatNotification> getUnreadNotifications(String username) {
        return chatNotificationRepository.findByRecipientIdAndReadFalseOrderByTimestampDesc(username);
    }

    @Override
    public void markNotificationAsRead(Long notificationId, String username) {
        ChatNotification notification = chatNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Chat notification not found"));

        // Verify the notification belongs to the user
        if (!notification.getRecipientId().equals(username)) {
            throw new RuntimeException("Access denied");
        }

        notification.setRead(true);
        chatNotificationRepository.save(notification);
    }
}