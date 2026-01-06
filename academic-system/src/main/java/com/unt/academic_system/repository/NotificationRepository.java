package com.unt.academic_system.repository;

import com.unt.academic_system.model.Notification;
import com.unt.academic_system.model.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Find notifications for a user
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long userId);

    // Find unread notifications for a user
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    List<Notification> findAllByOrderByCreatedAtDesc();

    // Find notifications by type
    List<Notification> findByType(NotificationType type);

    // Count unread notifications for a user
    long countByRecipientIdAndIsReadFalse(Long userId);
}