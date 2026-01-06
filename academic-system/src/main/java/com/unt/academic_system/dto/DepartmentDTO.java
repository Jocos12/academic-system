package com.unt.academic_system.dto;

import com.unt.academic_system.model.Department;
import com.unt.academic_system.model.Lecturer;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DepartmentDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private Long facultyId;
    private String facultyName;
    private String facultyCode;
    private Lecturer head;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DepartmentDTO(Department department) {
        this.id = department.getId();
        this.name = department.getName();
        this.code = department.getCode();
        this.description = department.getDescription();
        this.facultyId = department.getFacultyId();
        this.facultyName = department.getFaculty() != null ? department.getFaculty().getName() : null;
        this.facultyCode = department.getFaculty() != null ? department.getFaculty().getCode() : null;
        this.head = department.getHead();
        this.isActive = department.getIsActive();
        this.createdAt = department.getCreatedAt();
        this.updatedAt = department.getUpdatedAt();
    }
}