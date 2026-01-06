package com.unt.academic_system.repository;

import com.unt.academic_system.model.Parent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ParentRepository extends JpaRepository<Parent, Long> {

    // ✅ CRITICAL: Fetch parent with all nested data in ONE query
    @Query("SELECT DISTINCT p FROM Parent p " +
            "LEFT JOIN FETCH p.children c " +
            "LEFT JOIN FETCH c.enrollments e " +
            "LEFT JOIN FETCH e.course " +
            "LEFT JOIN FETCH c.payments " +
            "WHERE p.id = :id")
    Optional<Parent> findByIdWithDetails(@Param("id") Long id);

    List<Parent> findByRelationship(String relationship);

    List<Parent> findByOccupation(String occupation);
}