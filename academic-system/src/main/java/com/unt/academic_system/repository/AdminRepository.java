package com.unt.academic_system.repository;

import com.unt.academic_system.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    // In AdminRepository.java (if not already there)
    Admin findByEmail(String email);

    // Find admin by employee ID
    Optional<Admin> findByEmployeeId(String employeeId);

    // Check if employee ID exists
    boolean existsByEmployeeId(String employeeId);

    // Find admins by department
    List<Admin> findByDepartment(String department);

    // Find admins by access level
    List<Admin> findByAccessLevel(String accessLevel);
}