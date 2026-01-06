package com.unt.academic_system.repository;



import com.unt.academic_system.model.ChatNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatNotificationRepository extends JpaRepository<ChatNotification, Long> {

    // Trouver les notifications non lues pour un destinataire spécifique
    List<ChatNotification> findByRecipientIdAndReadFalseOrderByTimestampDesc(String recipientId);

    // Trouver toutes les notifications pour un destinataire spécifique
    List<ChatNotification> findByRecipientIdOrderByTimestampDesc(String recipientId);

    // Trouver les notifications par expéditeur
    List<ChatNotification> findBySenderIdOrderByTimestampDesc(String senderId);

    // Trouver les notifications par type
    List<ChatNotification> findByTypeOrderByTimestampDesc(ChatNotification.NotificationType type);

    // Trouver les notifications récentes (dernières 24 heures)
    @Query("SELECT n FROM ChatNotification n WHERE n.recipientId = :recipientId AND n.timestamp >= :since ORDER BY n.timestamp DESC")
    List<ChatNotification> findRecentNotifications(@Param("recipientId") String recipientId, @Param("since") LocalDateTime since);

    // Compter les notifications non lues pour un utilisateur
    long countByRecipientIdAndReadFalse(String recipientId);

    // Supprimer les anciennes notifications (pour le nettoyage)
    void deleteByTimestampBefore(LocalDateTime cutoffTime);

    // Marquer toutes les notifications comme lues pour un utilisateur
    @Query("UPDATE ChatNotification n SET n.read = true WHERE n.recipientId = :recipientId AND n.read = false")
    void markAllAsReadForUser(@Param("recipientId") String recipientId);
}