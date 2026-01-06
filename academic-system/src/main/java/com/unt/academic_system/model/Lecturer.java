package com.unt.academic_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"courses"})
@Entity
@Table(name = "lecturers")
@PrimaryKeyJoinColumn(name = "id")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Lecturer extends User {

    @Column(unique = true, length = 20)
    private String employeeId;

    @Column(length = 100)
    private String department;

    @Column(length = 200)
    private String qualification;

    @Column(length = 200)
    private String specialization;

    @Column(length = 100)
    private String officeLocation;

    @Column(length = 200)
    private String officeHours;

    private LocalDate hireDate;

    /**
     * CRITICAL: Use fetch = FetchType.LAZY to avoid loading all courses
     * Use @JsonIgnoreProperties instead of @JsonIgnore to prevent circular reference
     * while still allowing manual serialization when needed
     */
    @OneToMany(mappedBy = "lecturer", cascade = {CascadeType.PERSIST, CascadeType.MERGE}, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"lecturer", "enrollments", "prerequisites", "contents"})
    private Set<Course> courses = new HashSet<>();

    /**
     * Initialize collections to avoid NullPointerException
     */
    @PostLoad
    @PostPersist
    public void initializeCollections() {
        if (this.courses == null) {
            this.courses = new HashSet<>();
        }
    }

    /**
     * Helper method to safely add a course
     * Maintains bidirectional relationship
     */
    public void addCourse(Course course) {
        if (course != null) {
            if (this.courses == null) {
                this.courses = new HashSet<>();
            }
            this.courses.add(course);
            if (course.getLecturer() != this) {
                course.setLecturer(this);
            }
        }
    }

    /**
     * Helper method to safely remove a course
     * Maintains bidirectional relationship
     */
    public void removeCourse(Course course) {
        if (course != null && this.courses != null) {
            this.courses.remove(course);
            if (course.getLecturer() == this) {
                course.setLecturer(null);
            }
        }
    }

    /**
     * Get the count of courses without triggering lazy loading issues
     */
    public int getCourseCount() {
        return courses != null ? courses.size() : 0;
    }
}