package com.unt.academic_system.service;

import com.unt.academic_system.dto.ParentResponseDTO;
import com.unt.academic_system.model.Parent;

import java.util.List;
import java.util.Optional;

public interface ParentService {

    Parent registerParent(Parent parent);
    Optional<Parent> findById(Long id);
    ParentResponseDTO getParentWithDetails(Long id); // ✅ NEW METHOD
    Parent updateParent(Long id, Parent parent);
    List<Parent> getAllParents();
    List<Parent> getParentsByRelationship(String relationship);
}