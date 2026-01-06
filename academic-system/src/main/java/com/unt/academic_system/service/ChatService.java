
package com.unt.academic_system.service;


import com.unt.academic_system.model.ChatMessage;
import com.unt.academic_system.repository.ChatMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ChatService {
    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);
    private final ChatMessageRepository chatMessageRepository;

    // In-memory storage for user online status
    private final Map<String, UserStatus> userStatusMap = new ConcurrentHashMap<>();

    // File upload configuration
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-file-size:52428800}") // 50MB default
    private long maxFileSize;

    // Allowed file types
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
            "video/mp4", "video/avi", "video/mov", "video/wmv", "video/webm"
    );

    private static final Set<String> ALLOWED_AUDIO_TYPES = Set.of(
            "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/mpeg"
    );

    private static final Set<String> ALLOWED_DOCUMENT_TYPES = Set.of(
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    public ChatService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @jakarta.annotation.PostConstruct
    private void initializeUploadDirectory() {
        try {
            // Ensure uploadDir is not null or empty
            if (uploadDir == null || uploadDir.trim().isEmpty()) {
                uploadDir = "uploads"; // Default fallback
                logger.warn("Upload directory was null/empty, using default: {}", uploadDir);
            }

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                logger.info("Created upload directory: {}", uploadPath.toAbsolutePath());
            } else {
                logger.info("Upload directory already exists: {}", uploadPath.toAbsolutePath());
            }
        } catch (IOException e) {
            logger.error("Failed to create upload directory: {}", uploadDir, e);
            throw new RuntimeException("Cannot initialize upload directory", e);
        }
    }


    @Transactional
    public ChatMessage saveMessage(ChatMessage chatMessage) {
        logger.info("==========================================");
        logger.info("ATTEMPTING TO SAVE MESSAGE");
        logger.info("Message ID: {}", chatMessage.getId());
        logger.info("Sender: {}", chatMessage.getSenderId());
        logger.info("Recipient: {}", chatMessage.getRecipientId());
        logger.info("Content: {}", chatMessage.getContent());
        logger.info("Type: {}", chatMessage.getType());
        logger.info("Timestamp: {}", chatMessage.getTimestamp());
        logger.info("==========================================");

        int maxRetries = 3;
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                if (chatMessage == null) {
                    logger.error("CRITICAL: Chat message is NULL");
                    throw new IllegalArgumentException("Chat message cannot be null");
                }

                if (chatMessage.getSenderId() == null || chatMessage.getSenderId().trim().isEmpty()) {
                    logger.error("CRITICAL: Sender ID is null or empty");
                    throw new IllegalArgumentException("Sender ID cannot be null or empty");
                }

                if (chatMessage.getRecipientId() == null || chatMessage.getRecipientId().trim().isEmpty()) {
                    logger.error("CRITICAL: Recipient ID is null or empty");
                    throw new IllegalArgumentException("Recipient ID cannot be null or empty");
                }

                if (chatMessage.getTimestamp() == null) {
                    logger.warn("Timestamp was null, setting to now");
                    chatMessage.setTimestamp(LocalDateTime.now());
                }

                if (chatMessage.getId() == null) {
                    logger.info("New message - setting defaults");
                    chatMessage.setRead(false);
                }

                if (chatMessage.getStatus() == null) {
                    logger.info("Status was null, setting to SENT");
                    chatMessage.setStatus("SENT");
                }

                if (chatMessage.getType() == null) {
                    logger.info("Type was null, setting to CHAT");
                    chatMessage.setType(ChatMessage.MessageType.CHAT);
                }

                logger.info("Calling repository.save()...");
                ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
                logger.info("✅ MESSAGE SAVED SUCCESSFULLY!");
                logger.info("Saved Message ID: {}", savedMessage.getId());
                logger.info("Saved Message Content: {}", savedMessage.getContent());
                logger.info("==========================================");
                return savedMessage;

            } catch (org.hibernate.StaleObjectStateException e) {
                retryCount++;
                logger.warn("StaleObjectStateException on attempt {}/{}, retrying...", retryCount, maxRetries, e);
                if (retryCount >= maxRetries) {
                    logger.error("❌ FAILED to save message after {} retries", maxRetries, e);
                    throw new RuntimeException("Failed to save message after retries", e);
                }
                try {
                    Thread.sleep(100);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
            } catch (IllegalArgumentException e) {
                logger.error("❌ INVALID MESSAGE DATA: {}", e.getMessage(), e);
                throw e;
            } catch (Exception e) {
                logger.error("❌ UNEXPECTED ERROR saving message", e);
                logger.error("Exception type: {}", e.getClass().getName());
                logger.error("Exception message: {}", e.getMessage());
                if (e.getCause() != null) {
                    logger.error("Caused by: {}", e.getCause().getMessage());
                }
                throw new RuntimeException("Failed to save message", e);
            }
        }
        logger.error("❌ CRITICAL: Exited retry loop without saving");
        throw new RuntimeException("Failed to save message after retries");
    }




    @Transactional(readOnly = true)
    public ChatMessage getMessageById(Long messageId) {
        try {
            if (messageId == null) {
                throw new IllegalArgumentException("Message ID cannot be null");
            }

            Optional<ChatMessage> messageOpt = chatMessageRepository.findById(messageId);
            if (messageOpt.isPresent()) {
                logger.debug("Retrieved message with ID: {}", messageId);
                return messageOpt.get();
            } else {
                logger.warn("Message not found with ID: {}", messageId);
                return null;
            }
        } catch (Exception e) {
            logger.error("Error retrieving message with ID: {}", messageId, e);
            return null;
        }
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(String fileUrl) throws IOException {
        try {
            if (fileUrl == null || fileUrl.trim().isEmpty()) {
                throw new IllegalArgumentException("File URL cannot be null or empty");
            }

            String cleanFileUrl = fileUrl.startsWith("/uploads/") ?
                    fileUrl.substring("/uploads/".length()) : fileUrl;

            Path filePath = Paths.get(uploadDir).resolve(cleanFileUrl).normalize();

            if (!Files.exists(filePath)) {
                throw new IOException("File not found: " + filePath);
            }

            Path uploadPath = Paths.get(uploadDir).normalize();
            if (!filePath.startsWith(uploadPath)) {
                throw new IOException("File is outside upload directory");
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                logger.debug("Successfully loaded file resource: {}", filePath);
                return resource;
            } else {
                throw new IOException("File not readable: " + filePath);
            }

        } catch (Exception e) {
            logger.error("Error loading file as resource: {}", fileUrl, e);
            throw new IOException("Could not load file: " + fileUrl, e);
        }
    }

    @Transactional(readOnly = true)
    public Resource generateThumbnail(String fileUrl) throws IOException {
        try {
            if (fileUrl == null || fileUrl.trim().isEmpty()) {
                throw new IllegalArgumentException("File URL cannot be null or empty");
            }

            Resource originalResource = loadFileAsResource(fileUrl);
            BufferedImage originalImage = ImageIO.read(originalResource.getInputStream());

            if (originalImage == null) {
                throw new IOException("Could not read image file");
            }

            int maxSize = 200;
            int originalWidth = originalImage.getWidth();
            int originalHeight = originalImage.getHeight();

            double scaleFactor = Math.min(
                    (double) maxSize / originalWidth,
                    (double) maxSize / originalHeight
            );

            int thumbnailWidth = (int) (originalWidth * scaleFactor);
            int thumbnailHeight = (int) (originalHeight * scaleFactor);

            BufferedImage thumbnail = new BufferedImage(
                    thumbnailWidth, thumbnailHeight, BufferedImage.TYPE_INT_RGB
            );

            Graphics2D g2d = thumbnail.createGraphics();
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            g2d.drawImage(originalImage, 0, 0, thumbnailWidth, thumbnailHeight, null);
            g2d.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(thumbnail, "jpg", baos);
            byte[] thumbnailBytes = baos.toByteArray();

            return new ByteArrayResource(thumbnailBytes) {
                @Override
                public String getFilename() {
                    return "thumbnail.jpg";
                }
            };

        } catch (Exception e) {
            logger.error("Error generating thumbnail for: {}", fileUrl, e);
            throw new IOException("Could not generate thumbnail", e);
        }
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getConversationMedia(String senderId, String recipientId,
                                                  String type, int page, int size) {
        try {
            validateUserIds(senderId, recipientId);

            if (page < 0) page = 0;
            if (size <= 0 || size > 100) size = 20;

            PageRequest pageRequest = PageRequest.of(page, size, Sort.by("timestamp").descending());

            List<ChatMessage> mediaMessages;

            if (type != null && !type.trim().isEmpty()) {
                ChatMessage.MessageType messageType;
                try {
                    messageType = ChatMessage.MessageType.valueOf(type.toUpperCase());
                } catch (IllegalArgumentException e) {
                    logger.warn("Invalid message type: {}, using default", type);
                    messageType = ChatMessage.MessageType.IMAGE;
                }

                mediaMessages = chatMessageRepository.findConversationMediaByType(
                        senderId, recipientId, messageType, pageRequest);
            } else {
                mediaMessages = chatMessageRepository.findConversationMedia(
                        senderId, recipientId, pageRequest);
            }

            logger.debug("Retrieved {} media messages for conversation between {} and {} (type: {})",
                    mediaMessages.size(), senderId, recipientId, type);

            return mediaMessages.stream()
                    .filter(msg -> msg.getFileUrl() != null)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            logger.error("Error retrieving conversation media", e);
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public Resource generateMediaPreview(ChatMessage message) throws IOException {
        switch (message.getType()) {
            case IMAGE:
                return generateThumbnail(message.getFileUrl());
            case VIDEO:
                return generateVideoThumbnail(message.getFileUrl());
            case DOCUMENT:
                return generateDocumentPreview(message.getFileUrl());
            case AUDIO:
                return generateAudioPreview(message.getFileUrl());
            default:
                return generateDefaultPreview();
        }
    }

    private Resource generateVideoThumbnail(String videoUrl) throws IOException {
        Path path = Paths.get(uploadDir).resolve(videoUrl.replace("/uploads/", ""));
        BufferedImage thumbnail = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = thumbnail.createGraphics();
        graphics.setColor(new Color(200, 200, 255));
        graphics.fillRect(0, 0, 200, 200);
        graphics.setColor(Color.RED);
        graphics.fillPolygon(
                new int[]{80, 80, 140},
                new int[]{70, 130, 100},
                3
        );
        graphics.setColor(Color.BLACK);
        graphics.setFont(new Font("Arial", Font.BOLD, 16));
        graphics.drawString("VIDEO", 75, 160);
        graphics.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(thumbnail, "jpg", baos);
        byte[] bytes = baos.toByteArray();

        return new ByteArrayResource(bytes);
    }

    private Resource generateDocumentPreview(String fileUrl) throws IOException {
        BufferedImage image = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, 200, 200);
        graphics.setColor(Color.BLUE);
        graphics.drawString("PDF", 80, 100);
        graphics.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        byte[] bytes = baos.toByteArray();

        return new ByteArrayResource(bytes);
    }

    private Resource generateAudioPreview(String fileUrl) throws IOException {
        BufferedImage image = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, 200, 200);
        graphics.setColor(Color.GREEN);
        for (int i = 0; i < 5; i++) {
            int height = 20 + (int)(Math.random() * 60);
            graphics.fillRect(60 + i * 20, 100 - height/2, 10, height);
        }
        graphics.drawString("AUDIO", 70, 160);
        graphics.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        byte[] bytes = baos.toByteArray();

        return new ByteArrayResource(bytes);
    }

    private Resource generateDefaultPreview() throws IOException {
        BufferedImage image = new BufferedImage(200, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, 200, 200);
        graphics.setColor(Color.GRAY);
        graphics.drawString("FILE", 80, 100);
        graphics.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        byte[] bytes = baos.toByteArray();

        return new ByteArrayResource(bytes);
    }

    private boolean isImageFile(String contentType) {
        return contentType != null && ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase());
    }

    private boolean isVideoFile(String contentType) {
        return contentType != null && ALLOWED_VIDEO_TYPES.contains(contentType.toLowerCase());
    }

    private boolean isAudioFile(String contentType) {
        return contentType != null && ALLOWED_AUDIO_TYPES.contains(contentType.toLowerCase());
    }

    private boolean isDocumentFile(String contentType) {
        return contentType != null && ALLOWED_DOCUMENT_TYPES.contains(contentType.toLowerCase());
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getUserMedia(String userId, String mediaType, int page, int size) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                throw new IllegalArgumentException("User ID cannot be null or empty");
            }

            if (page < 0) page = 0;
            if (size <= 0 || size > 100) size = 20;

            PageRequest pageRequest = PageRequest.of(page, size, Sort.by("timestamp").descending());

            List<ChatMessage> mediaMessages;

            if (mediaType != null && !mediaType.trim().isEmpty()) {
                ChatMessage.MessageType messageType;
                try {
                    messageType = ChatMessage.MessageType.valueOf(mediaType.toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Invalid media type: " + mediaType);
                }

                mediaMessages = chatMessageRepository.findUserMediaByType(userId, messageType, pageRequest);
            } else {
                mediaMessages = chatMessageRepository.findUserMedia(userId, pageRequest);
            }

            logger.debug("Retrieved {} media files for user {} (type: {})",
                    mediaMessages.size(), userId, mediaType);

            return mediaMessages;

        } catch (Exception e) {
            logger.error("Error retrieving user media for user: {}", userId, e);
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getChatHistory(String senderId, String recipientId) {
        try {
            validateUserIds(senderId, recipientId);

            PageRequest pageRequest = PageRequest.of(0, 100, Sort.by("timestamp").descending());
            List<ChatMessage> messages = chatMessageRepository.findBySenderIdAndRecipientId(
                    senderId, recipientId, pageRequest);

            List<ChatMessage> chronologicalMessages = new ArrayList<>(messages);
            Collections.reverse(chronologicalMessages);

            logger.debug("Retrieved {} messages for conversation between {} and {}",
                    chronologicalMessages.size(), senderId, recipientId);
            return chronologicalMessages;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid parameters for chat history: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error retrieving chat history for {} and {}", senderId, recipientId, e);
            return new ArrayList<>();
        }
    }




    @Transactional(readOnly = true)
    public List<ChatMessage> getChatHistoryPaginated(String senderId, String recipientId, int page, int size) {
        logger.info("📚 Getting chat history from service");
        logger.info("   Sender: {}", senderId);
        logger.info("   Recipient: {}", recipientId);
        logger.info("   Page: {}, Size: {}", page, size);

        try {
            // Validate inputs
            if (senderId == null || senderId.trim().isEmpty()) {
                throw new IllegalArgumentException("Sender ID cannot be null or empty");
            }

            if (recipientId == null || recipientId.trim().isEmpty()) {
                throw new IllegalArgumentException("Recipient ID cannot be null or empty");
            }

            if (page < 0) page = 0;
            if (size <= 0 || size > 100) size = 50;

            // Normalize email addresses (trim and lowercase)
            String normalizedSender = senderId.trim().toLowerCase();
            String normalizedRecipient = recipientId.trim().toLowerCase();

            logger.info("🔍 Querying conversation between: {} <-> {}", normalizedSender, normalizedRecipient);

            // Create pageable with descending order (newest first from DB)
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));

            // Query for bidirectional conversation
            List<ChatMessage> messages = chatMessageRepository.findConversationMessages(
                    normalizedSender,
                    normalizedRecipient,
                    pageable
            );

            logger.info("✅ Found {} messages in database", messages.size());

            // Reverse to get chronological order for display
            List<ChatMessage> chronologicalMessages = new ArrayList<>(messages);
            Collections.reverse(chronologicalMessages);

            // Log sample messages for debugging
            if (!chronologicalMessages.isEmpty()) {
                logger.info("📧 Sample messages:");
                chronologicalMessages.stream().limit(3).forEach(msg -> {
                    logger.info("   {} -> {}: {}",
                            msg.getSenderId(),
                            msg.getRecipientId(),
                            msg.getContent() != null && msg.getContent().length() > 30 ?
                                    msg.getContent().substring(0, 30) + "..." :
                                    msg.getContent());
                });
            }

            return chronologicalMessages;

        } catch (Exception e) {
            logger.error("❌ Error in getChatHistoryPaginated", e);
            throw new RuntimeException("Failed to fetch chat history: " + e.getMessage(), e);
        }
    }







    @Transactional(readOnly = true)
    public List<ChatMessage> getUnreadMessages(String recipientId) {
        try {
            if (recipientId == null || recipientId.trim().isEmpty()) {
                throw new IllegalArgumentException("Recipient ID cannot be null or empty");
            }

            List<ChatMessage> unreadMessages = chatMessageRepository.findByRecipientIdAndReadFalse(recipientId);
            logger.debug("Found {} unread messages for user {}", unreadMessages.size(), recipientId);
            return unreadMessages;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid recipient ID: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error retrieving unread messages for user {}", recipientId, e);
            return new ArrayList<>();
        }
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getNewMessages(String username, LocalDateTime cutoffTime) {
        try {
            if (username == null || username.trim().isEmpty()) {
                throw new IllegalArgumentException("Username cannot be null or empty");
            }

            if (cutoffTime == null) {
                cutoffTime = LocalDateTime.now().minusHours(24);
            }

            List<ChatMessage> unreadMessages = chatMessageRepository.findByRecipientIdAndReadFalse(username);

            List<ChatMessage> recentMessages = chatMessageRepository.findRecentMessages(cutoffTime)
                    .stream()
                    .filter(message ->
                            message.getRecipientId().equals(username) ||
                                    message.getSenderId().equals(username))
                    .collect(Collectors.toList());

            List<ChatMessage> allMessages = new ArrayList<>(unreadMessages);
            for (ChatMessage message : recentMessages) {
                if (!containsMessage(allMessages, message)) {
                    allMessages.add(message);
                }
            }

            allMessages.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

            logger.debug("Retrieved {} new messages for user {}", allMessages.size(), username);
            return allMessages;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error retrieving new messages for user {}", username, e);
            return new ArrayList<>();
        }
    }

    private boolean containsMessage(List<ChatMessage> messages, ChatMessage targetMessage) {
        return messages.stream()
                .anyMatch(message -> message.getId() != null &&
                        message.getId().equals(targetMessage.getId()));
    }

    @Transactional
    public void markMessageAsRead(Long messageId, String username) {
        try {
            if (messageId == null) {
                throw new IllegalArgumentException("Message ID cannot be null");
            }

            if (username == null || username.trim().isEmpty()) {
                throw new IllegalArgumentException("Username cannot be null or empty");
            }

            Optional<ChatMessage> messageOpt = chatMessageRepository.findById(messageId);

            if (messageOpt.isPresent()) {
                ChatMessage message = messageOpt.get();

                if (message.getRecipientId().equals(username)) {
                    message.setRead(true);
                    message.setStatus("READ");
                    chatMessageRepository.save(message);
                    logger.info("Message {} marked as read by {}", messageId, username);
                } else {
                    logger.warn("User {} attempted to mark message {} as read but is not the recipient",
                            username, messageId);
                    throw new IllegalArgumentException("User is not authorized to mark this message as read");
                }
            } else {
                logger.warn("Attempted to mark non-existent message {} as read", messageId);
                throw new IllegalArgumentException("Message not found");
            }
        } catch (IllegalArgumentException e) {
            logger.error("Invalid parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error marking message {} as read by user {}", messageId, username, e);
            throw new RuntimeException("Failed to mark message as read", e);
        }
    }

    @Transactional
    public void markAllMessagesAsRead(String recipientId, String senderId) {
        try {
            if (recipientId == null || recipientId.trim().isEmpty()) {
                throw new IllegalArgumentException("Recipient ID cannot be null or empty");
            }

            List<ChatMessage> unreadMessages = chatMessageRepository.findByRecipientIdAndReadFalse(recipientId);

            List<ChatMessage> messagesToUpdate = unreadMessages.stream()
                    .filter(message -> senderId == null || message.getSenderId().equals(senderId))
                    .collect(Collectors.toList());

            for (ChatMessage message : messagesToUpdate) {
                message.setRead(true);
                message.setStatus("READ");
            }

            if (!messagesToUpdate.isEmpty()) {
                chatMessageRepository.saveAll(messagesToUpdate);
                logger.info("Marked {} messages as read for recipient {} from sender {}",
                        messagesToUpdate.size(), recipientId, senderId);
            }
        } catch (IllegalArgumentException e) {
            logger.error("Invalid parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error marking all messages as read for recipient {} from sender {}",
                    recipientId, senderId, e);
            throw new RuntimeException("Failed to mark messages as read", e);
        }
    }

    @Transactional
    public boolean deleteMessage(Long messageId, String username) {
        try {
            if (messageId == null) {
                throw new IllegalArgumentException("Message ID cannot be null");
            }

            if (username == null || username.trim().isEmpty()) {
                throw new IllegalArgumentException("Username cannot be null or empty");
            }

            Optional<ChatMessage> messageOpt = chatMessageRepository.findById(messageId);

            if (messageOpt.isPresent()) {
                ChatMessage message = messageOpt.get();

                if (message.getSenderId().equals(username) || message.getRecipientId().equals(username)) {
                    chatMessageRepository.deleteById(messageId);
                    logger.info("Message {} deleted by user {}", messageId, username);
                    return true;
                } else {
                    logger.warn("User {} attempted to delete message {} but is not authorized", username, messageId);
                    return false;
                }
            } else {
                logger.warn("Attempted to delete non-existent message {}", messageId);
                return false;
            }
        } catch (IllegalArgumentException e) {
            logger.error("Invalid parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error deleting message {} by user {}", messageId, username, e);
            return false;
        }
    }

    public void updateUserStatus(String userId, String status) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                throw new IllegalArgumentException("User ID cannot be null or empty");
            }

            if (status == null || status.trim().isEmpty()) {
                throw new IllegalArgumentException("Status cannot be null or empty");
            }

            UserStatus userStatus = userStatusMap.getOrDefault(userId, new UserStatus());
            userStatus.setStatus(status.toUpperCase());
            userStatus.setLastSeen(LocalDateTime.now());
            userStatusMap.put(userId, userStatus);

            logger.debug("Updated status for user {} to {}", userId, status);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error updating status for user {}", userId, e);
        }
    }

    public boolean isUserOnline(String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                return false;
            }

            UserStatus userStatus = userStatusMap.get(userId);
            if (userStatus == null) {
                return false;
            }

            return "ONLINE".equals(userStatus.getStatus()) &&
                    userStatus.getLastSeen().isAfter(LocalDateTime.now().minusMinutes(5));
        } catch (Exception e) {
            logger.error("Error checking online status for user {}", userId, e);
            return false;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getContactsStatus(String username) {
        try {
            if (username == null || username.trim().isEmpty()) {
                throw new IllegalArgumentException("Username cannot be null or empty");
            }

            Map<String, Object> contactsStatus = new HashMap<>();
            Set<String> contactIds = getContactIds(username);

            Map<String, Object> onlineUsers = new HashMap<>();
            Map<String, Object> offlineUsers = new HashMap<>();

            for (String contactId : contactIds) {
                UserStatus status = userStatusMap.get(contactId);
                Map<String, Object> contactInfo = new HashMap<>();

                if (status != null) {
                    contactInfo.put("status", status.getStatus());
                    contactInfo.put("lastSeen", status.getLastSeen());

                    if (isUserOnline(contactId)) {
                        onlineUsers.put(contactId, contactInfo);
                    } else {
                        offlineUsers.put(contactId, contactInfo);
                    }
                } else {
                    contactInfo.put("status", "OFFLINE");
                    contactInfo.put("lastSeen", null);
                    offlineUsers.put(contactId, contactInfo);
                }
            }

            contactsStatus.put("online", onlineUsers);
            contactsStatus.put("offline", offlineUsers);
            contactsStatus.put("totalContacts", contactIds.size());

            logger.debug("Retrieved status for {} contacts of user {}", contactIds.size(), username);
            return contactsStatus;

        } catch (IllegalArgumentException e) {
            logger.error("Invalid parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error retrieving contacts status for user {}", username, e);
            return new HashMap<>();
        }
    }

    private Set<String> getContactIds(String username) {
        try {
            Set<String> contactIds = new HashSet<>();
            List<ChatMessage> sentMessages = chatMessageRepository.findBySenderId(username);
            contactIds.addAll(sentMessages.stream()
                    .map(ChatMessage::getRecipientId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet()));

            List<ChatMessage> receivedMessages = chatMessageRepository.findByRecipientId(username);
            contactIds.addAll(receivedMessages.stream()
                    .map(ChatMessage::getSenderId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet()));

            contactIds.remove(username);
            return contactIds;
        } catch (Exception e) {
            logger.error("Error retrieving contact IDs for user {}", username, e);
            return new HashSet<>();
        }
    }

    @Transactional
    public String saveMediaFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds limit of " +
                    (maxFileSize / (1024 * 1024)) + "MB");
        }

        String contentType = file.getContentType();
        if (!isAllowedFileType(contentType)) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileExtension = originalFilename.contains(".") ?
                originalFilename.substring(originalFilename.lastIndexOf(".")) : "";
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/" + uniqueFilename;
    }

    private boolean isAllowedFileType(String contentType) {
        if (contentType == null) return false;

        return ALLOWED_IMAGE_TYPES.contains(contentType) ||
                ALLOWED_VIDEO_TYPES.contains(contentType) ||
                ALLOWED_AUDIO_TYPES.contains(contentType) ||
                ALLOWED_DOCUMENT_TYPES.contains(contentType);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMessageStatistics(String username) {
        try {
            if (username == null || username.trim().isEmpty()) {
                throw new IllegalArgumentException("Username cannot be null or empty");
            }

            Map<String, Object> stats = new HashMap<>();

            long totalSent = chatMessageRepository.countBySenderId(username);
            long totalReceived = chatMessageRepository.countByRecipientId(username);
            long unreadCount = chatMessageRepository.countByRecipientIdAndReadFalse(username);

            stats.put("totalSent", totalSent);
            stats.put("totalReceived", totalReceived);
            stats.put("unreadCount", unreadCount);
            stats.put("totalMessages", totalSent + totalReceived);

            logger.debug("Retrieved message statistics for user {}: sent={}, received={}, unread={}",
                    username, totalSent, totalReceived, unreadCount);

            return stats;
        } catch (IllegalArgumentException e) {
            logger.error("Invalid parameters: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error retrieving message statistics for user {}", username, e);
            return new HashMap<>();
        }
    }

    private void validateUserIds(String senderId, String recipientId) {
        if (senderId == null || senderId.trim().isEmpty()) {
            throw new IllegalArgumentException("Sender ID cannot be null or empty");
        }
        if (recipientId == null || recipientId.trim().isEmpty()) {
            throw new IllegalArgumentException("Recipient ID cannot be null or empty");
        }
    }

    public void cleanupOldUserStatuses() {
        try {
            LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
            userStatusMap.entrySet().removeIf(entry ->
                    entry.getValue().getLastSeen().isBefore(cutoff));

            logger.debug("Cleaned up old user statuses, remaining: {}", userStatusMap.size());
        } catch (Exception e) {
            logger.error("Error cleaning up old user statuses", e);
        }
    }

    private static class UserStatus {
        private String status;
        private LocalDateTime lastSeen;

        public UserStatus() {
            this.status = "OFFLINE";
            this.lastSeen = LocalDateTime.now();
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public LocalDateTime getLastSeen() {
            return lastSeen;
        }

        public void setLastSeen(LocalDateTime lastSeen) {
            this.lastSeen = lastSeen;
        }
    }
}