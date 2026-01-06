package com.unt.academic_system.controller;

import com.unt.academic_system.dto.PaymentCreateDTO;
import com.unt.academic_system.model.Course;
import com.unt.academic_system.model.Payment;
import com.unt.academic_system.model.PaymentStatus;
import com.unt.academic_system.model.Student;
import com.unt.academic_system.service.PaymentService;
import com.unt.academic_system.service.PaymentService.PaymentSummary;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Record a new payment
     */
    /**
     * Record a new payment - UPDATED to use DTO
     */
    @PostMapping
    public ResponseEntity<?> recordPayment(@Valid @RequestBody PaymentCreateDTO paymentDTO) {
        try {
            // Convert DTO to Payment entity
            Payment payment = new Payment();

            // Set student
            Student student = new Student();
            student.setId(paymentDTO.getStudentId());
            payment.setStudent(student);

            // Set course if provided
            if (paymentDTO.getCourseId() != null) {
                Course course = new Course();
                course.setId(paymentDTO.getCourseId());
                payment.setCourse(course);
            }

            // Set other fields
            payment.setPaymentType(paymentDTO.getPaymentType());
            payment.setAmount(paymentDTO.getAmount());
            payment.setAcademicYear(paymentDTO.getAcademicYear());
            payment.setSemester(paymentDTO.getSemester());
            payment.setPaymentMethod(paymentDTO.getPaymentMethod());
            payment.setTransactionReference(paymentDTO.getTransactionReference());
            payment.setPaymentStatus(paymentDTO.getPaymentStatus());
            payment.setNotes(paymentDTO.getNotes());

            Payment savedPayment = paymentService.recordPayment(payment);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedPayment);
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all payments
     */
    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(paymentService.findAll());
    }

    /**
     * Get payment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPaymentById(@PathVariable Long id) {
        Optional<Payment> payment = paymentService.findById(id);
        return payment.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Get payments for a student
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Payment>> getStudentPayments(@PathVariable Long studentId) {
        return ResponseEntity.ok(paymentService.getStudentPayments(studentId));
    }

    /**
     * ✅ NEW ENDPOINT: Get payment summary for student
     */
    @GetMapping("/student/{studentId}/summary/{academicYear}/{semester}")
    public ResponseEntity<?> getPaymentSummary(
            @PathVariable Long studentId,
            @PathVariable String academicYear,
            @PathVariable Integer semester) {
        try {
            PaymentSummary summary = paymentService.getPaymentSummary(studentId, academicYear, semester);
            return ResponseEntity.ok(summary);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    /**
     * Get payments by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Payment>> getPaymentsByStatus(@PathVariable PaymentStatus status) {
        return ResponseEntity.ok(paymentService.getPaymentsByStatus(status));
    }

    /**
     * Find payment by transaction reference
     */
    @GetMapping("/reference/{reference}")
    public ResponseEntity<?> findByTransactionReference(@PathVariable String reference) {
        Optional<Payment> payment = paymentService.findByTransactionReference(reference);
        return payment.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Approve a payment
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approvePayment(
            @PathVariable Long id,
            @RequestParam String approvedBy) {
        try {
            Payment approved = paymentService.approvePayment(id, approvedBy);
            return ResponseEntity.ok(approved);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * Reject a payment
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectPayment(
            @PathVariable Long id,
            @RequestParam String rejectedBy,
            @RequestParam String reason) {
        try {
            Payment rejected = paymentService.rejectPayment(id, rejectedBy, reason);
            return ResponseEntity.ok(rejected);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * Update payment
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePayment(
            @PathVariable Long id,
            @RequestBody Payment payment) {
        try {
            Payment updated = paymentService.updatePayment(id, payment);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * Calculate semester payment
     */
    @GetMapping("/student/{studentId}/calculate/{academicYear}/{semester}")
    public ResponseEntity<?> calculateSemesterPayment(
            @PathVariable Long studentId,
            @PathVariable String academicYear,
            @PathVariable Integer semester) {
        try {
            Double amount = paymentService.calculateSemesterPayment(studentId, academicYear, semester);
            return ResponseEntity.ok(amount);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    /**
     * Check if student has paid for semester
     */
    @GetMapping("/student/{studentId}/check-payment/{academicYear}/{semester}")
    public ResponseEntity<?> hasStudentPaid(
            @PathVariable Long studentId,
            @PathVariable String academicYear,
            @PathVariable Integer semester) {
        try {
            boolean hasPaid = paymentService.hasStudentPaidForSemester(studentId, academicYear, semester);
            return ResponseEntity.ok(hasPaid);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    /**
     * Calculate total revenue
     */
    @GetMapping("/revenue/{academicYear}/{semester}")
    public ResponseEntity<?> calculateRevenue(
            @PathVariable String academicYear,
            @PathVariable Integer semester) {
        try {
            Double revenue = paymentService.calculateTotalRevenue(academicYear, semester);
            return ResponseEntity.ok(revenue);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}