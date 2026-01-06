package com.unt.academic_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"enrollments", "payments", "parent"})
@ToString(callSuper = true, exclude = {"enrollments", "payments", "parent"})
@Entity
@Table(name = "students")
public class Student extends User {

    @Column(name = "student_id", nullable = false, unique = true, length = 20)
    private String studentId;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(nullable = false, length = 100)
    private String faculty;

    @Column(nullable = false, length = 100)
    private String program;

    @Column(name = "current_year", nullable = false)
    private Integer currentYear;

    @Column(name = "current_semester", nullable = false)
    private Integer currentSemester;

    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear;

    @Column(name = "enrollment_date", nullable = false)
    private LocalDate enrollmentDate;

    @Column(name = "cumulative_gpa", nullable = false)
    private Double cumulativeGPA = 0.0;

    @Column(name = "total_credits_earned", nullable = false)
    private Integer totalCreditsEarned = 0;

    @Column(length = 500)
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties({"children", "hibernateLazyInitializer"})
    private Parent parent;

    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Enrollment> enrollments = new HashSet<>();

    @OneToMany(mappedBy = "student", fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Payment> payments = new HashSet<>();
}