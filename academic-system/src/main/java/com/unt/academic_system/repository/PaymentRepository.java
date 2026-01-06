package com.unt.academic_system.repository;

import com.unt.academic_system.model.Payment;
import com.unt.academic_system.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // ==================== FIND BY STUDENT ====================

    /**
     * Find all payments for a student
     */
    List<Payment> findByStudentId(Long studentId);

    /**
     * Find all payments for a student ordered by payment date (most recent first)
     */
    List<Payment> findByStudentIdOrderByPaymentDateDesc(Long studentId);

    /**
     * Find payments for a student in a specific academic year and semester
     */
    List<Payment> findByStudentIdAndAcademicYearAndSemester(
            Long studentId,
            String academicYear,
            Integer semester
    );

    /**
     * Find payments for a student with specific status
     */
    List<Payment> findByStudentIdAndPaymentStatus(Long studentId, PaymentStatus paymentStatus);

    /**
     * Find payments for a student in academic year, semester with specific status
     */
    List<Payment> findByStudentIdAndAcademicYearAndSemesterAndPaymentStatus(
            Long studentId,
            String academicYear,
            Integer semester,
            PaymentStatus paymentStatus
    );

    // ==================== FIND BY PAYMENT STATUS ====================

    /**
     * Find all payments by status
     */
    List<Payment> findByPaymentStatus(PaymentStatus paymentStatus);

    /**
     * Find all payments by status ordered by payment date
     */
    List<Payment> findByPaymentStatusOrderByPaymentDateDesc(PaymentStatus paymentStatus);

    /**
     * Find pending payments
     */
    @Query("SELECT p FROM Payment p WHERE p.paymentStatus = 'PENDING' ORDER BY p.paymentDate DESC")
    List<Payment> findPendingPayments();

    /**
     * Find approved payments
     */
    @Query("SELECT p FROM Payment p WHERE p.paymentStatus = 'APPROVED' ORDER BY p.paymentDate DESC")
    List<Payment> findApprovedPayments();

    /**
     * Find rejected payments
     */
    @Query("SELECT p FROM Payment p WHERE p.paymentStatus = 'REJECTED' ORDER BY p.paymentDate DESC")
    List<Payment> findRejectedPayments();

    // ==================== FIND BY TRANSACTION REFERENCE ====================

    /**
     * Find payment by transaction reference
     */
    Optional<Payment> findByTransactionReference(String transactionReference);

    /**
     * Check if transaction reference exists
     */
    boolean existsByTransactionReference(String transactionReference);

    // ==================== FIND BY ACADEMIC YEAR & SEMESTER ====================

    /**
     * Find all payments for academic year and semester
     */
    List<Payment> findByAcademicYearAndSemester(String academicYear, Integer semester);

    /**
     * Find payments by academic year, semester and status
     */
    List<Payment> findByAcademicYearAndSemesterAndPaymentStatus(
            String academicYear,
            Integer semester,
            PaymentStatus paymentStatus
    );

    /**
     * Find all payments for an academic year
     */
    List<Payment> findByAcademicYear(String academicYear);

    // ==================== FIND BY COURSE ====================

    /**
     * Find payments for a specific course
     */
    List<Payment> findByCourseId(Long courseId);

    /**
     * Find payments for a course in academic year and semester
     */
    List<Payment> findByCourseIdAndAcademicYearAndSemester(
            Long courseId,
            String academicYear,
            Integer semester
    );

    // ==================== FIND BY DATE RANGE ====================

    /**
     * Find payments between two dates
     */
    List<Payment> findByPaymentDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Find approved payments between two dates
     */
    @Query("SELECT p FROM Payment p WHERE p.paymentStatus = 'APPROVED' " +
            "AND p.paymentDate BETWEEN :startDate AND :endDate")
    List<Payment> findApprovedPaymentsBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ==================== STATISTICS & AGGREGATIONS ====================

    /**
     * Calculate total revenue for academic year and semester
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p " +
            "WHERE p.academicYear = :year AND p.semester = :semester " +
            "AND p.paymentStatus = 'APPROVED'")
    Double calculateTotalRevenue(
            @Param("year") String academicYear,
            @Param("semester") Integer semester
    );

    /**
     * Calculate total paid amount for a student in a semester
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p " +
            "WHERE p.student.id = :studentId " +
            "AND p.academicYear = :year " +
            "AND p.semester = :semester " +
            "AND p.paymentStatus = 'APPROVED'")
    Double calculateStudentPaidAmount(
            @Param("studentId") Long studentId,
            @Param("year") String academicYear,
            @Param("semester") Integer semester
    );

    /**
     * Count payments by status
     */
    Long countByPaymentStatus(PaymentStatus paymentStatus);

    /**
     * Count pending payments for a student
     */
    @Query("SELECT COUNT(p) FROM Payment p " +
            "WHERE p.student.id = :studentId AND p.paymentStatus = 'PENDING'")
    Long countPendingPaymentsByStudent(@Param("studentId") Long studentId);

    /**
     * Count payments for academic year and semester
     */
    Long countByAcademicYearAndSemester(String academicYear, Integer semester);

    // ==================== STUDENTS WITH PAYMENT STATUS ====================

    /**
     * Find students who have NOT paid for a specific semester
     */
    @Query("SELECT DISTINCT p.student FROM Payment p " +
            "WHERE p.academicYear = :year " +
            "AND p.semester = :semester " +
            "AND p.paymentStatus = 'APPROVED' " +
            "GROUP BY p.student " +
            "HAVING SUM(p.amount) < :requiredAmount")
    List<Object> findStudentsWithInsufficientPayment(
            @Param("year") String academicYear,
            @Param("semester") Integer semester,
            @Param("requiredAmount") Double requiredAmount
    );

    /**
     * Find students who have fully paid for a semester
     */
    @Query("SELECT DISTINCT p.student FROM Payment p " +
            "WHERE p.academicYear = :year " +
            "AND p.semester = :semester " +
            "AND p.paymentStatus = 'APPROVED' " +
            "GROUP BY p.student " +
            "HAVING SUM(p.amount) >= :requiredAmount")
    List<Object> findStudentsWithFullPayment(
            @Param("year") String academicYear,
            @Param("semester") Integer semester,
            @Param("requiredAmount") Double requiredAmount
    );

    // ==================== PAYMENT VERIFICATION ====================

    /**
     * Check if student has any approved payment for semester
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
            "FROM Payment p " +
            "WHERE p.student.id = :studentId " +
            "AND p.academicYear = :year " +
            "AND p.semester = :semester " +
            "AND p.paymentStatus = 'APPROVED'")
    boolean hasApprovedPayment(
            @Param("studentId") Long studentId,
            @Param("year") String academicYear,
            @Param("semester") Integer semester
    );

    /**
     * Check if student has pending payments
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END " +
            "FROM Payment p " +
            "WHERE p.student.id = :studentId " +
            "AND p.paymentStatus = 'PENDING'")
    boolean hasPendingPayments(@Param("studentId") Long studentId);

    // ==================== RECENT PAYMENTS ====================

    /**
     * Find recent payments (last N days)
     */
    @Query("SELECT p FROM Payment p " +
            "WHERE p.paymentDate >= :sinceDate " +
            "ORDER BY p.paymentDate DESC")
    List<Payment> findRecentPayments(@Param("sinceDate") LocalDateTime sinceDate);

    /**
     * Find latest N payments
     */
    @Query("SELECT p FROM Payment p ORDER BY p.paymentDate DESC LIMIT :limit")
    List<Payment> findLatestPayments(@Param("limit") int limit);

    /**
     * Find latest payments for a student
     */
    @Query("SELECT p FROM Payment p " +
            "WHERE p.student.id = :studentId " +
            "ORDER BY p.paymentDate DESC LIMIT :limit")
    List<Payment> findLatestPaymentsByStudent(
            @Param("studentId") Long studentId,
            @Param("limit") int limit
    );

    // ==================== PAYMENT BY PAYMENT METHOD ====================

    /**
     * Find payments by payment method
     */
    @Query("SELECT p FROM Payment p WHERE p.paymentMethod = :method ORDER BY p.paymentDate DESC")
    List<Payment> findByPaymentMethod(@Param("method") String paymentMethod);

    /**
     * Count payments by payment method
     */
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.paymentMethod = :method")
    Long countByPaymentMethod(@Param("method") String paymentMethod);

    // ==================== PROCESSED PAYMENTS ====================

    /**
     * Find payments processed by specific person
     */
    List<Payment> findByProcessedBy(String processedBy);

    /**
     * Find payments processed between dates
     */
    @Query("SELECT p FROM Payment p " +
            "WHERE p.processedAt BETWEEN :startDate AND :endDate " +
            "ORDER BY p.processedAt DESC")
    List<Payment> findPaymentsProcessedBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // ==================== CUSTOM QUERIES ====================

    /**
     * Get payment summary for dashboard
     */
    @Query("SELECT p.paymentStatus, COUNT(p), SUM(p.amount) " +
            "FROM Payment p " +
            "WHERE p.academicYear = :year AND p.semester = :semester " +
            "GROUP BY p.paymentStatus")
    List<Object[]> getPaymentSummaryByStatus(
            @Param("year") String academicYear,
            @Param("semester") Integer semester
    );

    /**
     * Find duplicate transaction references (for data integrity check)
     */
    @Query("SELECT p.transactionReference, COUNT(p) " +
            "FROM Payment p " +
            "GROUP BY p.transactionReference " +
            "HAVING COUNT(p) > 1")
    List<Object[]> findDuplicateTransactionReferences();

    /**
     * Find payments without course assignment
     */
    @Query("SELECT p FROM Payment p WHERE p.course IS NULL")
    List<Payment> findPaymentsWithoutCourse();

    /**
     * Find payments with notes containing specific keyword
     */
    @Query("SELECT p FROM Payment p WHERE LOWER(p.notes) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Payment> findPaymentsByNotesKeyword(@Param("keyword") String keyword);
}