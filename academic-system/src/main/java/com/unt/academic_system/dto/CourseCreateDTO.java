package com.unt.academic_system.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * DTO for creating new courses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseCreateDTO {

    @NotBlank(message = "Course code is required")
    @Size(max = 20, message = "Course code must not exceed 20 characters")
    private String courseCode;

    @NotBlank(message = "Course name is required")
    @Size(max = 200, message = "Course name must not exceed 200 characters")
    private String courseName;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @NotNull(message = "Credits is required")
    @Min(value = 1, message = "Credits must be at least 1")
    @Max(value = 10, message = "Credits must not exceed 10")
    private Integer credits;

    @NotBlank(message = "Faculty is required")
    @Size(max = 100, message = "Faculty must not exceed 100 characters")
    private String faculty;

    @NotBlank(message = "Department is required")
    @Size(max = 100, message = "Department must not exceed 100 characters")
    private String department;

    @NotNull(message = "Year is required")
    @Pattern(regexp = "^\\d{4}-\\d{4}$", message = "Year must be in format YYYY-YYYY (e.g., 2024-2025)")
    private String year;  // Changé de Integer à String

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be 1 or 2")
    @Max(value = 2, message = "Semester must be 1 or 2")
    private Integer semester;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must be non-negative")
    private Double price;

    @NotNull(message = "Max students is required")
    @Min(value = 1, message = "Max students must be at least 1")
    @Max(value = 500, message = "Max students must not exceed 500")
    private Integer maxStudents;

    private Boolean isActive = true;

    private Long lecturerId;

    private Set<Long> prerequisiteIds;
}