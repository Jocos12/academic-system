package com.unt.academic_system.repository;

import com.unt.academic_system.model.ChatGroup;
import com.unt.academic_system.model.ChatGroupMessage;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatGroupMessageRepository extends JpaRepository<ChatGroupMessage, Long> {

    // Find messages by group
    List<ChatGroupMessage> findByGroupOrderByTimestampDesc(ChatGroup group);

    // Find messages by group with pagination
    List<ChatGroupMessage> findByGroupOrderByTimestampDesc(ChatGroup group, Pageable pageable);

    // Find messages by group ID
    @Query("SELECT m FROM ChatGroupMessage m WHERE m.group.id = :groupId ORDER BY m.timestamp DESC")
    List<ChatGroupMessage> findByGroupId(@Param("groupId") Long groupId, Pageable pageable);

    // Count messages in a group
    long countByGroup(ChatGroup group);

    // Find unread messages for a user in a group
    @Query("SELECT m FROM ChatGroupMessage m WHERE m.group.id = :groupId " +
            "AND m.senderId != :userId " +
            "AND (m.readBy IS NULL OR m.readBy NOT LIKE CONCAT('%', :userId, '%')) " +
            "ORDER BY m.timestamp DESC")
    List<ChatGroupMessage> findUnreadMessages(@Param("groupId") Long groupId,
                                              @Param("userId") String userId);

    // Find messages by sender in a group
    List<ChatGroupMessage> findByGroupAndSenderIdOrderByTimestampDesc(ChatGroup group, String senderId);

    // Find recent messages after a specific time
    @Query("SELECT m FROM ChatGroupMessage m WHERE m.group.id = :groupId " +
            "AND m.timestamp > :since ORDER BY m.timestamp DESC")
    List<ChatGroupMessage> findRecentMessages(@Param("groupId") Long groupId,
                                              @Param("since") LocalDateTime since);

    // Find media messages in a group
    @Query("SELECT m FROM ChatGroupMessage m WHERE m.group.id = :groupId " +
            "AND m.type IN ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'FILE') " +
            "ORDER BY m.timestamp DESC")
    List<ChatGroupMessage> findGroupMedia(@Param("groupId") Long groupId, Pageable pageable);

    // Search messages in a group
    @Query("SELECT m FROM ChatGroupMessage m WHERE m.group.id = :groupId " +
            "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "ORDER BY m.timestamp DESC")
    List<ChatGroupMessage> searchMessagesInGroup(@Param("groupId") Long groupId,
                                                 @Param("searchTerm") String searchTerm);

    // Delete messages older than specified date
    void deleteByGroupAndTimestampBefore(ChatGroup group, LocalDateTime before);

    // Count unread messages for user
    @Query("SELECT COUNT(m) FROM ChatGroupMessage m WHERE m.group.id = :groupId " +
            "AND m.senderId != :userId " +
            "AND (m.readBy IS NULL OR m.readBy NOT LIKE CONCAT('%', :userId, '%'))")
    long countUnreadMessages(@Param("groupId") Long groupId, @Param("userId") String userId);
}