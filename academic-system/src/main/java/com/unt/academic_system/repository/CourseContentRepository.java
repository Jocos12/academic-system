package com.unt.academic_system.repository;

import com.unt.academic_system.model.ApprovalStatus;
import com.unt.academic_system.model.CourseContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseContentRepository extends JpaRepository<CourseContent, Long> {

    // Find content by course
    List<CourseContent> findByCourseId(Long courseId);

    // Find content by lecturer
    List<CourseContent> findByLecturerId(Long lecturerId);

    // Find content by approval status
    List<CourseContent> findByApprovalStatus(ApprovalStatus status);

    // Find pending content for admin review
    List<CourseContent> findByApprovalStatusOrderByUploadedAtAsc(ApprovalStatus status);

    // Find approved content for a course
    List<CourseContent> findByCourseIdAndApprovalStatus(Long courseId, ApprovalStatus status);
}