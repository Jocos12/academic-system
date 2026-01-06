package com.unt.academic_system.service;

import com.unt.academic_system.model.Admin;
import com.unt.academic_system.model.ApprovalStatus;
import com.unt.academic_system.model.CourseContent;
import com.unt.academic_system.repository.AdminRepository;
import com.unt.academic_system.repository.CourseContentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseContentServiceImpl implements CourseContentService {

    private final CourseContentRepository courseContentRepository;
    private final AdminRepository adminRepository;

    @Override
    @Transactional
    public CourseContent uploadContent(CourseContent content) {
        log.info("Uploading content: {} for course: {}",
                content.getTitle(), content.getCourse().getId());

        // Set initial status as PENDING (awaiting admin approval)
        content.setApprovalStatus(ApprovalStatus.PENDING);

        CourseContent saved = courseContentRepository.save(content);
        log.info("Content uploaded successfully with id: {}", saved.getId());

        return saved;
    }

    @Override
    public List<CourseContent> getAllContent() {
        log.info("Fetching all content");
        return courseContentRepository.findAll();
    }

    @Override
    public Optional<CourseContent> findById(Long id) {
        log.info("Fetching content by id: {}", id);
        return courseContentRepository.findById(id);
    }

    @Override
    public List<CourseContent> getContentByCourse(Long courseId) {
        log.info("Fetching content for course id: {}", courseId);
        return courseContentRepository.findByCourseId(courseId);
    }

    @Override
    public List<CourseContent> getContentByLecturer(Long lecturerId) {
        log.info("Fetching content for lecturer id: {}", lecturerId);

        try {
            List<CourseContent> contents = courseContentRepository.findByLecturerId(lecturerId);
            log.info("Found {} content items for lecturer {}", contents.size(), lecturerId);

            // Force initialization of lazy-loaded fields
            contents.forEach(c -> {
                if (c.getCourse() != null) {
                    c.getCourse().getCourseName(); // Force course load
                }
                if (c.getLecturer() != null) {
                    c.getLecturer().getFirstName(); // Force lecturer load
                }
                if (c.getApprovedBy() != null) {
                    c.getApprovedBy().getFirstName(); // Force admin load
                }
            });

            return contents;
        } catch (Exception e) {
            log.error("Error fetching content for lecturer {}: {}", lecturerId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch lecturer content: " + e.getMessage());
        }
    }

    @Override
    public List<CourseContent> getPendingContent() {
        log.info("Fetching pending content");
        return courseContentRepository.findByApprovalStatusOrderByUploadedAtAsc(ApprovalStatus.PENDING);
    }

    @Override
    public List<CourseContent> getApprovedContentForCourse(Long courseId) {
        log.info("Fetching approved content for course id: {}", courseId);
        return courseContentRepository.findByCourseIdAndApprovalStatus(courseId, ApprovalStatus.APPROVED);
    }

    @Override
    @Transactional
    public void approveContent(Long contentId, Long adminId) {
        log.info("Approving content id: {} by admin: {}", contentId, adminId);

        CourseContent content = courseContentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Content not found with id: " + contentId));

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + adminId));

        content.setApprovalStatus(ApprovalStatus.APPROVED);
        content.setApprovedBy(admin);
        content.setApprovedAt(LocalDateTime.now());
        content.setRejectionReason(null);

        courseContentRepository.save(content);
        log.info("Content approved successfully");
    }

    @Override
    @Transactional
    public void rejectContent(Long contentId, Long adminId, String reason) {
        log.info("Rejecting content id: {} by admin: {}", contentId, adminId);

        CourseContent content = courseContentRepository.findById(contentId)
                .orElseThrow(() -> new RuntimeException("Content not found with id: " + contentId));

        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found with id: " + adminId));

        content.setApprovalStatus(ApprovalStatus.REJECTED);
        content.setApprovedBy(admin);
        content.setApprovedAt(LocalDateTime.now());
        content.setRejectionReason(reason);

        courseContentRepository.save(content);
        log.info("Content rejected successfully");
    }

    @Override
    @Transactional
    public void deleteContent(Long contentId) {
        log.info("Deleting content id: {}", contentId);

        if (!courseContentRepository.existsById(contentId)) {
            throw new RuntimeException("Content not found with id: " + contentId);
        }

        courseContentRepository.deleteById(contentId);
        log.info("Content deleted successfully");
    }
}