package com.unt.academic_system.dto;

import com.unt.academic_system.model.PaymentMethod;
import com.unt.academic_system.model.PaymentStatus;
import com.unt.academic_system.model.PaymentType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCreateDTO {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    private Long courseId;  // Optional

    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;

    @NotBlank(message = "Academic year is required")
    private String academicYear;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be 1 or 2")
    @Max(value = 2, message = "Semester must be 1 or 2")
    private Integer semester;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    @NotBlank(message = "Transaction reference is required")
    private String transactionReference;

    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    private String notes;
}