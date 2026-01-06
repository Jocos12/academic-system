package com.unt.academic_system.service;

import com.unt.academic_system.model.Lecturer;

import java.util.List;
import java.util.Optional;

public interface LecturerService {

    Lecturer registerLecturer(Lecturer lecturer);
    Optional<Lecturer> findById(Long id);
    Optional<Lecturer> findByEmployeeId(String employeeId);
    Optional<Lecturer> findByEmail(String email);
    Lecturer updateLecturer(Long id, Lecturer lecturer);
    List<Lecturer> getAllLecturers();
    List<Lecturer> getLecturersByDepartment(String department);
    List<Lecturer> getLecturersByQualification(String qualification);
    void assignCourse(Long lecturerId, Long courseId);
    void assignMultipleCoursesNative(Long lecturerId, List<Long> courseIds);

    // *** AJOUTEZ CES TROIS MÉTHODES MANQUANTES ***
    void assignMultipleCourses(Long lecturerId, List<Long> courseIds);
    void unassignCourse(Long lecturerId, Long courseId);
    void deleteLecturer(Long id);
}