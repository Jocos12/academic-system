package com.unt.academic_system.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "admins")
public class Admin extends User {

    @Column(nullable = false, unique = true, length = 20)
    private String employeeId;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(nullable = false)
    private LocalDate hireDate;

    @Column(nullable = false, length = 50)
    private String accessLevel; // SUPER_ADMIN, REGISTRAR, FINANCE, etc.

    @Column(name = "profile_picture", length = 500)
    private String profilePicture; // URL or base64 for profile picture
}