package com.unt.academic_system.controller;

import com.unt.academic_system.model.User;
import com.unt.academic_system.service.JwtService;
import com.unt.academic_system.service.OTPService;
import com.unt.academic_system.service.UserService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:63342", "http://localhost:63343", "http://localhost:5500", "http://127.0.0.1:5500"}, allowCredentials = "true")
public class AuthController {

    private final UserService userService;
    private final OTPService otpService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // ==================== CREDENTIALS VERIFICATION ====================

    @PostMapping("/verify-credentials")
    public ResponseEntity<?> verifyCredentials(@RequestBody CredentialsRequest request) {
        try {
            log.info("🔐 Verifying credentials for email: {}", request.getEmail());

            // Validate input
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                log.warn("❌ Empty email provided");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email is required"));
            }

            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                log.warn("❌ Empty password provided");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Password is required"));
            }

            // Find user by email (case-insensitive)
            Optional<User> userOptional = userService.findByEmail(request.getEmail().toLowerCase().trim());

            if (userOptional.isEmpty()) {
                log.warn("❌ User not found: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid email or password"));
            }

            User user = userOptional.get();

            // Check if account is active
            Boolean isActive = user.getIsActive();
            if (isActive == null || !isActive) {
                log.warn("❌ Account inactive: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Account is inactive. Please contact support."));
            }

            // Debug password info (REMOVE IN PRODUCTION)
            log.debug("🔍 Stored password length: {}", user.getPassword().length());
            log.debug("🔍 Input password length: {}", request.getPassword().length());
            log.debug("🔍 Password starts with $2: {}", user.getPassword().startsWith("$2"));

            // Verify password
            boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());

            log.info("🔑 Password match result for {}: {}", request.getEmail(), passwordMatches);

            if (!passwordMatches) {
                log.warn("❌ Invalid password for: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid email or password"));
            }

            // Password is correct - return user data (without password)
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("role", user.getRole().toString());

            log.info("✅ Credentials verified successfully for: {} (Role: {})",
                    request.getEmail(), user.getRole());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("💥 Error verifying credentials: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An error occurred during authentication"));
        }
    }

    // ==================== OTP MANAGEMENT ====================

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOTP(@RequestBody OTPRequest request) {
        try {
            log.info("📧 OTP requested for: {}", request.getEmail());

            // Verify user exists
            Optional<User> userOptional = userService.findByEmail(request.getEmail().toLowerCase().trim());
            if (userOptional.isEmpty()) {
                log.warn("❌ User not found for OTP request: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            // Generate and send OTP
            otpService.generateAndSendOTP(request.getEmail().toLowerCase().trim());

            log.info("✅ OTP sent successfully to: {}", request.getEmail());
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully", "email", request.getEmail()));

        } catch (Exception e) {
            log.error("💥 Error sending OTP: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send OTP"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(@RequestBody OTPVerifyRequest request, HttpSession session) {
        try {
            log.info("🔐 Verifying OTP for: {}", request.getEmail());

            boolean isValid = otpService.verifyOTP(request.getEmail().toLowerCase().trim(), request.getOtp());

            if (!isValid) {
                log.warn("❌ Invalid OTP for: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid or expired OTP"));
            }

            // OTP is valid - get user and create session
            Optional<User> userOptional = userService.findByEmail(request.getEmail().toLowerCase().trim());
            if (userOptional.isEmpty()) {
                log.warn("❌ User not found after OTP verification: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            User user = userOptional.get();

            // ✅ Generate JWT tokens
            String accessToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            // Store user info in session
            session.setAttribute("userId", user.getId());
            session.setAttribute("userRole", user.getRole().toString());
            session.setAttribute("userEmail", user.getEmail());

            // Prepare response (without password)
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("role", user.getRole().toString());
            response.put("token", accessToken);
            response.put("refreshToken", refreshToken);
            response.put("expiresIn", 86400000); // 24 hours

            log.info("✅ Login successful for: {} (Role: {})", user.getEmail(), user.getRole());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("💥 Error verifying OTP: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An error occurred during OTP verification"));
        }
    }

    // ==================== TOKEN MANAGEMENT ====================

    /**
     * Get token for authenticated user (for WebSocket/API use)
     */
    @PostMapping("/token")
    public ResponseEntity<?> getToken(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            }

            log.info("📝 Token request for user: {}", email);

            // Find user by email
            Optional<User> userOptional = userService.findByEmail(email.toLowerCase().trim());
            if (userOptional.isEmpty()) {
                log.warn("❌ User not found for token request: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            User user = userOptional.get();

            // Check if user is active
            if (!Boolean.TRUE.equals(user.getIsActive())) {
                log.warn("❌ Inactive user attempted to get token: {}", email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "User account is not active"));
            }

            // Generate new tokens
            String accessToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            log.info("✅ Generated tokens for user: {}", email);

            return ResponseEntity.ok(Map.of(
                    "token", accessToken,
                    "refreshToken", refreshToken,
                    "email", email,
                    "userId", user.getId(),
                    "role", user.getRole().name(),
                    "expiresIn", 86400000 // 24 hours
            ));

        } catch (Exception e) {
            log.error("💥 Error generating token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    /**
     * Validate token
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Token is required"));
            }

            log.info("🔍 Validating token...");

            // Use safe validation method
            boolean isValid = jwtService.isTokenValidSafe(token);

            if (isValid) {
                String email = jwtService.getEmailFromToken(token);
                Map<String, Object> tokenInfo = jwtService.getUserInfoFromToken(token);

                log.info("✅ Token valid for user: {}", email);

                return ResponseEntity.ok(Map.of(
                        "valid", true,
                        "email", email,
                        "userInfo", tokenInfo
                ));
            } else {
                log.warn("⚠️ Invalid or expired token");
                return ResponseEntity.ok(Map.of(
                        "valid", false,
                        "message", "Token is invalid or expired"
                ));
            }

        } catch (Exception e) {
            log.error("💥 Error validating token: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "error", "Token validation failed"
            ));
        }
    }

    /**
     * Refresh token
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null || refreshToken.trim().isEmpty()) {
                log.warn("❌ Empty refresh token provided");
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Refresh token is required"));
            }

            log.info("🔄 Refreshing token...");

            // Validate refresh token format
            if (!jwtService.isValidTokenFormat(refreshToken)) {
                log.warn("❌ Invalid refresh token format");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid refresh token format"));
            }

            // Check if it's actually a refresh token
            if (!jwtService.isRefreshToken(refreshToken)) {
                log.warn("❌ Not a refresh token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid refresh token type"));
            }

            // Extract email safely
            String email = jwtService.getEmailFromToken(refreshToken);
            if (email == null || email.trim().isEmpty()) {
                log.warn("❌ Could not extract email from refresh token");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid refresh token - no user info"));
            }

            // Find user
            Optional<User> userOptional = userService.findByEmail(email.toLowerCase().trim());
            if (userOptional.isEmpty()) {
                log.warn("❌ User not found for refresh token: {}", email);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }

            User user = userOptional.get();

            // Check if user is active
            if (!Boolean.TRUE.equals(user.getIsActive())) {
                log.warn("❌ Inactive user attempted to refresh token: {}", email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "User account is not active"));
            }

            // Validate refresh token against user
            if (!jwtService.validateRefreshToken(refreshToken, user)) {
                log.warn("❌ Refresh token validation failed for user: {}", email);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Refresh token validation failed"));
            }

            // Generate new tokens
            String newAccessToken = jwtService.generateToken(user);
            String newRefreshToken = jwtService.generateRefreshToken(user);

            log.info("✅ Tokens refreshed successfully for user: {}", email);

            return ResponseEntity.ok(Map.of(
                    "token", newAccessToken,
                    "refreshToken", newRefreshToken,
                    "email", email,
                    "userId", user.getId(),
                    "role", user.getRole().name(),
                    "expiresIn", 86400000 // 24 hours
            ));

        } catch (Exception e) {
            log.error("💥 Error refreshing token: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Token refresh failed", "message", e.getMessage()));
        }
    }

    // ==================== LOGOUT ====================

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        try {
            String userEmail = (String) session.getAttribute("userEmail");
            session.invalidate();
            log.info("✅ User logged out successfully: {}", userEmail);
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            log.error("💥 Error during logout: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Logout failed"));
        }
    }

    // ==================== REQUEST DTOs ====================

    static class CredentialsRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    static class OTPRequest {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    static class OTPVerifyRequest {
        private String email;
        private String otp;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getOtp() {
            return otp;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }
    }
}