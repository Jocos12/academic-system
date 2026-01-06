package com.unt.academic_system.dto;

import com.unt.academic_system.model.Course;
import com.unt.academic_system.model.Lecturer;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseDTO {
    private Long id;
    private String courseCode;
    private String courseName;
    private String description;
    private Integer credits;
    private String faculty;
    private String department;
    private String year;  // Changé de Integer à String
    private Integer semester;
    private Double price;
    private Integer maxStudents;
    private Boolean isActive;

    // Lecturer information
    private Long lecturerId;
    private String lecturerName;
    private String lecturerEmail;

    // Enrollment information
    private Integer enrollmentCount;
    private Integer availableSeats;

    // Prerequisites
    private Set<PrerequisiteDTO> prerequisites;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Inner DTO for prerequisites to avoid circular references
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrerequisiteDTO {
        private Long id;
        private String courseCode;
        private String courseName;
        private Integer credits;
    }

    /**
     * Constructor from Course entity
     */
    public CourseDTO(Course course) {
        this.id = course.getId();
        this.courseCode = course.getCourseCode();
        this.courseName = course.getCourseName();
        this.description = course.getDescription();
        this.credits = course.getCredits();
        this.faculty = course.getFaculty();
        this.department = course.getDepartment();
        this.year = course.getYear();
        this.semester = course.getSemester();
        this.price = course.getPrice();
        this.maxStudents = course.getMaxStudents();
        this.isActive = course.getIsActive();
        this.createdAt = course.getCreatedAt();
        this.updatedAt = course.getUpdatedAt();

        // Handle lecturer information
        if (course.getLecturer() != null) {
            Lecturer lecturer = course.getLecturer();
            this.lecturerId = lecturer.getId();
            this.lecturerName = lecturer.getFirstName() + " " + lecturer.getLastName();
            this.lecturerEmail = lecturer.getEmail();
        }

        // Handle prerequisites
        if (course.getPrerequisites() != null && !course.getPrerequisites().isEmpty()) {
            this.prerequisites = course.getPrerequisites().stream()
                    .map(prereq -> new PrerequisiteDTO(
                            prereq.getId(),
                            prereq.getCourseCode(),
                            prereq.getCourseName(),
                            prereq.getCredits()
                    ))
                    .collect(Collectors.toSet());
        } else {
            this.prerequisites = new HashSet<>();
        }

        // Enrollment count will be set by service layer
        this.enrollmentCount = 0;
        this.availableSeats = this.maxStudents;
    }

    /**
     * Constructor with enrollment count
     */
    public CourseDTO(Course course, Integer enrollmentCount) {
        this(course);
        this.enrollmentCount = enrollmentCount;
        this.availableSeats = this.maxStudents - enrollmentCount;
    }

    /**
     * Static factory method to convert Course to DTO
     */
    public static CourseDTO fromEntity(Course course) {
        return new CourseDTO(course);
    }

    /**
     * Static factory method with enrollment count
     */
    public static CourseDTO fromEntity(Course course, Integer enrollmentCount) {
        return new CourseDTO(course, enrollmentCount);
    }

    /**
     * Convert DTO to Course entity (for create/update operations)
     */
    public Course toEntity() {
        Course course = new Course();
        course.setId(this.id);
        course.setCourseCode(this.courseCode);
        course.setCourseName(this.courseName);
        course.setDescription(this.description);
        course.setCredits(this.credits);
        course.setFaculty(this.faculty);
        course.setDepartment(this.department);
        course.setYear(this.year);
        course.setSemester(this.semester);
        course.setPrice(this.price);
        course.setMaxStudents(this.maxStudents);
        course.setIsActive(this.isActive != null ? this.isActive : true);
        return course;
    }
}