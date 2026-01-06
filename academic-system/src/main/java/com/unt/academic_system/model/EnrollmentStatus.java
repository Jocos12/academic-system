package com.unt.academic_system.model;

public enum EnrollmentStatus {
    PENDING,      // Waiting for payment/approval
    REGISTERED,   // Successfully enrolled
    IN_PROGRESS,  // Course ongoing
    COMPLETED,    // Course finished
    DROPPED,      // Student dropped the course
    FAILED        // Student failed the course
}