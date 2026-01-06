package com.unt.academic_system.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"lecturer", "prerequisites", "enrollments", "contents"})
@Entity
@Table(name = "courses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String courseCode;

    @Column(nullable = false, length = 200)
    private String courseName;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Integer credits;

    @Column(nullable = false, length = 100)
    private String faculty;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(nullable = false, length = 9)
    private String year;  // Changé de Integer à String

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer maxStudents = 50;

    @Column(nullable = false)
    private Boolean isActive = true;

    /**
     * CRITICAL FIX: Lecturer relationship with proper JSON handling
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lecturer_id")
    @JsonIgnoreProperties({"courses", "password", "hibernateLazyInitializer", "handler"})
    private Lecturer lecturer;

    /**
     * CRITICAL FIX: Prerequisites with proper JSON serialization
     * Using @JsonIgnoreProperties to prevent circular references
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "course_prerequisites",
            joinColumns = @JoinColumn(name = "course_id"),
            inverseJoinColumns = @JoinColumn(name = "prerequisite_id")
    )
    @JsonIgnoreProperties({"prerequisites", "enrollments", "contents", "lecturer", "hibernateLazyInitializer", "handler"})
    private Set<Course> prerequisites = new HashSet<>();

    /**
     * CRITICAL FIX: Enrollments - IGNORE COMPLETELY for serialization
     * This prevents ConcurrentModificationException
     */
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"course", "student", "hibernateLazyInitializer", "handler"}, allowSetters = true)
    private Set<Enrollment> enrollments = new HashSet<>();

    /**
     * CRITICAL FIX: Course contents - IGNORE for serialization
     */
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"course", "lecturer", "hibernateLazyInitializer", "handler"}, allowSetters = true)
    private Set<CourseContent> contents = new HashSet<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Helper method to maintain bidirectional relationship
     */
    /**
     * Helper method to maintain bidirectional relationship
     * CRITICAL: This ensures both sides of the relationship are synchronized
     */
    public void setLecturer(Lecturer lecturer) {
        // Remove from old lecturer if exists
        if (this.lecturer != null && this.lecturer != lecturer) {
            this.lecturer.getCourses().remove(this);
        }

        this.lecturer = lecturer;

        // Add to new lecturer if not null
        if (lecturer != null && !lecturer.getCourses().contains(this)) {
            lecturer.getCourses().add(this);
        }
    }

    /**
     * Initialize collections to avoid LazyInitializationException
     */
    @PostLoad
    public void initializeCollections() {
        if (this.prerequisites == null) {
            this.prerequisites = new HashSet<>();
        }
        if (this.enrollments == null) {
            this.enrollments = new HashSet<>();
        }
        if (this.contents == null) {
            this.contents = new HashSet<>();
        }
    }
}