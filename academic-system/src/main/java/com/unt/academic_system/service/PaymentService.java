package com.unt.academic_system.service;

import com.unt.academic_system.model.Payment;
import com.unt.academic_system.model.PaymentStatus;

import java.util.List;
import java.util.Optional;

public interface PaymentService {

    // Core payment operations
    Payment recordPayment(Payment payment);
    Optional<Payment> findById(Long id);
    Optional<Payment> findByTransactionReference(String reference);
    Payment updatePayment(Long id, Payment payment);
    List<Payment> findAll();

    // Student payment queries
    List<Payment> getStudentPayments(Long studentId);
    List<Payment> getPaymentsByStatus(PaymentStatus status);

    // Payment calculations
    Double calculateSemesterPayment(Long studentId, String academicYear, Integer semester);
    Double calculateTotalRevenue(String academicYear, Integer semester);

    // Payment verification
    boolean hasStudentPaidForSemester(Long studentId, String academicYear, Integer semester);
    PaymentSummary getPaymentSummary(Long studentId, String academicYear, Integer semester);

    // Payment approval/rejection
    Payment approvePayment(Long paymentId, String approvedBy);
    Payment rejectPayment(Long paymentId, String rejectedBy, String reason);

    // Inner class for payment summary
    class PaymentSummary {
        private Double requiredAmount;
        private Double paidAmount;
        private Double pendingAmount;
        private Double remainingAmount;
        private String paymentStatus;

        public PaymentSummary() {}

        public PaymentSummary(Double requiredAmount, Double paidAmount, Double pendingAmount,
                              Double remainingAmount, String paymentStatus) {
            this.requiredAmount = requiredAmount;
            this.paidAmount = paidAmount;
            this.pendingAmount = pendingAmount;
            this.remainingAmount = remainingAmount;
            this.paymentStatus = paymentStatus;
        }

        // Getters and Setters
        public Double getRequiredAmount() { return requiredAmount; }
        public void setRequiredAmount(Double requiredAmount) { this.requiredAmount = requiredAmount; }

        public Double getPaidAmount() { return paidAmount; }
        public void setPaidAmount(Double paidAmount) { this.paidAmount = paidAmount; }

        public Double getPendingAmount() { return pendingAmount; }
        public void setPendingAmount(Double pendingAmount) { this.pendingAmount = pendingAmount; }

        public Double getRemainingAmount() { return remainingAmount; }
        public void setRemainingAmount(Double remainingAmount) { this.remainingAmount = remainingAmount; }

        public String getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

        @Override
        public String toString() {
            return "PaymentSummary{" +
                    "requiredAmount=" + requiredAmount +
                    ", paidAmount=" + paidAmount +
                    ", pendingAmount=" + pendingAmount +
                    ", remainingAmount=" + remainingAmount +
                    ", paymentStatus='" + paymentStatus + '\'' +
                    '}';
        }
    }
}