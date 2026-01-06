package com.unt.academic_system.repository;

import com.unt.academic_system.model.Lecturer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LecturerRepository extends JpaRepository<Lecturer, Long> {

    // Find lecturer by employee ID
    Optional<Lecturer> findByEmployeeId(String employeeId);

    Optional<Lecturer> findByEmail(String email);

    // Check if employee ID exists
    boolean existsByEmployeeId(String employeeId);

    // Find lecturers by department
    List<Lecturer> findByDepartment(String department);

    // Find lecturers by qualification
    List<Lecturer> findByQualification(String qualification);

    // Find lecturers by specialization
    List<Lecturer> findBySpecialization(String specialization);
}