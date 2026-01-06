package com.unt.academic_system.service;

import com.unt.academic_system.model.CourseContent;

import java.util.List;
import java.util.Optional;

public interface CourseContentService {

    List<CourseContent> getAllContent();

    CourseContent uploadContent(CourseContent content);
    Optional<CourseContent> findById(Long id);
    List<CourseContent> getContentByCourse(Long courseId);
    List<CourseContent> getContentByLecturer(Long lecturerId);
    List<CourseContent> getPendingContent();
    List<CourseContent> getApprovedContentForCourse(Long courseId);
    void approveContent(Long contentId, Long adminId);
    void rejectContent(Long contentId, Long adminId, String reason);
    void deleteContent(Long contentId);
}