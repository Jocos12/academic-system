package com.unt.academic_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(length = 1000)
    private String description;

    @JsonIgnore  // Keep this to prevent circular reference
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    // This allows reading/writing facultyId in JSON
    @Column(name = "faculty_id", insertable = false, updatable = false)
    @JsonProperty("facultyId")
    private Long facultyId;

    // Add this getter to expose faculty details without circular reference
    @JsonProperty("facultyName")
    @Transient
    public String getFacultyName() {
        return faculty != null ? faculty.getName() : null;
    }

    @JsonProperty("facultyCode")
    @Transient
    public String getFacultyCode() {
        return faculty != null ? faculty.getCode() : null;
    }

    @ManyToOne
    @JoinColumn(name = "head_id")
    private Lecturer head;

    @Column(nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}