package com.unt.academic_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_group_messages")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ChatGroupMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    @JsonIgnoreProperties({"messages", "memberEmails", "adminEmails"})
    private ChatGroup group;

    @Column(nullable = false)
    private String senderId;

    @Column(nullable = false, length = 100)
    private String senderName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MessageType type = MessageType.CHAT;

    public enum MessageType {
        CHAT, IMAGE, VIDEO, AUDIO, DOCUMENT, FILE, SYSTEM
    }

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(length = 50)
    private String status = "SENT";

    // File-related fields
    @Column(length = 500)
    private String fileName;

    @Column(length = 1000)
    private String fileUrl;

    @Column
    private Long fileSize;

    // Read receipts - store as comma-separated emails
    @Column(columnDefinition = "TEXT")
    private String readBy;

    public void addReadBy(String email) {
        if (readBy == null || readBy.isEmpty()) {
            readBy = email;
        } else if (!readBy.contains(email)) {
            readBy += "," + email;
        }
    }

    public boolean isReadBy(String email) {
        return readBy != null && readBy.contains(email);
    }

    @Override
    public String toString() {
        return "ChatGroupMessage{" +
                "id=" + id +
                ", groupId=" + (group != null ? group.getId() : null) +
                ", senderId='" + senderId + '\'' +
                ", type=" + type +
                ", timestamp=" + timestamp +
                '}';
    }
}