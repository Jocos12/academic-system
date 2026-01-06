package com.unt.academic_system.service;

import com.unt.academic_system.model.Admin;

import java.util.List;
import java.util.Optional;

public interface AdminService {

    Admin registerAdmin(Admin admin);
    Optional<Admin> findById(Long id);
    Optional<Admin> findByEmployeeId(String employeeId);
    Admin findByEmail(String email);
    Admin updateAdmin(Long id, Admin admin);
    List<Admin> getAllAdmins();
    List<Admin> getAdminsByDepartment(String department);
    List<Admin> getAdminsByAccessLevel(String accessLevel);
}