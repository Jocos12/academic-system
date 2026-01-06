package com.unt.academic_system.service;

import com.unt.academic_system.dto.ParentResponseDTO;
import com.unt.academic_system.model.Parent;
import com.unt.academic_system.model.UserRole;
import com.unt.academic_system.repository.ParentRepository;
import com.unt.academic_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParentServiceImpl implements ParentService {

    private final ParentRepository parentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Parent registerParent(Parent parent) {
        if (userRepository.existsByEmail(parent.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        parent.setRole(UserRole.PARENT);
        parent.setIsActive(true);

        return parentRepository.save(parent);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Parent> findById(Long id) {
        return parentRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public ParentResponseDTO getParentWithDetails(Long id) {
        log.info("🔍 Fetching parent with ID: {}", id);

        // ✅ Use the custom query that fetches everything in ONE go
        Optional<Parent> parentOpt = parentRepository.findByIdWithDetails(id);

        if (parentOpt.isEmpty()) {
            log.warn("⚠️ Parent not found with ID: {}", id);
            return null;
        }

        Parent parent = parentOpt.get();
        log.info("✅ Parent found: {} {}", parent.getFirstName(), parent.getLastName());

        if (parent.getChildren() != null) {
            log.info("👨‍👩‍👧 Found {} children", parent.getChildren().size());

            parent.getChildren().forEach(student -> {
                log.info("  - Student: {} (Enrollments: {}, Payments: {})",
                        student.getStudentId(),
                        student.getEnrollments() != null ? student.getEnrollments().size() : 0,
                        student.getPayments() != null ? student.getPayments().size() : 0);
            });
        }

        // Convert to DTO (all data is already loaded)
        ParentResponseDTO dto = ParentResponseDTO.fromEntity(parent);
        log.info("✅ DTO created successfully");

        return dto;
    }

    @Override
    @Transactional
    public Parent updateParent(Long id, Parent updatedParent) {
        Parent existing = parentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parent not found"));

        existing.setFirstName(updatedParent.getFirstName());
        existing.setLastName(updatedParent.getLastName());
        existing.setPhoneNumber(updatedParent.getPhoneNumber());
        existing.setRelationship(updatedParent.getRelationship());
        existing.setOccupation(updatedParent.getOccupation());
        existing.setAddress(updatedParent.getAddress());

        return parentRepository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Parent> getAllParents() {
        return parentRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Parent> getParentsByRelationship(String relationship) {
        return parentRepository.findByRelationship(relationship);
    }
}