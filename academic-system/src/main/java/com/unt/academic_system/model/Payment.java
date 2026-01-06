package com.unt.academic_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_student_id", columnList = "student_id"),
        @Index(name = "idx_transaction_ref", columnList = "transaction_reference"),
        @Index(name = "idx_payment_status", columnList = "payment_status"),
        @Index(name = "idx_academic_year_semester", columnList = "academic_year,semester")
})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"enrollments", "payments", "parent", "password"})
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    @JsonIgnoreProperties({"enrollments", "prerequisites", "courseMaterials", "lecturer"})
    private Course course;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 30)
    private PaymentType paymentType;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    @Column(nullable = false)
    private Integer semester;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "transaction_reference", unique = true, nullable = false, length = 100)
    private String transactionReference;

    @Column(length = 1000)
    private String notes;

    @Column(name = "processed_by", length = 100)
    private String processedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "payment_date", nullable = false, updatable = false)
    private LocalDateTime paymentDate;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    // Helper methods
    public boolean isPending() {
        return PaymentStatus.PENDING.equals(this.paymentStatus);
    }

    public boolean isApproved() {
        return PaymentStatus.APPROVED.equals(this.paymentStatus);
    }

    public boolean isRejected() {
        return PaymentStatus.REJECTED.equals(this.paymentStatus);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Payment)) return false;
        Payment payment = (Payment) o;
        return id != null && Objects.equals(id, payment.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Payment{" +
                "id=" + id +
                ", amount=" + amount +
                ", academicYear='" + academicYear + '\'' +
                ", semester=" + semester +
                ", paymentStatus=" + paymentStatus +
                ", transactionReference='" + transactionReference + '\'' +
                '}';
    }
}