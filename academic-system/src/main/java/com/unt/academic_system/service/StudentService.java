package com.unt.academic_system.service;

import com.unt.academic_system.model.Student;

import java.util.List;
import java.util.Optional;

public interface StudentService {

    // Register new student
    Student registerStudent(Student student);

    // Find student by ID
    Optional<Student> findById(Long id);

    // Find student by student ID
    Optional<Student> findByStudentId(String studentId);

    // Update student information
    Student updateStudent(Long id, Student student);

    // Get all students
    List<Student> getAllStudents();

    // Get students by faculty
    List<Student> getStudentsByFaculty(String faculty);

    // Get students by program
    List<Student> getStudentsByProgram(String program);

    // Get students by year and semester
    List<Student> getStudentsByYearAndSemester(Integer year, Integer semester);

    // Get students with GPA above threshold
    List<Student> getStudentsWithHighGPA(Double minGpa);

    // Link student to parent
    void linkParent(Long studentId, Long parentId);

    // Update student GPA
    void updateGPA(Long studentId, Double newGpa);

    // Update credits earned
    void updateCredits(Long studentId, Integer creditsToAdd);

    // Get students without payment for current semester
    List<Student> getStudentsWithoutPayment(String academicYear, Integer semester);
}