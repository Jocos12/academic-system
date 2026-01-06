package com.unt.academic_system.repository;

import com.unt.academic_system.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    // Find department by name
    Optional<Department> findByName(String name);

    // Find department by code
    Optional<Department> findByCode(String code);

    // Find departments by faculty
    List<Department> findByFacultyId(Long facultyId);

    // Find active departments
    List<Department> findByIsActiveTrue();

    // Count departments by faculty ID - ADD THIS LINE
    int countByFacultyId(Long facultyId);
}