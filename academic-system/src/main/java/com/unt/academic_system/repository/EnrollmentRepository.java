package com.unt.academic_system.repository;

import com.unt.academic_system.model.Enrollment;
import com.unt.academic_system.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    /**
     * Find enrollments by student ID
     */
    List<Enrollment> findByStudentId(Long studentId);

    /**
     * Find enrollments by course ID
     */
    List<Enrollment> findByCourseId(Long courseId);

    /**
     * Find enrollments by status - MISSING METHOD ADDED
     */
    List<Enrollment> findByStatus(EnrollmentStatus status);

    /**
     * Find enrollments by student, academic year and semester
     */
    List<Enrollment> findByStudentIdAndAcademicYearAndSemester(
            Long studentId,
            String academicYear,
            Integer semester
    );

    /**
     * Check if enrollment exists for specific student, course, year and semester
     */
    boolean existsByStudentIdAndCourseIdAndAcademicYearAndSemester(
            Long studentId,
            Long courseId,
            String academicYear,
            Integer semester
    );

    /**
     * Find unpaid enrollments
     */
    List<Enrollment> findByIsPaidFalse();

    /**
     * Find enrollments by student ID and status - MISSING METHOD ADDED
     */
    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    /**
     * Check if student completed a specific course
     */
    boolean existsByStudentIdAndCourseIdAndStatus(
            Long studentId,
            Long courseId,
            EnrollmentStatus status
    );

    /**
     * Count enrollments for a specific course
     */
    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId")
    Integer countByCourseId(@Param("courseId") Long courseId);

    /**
     * Count active enrollments for a course (REGISTERED or IN_PROGRESS)
     */
    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId " +
            "AND e.status IN ('REGISTERED', 'IN_PROGRESS')")
    Integer countActiveByCourseId(@Param("courseId") Long courseId);

    /**
     * Calculate total credits for current semester - MISSING METHOD ADDED
     */
    @Query("SELECT SUM(c.credits) FROM Enrollment e JOIN e.course c " +
            "WHERE e.student.id = :studentId AND e.academicYear = :year " +
            "AND e.semester = :semester AND e.status = 'REGISTERED'")
    Integer calculateCurrentSemesterCredits(
            @Param("studentId") Long studentId,
            @Param("year") String academicYear,
            @Param("semester") Integer semester
    );

    /**
     * Calculate GPA for a student - MISSING METHOD ADDED
     */
    @Query("SELECT AVG(e.totalGrade) FROM Enrollment e " +
            "WHERE e.student.id = :studentId AND e.status = 'COMPLETED'")
    Double calculateGPA(@Param("studentId") Long studentId);

    /**
     * Find enrollments by student and course
     */
    Enrollment findByStudentIdAndCourseId(Long studentId, Long courseId);

    /**
     * Check if enrollment exists for student and course
     */
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);
}