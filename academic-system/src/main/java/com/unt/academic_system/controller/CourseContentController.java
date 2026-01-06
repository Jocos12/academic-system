package com.unt.academic_system.controller;

import com.unt.academic_system.dto.CourseContentDTO;
import com.unt.academic_system.model.ApprovalStatus;
import com.unt.academic_system.model.CourseContent;
import com.unt.academic_system.service.CourseContentService;
import com.unt.academic_system.util.DTOMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/course-content")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseContentController {

    private final CourseContentService courseContentService;

    @GetMapping
    public ResponseEntity<List<CourseContentDTO>> getAllContent() {
        try {
            log.info("GET /api/course-content - Fetching all content");
            List<CourseContent> contents = courseContentService.getAllContent();
            List<CourseContentDTO> dtos = DTOMapper.toCourseContentDTOList(contents);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching all content: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadContent(
            @RequestParam("content") String contentJson,
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("POST /api/course-content/upload - Uploading content");

            ObjectMapper objectMapper = new ObjectMapper();
            CourseContent content = objectMapper.readValue(contentJson, CourseContent.class);

            // Set file details
            String fileName = file.getOriginalFilename();
            long fileSize = file.getSize();

            content.setFileName(fileName);
            content.setFileSize(fileSize);

            // Save the file to disk FIRST
            String filePath = saveFile(file);
            content.setFilePath(filePath);

            // Set default approval status
            content.setApprovalStatus(ApprovalStatus.PENDING);

            CourseContent uploaded = courseContentService.uploadContent(content);
            CourseContentDTO dto = DTOMapper.toCourseContentDTO(uploaded);

            log.info("Content uploaded successfully with id: {}", uploaded.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception e) {
            log.error("Error uploading content: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Failed to upload content: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContentById(@PathVariable Long id) {
        try {
            log.info("GET /api/course-content/{} - Fetching content", id);
            Optional<CourseContent> content = courseContentService.findById(id);
            return content.map(c -> ResponseEntity.ok(DTOMapper.toCourseContentDTO(c)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        } catch (Exception e) {
            log.error("Error fetching content {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseContentDTO>> getContentByCourse(@PathVariable Long courseId) {
        try {
            log.info("GET /api/course-content/course/{} - Fetching course content", courseId);
            List<CourseContent> contents = courseContentService.getContentByCourse(courseId);
            List<CourseContentDTO> dtos = DTOMapper.toCourseContentDTOList(contents);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching content for course {}: {}", courseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<?> getContentByLecturer(@PathVariable Long lecturerId) {
        try {
            log.info("GET /api/course-content/lecturer/{} - Fetching lecturer content", lecturerId);
            List<CourseContent> contents = courseContentService.getContentByLecturer(lecturerId);
            List<CourseContentDTO> dtos = DTOMapper.toCourseContentDTOList(contents);
            log.info("Successfully fetched {} content items for lecturer {}", dtos.size(), lecturerId);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching content for lecturer {}: {}", lecturerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch lecturer content: " + e.getMessage());
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<List<CourseContentDTO>> getPendingContent() {
        try {
            log.info("GET /api/course-content/pending - Fetching pending content");
            List<CourseContent> contents = courseContentService.getPendingContent();
            List<CourseContentDTO> dtos = DTOMapper.toCourseContentDTOList(contents);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching pending content: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/course/{courseId}/approved")
    public ResponseEntity<List<CourseContentDTO>> getApprovedContentForCourse(@PathVariable Long courseId) {
        try {
            log.info("GET /api/course-content/course/{}/approved", courseId);
            List<CourseContent> contents = courseContentService.getApprovedContentForCourse(courseId);
            List<CourseContentDTO> dtos = DTOMapper.toCourseContentDTOList(contents);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching approved content for course {}: {}", courseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{contentId}/approve/{adminId}")
    public ResponseEntity<?> approveContent(
            @PathVariable Long contentId,
            @PathVariable Long adminId) {
        try {
            log.info("PUT /api/course-content/{}/approve/{}", contentId, adminId);
            courseContentService.approveContent(contentId, adminId);
            return ResponseEntity.ok("Content approved successfully");
        } catch (RuntimeException e) {
            log.error("Error approving content: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error approving content: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to approve content");
        }
    }

    @PutMapping("/{contentId}/reject/{adminId}")
    public ResponseEntity<?> rejectContent(
            @PathVariable Long contentId,
            @PathVariable Long adminId,
            @RequestParam String reason) {
        try {
            log.info("PUT /api/course-content/{}/reject/{}", contentId, adminId);
            courseContentService.rejectContent(contentId, adminId, reason);
            return ResponseEntity.ok("Content rejected");
        } catch (RuntimeException e) {
            log.error("Error rejecting content: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error rejecting content: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to reject content");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContent(@PathVariable Long id) {
        try {
            log.info("DELETE /api/course-content/{}", id);
            courseContentService.deleteContent(id);
            return ResponseEntity.ok("Content deleted successfully");
        } catch (RuntimeException e) {
            log.error("Error deleting content: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error deleting content: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete content");
        }
    }

    private String saveFile(MultipartFile file) throws IOException {
        // Use absolute path in your project
        String uploadDir = System.getProperty("user.dir") + "/uploads/course-content/";
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Return the full path
        return uploadDir + fileName;
    }
}