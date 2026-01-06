package com.unt.academic_system.service;

import com.unt.academic_system.model.*;
import com.unt.academic_system.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatGroupService {

    private static final Logger logger = LoggerFactory.getLogger(ChatGroupService.class);

    @Autowired
    private ChatGroupRepository groupRepository;

    @Autowired
    private ChatGroupMessageRepository groupMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private LecturerRepository lecturerRepository;

    @Autowired
    private AdminRepository adminRepository;

    // ==================== GROUP MANAGEMENT ====================

    @Transactional
    public ChatGroup createGroup(ChatGroup group) {
        try {
            logger.info("Creating group: {}", group.getName());

            if (group.getName() == null || group.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Group name cannot be empty");
            }

            if (group.getType() == null) {
                throw new IllegalArgumentException("Group type is required");
            }

            if (group.getCreatedBy() == null || group.getCreatedBy().trim().isEmpty()) {
                throw new IllegalArgumentException("Creator email is required");
            }

            // Add creator as admin
            group.addAdmin(group.getCreatedBy());

            ChatGroup savedGroup = groupRepository.save(group);
            logger.info("✅ Group created successfully with ID: {}", savedGroup.getId());
            return savedGroup;

        } catch (Exception e) {
            logger.error("❌ Error creating group", e);
            throw new RuntimeException("Failed to create group: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ChatGroup createAdminParentGroup(String adminEmail) {
        try {
            logger.info("Creating Admin-Parent group by: {}", adminEmail);

            // Check if group already exists
            Optional<ChatGroup> existing = groupRepository.findByNameAndType(
                    "Admin-Parent Communication",
                    ChatGroup.GroupType.ADMIN_PARENT
            );

            if (existing.isPresent()) {
                logger.info("Admin-Parent group already exists");
                return existing.get();
            }

            // Get all parents
            List<Parent> parents = parentRepository.findAll();
            logger.info("Found {} parents", parents.size());

            // Get all admins
            List<Admin> admins = adminRepository.findAll();
            logger.info("Found {} admins", admins.size());

            ChatGroup group = new ChatGroup();
            group.setName("Admin-Parent Communication");
            group.setDescription("Official communication channel between administrators and parents");
            group.setType(ChatGroup.GroupType.ADMIN_PARENT);
            group.setCreatedBy(adminEmail);
            group.setIsActive(true);

            // Add all admins as group admins
            for (Admin admin : admins) {
                group.addAdmin(admin.getEmail());
            }

            // Add all parents as members
            for (Parent parent : parents) {
                group.addMember(parent.getEmail());
            }

            ChatGroup savedGroup = groupRepository.save(group);
            logger.info("✅ Admin-Parent group created with {} members", savedGroup.getMemberCount());

            // Send welcome message
            sendSystemMessage(savedGroup.getId(),
                    "Welcome to Admin-Parent Communication Group! " +
                            "This is the official channel for important updates and announcements.");

            return savedGroup;

        } catch (Exception e) {
            logger.error("❌ Error creating Admin-Parent group", e);
            throw new RuntimeException("Failed to create Admin-Parent group: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ChatGroup createAdminLecturerGroup(String adminEmail) {
        try {
            logger.info("Creating Admin-Lecturer group by: {}", adminEmail);

            // Check if group already exists
            Optional<ChatGroup> existing = groupRepository.findByNameAndType(
                    "Admin-Lecturer Professional Updates",
                    ChatGroup.GroupType.ADMIN_LECTURER
            );

            if (existing.isPresent()) {
                logger.info("Admin-Lecturer group already exists");
                return existing.get();
            }

            // Get all lecturers
            List<Lecturer> lecturers = lecturerRepository.findAll();
            logger.info("Found {} lecturers", lecturers.size());

            // Get all admins
            List<Admin> admins = adminRepository.findAll();
            logger.info("Found {} admins", admins.size());

            ChatGroup group = new ChatGroup();
            group.setName("Admin-Lecturer Professional Updates");
            group.setDescription("Professional updates and announcements for lecturers and administrators");
            group.setType(ChatGroup.GroupType.ADMIN_LECTURER);
            group.setCreatedBy(adminEmail);
            group.setIsActive(true);

            // Add all admins as group admins
            for (Admin admin : admins) {
                group.addAdmin(admin.getEmail());
            }

            // Add all lecturers as members
            for (Lecturer lecturer : lecturers) {
                group.addMember(lecturer.getEmail());
            }

            ChatGroup savedGroup = groupRepository.save(group);
            logger.info("✅ Admin-Lecturer group created with {} members", savedGroup.getMemberCount());

            // Send welcome message
            sendSystemMessage(savedGroup.getId(),
                    "Welcome to Admin-Lecturer Professional Updates! " +
                            "Stay informed about important academic and administrative updates.");

            return savedGroup;

        } catch (Exception e) {
            logger.error("❌ Error creating Admin-Lecturer group", e);
            throw new RuntimeException("Failed to create Admin-Lecturer group: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void initializeSystemGroups(String adminEmail) {
        try {
            logger.info("🚀 Initializing system groups...");

            // Create Admin-Parent group
            ChatGroup adminParentGroup = createAdminParentGroup(adminEmail);
            logger.info("✅ Admin-Parent group initialized: {}", adminParentGroup.getId());

            // Create Admin-Lecturer group
            ChatGroup adminLecturerGroup = createAdminLecturerGroup(adminEmail);
            logger.info("✅ Admin-Lecturer group initialized: {}", adminLecturerGroup.getId());

            logger.info("✅ All system groups initialized successfully");

        } catch (Exception e) {
            logger.error("❌ Error initializing system groups", e);
            throw new RuntimeException("Failed to initialize system groups: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<ChatGroup> getUserGroups(String userEmail) {
        try {
            List<ChatGroup> groups = groupRepository.findGroupsByMemberEmail(userEmail);
            logger.info("Found {} groups for user: {}", groups.size(), userEmail);
            return groups;
        } catch (Exception e) {
            logger.error("Error fetching groups for user: {}", userEmail, e);
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public Optional<ChatGroup> getGroupById(Long groupId) {
        return groupRepository.findById(groupId);
    }

    @Transactional(readOnly = true)
    public List<ChatGroup> getAllGroups() {
        return groupRepository.findByIsActiveTrue();
    }

    @Transactional
    public ChatGroup addMemberToGroup(Long groupId, String memberEmail) {
        try {
            Optional<ChatGroup> groupOpt = groupRepository.findById(groupId);
            if (!groupOpt.isPresent()) {
                throw new IllegalArgumentException("Group not found");
            }

            ChatGroup group = groupOpt.get();
            group.addMember(memberEmail);

            ChatGroup savedGroup = groupRepository.save(group);
            logger.info("Added member {} to group {}", memberEmail, groupId);

            // Send system notification
            sendSystemMessage(groupId,
                    String.format("New member joined: %s", memberEmail));

            return savedGroup;

        } catch (Exception e) {
            logger.error("Error adding member to group", e);
            throw new RuntimeException("Failed to add member: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ChatGroup removeMemberFromGroup(Long groupId, String memberEmail) {
        try {
            Optional<ChatGroup> groupOpt = groupRepository.findById(groupId);
            if (!groupOpt.isPresent()) {
                throw new IllegalArgumentException("Group not found");
            }

            ChatGroup group = groupOpt.get();
            group.removeMember(memberEmail);
            group.removeAdmin(memberEmail); // Also remove from admins if present

            ChatGroup savedGroup = groupRepository.save(group);
            logger.info("Removed member {} from group {}", memberEmail, groupId);

            return savedGroup;

        } catch (Exception e) {
            logger.error("Error removing member from group", e);
            throw new RuntimeException("Failed to remove member: " + e.getMessage(), e);
        }
    }

    @Transactional
    public ChatGroup updateGroup(Long groupId, ChatGroup updatedGroup) {
        try {
            Optional<ChatGroup> existingOpt = groupRepository.findById(groupId);
            if (!existingOpt.isPresent()) {
                throw new IllegalArgumentException("Group not found");
            }

            ChatGroup existing = existingOpt.get();

            if (updatedGroup.getName() != null) {
                existing.setName(updatedGroup.getName());
            }
            if (updatedGroup.getDescription() != null) {
                existing.setDescription(updatedGroup.getDescription());
            }
            if (updatedGroup.getIconUrl() != null) {
                existing.setIconUrl(updatedGroup.getIconUrl());
            }

            return groupRepository.save(existing);

        } catch (Exception e) {
            logger.error("Error updating group", e);
            throw new RuntimeException("Failed to update group: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteGroup(Long groupId) {
        try {
            Optional<ChatGroup> groupOpt = groupRepository.findById(groupId);
            if (groupOpt.isPresent()) {
                ChatGroup group = groupOpt.get();
                group.setIsActive(false);
                groupRepository.save(group);
                logger.info("Deactivated group: {}", groupId);
            }
        } catch (Exception e) {
            logger.error("Error deleting group", e);
            throw new RuntimeException("Failed to delete group: " + e.getMessage(), e);
        }
    }

    // ==================== MESSAGE MANAGEMENT ====================

    @Transactional
    public ChatGroupMessage sendMessage(ChatGroupMessage message) {
        try {
            logger.info("Sending group message to group: {}", message.getGroup().getId());

            if (message.getContent() == null || message.getContent().trim().isEmpty()) {
                throw new IllegalArgumentException("Message content cannot be empty");
            }

            if (message.getGroup() == null) {
                throw new IllegalArgumentException("Group is required");
            }

            if (message.getSenderId() == null) {
                throw new IllegalArgumentException("Sender ID is required");
            }

            // Verify sender is a member
            ChatGroup group = groupRepository.findById(message.getGroup().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Group not found"));

            if (!group.isMember(message.getSenderId())) {
                throw new IllegalArgumentException("Sender is not a member of this group");
            }

            message.setTimestamp(LocalDateTime.now());
            message.setStatus("SENT");

            ChatGroupMessage saved = groupMessageRepository.save(message);
            logger.info("✅ Group message saved with ID: {}", saved.getId());
            return saved;

        } catch (Exception e) {
            logger.error("❌ Error sending group message", e);
            throw new RuntimeException("Failed to send message: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void sendSystemMessage(Long groupId, String content) {
        try {
            ChatGroup group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new IllegalArgumentException("Group not found"));

            ChatGroupMessage message = new ChatGroupMessage();
            message.setGroup(group);
            message.setSenderId("SYSTEM");
            message.setSenderName("System");
            message.setContent(content);
            message.setType(ChatGroupMessage.MessageType.SYSTEM);
            message.setTimestamp(LocalDateTime.now());

            groupMessageRepository.save(message);
            logger.info("System message sent to group: {}", groupId);

        } catch (Exception e) {
            logger.error("Error sending system message", e);
        }
    }

    @Transactional(readOnly = true)
    public List<ChatGroupMessage> getGroupMessages(Long groupId, int page, int size) {
        try {
            PageRequest pageRequest = PageRequest.of(page, size, Sort.by("timestamp").descending());
            List<ChatGroupMessage> messages = groupMessageRepository.findByGroupId(groupId, pageRequest);

            // Reverse to get chronological order
            Collections.reverse(messages);

            logger.info("Retrieved {} messages for group: {}", messages.size(), groupId);
            return messages;

        } catch (Exception e) {
            logger.error("Error fetching group messages", e);
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<ChatGroupMessage> getUnreadMessages(Long groupId, String userId) {
        try {
            return groupMessageRepository.findUnreadMessages(groupId, userId);
        } catch (Exception e) {
            logger.error("Error fetching unread messages", e);
            return new ArrayList<>();
        }
    }

    @Transactional
    public void markMessageAsRead(Long messageId, String userId) {
        try {
            Optional<ChatGroupMessage> messageOpt = groupMessageRepository.findById(messageId);
            if (messageOpt.isPresent()) {
                ChatGroupMessage message = messageOpt.get();
                message.addReadBy(userId);
                groupMessageRepository.save(message);
                logger.info("Message {} marked as read by {}", messageId, userId);
            }
        } catch (Exception e) {
            logger.error("Error marking message as read", e);
        }
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long groupId, String userId) {
        try {
            return groupMessageRepository.countUnreadMessages(groupId, userId);
        } catch (Exception e) {
            logger.error("Error counting unread messages", e);
            return 0;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGroupStatistics(Long groupId) {
        try {
            ChatGroup group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new IllegalArgumentException("Group not found"));

            Map<String, Object> stats = new HashMap<>();
            stats.put("memberCount", group.getMemberCount());
            stats.put("totalMessages", groupMessageRepository.countByGroup(group));
            stats.put("groupType", group.getType().toString());
            stats.put("createdAt", group.getCreatedAt());

            return stats;

        } catch (Exception e) {
            logger.error("Error fetching group statistics", e);
            return new HashMap<>();
        }
    }
}