package com.unt.academic_system.service;

import com.unt.academic_system.dto.EnrollmentCreateDTO;
import com.unt.academic_system.dto.EnrollmentDTO;
import com.unt.academic_system.dto.EnrollmentUpdateDTO;
import com.unt.academic_system.model.EnrollmentStatus;

import java.util.List;
import java.util.Optional;

public interface EnrollmentService {

    /**
     * Enroll a student in a course
     */
    EnrollmentDTO enrollStudent(EnrollmentCreateDTO enrollmentCreateDTO);

    /**
     * Find all enrollments
     */
    List<EnrollmentDTO> findAll();

    /**
     * Find enrollment by ID
     */
    Optional<EnrollmentDTO> findById(Long id);

    /**
     * Update enrollment
     */
    EnrollmentDTO updateEnrollment(Long id, EnrollmentUpdateDTO enrollmentUpdateDTO);

    /**
     * Drop a course (change status to DROPPED)
     */
    void dropCourse(Long enrollmentId);

    /**
     * Delete an enrollment
     */
    void deleteEnrollment(Long id);

    /**
     * Get all enrollments for a student
     */
    List<EnrollmentDTO> getStudentEnrollments(Long studentId);

    /**
     * Get all enrollments for a course
     */
    List<EnrollmentDTO> getCourseEnrollments(Long courseId);

    /**
     * Get enrollments by status
     */
    List<EnrollmentDTO> getEnrollmentsByStatus(EnrollmentStatus status);

    /**
     * Update grades for an enrollment
     */
    EnrollmentDTO updateGrade(Long enrollmentId, Double midterm, Double finalGrade);

    /**
     * Update attendance for an enrollment
     */
    EnrollmentDTO updateAttendance(Long enrollmentId, Integer attendance);

    /**
     * Mark enrollment as paid
     */
    EnrollmentDTO markAsPaid(Long enrollmentId);

    /**
     * Get student transcript (completed courses)
     */
    List<EnrollmentDTO> getStudentTranscript(Long studentId);

    /**
     * Calculate current semester credits
     */
    Integer calculateCurrentCredits(Long studentId, String academicYear, Integer semester);

    /**
     * Calculate student GPA
     */
    Double calculateGPA(Long studentId);
}