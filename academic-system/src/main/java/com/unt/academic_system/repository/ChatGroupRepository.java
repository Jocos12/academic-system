package com.unt.academic_system.repository;

import com.unt.academic_system.model.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {

    // Find groups by type
    List<ChatGroup> findByType(ChatGroup.GroupType type);

    // Find active groups by type
    List<ChatGroup> findByTypeAndIsActiveTrue(ChatGroup.GroupType type);

    // Find groups created by a user
    List<ChatGroup> findByCreatedBy(String createdBy);

    // Find groups where user is a member
    @Query("SELECT g FROM ChatGroup g JOIN g.memberEmails m WHERE m = :email AND g.isActive = true")
    List<ChatGroup> findGroupsByMemberEmail(@Param("email") String email);

    // Find groups where user is an admin
    @Query("SELECT g FROM ChatGroup g JOIN g.adminEmails a WHERE a = :email AND g.isActive = true")
    List<ChatGroup> findGroupsByAdminEmail(@Param("email") String email);

    // Find group by name and type
    Optional<ChatGroup> findByNameAndType(String name, ChatGroup.GroupType type);

    // Check if group exists by type
    boolean existsByType(ChatGroup.GroupType type);

    // Find all active groups
    List<ChatGroup> findByIsActiveTrue();

    // Search groups by name
    @Query("SELECT g FROM ChatGroup g WHERE g.isActive = true AND LOWER(g.name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<ChatGroup> searchByName(@Param("searchTerm") String searchTerm);
}