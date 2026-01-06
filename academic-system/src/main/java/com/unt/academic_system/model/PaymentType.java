package com.unt.academic_system.model;

public enum PaymentType {
    TUITION("Tuition Fees"),
    COURSE_FEE("Course Fee"),
    REGISTRATION("Registration"),
    LIBRARY("Library Fee"),
    EXAM("Exam Fee"),
    GRADUATION("Graduation Fee"),
    LATE_PAYMENT("Late Payment Fee"),
    OTHER("Other");

    private final String displayName;

    PaymentType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}