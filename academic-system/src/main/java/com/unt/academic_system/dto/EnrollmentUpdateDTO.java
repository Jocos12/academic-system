package com.unt.academic_system.dto;

import com.unt.academic_system.model.EnrollmentStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating enrollment information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentUpdateDTO {

    private EnrollmentStatus status;

    @Min(value = 0, message = "Midterm grade must be between 0 and 100")
    @Max(value = 100, message = "Midterm grade must be between 0 and 100")
    private Double midtermGrade;

    @Min(value = 0, message = "Final grade must be between 0 and 100")
    @Max(value = 100, message = "Final grade must be between 0 and 100")
    private Double finalGrade;

    @Min(value = 0, message = "Attendance must be non-negative")
    @Max(value = 100, message = "Attendance cannot exceed 100%")
    private Integer attendance;

    private Boolean isPaid;
}