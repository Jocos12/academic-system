package com.unt.academic_system.model;

public enum UserRole {
    STUDENT("Student"),
    LECTURER("Lecturer"),
    ADMIN("Administrator"),
    PARENT("Parent");

    private final String displayName;

    UserRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    @Override
    public String toString() {
        return this.name();
    }
}