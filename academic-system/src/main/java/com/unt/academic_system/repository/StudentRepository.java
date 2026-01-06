package com.unt.academic_system.repository;

import com.unt.academic_system.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    // ✅ Find student by student ID
    Optional<Student> findByStudentId(String studentId);

    // ✅ Check if student ID exists
    boolean existsByStudentId(String studentId);

    // ✅ Find student by email
    Optional<Student> findByEmail(String email);

    // ✅ Check if email exists
    boolean existsByEmail(String email);

    // ✅ Find students by faculty
    List<Student> findByFaculty(String faculty);

    // ✅ Find students by program (department)
    List<Student> findByProgram(String program);

    // ✅ Find students by faculty and program
    List<Student> findByFacultyAndProgram(String faculty, String program);

    // ✅ Find students by year and semester
    List<Student> findByCurrentYearAndCurrentSemester(Integer year, Integer semester);

    // ✅ Find students by current year
    List<Student> findByCurrentYear(Integer year);

    // ✅ Find students by current semester
    List<Student> findByCurrentSemester(Integer semester);

    // ✅ Find students by parent
    List<Student> findByParentId(Long parentId);

    // ✅ Find students with GPA above threshold
    List<Student> findByCumulativeGPAGreaterThanEqual(Double gpa);

    // ✅ Find students with GPA below threshold
    List<Student> findByCumulativeGPALessThan(Double gpa);

    // ✅ Find students with GPA between range
    List<Student> findByCumulativeGPABetween(Double minGpa, Double maxGpa);

    // ✅ CORRECTION: Utilisation de 'paymentStatus' au lieu de 'status'
    @Query("SELECT s FROM Student s WHERE s.id NOT IN " +
            "(SELECT p.student.id FROM Payment p WHERE p.academicYear = :year " +
            "AND p.semester = :semester AND p.paymentStatus = 'APPROVED')")
    List<Student> findStudentsWithoutPayment(@Param("year") String academicYear,
                                             @Param("semester") Integer semester);

    // ✅ Find students who have paid for a semester
    @Query("SELECT DISTINCT s FROM Student s " +
            "JOIN Payment p ON p.student.id = s.id " +
            "WHERE p.academicYear = :year " +
            "AND p.semester = :semester " +
            "AND p.paymentStatus = 'APPROVED'")
    List<Student> findStudentsWithPayment(@Param("year") String academicYear,
                                          @Param("semester") Integer semester);

    // ✅ Find students by academic year
    List<Student> findByAcademicYear(String academicYear);

    // ✅ Find students enrolled in a specific course
    @Query("SELECT DISTINCT s FROM Student s " +
            "JOIN Enrollment e ON e.student.id = s.id " +
            "WHERE e.course.id = :courseId")
    List<Student> findStudentsEnrolledInCourse(@Param("courseId") Long courseId);

    // ✅ Find students with pending enrollments
    @Query("SELECT DISTINCT s FROM Student s " +
            "JOIN Enrollment e ON e.student.id = s.id " +
            "WHERE e.status = 'PENDING'")
    List<Student> findStudentsWithPendingEnrollments();

    // ✅ Count students by faculty
    long countByFaculty(String faculty);

    // ✅ Count students by program
    long countByProgram(String program);

    // ✅ Count students by current year
    long countByCurrentYear(Integer year);

    // ✅ Find top students by GPA
    @Query("SELECT s FROM Student s ORDER BY s.cumulativeGPA DESC")
    List<Student> findTopStudentsByGPA();

    // ✅ Find students with no parent assigned
    List<Student> findByParentIsNull();

    // ✅ Search students by name
    @Query("SELECT s FROM Student s WHERE " +
            "LOWER(s.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(s.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(s.studentId) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Student> searchStudents(@Param("searchTerm") String searchTerm);

    // ✅ Find students who completed courses in a semester
    @Query("SELECT DISTINCT s FROM Student s " +
            "JOIN Enrollment e ON e.student.id = s.id " +
            "WHERE e.academicYear = :year " +
            "AND e.semester = :semester " +
            "AND e.status = 'COMPLETED'")
    List<Student> findStudentsWhoCompletedSemester(@Param("year") String academicYear,
                                                   @Param("semester") Integer semester);

    // ✅ Find students at risk (low GPA)
    @Query("SELECT s FROM Student s WHERE s.cumulativeGPA < :threshold AND s.cumulativeGPA > 0")
    List<Student> findAtRiskStudents(@Param("threshold") Double gpaThreshold);

    // ✅ Find students with perfect attendance
    @Query("SELECT DISTINCT s FROM Student s " +
            "JOIN Enrollment e ON e.student.id = s.id " +
            "WHERE e.academicYear = :year " +
            "AND e.semester = :semester " +
            "AND e.attendance = 100")
    List<Student> findStudentsWithPerfectAttendance(@Param("year") String academicYear,
                                                    @Param("semester") Integer semester);

    // ✅ Get student statistics by faculty
    @Query("SELECT s.faculty, COUNT(s), AVG(s.cumulativeGPA), " +
            "AVG(s.totalCreditsEarned) FROM Student s GROUP BY s.faculty")
    List<Object[]> getStudentStatsByFaculty();

    // ✅ Find students by enrollment date range
    @Query("SELECT s FROM Student s WHERE s.enrollmentDate BETWEEN :startDate AND :endDate")
    List<Student> findStudentsByEnrollmentDateRange(@Param("startDate") java.time.LocalDate startDate,
                                                    @Param("endDate") java.time.LocalDate endDate);

    // ✅ Find newly enrolled students (enrolled in last N days)
    @Query("SELECT s FROM Student s WHERE s.enrollmentDate >= :cutoffDate")
    List<Student> findStudentsByEnrollmentDateAfter(@Param("cutoffDate") java.time.LocalDate cutoffDate);

    // ✅ Helper method to find newly enrolled students (last 30 days)
    default List<Student> findNewlyEnrolledStudents() {
        return findStudentsByEnrollmentDateAfter(java.time.LocalDate.now().minusDays(30));
    }

    // ✅ Count students with outstanding payments
    @Query("SELECT COUNT(DISTINCT s.id) FROM Student s " +
            "WHERE s.id NOT IN " +
            "(SELECT p.student.id FROM Payment p WHERE p.academicYear = :year " +
            "AND p.semester = :semester AND p.paymentStatus = 'APPROVED')")
    long countStudentsWithOutstandingPayments(@Param("year") String academicYear,
                                              @Param("semester") Integer semester);

    // ✅ Find students ordered by GPA (descending)
    List<Student> findAllByOrderByCumulativeGPADesc();

    // ✅ Find students ordered by enrollment date (most recent first)
    List<Student> findAllByOrderByEnrollmentDateDesc();

    // ✅ Find students by faculty ordered by GPA
    List<Student> findByFacultyOrderByCumulativeGPADesc(String faculty);

    // ✅ Delete students by academic year (for cleanup)
    void deleteByAcademicYear(String academicYear);
}