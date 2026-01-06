package com.unt.academic_system.controller;

import com.unt.academic_system.model.ChatGroup;
import com.unt.academic_system.model.ChatGroupMessage;
import com.unt.academic_system.model.User;
import com.unt.academic_system.service.ChatGroupService;
import com.unt.academic_system.service.JwtService;
import com.unt.academic_system.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@Controller
@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class ChatGroupController {

    private static final Logger logger = LoggerFactory.getLogger(ChatGroupController.class);

    @Autowired
    private ChatGroupService groupService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // ==================== GROUP ENDPOINTS ====================

    @GetMapping
    public ResponseEntity<?> getUserGroups(@RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            List<ChatGroup> groups = groupService.getUserGroups(userEmail);

            // Add unread counts
            List<Map<String, Object>> enrichedGroups = new ArrayList<>();
            for (ChatGroup group : groups) {
                Map<String, Object> groupData = new HashMap<>();
                groupData.put("id", group.getId());
                groupData.put("name", group.getName());
                groupData.put("description", group.getDescription());
                groupData.put("iconUrl", group.getIconUrl());
                groupData.put("type", group.getType());
                groupData.put("memberCount", group.getMemberCount());
                groupData.put("createdAt", group.getCreatedAt());
                groupData.put("isAdmin", group.isAdmin(userEmail));
                groupData.put("unreadCount", groupService.getUnreadCount(group.getId(), userEmail));

                enrichedGroups.add(groupData);
            }

            logger.info("✅ Retrieved {} groups for user: {}", groups.size(), userEmail);
            return ResponseEntity.ok(enrichedGroups);

        } catch (Exception e) {
            logger.error("❌ Error fetching user groups", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch groups: " + e.getMessage()));
        }
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroup(@PathVariable Long groupId,
                                      @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ChatGroup group = groupOpt.get();

            // Check if user is a member
            if (!group.isMember(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            Map<String, Object> groupData = new HashMap<>();
            groupData.put("id", group.getId());
            groupData.put("name", group.getName());
            groupData.put("description", group.getDescription());
            groupData.put("iconUrl", group.getIconUrl());
            groupData.put("type", group.getType());
            groupData.put("memberCount", group.getMemberCount());
            groupData.put("createdBy", group.getCreatedBy());
            groupData.put("createdAt", group.getCreatedAt());
            groupData.put("isAdmin", group.isAdmin(userEmail));
            groupData.put("memberEmails", group.getMemberEmails());
            groupData.put("adminEmails", group.getAdminEmails());

            return ResponseEntity.ok(groupData);

        } catch (Exception e) {
            logger.error("Error fetching group", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch group"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> requestBody,
                                         @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            String name = (String) requestBody.get("name");
            String description = (String) requestBody.get("description");
            String typeStr = (String) requestBody.get("type");
            List<String> memberEmails = (List<String>) requestBody.get("memberEmails");

            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Group name is required"));
            }

            ChatGroup group = new ChatGroup();
            group.setName(name);
            group.setDescription(description);
            group.setCreatedBy(userEmail);

            if (typeStr != null) {
                try {
                    group.setType(ChatGroup.GroupType.valueOf(typeStr));
                } catch (IllegalArgumentException e) {
                    group.setType(ChatGroup.GroupType.CUSTOM);
                }
            } else {
                group.setType(ChatGroup.GroupType.CUSTOM);
            }

            // Add creator as admin
            group.addAdmin(userEmail);

            // Add other members
            if (memberEmails != null) {
                for (String email : memberEmails) {
                    group.addMember(email);
                }
            }

            ChatGroup savedGroup = groupService.createGroup(group);

            // Notify all members
            for (String memberEmail : savedGroup.getMemberEmails()) {
                messagingTemplate.convertAndSendToUser(memberEmail, "/queue/group",
                        Map.of("action", "GROUP_CREATED", "group", savedGroup));
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(savedGroup);

        } catch (Exception e) {
            logger.error("Error creating group", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create group: " + e.getMessage()));
        }
    }

    @PostMapping("/initialize-system-groups")
    public ResponseEntity<?> initializeSystemGroups(@RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String adminEmail = jwtService.getEmailFromToken(token);

            // Verify user is an admin
            Optional<User> userOpt = userService.findByEmail(adminEmail);
            if (!userOpt.isPresent() || !userOpt.get().getRole().toString().equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only administrators can initialize system groups"));
            }

            groupService.initializeSystemGroups(adminEmail);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "System groups initialized successfully"
            ));

        } catch (Exception e) {
            logger.error("Error initializing system groups", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to initialize system groups: " + e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<?> addMember(@PathVariable Long groupId,
                                       @RequestBody Map<String, String> request,
                                       @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);
            String memberEmail = request.get("memberEmail");

            // Verify user is group admin
            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            if (!groupOpt.get().isAdmin(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only group admins can add members"));
            }

            ChatGroup updatedGroup = groupService.addMemberToGroup(groupId, memberEmail);

            // Notify new member
            messagingTemplate.convertAndSendToUser(memberEmail, "/queue/group",
                    Map.of("action", "ADDED_TO_GROUP", "group", updatedGroup));

            return ResponseEntity.ok(updatedGroup);

        } catch (Exception e) {
            logger.error("Error adding member", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add member"));
        }
    }

    @DeleteMapping("/{groupId}/members/{memberEmail}")
    public ResponseEntity<?> removeMember(@PathVariable Long groupId,
                                          @PathVariable String memberEmail,
                                          @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            if (!groupOpt.get().isAdmin(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only group admins can remove members"));
            }

            ChatGroup updatedGroup = groupService.removeMemberFromGroup(groupId, memberEmail);

            // Notify removed member
            messagingTemplate.convertAndSendToUser(memberEmail, "/queue/group",
                    Map.of("action", "REMOVED_FROM_GROUP", "groupId", groupId));

            return ResponseEntity.ok(updatedGroup);

        } catch (Exception e) {
            logger.error("Error removing member", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to remove member"));
        }
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<?> updateGroup(@PathVariable Long groupId,
                                         @RequestBody ChatGroup updatedGroup,
                                         @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            if (!groupOpt.get().isAdmin(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only group admins can update the group"));
            }

            ChatGroup updated = groupService.updateGroup(groupId, updatedGroup);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            logger.error("Error updating group", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update group"));
        }
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId,
                                         @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            if (!groupOpt.get().isAdmin(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only group admins can delete the group"));
            }

            groupService.deleteGroup(groupId);
            return ResponseEntity.ok(Map.of("success", true));

        } catch (Exception e) {
            logger.error("Error deleting group", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete group"));
        }
    }

    // ==================== MESSAGE ENDPOINTS ====================

    @GetMapping("/{groupId}/messages")
    public ResponseEntity<?> getGroupMessages(@PathVariable Long groupId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "50") int size,
                                              @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            if (!groupOpt.get().isMember(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            List<ChatGroupMessage> messages = groupService.getGroupMessages(groupId, page, size);
            return ResponseEntity.ok(messages);

        } catch (Exception e) {
            logger.error("Error fetching group messages", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch messages"));
        }
    }

    @PostMapping("/{groupId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable Long groupId,
                                         @RequestBody ChatGroupMessage message,
                                         @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ChatGroup group = groupOpt.get();
            if (!group.isMember(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Only group members can send messages"));
            }

            message.setGroup(group);
            message.setSenderId(userEmail);

            // Get sender name from database
            Optional<User> userOpt = userService.findByEmail(userEmail);
            if (userOpt.isPresent()) {
                message.setSenderName(userOpt.get().getFullName());
            } else {
                message.setSenderName(userEmail);
            }

            ChatGroupMessage savedMessage = groupService.sendMessage(message);

            // Broadcast to all group members
            for (String memberEmail : group.getMemberEmails()) {
                if (!memberEmail.equals(userEmail)) {
                    messagingTemplate.convertAndSendToUser(memberEmail, "/queue/group",
                            savedMessage);
                }
            }

            return ResponseEntity.ok(savedMessage);

        } catch (Exception e) {
            logger.error("Error sending group message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send message: " + e.getMessage()));
        }
    }

    @PostMapping("/{groupId}/upload-media")
    public ResponseEntity<?> uploadMedia(@PathVariable Long groupId,
                                         @RequestParam("file") MultipartFile file,
                                         @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            ChatGroup group = groupOpt.get();
            if (!group.isMember(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            // TODO: Implement file upload logic similar to private chat
            // For now, return not implemented
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                    .body(Map.of("message", "File upload for groups coming soon"));

        } catch (Exception e) {
            logger.error("Error uploading media to group", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload media"));
        }
    }

    @PostMapping("/{groupId}/messages/{messageId}/read")
    public ResponseEntity<?> markMessageAsRead(@PathVariable Long groupId,
                                               @PathVariable Long messageId,
                                               @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            groupService.markMessageAsRead(messageId, userEmail);
            return ResponseEntity.ok(Map.of("success", true));

        } catch (Exception e) {
            logger.error("Error marking message as read", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to mark message as read"));
        }
    }

    @GetMapping("/{groupId}/statistics")
    public ResponseEntity<?> getGroupStatistics(@PathVariable Long groupId,
                                                @RequestHeader(value = "Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String userEmail = jwtService.getEmailFromToken(token);

            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            if (!groupOpt.get().isMember(userEmail)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Access denied"));
            }

            Map<String, Object> stats = groupService.getGroupStatistics(groupId);
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            logger.error("Error fetching group statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch statistics"));
        }
    }



    @MessageMapping("/chat.group")
    public void sendGroupMessage(@Payload ChatGroupMessage message, Principal principal) {
        try {
            logger.info("📨 Receiving group message via WebSocket");

            if (principal == null) {
                logger.error("❌ Principal is null");
                return;
            }

            logger.info("Sender: {}", principal.getName());
            logger.info("Message payload: {}", message);

            // Extract group ID from the message
            Long groupId = null;
            if (message.getGroup() != null) {
                groupId = message.getGroup().getId();
                logger.info("Group ID from message.getGroup(): {}", groupId);
            }

            if (groupId == null) {
                logger.error("❌ Group ID is null in message payload");

                // Send error back to sender
                messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors",
                        Map.of("error", "Group ID is required", "messageContent", message.getContent()));
                return;
            }

            // Set sender information
            message.setSenderId(principal.getName());

            // Get sender name from database
            Optional<User> userOpt = userService.findByEmail(principal.getName());
            if (userOpt.isPresent()) {
                message.setSenderName(userOpt.get().getFullName());
            } else {
                message.setSenderName(principal.getName());
            }

            message.setTimestamp(LocalDateTime.now());

            // Fetch the full group entity
            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                logger.error("❌ Group not found: {}", groupId);
                messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors",
                        Map.of("error", "Group not found", "groupId", groupId));
                return;
            }

            ChatGroup group = groupOpt.get();

            // Verify sender is a member
            if (!group.isMember(principal.getName())) {
                logger.error("❌ Sender is not a member of group: {}", groupId);
                messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors",
                        Map.of("error", "You are not a member of this group"));
                return;
            }

            message.setGroup(group);

            // Save the message
            ChatGroupMessage savedMessage = groupService.sendMessage(message);
            logger.info("✅ Message saved with ID: {}", savedMessage.getId());

            // Broadcast to all group members
            int successCount = 0;
            int failCount = 0;

            for (String memberEmail : group.getMemberEmails()) {
                try {
                    messagingTemplate.convertAndSendToUser(memberEmail, "/queue/group", savedMessage);
                    successCount++;
                } catch (Exception e) {
                    logger.error("❌ Error sending message to user: {}", memberEmail, e);
                    failCount++;
                }
            }

            logger.info("✅ Group message broadcast complete: {} success, {} failed", successCount, failCount);

        } catch (Exception e) {
            logger.error("❌ Error sending group message via WebSocket", e);
            if (principal != null) {
                try {
                    messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors",
                            Map.of("error", "Failed to send group message: " + e.getMessage()));
                } catch (Exception ex) {
                    logger.error("❌ Error sending error message", ex);
                }
            }
        }
    }





    @MessageMapping("/group.typing")
    public void groupTyping(@Payload Map<String, Object> payload, Principal principal) {
        try {
            logger.debug("📝 Receiving group typing indicator");

            if (principal == null) {
                logger.warn("⚠️ Principal is null in group typing");
                return;
            }

            if (payload == null) {
                logger.warn("⚠️ Payload is null in group typing");
                return;
            }

            // Extract groupId safely
            Object groupIdObj = payload.get("groupId");
            if (groupIdObj == null) {
                logger.warn("⚠️ groupId is null in payload");
                return;
            }

            Long groupId;
            try {
                groupId = Long.valueOf(groupIdObj.toString());
            } catch (NumberFormatException e) {
                logger.error("❌ Invalid groupId format: {}", groupIdObj);
                return;
            }

            // Extract isTyping safely
            Object isTypingObj = payload.get("isTyping");
            boolean isTyping = isTypingObj != null && Boolean.parseBoolean(isTypingObj.toString());

            // Get sender name safely
            String senderName = payload.get("senderName") != null ?
                    payload.get("senderName").toString() :
                    principal.getName();

            // Verify group exists
            Optional<ChatGroup> groupOpt = groupService.getGroupById(groupId);
            if (!groupOpt.isPresent()) {
                logger.warn("⚠️ Group not found: {}", groupId);
                return;
            }

            ChatGroup group = groupOpt.get();

            // Create typing indicator message using HashMap to avoid null issues
            Map<String, Object> typingMessage = new HashMap<>();
            typingMessage.put("groupId", groupId);
            typingMessage.put("senderId", principal.getName());
            typingMessage.put("senderName", senderName);
            typingMessage.put("isTyping", isTyping);

            // Broadcast typing indicator to all members except sender
            for (String memberEmail : group.getMemberEmails()) {
                if (!memberEmail.equals(principal.getName())) {
                    try {
                        messagingTemplate.convertAndSendToUser(memberEmail, "/queue/typing", typingMessage);
                    } catch (Exception e) {
                        logger.error("❌ Error sending typing indicator to: {}", memberEmail, e);
                    }
                }
            }

            logger.debug("✅ Group typing indicator broadcast successfully");

        } catch (Exception e) {
            logger.error("❌ Error handling group typing indicator", e);
        }
    }
}