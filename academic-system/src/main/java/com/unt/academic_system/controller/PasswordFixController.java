package com.unt.academic_system.controller;

import com.unt.academic_system.model.User;
import com.unt.academic_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ONE-TIME USE ONLY - Delete this controller after fixing passwords
 * This will re-encode all plain text passwords in the database to BCrypt
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/fix")
@RequiredArgsConstructor
public class PasswordFixController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Call this ONCE to fix all passwords in database
     * URL: POST http://localhost:8080/api/admin/fix/passwords
     */
    @PostMapping("/passwords")
    public ResponseEntity<?> fixAllPasswords() {
        try {
            log.warn("🔧 Starting password fix process...");

            List<User> allUsers = userRepository.findAll();
            int fixedCount = 0;

            for (User user : allUsers) {
                String currentPassword = user.getPassword();

                // Check if password is already BCrypt encoded
                // BCrypt passwords start with $2a$, $2b$, or $2y$ and are 60 chars long
                if (currentPassword != null &&
                        (currentPassword.startsWith("$2a$") ||
                                currentPassword.startsWith("$2b$") ||
                                currentPassword.startsWith("$2y$")) &&
                        currentPassword.length() == 60) {

                    log.info("✅ Password already encoded for: {}", user.getEmail());
                    continue;
                }

                // Password is plain text - encode it
                String encodedPassword = passwordEncoder.encode(currentPassword);
                user.setPassword(encodedPassword);
                userRepository.save(user);

                fixedCount++;
                log.info("🔐 Fixed password for: {} (was: {}...)",
                        user.getEmail(),
                        currentPassword.length() > 10 ? currentPassword.substring(0, 10) : currentPassword);
            }

            String message = String.format("✅ Password fix complete! Fixed %d out of %d users",
                    fixedCount, allUsers.size());
            log.warn(message);

            return ResponseEntity.ok().body(message);

        } catch (Exception e) {
            log.error("❌ Error fixing passwords: ", e);
            return ResponseEntity.internalServerError()
                    .body("Error: " + e.getMessage());
        }
    }

    /**
     * Fix a single user's password if you know their current plain password
     * URL: POST http://localhost:8080/api/admin/fix/single-password
     * Body: {"email": "user@example.com", "plainPassword": "password123"}
     */
    @PostMapping("/single-password")
    public ResponseEntity<?> fixSinglePassword(@RequestBody PasswordFixRequest request) {
        try {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String encodedPassword = passwordEncoder.encode(request.getPlainPassword());
            user.setPassword(encodedPassword);
            userRepository.save(user);

            log.info("🔐 Fixed password for: {}", user.getEmail());
            return ResponseEntity.ok("Password fixed successfully for: " + user.getEmail());

        } catch (Exception e) {
            log.error("❌ Error: ", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    static class PasswordFixRequest {
        private String email;
        private String plainPassword;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPlainPassword() { return plainPassword; }
        public void setPlainPassword(String plainPassword) { this.plainPassword = plainPassword; }
    }
}