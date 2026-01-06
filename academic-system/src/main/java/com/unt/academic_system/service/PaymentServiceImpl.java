package com.unt.academic_system.service;

import com.unt.academic_system.model.*;
import com.unt.academic_system.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AcademicYearRepository academicYearRepository;

    /**
     * Record a new payment with comprehensive validation
     */
    @Override
    public Payment recordPayment(Payment payment) {
        log.info("🔄 Recording new payment for student ID: {}", payment.getStudent().getId());

        try {
            // VALIDATION 1: Verify student exists
            Student student = studentRepository.findById(payment.getStudent().getId())
                    .orElseThrow(() -> new RuntimeException("Student not found with ID: " + payment.getStudent().getId()));
            payment.setStudent(student);
            log.info("✅ Student verified: {} {}", student.getFirstName(), student.getLastName());

            // VALIDATION 2: Verify academic year exists and is valid
            Optional<AcademicYear> academicYear = academicYearRepository
                    .findByYearCodeAndIsActiveTrue(payment.getAcademicYear());

            if (academicYear.isEmpty()) {
                academicYear = academicYearRepository.findByYearCode(payment.getAcademicYear());
                if (academicYear.isEmpty()) {
                    throw new RuntimeException("Academic year not found: " + payment.getAcademicYear());
                } else if (!academicYear.get().getIsActive()) {
                    log.warn("⚠️ Academic year {} is not active, but allowing payment", payment.getAcademicYear());
                }
            }
            log.info("✅ Academic year verified: {}", payment.getAcademicYear());

            // VALIDATION 3: Verify semester is valid (1 or 2)
            if (payment.getSemester() < 1 || payment.getSemester() > 2) {
                throw new RuntimeException("Invalid semester. Must be 1 or 2, got: " + payment.getSemester());
            }
            log.info("✅ Semester verified: {}", payment.getSemester());

            // VALIDATION 4: If payment is for a specific course, verify enrollment
            if (payment.getCourse() != null && payment.getCourse().getId() != null) {
                Course course = courseRepository.findById(payment.getCourse().getId())
                        .orElseThrow(() -> new RuntimeException("Course not found with ID: " + payment.getCourse().getId()));
                payment.setCourse(course);

                // Check if student is enrolled in this course
                List<Enrollment> enrollments = enrollmentRepository
                        .findByStudentIdAndAcademicYearAndSemester(
                                student.getId(),
                                payment.getAcademicYear(),
                                payment.getSemester()
                        );

                boolean isEnrolled = enrollments.stream()
                        .anyMatch(e -> e.getCourse() != null &&
                                e.getCourse().getId().equals(course.getId()));

                if (!isEnrolled) {
                    log.warn("⚠️ Student is not enrolled in course: {} for {} semester {}",
                            course.getCourseCode(), payment.getAcademicYear(), payment.getSemester());
                    // Allow payment but log warning - student might be paying in advance
                } else {
                    log.info("✅ Enrollment verified for course: {}", course.getCourseCode());
                }
            }

            // VALIDATION 5: Verify amount is positive
            if (payment.getAmount() == null || payment.getAmount() <= 0) {
                throw new RuntimeException("Payment amount must be greater than 0");
            }
            log.info("✅ Amount verified: {} FCFA", payment.getAmount());

            // VALIDATION 6: Check for duplicate transaction reference
            if (payment.getTransactionReference() != null && !payment.getTransactionReference().isEmpty()) {
                Optional<Payment> existingPayment = paymentRepository
                        .findByTransactionReference(payment.getTransactionReference());
                if (existingPayment.isPresent()) {
                    throw new RuntimeException("Duplicate transaction reference: " + payment.getTransactionReference());
                }
            } else {
                // Generate unique transaction reference
                payment.setTransactionReference(generateTransactionReference());
            }
            log.info("✅ Transaction reference verified: {}", payment.getTransactionReference());

            // Set default values
            if (payment.getPaymentStatus() == null) {
                payment.setPaymentStatus(PaymentStatus.PENDING);
            }

            if (payment.getPaymentDate() == null) {
                payment.setPaymentDate(LocalDateTime.now());
            }

            // Save payment
            Payment savedPayment = paymentRepository.save(payment);
            log.info("✅ Payment recorded successfully. ID: {}, Reference: {}",
                    savedPayment.getId(), savedPayment.getTransactionReference());

            return savedPayment;

        } catch (Exception e) {
            log.error("❌ Payment recording failed: {}", e.getMessage(), e);
            throw new RuntimeException("Payment recording failed: " + e.getMessage(), e);
        }
    }

    /**
     * Calculate required payment amount for a student's semester
     */
    @Override
    public Double calculateSemesterPayment(Long studentId, String academicYear, Integer semester) {
        log.info("💰 Calculating semester payment for student: {}, year: {}, semester: {}",
                studentId, academicYear, semester);

        try {
            // Get all enrollments for the student in this semester
            List<Enrollment> enrollments = enrollmentRepository
                    .findByStudentIdAndAcademicYearAndSemester(studentId, academicYear, semester);

            if (enrollments.isEmpty()) {
                log.warn("⚠️ No enrollments found for student {} in {} semester {}",
                        studentId, academicYear, semester);
                return 0.0;
            }

            double totalAmount = 0.0;

            // Calculate based on enrolled courses
            for (Enrollment enrollment : enrollments) {
                Course course = enrollment.getCourse();

                if (course != null && course.getPrice() != null) {
                    totalAmount += course.getPrice().doubleValue();
                    log.debug("📚 Course: {} - Price: {} FCFA", course.getCourseCode(), course.getPrice());
                } else {
                    log.warn("⚠️ Course has no price set: {}", course != null ? course.getCourseCode() : "Unknown");
                }
            }

            log.info("✅ Total calculated amount: {} FCFA for {} courses", totalAmount, enrollments.size());
            return totalAmount;

        } catch (Exception e) {
            log.error("❌ Error calculating semester payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to calculate semester payment: " + e.getMessage(), e);
        }
    }

    /**
     * Check if student has paid for a specific semester
     */
    @Override
    public boolean hasStudentPaidForSemester(Long studentId, String academicYear, Integer semester) {
        log.info("🔍 Checking payment status for student: {}, year: {}, semester: {}",
                studentId, academicYear, semester);

        try {
            // Get all approved payments
            List<Payment> approvedPayments = paymentRepository
                    .findByStudentIdAndAcademicYearAndSemesterAndPaymentStatus(
                            studentId, academicYear, semester, PaymentStatus.APPROVED
                    );

            // Calculate required amount
            Double requiredAmount = calculateSemesterPayment(studentId, academicYear, semester);

            // Calculate total paid amount
            Double paidAmount = approvedPayments.stream()
                    .mapToDouble(Payment::getAmount)
                    .sum();

            boolean hasPaid = paidAmount >= requiredAmount;
            log.info("💳 Payment status - Required: {} FCFA, Paid: {} FCFA, Status: {}",
                    requiredAmount, paidAmount, hasPaid ? "PAID" : "UNPAID");

            return hasPaid;

        } catch (Exception e) {
            log.error("❌ Error checking payment status: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Get comprehensive payment summary for a student's semester
     */
    @Override
    public PaymentSummary getPaymentSummary(Long studentId, String academicYear, Integer semester) {
        log.info("📊 Getting payment summary for student: {}, year: {}, semester: {}",
                studentId, academicYear, semester);

        try {
            // Calculate required amount
            Double requiredAmount = calculateSemesterPayment(studentId, academicYear, semester);

            // Get all payments for this semester
            List<Payment> allPayments = paymentRepository
                    .findByStudentIdAndAcademicYearAndSemester(studentId, academicYear, semester);

            // Calculate paid amount (approved only)
            Double paidAmount = allPayments.stream()
                    .filter(p -> PaymentStatus.APPROVED.equals(p.getPaymentStatus()))
                    .mapToDouble(Payment::getAmount)
                    .sum();

            // Calculate pending amount
            Double pendingAmount = allPayments.stream()
                    .filter(p -> PaymentStatus.PENDING.equals(p.getPaymentStatus()))
                    .mapToDouble(Payment::getAmount)
                    .sum();

            // Calculate remaining amount
            Double remainingAmount = Math.max(0, requiredAmount - paidAmount);

            // Determine payment status
            String paymentStatus = remainingAmount <= 0 ? "PAID" : "UNPAID";

            PaymentSummary summary = new PaymentSummary(
                    requiredAmount,
                    paidAmount,
                    pendingAmount,
                    remainingAmount,
                    paymentStatus
            );

            log.info("✅ Payment summary generated: {}", summary);
            return summary;

        } catch (Exception e) {
            log.error("❌ Error generating payment summary: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate payment summary: " + e.getMessage(), e);
        }
    }

    /**
     * Approve a payment
     */
    @Override
    public Payment approvePayment(Long paymentId, String approvedBy) {
        log.info("✅ Approving payment ID: {} by: {}", paymentId, approvedBy);

        try {
            Payment payment = paymentRepository.findById(paymentId)
                    .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + paymentId));

            if (!PaymentStatus.PENDING.equals(payment.getPaymentStatus())) {
                throw new RuntimeException("Can only approve PENDING payments. Current status: " +
                        payment.getPaymentStatus());
            }

            payment.setPaymentStatus(PaymentStatus.APPROVED);
            payment.setProcessedBy(approvedBy);
            payment.setProcessedAt(LocalDateTime.now());
            payment.setRejectionReason(null);

            Payment approved = paymentRepository.save(payment);
            log.info("✅ Payment approved successfully");

            return approved;

        } catch (Exception e) {
            log.error("❌ Payment approval failed: {}", e.getMessage(), e);
            throw new RuntimeException("Payment approval failed: " + e.getMessage(), e);
        }
    }

    /**
     * Reject a payment
     */
    @Override
    public Payment rejectPayment(Long paymentId, String rejectedBy, String reason) {
        log.info("❌ Rejecting payment ID: {} by: {}", paymentId, rejectedBy);

        try {
            Payment payment = paymentRepository.findById(paymentId)
                    .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + paymentId));

            if (!PaymentStatus.PENDING.equals(payment.getPaymentStatus())) {
                throw new RuntimeException("Can only reject PENDING payments. Current status: " +
                        payment.getPaymentStatus());
            }

            if (reason == null || reason.trim().isEmpty()) {
                throw new RuntimeException("Rejection reason is required");
            }

            payment.setPaymentStatus(PaymentStatus.REJECTED);
            payment.setProcessedBy(rejectedBy);
            payment.setProcessedAt(LocalDateTime.now());
            payment.setRejectionReason(reason);

            Payment rejected = paymentRepository.save(payment);
            log.info("✅ Payment rejected successfully. Reason: {}", reason);

            return rejected;

        } catch (Exception e) {
            log.error("❌ Payment rejection failed: {}", e.getMessage(), e);
            throw new RuntimeException("Payment rejection failed: " + e.getMessage(), e);
        }
    }

    /**
     * Get all payments for a student (ordered by date)
     */
    @Override
    public List<Payment> getStudentPayments(Long studentId) {
        log.info("📋 Fetching payments for student: {}", studentId);
        return paymentRepository.findByStudentIdOrderByPaymentDateDesc(studentId);
    }

    /**
     * Get payments by status
     */
    @Override
    public List<Payment> getPaymentsByStatus(PaymentStatus status) {
        log.info("📋 Fetching payments with status: {}", status);
        return paymentRepository.findByPaymentStatusOrderByPaymentDateDesc(status);
    }

    /**
     * Find payment by transaction reference
     */
    @Override
    public Optional<Payment> findByTransactionReference(String reference) {
        log.info("🔍 Finding payment by reference: {}", reference);
        return paymentRepository.findByTransactionReference(reference);
    }

    /**
     * Calculate total revenue for academic year and semester
     */
    @Override
    public Double calculateTotalRevenue(String academicYear, Integer semester) {
        log.info("💰 Calculating revenue for year: {}, semester: {}", academicYear, semester);

        try {
            List<Payment> approvedPayments = paymentRepository
                    .findByAcademicYearAndSemesterAndPaymentStatus(
                            academicYear, semester, PaymentStatus.APPROVED
                    );

            Double revenue = approvedPayments.stream()
                    .mapToDouble(Payment::getAmount)
                    .sum();

            log.info("✅ Total revenue: {} FCFA from {} payments", revenue, approvedPayments.size());
            return revenue;

        } catch (Exception e) {
            log.error("❌ Error calculating revenue: {}", e.getMessage(), e);
            return 0.0;
        }
    }

    /**
     * Get all payments
     */
    @Override
    public List<Payment> findAll() {
        log.info("📋 Fetching all payments");
        return paymentRepository.findAll();
    }

    /**
     * Find payment by ID
     */
    @Override
    public Optional<Payment> findById(Long id) {
        log.info("🔍 Finding payment by ID: {}", id);
        return paymentRepository.findById(id);
    }

    /**
     * Update payment details
     */
    @Override
    public Payment updatePayment(Long id, Payment payment) {
        log.info("✏️ Updating payment ID: {}", id);

        try {
            Payment existing = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment not found with ID: " + id));

            // Only allow updating certain fields
            if (payment.getAmount() != null && payment.getAmount() > 0) {
                existing.setAmount(payment.getAmount());
            }
            if (payment.getPaymentMethod() != null) {
                existing.setPaymentMethod(payment.getPaymentMethod());
            }
            if (payment.getNotes() != null) {
                existing.setNotes(payment.getNotes());
            }

            Payment updated = paymentRepository.save(existing);
            log.info("✅ Payment updated successfully");

            return updated;

        } catch (Exception e) {
            log.error("❌ Payment update failed: {}", e.getMessage(), e);
            throw new RuntimeException("Payment update failed: " + e.getMessage(), e);
        }
    }

    /**
     * Generate unique transaction reference
     */
    private String generateTransactionReference() {
        String prefix = "TXN";
        String timestamp = String.valueOf(System.currentTimeMillis());
        String uuid = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String reference = prefix + "-" + timestamp + "-" + uuid;

        log.debug("🔑 Generated transaction reference: {}", reference);
        return reference;
    }
}