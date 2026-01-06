package com.unt.academic_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "chat_groups")
public class ChatGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 500)
    private String iconUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private GroupType type;

    public enum GroupType {
        ADMIN_PARENT("Admin-Parent Communication"),
        ADMIN_LECTURER("Admin-Lecturer Professional Updates"),
        DEPARTMENT("Department Group"),
        CUSTOM("Custom Group");

        private final String displayName;

        GroupType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    @Column(nullable = false)
    private String createdBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private Boolean isActive = true;

    // Members stored as comma-separated emails
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "chat_group_members", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "member_email")
    private Set<String> memberEmails = new HashSet<>();

    // Admins of the group
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "chat_group_admins", joinColumns = @JoinColumn(name = "group_id"))
    @Column(name = "admin_email")
    private Set<String> adminEmails = new HashSet<>();

    // Group messages
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<ChatGroupMessage> messages = new HashSet<>();

    // Helper methods
    public void addMember(String email) {
        if (email != null && !email.trim().isEmpty()) {
            this.memberEmails.add(email);
        }
    }

    public void removeMember(String email) {
        this.memberEmails.remove(email);
    }

    public void addAdmin(String email) {
        if (email != null && !email.trim().isEmpty()) {
            this.adminEmails.add(email);
            this.memberEmails.add(email); // Admins are also members
        }
    }

    public void removeAdmin(String email) {
        this.adminEmails.remove(email);
    }

    public boolean isMember(String email) {
        return this.memberEmails.contains(email);
    }

    public boolean isAdmin(String email) {
        return this.adminEmails.contains(email);
    }

    @JsonProperty("memberCount")
    public int getMemberCount() {
        return memberEmails != null ? memberEmails.size() : 0;
    }

    @Override
    public String toString() {
        return "ChatGroup{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", type=" + type +
                ", memberCount=" + getMemberCount() +
                ", isActive=" + isActive +
                '}';
    }
}