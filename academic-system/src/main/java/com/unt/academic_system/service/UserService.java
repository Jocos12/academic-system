package com.unt.academic_system.service;

import com.unt.academic_system.model.User;
import com.unt.academic_system.model.UserRole;

import java.util.List;
import java.util.Optional;

public interface UserService {

    // Register new user
    User registerUser(User user);

    // Login user
    Optional<User> login(String email, String password);

    // Find user by ID
    Optional<User> findById(Long id);

    // Find user by email
    Optional<User> findByEmail(String email);

    // Update user
    User updateUser(Long id, User user);

    // Deactivate user account
    void deactivateUser(Long id);

    // Activate user account
    void activateUser(Long id);

    // Get all users
    List<User> getAllUsers();

    // Get users by role
    List<User> getUsersByRole(UserRole role);

    // Change password
    void changePassword(Long userId, String oldPassword, String newPassword);
}