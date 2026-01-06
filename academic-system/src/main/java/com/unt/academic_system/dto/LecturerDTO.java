package com.unt.academic_system.dto;

import com.unt.academic_system.model.Lecturer;
import com.unt.academic_system.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LecturerDTO {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private UserRole role;
    private Boolean isActive;
    private String employeeId;
    private String department;
    private String qualification;
    private String specialization;
    private String officeLocation;
    private String officeHours;
    private LocalDate hireDate;
    private Integer courseCount;

    // ✅ Liste des cours
    private List<SimpleCourseDTO> courses = new ArrayList<>();

    // ✅ Classe interne pour les cours
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleCourseDTO {
        private Long id;
        private String courseCode;
        private String courseName;
    }

    public LecturerDTO(Lecturer lecturer) {
        this.id = lecturer.getId();
        this.email = lecturer.getEmail();
        this.firstName = lecturer.getFirstName();
        this.lastName = lecturer.getLastName();
        this.phoneNumber = lecturer.getPhoneNumber();
        this.role = lecturer.getRole();
        this.isActive = lecturer.getIsActive();
        this.employeeId = lecturer.getEmployeeId();
        this.department = lecturer.getDepartment();
        this.qualification = lecturer.getQualification();
        this.specialization = lecturer.getSpecialization();
        this.officeLocation = lecturer.getOfficeLocation();
        this.officeHours = lecturer.getOfficeHours();
        this.hireDate = lecturer.getHireDate();
        this.courseCount = 0;
        this.courses = new ArrayList<>();
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public static LecturerDTO fromEntity(Lecturer lecturer) {
        return new LecturerDTO(lecturer);
    }
}
