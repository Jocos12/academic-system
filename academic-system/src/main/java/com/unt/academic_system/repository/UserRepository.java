package com.unt.academic_system.repository;

import com.unt.academic_system.model.User;
import com.unt.academic_system.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email (case-sensitive)
     */
    Optional<User> findByEmail(String email);

    /**
     * Find user by email (case-insensitive)
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * Check if email already exists (case-sensitive)
     */
    boolean existsByEmail(String email);

    /**
     * Check if email exists (case-insensitive)
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * Find users by role
     */
    List<User> findByRole(UserRole role);

    /**
     * Find active users
     * FIXED: Changed to findByIsActiveTrue() to match the 'isActive' field name in User entity
     */
    List<User> findByIsActiveTrue();

    /**
     * Find inactive users
     * FIXED: Changed to findByIsActiveFalse() to match the 'isActive' field name in User entity
     */
    List<User> findByIsActiveFalse();

    /**
     * Find user by phone number
     */
    Optional<User> findByPhoneNumber(String phoneNumber);

    /**
     * Find users by role and active status
     * FIXED: Changed to findByRoleAndIsActiveTrue() to match the 'isActive' field name
     */
    List<User> findByRoleAndIsActiveTrue(UserRole role);
}