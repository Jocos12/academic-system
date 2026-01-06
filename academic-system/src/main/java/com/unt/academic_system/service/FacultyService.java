package com.unt.academic_system.service;

import com.unt.academic_system.model.Faculty;

import java.util.List;
import java.util.Optional;

public interface FacultyService {

    Faculty createFaculty(Faculty faculty);
    Optional<Faculty> findById(Long id);
    Optional<Faculty> findByCode(String code);
    Faculty updateFaculty(Long id, Faculty faculty);
    void deleteFaculty(Long id);
    List<Faculty> getAllFaculties();
    List<Faculty> getActiveFaculties();
    void assignDean(Long facultyId, Long lecturerId);
}