package com.unt.academic_system.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating grades
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeUpdateDTO {

    @Min(value = 0, message = "Midterm grade must be between 0 and 100")
    @Max(value = 100, message = "Midterm grade must be between 0 and 100")
    private Double midterm;

    @Min(value = 0, message = "Final grade must be between 0 and 100")
    @Max(value = 100, message = "Final grade must be between 0 and 100")
    private Double finalGrade;
}