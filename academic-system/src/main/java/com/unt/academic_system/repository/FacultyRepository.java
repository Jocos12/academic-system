package com.unt.academic_system.repository;

import com.unt.academic_system.model.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {

    // Find faculty by name
    Optional<Faculty> findByName(String name);

    // Find faculty by code
    Optional<Faculty> findByCode(String code);

    // Find active faculties
    List<Faculty> findByIsActiveTrue();
}