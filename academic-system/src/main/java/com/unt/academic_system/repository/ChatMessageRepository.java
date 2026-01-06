package com.unt.academic_system.repository;



import com.unt.academic_system.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // Find unread messages for a specific recipient
    List<ChatMessage> findByRecipientIdAndReadFalse(String recipientId);

    // Count unread messages for a recipient
    long countByRecipientIdAndReadFalse(String recipientId);

    // Find messages within a specific time range
    List<ChatMessage> findByTimestampBetween(LocalDateTime startTime, LocalDateTime endTime);

    // Find messages by message type
    List<ChatMessage> findByType(ChatMessage.MessageType type);

    // Find messages for a specific sender
    List<ChatMessage> findBySenderId(String senderId);

    // Find messages for a specific recipient
    List<ChatMessage> findByRecipientId(String recipientId);

    // Count messages by sender
    long countBySenderId(String senderId);

    // Count messages by recipient
    long countByRecipientId(String recipientId);

    // Find messages containing specific content
    List<ChatMessage> findByContentContaining(String keyword);

    // Custom query to find recent messages
    @Query("SELECT m FROM ChatMessage m WHERE m.timestamp > :cutoffTime ORDER BY m.timestamp DESC")
    List<ChatMessage> findRecentMessages(@Param("cutoffTime") LocalDateTime cutoffTime);

    // Find conversation between two users with pagination
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = :senderId AND m.recipientId = :recipientId) OR (m.senderId = :recipientId AND m.recipientId = :senderId) ORDER BY m.timestamp DESC")
    List<ChatMessage> findBySenderIdAndRecipientId(@Param("senderId") String senderId, @Param("recipientId") String recipientId, Pageable pageable);

    // Find latest message between two users
    @Query("SELECT m FROM ChatMessage m WHERE (m.senderId = :senderId AND m.recipientId = :recipientId) OR (m.senderId = :recipientId AND m.recipientId = :senderId) ORDER BY m.timestamp DESC")
    Optional<ChatMessage> findLatestMessageBetweenUsers(@Param("senderId") String senderId, @Param("recipientId") String recipientId);

    // Find all messages for a user (sent or received)
    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = :userId OR m.recipientId = :userId ORDER BY m.timestamp DESC")
    List<ChatMessage> findAllMessagesByUserId(@Param("userId") String userId);

    // Find unread messages count for a user
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.recipientId = :userId AND m.read = false")
    long countUnreadMessagesByUserId(@Param("userId") String userId);

    // Mark messages as read
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.recipientId = :recipientId AND m.senderId = :senderId AND m.read = false")
    void markMessagesAsRead(@Param("recipientId") String recipientId, @Param("senderId") String senderId);

    // Find conversation messages
    @Query("SELECT cm FROM ChatMessage cm WHERE " +
            "(cm.senderId = :senderId AND cm.recipientId = :recipientId) OR " +
            "(cm.senderId = :recipientId AND cm.recipientId = :senderId) " +
            "ORDER BY cm.timestamp DESC")
    List<ChatMessage> findConversationMessages(
            @Param("senderId") String senderId,
            @Param("recipientId") String recipientId,
            Pageable pageable
    );
    // Find conversation media
    @Query("SELECT cm FROM ChatMessage cm WHERE ((cm.senderId = :senderId AND cm.recipientId = :recipientId) OR (cm.senderId = :recipientId AND cm.recipientId = :senderId)) AND cm.type IN ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'FILE') AND cm.fileUrl IS NOT NULL ORDER BY cm.timestamp DESC")
    List<ChatMessage> findConversationMedia(@Param("senderId") String senderId, @Param("recipientId") String recipientId, Pageable pageable);

    // Find conversation media by type
    @Query("SELECT cm FROM ChatMessage cm WHERE ((cm.senderId = :senderId AND cm.recipientId = :recipientId) OR (cm.senderId = :recipientId AND cm.recipientId = :senderId)) AND cm.type = :messageType AND cm.fileUrl IS NOT NULL ORDER BY cm.timestamp DESC")
    List<ChatMessage> findConversationMediaByType(@Param("senderId") String senderId, @Param("recipientId") String recipientId, @Param("messageType") ChatMessage.MessageType messageType, Pageable pageable);

    // Find all media for a user
    @Query("SELECT cm FROM ChatMessage cm WHERE (cm.senderId = :userId OR cm.recipientId = :userId) AND cm.type IN ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'FILE') AND cm.fileUrl IS NOT NULL ORDER BY cm.timestamp DESC")
    List<ChatMessage> findUserMedia(@Param("userId") String userId, Pageable pageable);

    // Find user media by type
    @Query("SELECT cm FROM ChatMessage cm WHERE (cm.senderId = :userId OR cm.recipientId = :userId) AND cm.type = :messageType AND cm.fileUrl IS NOT NULL ORDER BY cm.timestamp DESC")
    List<ChatMessage> findUserMediaByType(@Param("userId") String userId, @Param("messageType") ChatMessage.MessageType messageType, Pageable pageable);
}