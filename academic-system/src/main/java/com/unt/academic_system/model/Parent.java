package com.unt.academic_system.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "parents")
public class Parent extends User {

    @Column(nullable = false, length = 50)
    private String relationship; // Father, Mother, Guardian, Sponsor

    @Column(length = 100)
    private String occupation;

    @Column(length = 500)
    private String address;

    @OneToMany(mappedBy = "parent")
    @JsonIgnore
    private Set<Student> children = new HashSet<>();
}