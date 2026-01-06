package com.unt.academic_system.dto;

import com.unt.academic_system.model.Enrollment;
import com.unt.academic_system.model.EnrollmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentDTO {
    private Long id;

    // Student information
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentIdNumber;  // Changed from studentNumber to studentIdNumber

    // Course information
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Integer courseCredits;
    private String lecturerName;

    // Enrollment details
    private String academicYear;
    private Integer semester;
    private EnrollmentStatus status;

    // Grades
    private Double midtermGrade;
    private Double finalGrade;
    private Double totalGrade;
    private String letterGrade;

    // Additional info
    private Integer attendance;
    private Boolean isPaid;
    private Double courseFee;

    // Timestamps
    private LocalDateTime enrolledAt;
    private LocalDateTime updatedAt;

    /**
     * Convert Enrollment entity to DTO
     */
    public static EnrollmentDTO fromEntity(Enrollment enrollment) {
        if (enrollment == null) {
            return null;
        }

        EnrollmentDTOBuilder builder = EnrollmentDTO.builder()
                .id(enrollment.getId())
                .academicYear(enrollment.getAcademicYear())
                .semester(enrollment.getSemester())
                .status(enrollment.getStatus())
                .midtermGrade(enrollment.getMidtermGrade())
                .finalGrade(enrollment.getFinalGrade())
                .totalGrade(enrollment.getTotalGrade())
                .letterGrade(enrollment.getLetterGrade())
                .attendance(enrollment.getAttendance())
                .isPaid(enrollment.getIsPaid())
                .enrolledAt(enrollment.getEnrolledAt())
                .updatedAt(enrollment.getUpdatedAt());

        // Student information
        if (enrollment.getStudent() != null) {
            builder.studentId(enrollment.getStudent().getId())
                    .studentName(enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName())
                    .studentEmail(enrollment.getStudent().getEmail())
                    .studentIdNumber(enrollment.getStudent().getStudentId());  // Use getStudentId() from Student model
        }

        // Course information
        if (enrollment.getCourse() != null) {
            builder.courseId(enrollment.getCourse().getId())
                    .courseCode(enrollment.getCourse().getCourseCode())
                    .courseName(enrollment.getCourse().getCourseName())
                    .courseCredits(enrollment.getCourse().getCredits())
                    .courseFee(enrollment.getCourse().getPrice());

            // Lecturer information
            if (enrollment.getCourse().getLecturer() != null) {
                builder.lecturerName(enrollment.getCourse().getLecturer().getFirstName() +
                        " " + enrollment.getCourse().getLecturer().getLastName());
            }
        }

        return builder.build();
    }
}