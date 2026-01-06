package com.unt.academic_system.dto;
import lombok.Data;

@Data
public class CourseContentDTO {
    private Long id;
    private String title;
    private String description;
    private String contentType;
    private String fileName;
    private Long fileSize;
    private String filePath;
    private String approvalStatus;
    private String uploadedAt;
    private String approvedAt;
    private String rejectionReason;

    // Course info
    private Long courseId;
    private String courseName;
    private String courseCode;

    // Lecturer info
    private Long lecturerId;
    private String lecturerName;

    // Admin info
    private Long approvedById;
    private String approvedByName;
}
