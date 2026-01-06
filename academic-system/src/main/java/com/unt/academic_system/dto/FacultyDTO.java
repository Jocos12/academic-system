package com.unt.academic_system.dto;

import com.unt.academic_system.model.Faculty;
import com.unt.academic_system.model.Lecturer;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FacultyDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private Lecturer dean;
    private Boolean isActive;
    private int departmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FacultyDTO(Faculty faculty, int departmentCount) {
        this.id = faculty.getId();
        this.name = faculty.getName();
        this.code = faculty.getCode();
        this.description = faculty.getDescription();
        this.dean = faculty.getDean();
        this.isActive = faculty.getIsActive();
        this.departmentCount = departmentCount;
        this.createdAt = faculty.getCreatedAt();
        this.updatedAt = faculty.getUpdatedAt();
    }
}