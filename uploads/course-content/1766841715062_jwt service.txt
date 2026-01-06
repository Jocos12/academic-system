package com.unt.academic_system.service;

import com.unt.academic_system.model.*;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration; // Default 24 hours

    @Value("${jwt.refresh.expiration:604800000}")
    private long refreshExpiration; // Default 7 days

    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes();
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT secret key must be at least 32 bytes for HS256");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ==================== EXTRACTION METHODS ====================

    public String extractUsername(String token) {
        try {
            return extractClaim(token, Claims::getSubject);
        } catch (ExpiredJwtException e) {
            logger.warn("JWT token is expired: {}", e.getMessage());
            throw new RuntimeException("Token expired");
        } catch (MalformedJwtException e) {
            logger.warn("JWT token is malformed: {}", e.getMessage());
            throw new RuntimeException("Malformed token");
        } catch (SignatureException e) {
            logger.warn("JWT signature validation failed: {}", e.getMessage());
            throw new RuntimeException("Invalid token signature");
        } catch (Exception e) {
            logger.error("Unexpected error extracting username from token: {}", e.getMessage());
            throw new RuntimeException("Invalid token");
        }
    }





    // AJOUTER cette méthode pour gérer les tokens expirés
    public String extractEmailFromExpiredToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return null;
            }

            // Extraire l'email même d'un token expiré
            try {
                Jws<Claims> claimsJws = Jwts.parserBuilder()
                        .setSigningKey(getSigningKey())
                        .build()
                        .parseClaimsJws(token);

                String email = claimsJws.getBody().get("email", String.class);
                return email != null ? email : claimsJws.getBody().getSubject();
            } catch (ExpiredJwtException e) {
                // Token expiré, mais on peut extraire les claims
                String email = e.getClaims().get("email", String.class);
                return email != null ? email : e.getClaims().getSubject();
            }
        } catch (Exception e) {
            logger.error("Error extracting email from expired token: {}", e.getMessage());
            return null;
        }
    }

    // MODIFIER extractEmail pour mieux gérer l'expiration
    public String extractEmail(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                logger.error("❌ Token is null or empty");
                throw new IllegalArgumentException("Token cannot be null or empty");
            }

            Claims claims = extractAllClaims(token);
            if (claims == null) {
                logger.error("❌ Could not extract claims from token");
                throw new IllegalArgumentException("Invalid token - no claims found");
            }

            // Try to get email from 'email' claim first
            String email = claims.get("email", String.class);

            // If not found, try from subject
            if (email == null || email.trim().isEmpty()) {
                email = claims.getSubject();
                logger.debug("Email not in 'email' claim, using subject: {}", email);
            }

            if (email == null || email.trim().isEmpty()) {
                logger.error("❌ No email found in token claims");
                throw new IllegalArgumentException("Token does not contain user email");
            }

            logger.debug("✅ Successfully extracted email: {}", email);
            return email.trim();

        } catch (ExpiredJwtException e) {
            logger.warn("⚠️ Token expired, but extracting email from expired token");
            // Essayer d'extraire l'email même du token expiré
            String email = e.getClaims().get("email", String.class);
            if (email == null || email.isEmpty()) {
                email = e.getClaims().getSubject();
            }
            if (email != null && !email.isEmpty()) {
                logger.debug("✅ Extracted email from expired token: {}", email);
                return email;
            }
            throw new RuntimeException("Token expired and no email found", e);
        } catch (Exception e) {
            logger.error("❌ Error extracting email from token: {}", e.getMessage());
            throw new RuntimeException("Failed to extract email from token", e);
        }
    }
    public Long extractUserId(String token) {
        return extractClaim(token, claims -> {
            Object userId = claims.get("userId");
            if (userId instanceof Integer) {
                return ((Integer) userId).longValue();
            }
            return claims.get("userId", Long.class);
        });
    }

    public String extractUserRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String extractFullName(String token) {
        return extractClaim(token, claims -> claims.get("fullName", String.class));
    }

    public String extractFirstName(String token) {
        return extractClaim(token, claims -> claims.get("firstName", String.class));
    }

    public String extractLastName(String token) {
        return extractClaim(token, claims -> claims.get("lastName", String.class));
    }

    /**
     * ✅ SAFE: Get email from token without throwing exceptions
     */
    public String getEmailFromToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                logger.warn("⚠️ Token is null or empty");
                return null;
            }

            // Validate token format
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                logger.warn("⚠️ Invalid JWT format - expected 3 parts, got {}", parts.length);
                return null;
            }

            // Try to extract email
            String email = extractEmail(token);

            if (email != null && !email.trim().isEmpty()) {
                logger.debug("✅ Successfully extracted email: {}", email);
                return email.trim();
            }

            logger.warn("⚠️ No email found in token");
            return null;

        } catch (ExpiredJwtException e) {
            logger.warn("⚠️ Token expired: {}", e.getMessage());
            // Still try to get email from expired token
            try {
                return e.getClaims().get("email", String.class);
            } catch (Exception ex) {
                return null;
            }
        } catch (MalformedJwtException e) {
            logger.warn("⚠️ Malformed JWT: {}", e.getMessage());
            return null;
        } catch (SignatureException e) {
            logger.warn("⚠️ Invalid signature: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            logger.error("❌ Error extracting email from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * ✅ SAFE: Check if token is valid without throwing exceptions
     */
    public Boolean isTokenValidSafe(String token) {
        try {
            return isTokenValid(token);
        } catch (Exception e) {
            logger.warn("⚠️ Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Date extractIssuedAt(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claims != null ? claimsResolver.apply(claims) : null;
    }



    private Claims extractAllClaims(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                logger.error("❌ Cannot extract claims from null/empty token");
                return null;
            }

            // Validate token format
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                logger.error("❌ Invalid JWT format - expected 3 parts, got {}", parts.length);
                return null;
            }

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            logger.debug("✅ Successfully extracted claims");
            return claims;

        } catch (ExpiredJwtException e) {
            logger.error("❌ Token expired: {}", e.getMessage());
            throw e; // Re-throw to handle at higher level
        } catch (MalformedJwtException e) {
            logger.error("❌ Malformed JWT: {}", e.getMessage());
            throw e;
        } catch (SignatureException e) {
            logger.error("❌ Invalid signature: {}", e.getMessage());
            throw e;
        } catch (JwtException e) {
            logger.error("❌ JWT parsing failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("❌ Unexpected error extracting claims", e);
            return null;
        }
    }


    public boolean isValidTokenFormat(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        String[] parts = token.trim().split("\\.");
        if (parts.length != 3) {
            logger.warn("⚠️ Invalid JWT format - expected 3 parts, got {}", parts.length);
            return false;
        }

        // Check if parts are not empty
        for (String part : parts) {
            if (part.trim().isEmpty()) {
                logger.warn("⚠️ JWT contains empty part");
                return false;
            }
        }

        return true;
    }

    private Boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        return expiration != null && expiration.before(new Date());
    }

    // ==================== TOKEN GENERATION ====================

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", userDetails.getUsername());
        claims.put("authorities", userDetails.getAuthorities());
        return createToken(claims, userDetails.getUsername());
    }

    public String generateToken(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        return createToken(claims, email);
    }

    /**
     * Generate token for base User entity
     * FIXED: Changed from getActive() to getIsActive()
     */
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("fullName", user.getFirstName() + " " + user.getLastName());
        claims.put("role", user.getRole().name());
        claims.put("isActive", user.getIsActive()); // FIXED: Changed from getActive()
        claims.put("phoneNumber", user.getPhoneNumber());

        // Add role-specific claims
        addRoleSpecificClaims(claims, user);

        logger.debug("Generating token for user: {} with role: {}", user.getEmail(), user.getRole());
        return createToken(claims, user.getEmail());
    }

    /**
     * Add role-specific claims based on user type
     */
    private void addRoleSpecificClaims(Map<String, Object> claims, User user) {
        if (user instanceof Student) {
            Student student = (Student) user;
            claims.put("studentId", student.getStudentId());
            claims.put("faculty", student.getFaculty());
            claims.put("program", student.getProgram());
            claims.put("currentYear", student.getCurrentYear());
            claims.put("currentSemester", student.getCurrentSemester());
            claims.put("cumulativeGPA", student.getCumulativeGPA());

        } else if (user instanceof Lecturer) {
            Lecturer lecturer = (Lecturer) user;
            claims.put("employeeId", lecturer.getEmployeeId());
            claims.put("department", lecturer.getDepartment());
            claims.put("specialization", lecturer.getSpecialization());
            claims.put("officeLocation", lecturer.getOfficeLocation());

        } else if (user instanceof Admin) {
            Admin admin = (Admin) user;
            claims.put("employeeId", admin.getEmployeeId());
            claims.put("department", admin.getDepartment());
            claims.put("accessLevel", admin.getAccessLevel());

        } else if (user instanceof Parent) {
            Parent parent = (Parent) user;
            claims.put("relationship", parent.getRelationship());
            claims.put("occupation", parent.getOccupation());
        }
    }

    /**
     * Generate token with enhanced claims
     * FIXED: Changed from getActive() to getIsActive()
     */
    public String generateTokenWithClaims(User user, Map<String, Object> extraClaims) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("firstName", user.getFirstName());
        claims.put("lastName", user.getLastName());
        claims.put("fullName", user.getFirstName() + " " + user.getLastName());
        claims.put("role", user.getRole().name());
        claims.put("isActive", user.getIsActive()); // FIXED: Changed from getActive()

        // Add role-specific claims
        addRoleSpecificClaims(claims, user);

        // Add extra claims if provided
        if (extraClaims != null && !extraClaims.isEmpty()) {
            claims.putAll(extraClaims);
        }

        logger.debug("Generating token with extra claims for user: {}", user.getEmail());
        return createToken(claims, user.getEmail());
    }

    /**
     * Generate refresh token
     */
    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("type", "refresh");

        logger.debug("Generating refresh token for user: {}", user.getEmail());
        return createRefreshToken(claims, user.getEmail());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        logger.debug("Creating token for subject: {}", subject);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private String createRefreshToken(Map<String, Object> claims, String subject) {
        logger.debug("Creating refresh token for subject: {}", subject);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ==================== TOKEN VALIDATION ====================

    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return username != null &&
                    username.equals(userDetails.getUsername()) &&
                    !isTokenExpired(token);
        } catch (RuntimeException e) {
            logger.warn("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate token against User entity
     * FIXED: Changed from getActive() to getIsActive()
     */
    public Boolean validateToken(String token, User user) {
        try {
            final String tokenEmail = extractEmail(token);
            final Long tokenUserId = extractUserId(token);

            return tokenEmail != null && tokenUserId != null &&
                    tokenEmail.equals(user.getEmail()) &&
                    tokenUserId.equals(user.getId()) &&
                    !isTokenExpired(token) &&
                    Boolean.TRUE.equals(user.getIsActive()); // FIXED: Changed from getActive()
        } catch (RuntimeException e) {
            logger.warn("Token validation against user failed: {}", e.getMessage());
            return false;
        }
    }



    /**
     * ✅ ENHANCED: Token validation with format check
     */

    public Boolean isTokenValid(String token) {
        try {
            if (!isValidTokenFormat(token)) {
                logger.error("❌ Invalid token format");
                return false;
            }

            Claims claims = extractAllClaims(token);
            if (claims == null) {
                logger.error("❌ No claims extracted");
                return false;
            }

            boolean notExpired = !isTokenExpired(token);
            logger.debug("Token valid: {}, Expired: {}", notExpired, !notExpired);

            return notExpired;

        } catch (ExpiredJwtException e) {
            logger.warn("⚠️ Token expired");
            return false;
        } catch (Exception e) {
            logger.error("❌ Token validation failed: {}", e.getMessage());
            return false;
        }
    }






    /**
     * Check if token is a refresh token
     */
    public Boolean isRefreshToken(String token) {
        try {
            String tokenType = extractClaim(token, claims -> claims.get("type", String.class));
            return "refresh".equals(tokenType);
        } catch (Exception e) {
            logger.warn("Error checking token type: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate refresh token
     * FIXED: Changed from getActive() to getIsActive()
     */
    public Boolean validateRefreshToken(String token, User user) {
        try {
            if (!isRefreshToken(token)) {
                logger.warn("Token is not a refresh token");
                return false;
            }

            final String tokenEmail = extractEmail(token);
            final Long tokenUserId = extractUserId(token);

            return tokenEmail != null && tokenUserId != null &&
                    tokenEmail.equals(user.getEmail()) &&
                    tokenUserId.equals(user.getId()) &&
                    !isTokenExpired(token) &&
                    Boolean.TRUE.equals(user.getIsActive()); // FIXED: Changed from getActive()
        } catch (RuntimeException e) {
            logger.warn("Refresh token validation failed: {}", e.getMessage());
            return false;
        }
    }

    // ==================== TOKEN UTILITY METHODS ====================

    public Long getTokenExpirationTime(String token) {
        Date expiration = extractExpiration(token);
        return expiration != null ? expiration.getTime() - System.currentTimeMillis() : null;
    }

    public Long getTokenExpirationInMinutes(String token) {
        Long remainingTimeMs = getTokenExpirationTime(token);
        return remainingTimeMs != null ? remainingTimeMs / (1000 * 60) : null;
    }

    public Boolean isTokenExpiringSoon(String token, long minutes) {
        Long remainingMinutes = getTokenExpirationInMinutes(token);
        return remainingMinutes != null && remainingMinutes <= minutes;
    }

    /**
     * Get user information from token
     */
    public Map<String, Object> getUserInfoFromToken(String token) {
        try {
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("userId", extractUserId(token));
            userInfo.put("email", extractEmail(token));
            userInfo.put("firstName", extractFirstName(token));
            userInfo.put("lastName", extractLastName(token));
            userInfo.put("fullName", extractFullName(token));
            userInfo.put("role", extractUserRole(token));
            userInfo.put("issuedAt", extractIssuedAt(token));
            userInfo.put("expiration", extractExpiration(token));
            userInfo.put("isExpired", isTokenExpired(token));

            return userInfo;
        } catch (Exception e) {
            logger.error("Error extracting user info from token: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    // ==================== ROLE CHECKING METHODS ====================

    public Boolean hasRole(String token, UserRole requiredRole) {
        try {
            String tokenRole = extractUserRole(token);
            return tokenRole != null && tokenRole.equals(requiredRole.name());
        } catch (Exception e) {
            logger.warn("Error checking role from token: {}", e.getMessage());
            return false;
        }
    }

    public Boolean hasAnyRole(String token, UserRole... requiredRoles) {
        try {
            String tokenRole = extractUserRole(token);
            if (tokenRole == null) return false;

            for (UserRole role : requiredRoles) {
                if (tokenRole.equals(role.name())) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            logger.warn("Error checking roles from token: {}", e.getMessage());
            return false;
        }
    }

    public Boolean isAdminToken(String token) {
        return hasRole(token, UserRole.ADMIN);
    }

    public Boolean isStudentToken(String token) {
        return hasRole(token, UserRole.STUDENT);
    }

    public Boolean isLecturerToken(String token) {
        return hasRole(token, UserRole.LECTURER);
    }

    public Boolean isParentToken(String token) {
        return hasRole(token, UserRole.PARENT);
    }

    /**
     * Check if user has admin or lecturer access (for course management)
     */
    public Boolean hasAcademicStaffAccess(String token) {
        return hasAnyRole(token, UserRole.ADMIN, UserRole.LECTURER);
    }

    /**
     * Check if user has financial access (admin or parent for payments)
     */
    public Boolean hasFinancialAccess(String token) {
        return hasAnyRole(token, UserRole.ADMIN, UserRole.PARENT);
    }

    // ==================== TOKEN REFRESH ====================

    /**
     * Refresh an access token using refresh token
     */
    public String refreshAccessToken(String refreshToken, User user) {
        if (!validateRefreshToken(refreshToken, user)) {
            throw new RuntimeException("Invalid refresh token");
        }

        logger.debug("Refreshing access token for user: {}", user.getEmail());
        return generateToken(user);
    }

    /**
     * Invalidate token (for logout)
     */
    public Boolean invalidateToken(String token) {
        try {
            return isTokenValid(token);
        } catch (Exception e) {
            logger.warn("Error invalidating token: {}", e.getMessage());
            return false;
        }
    }

    // ==================== DEBUGGING & MONITORING ====================

    public Map<String, Object> extractAllClaimsAsMap(String token) {
        try {
            Claims claims = extractAllClaims(token);
            if (claims == null) return new HashMap<>();

            Map<String, Object> claimsMap = new HashMap<>();
            claims.forEach(claimsMap::put);
            return claimsMap;
        } catch (Exception e) {
            logger.error("Error extracting claims: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    public String getTokenType(String token) {
        String type = extractClaim(token, claims -> claims.get("type", String.class));
        return type != null ? type : "access";
    }

    /**
     * Check token health - comprehensive validation
     */
    public Map<String, Object> checkTokenHealth(String token) {
        Map<String, Object> health = new HashMap<>();

        try {
            health.put("isValid", isTokenValid(token));
            health.put("isExpired", isTokenExpired(token));
            health.put("expirationTime", extractExpiration(token));
            health.put("remainingMinutes", getTokenExpirationInMinutes(token));
            health.put("tokenType", getTokenType(token));
            health.put("userRole", extractUserRole(token));
            health.put("userId", extractUserId(token));
            health.put("email", extractEmail(token));
            health.put("fullName", extractFullName(token));
        } catch (Exception e) {
            health.put("error", e.getMessage());
            health.put("isValid", false);
        }

        return health;
    }

    // ==================== ROLE-SPECIFIC DATA EXTRACTION ====================

    /**
     * Extract student-specific data from token
     */
    public Map<String, Object> extractStudentInfo(String token) {
        if (!isStudentToken(token)) {
            return new HashMap<>();
        }

        Map<String, Object> studentInfo = new HashMap<>();
        studentInfo.put("studentId", extractClaim(token, claims -> claims.get("studentId", String.class)));
        studentInfo.put("faculty", extractClaim(token, claims -> claims.get("faculty", String.class)));
        studentInfo.put("program", extractClaim(token, claims -> claims.get("program", String.class)));
        studentInfo.put("currentYear", extractClaim(token, claims -> claims.get("currentYear", Integer.class)));
        studentInfo.put("currentSemester", extractClaim(token, claims -> claims.get("currentSemester", Integer.class)));
        studentInfo.put("cumulativeGPA", extractClaim(token, claims -> claims.get("cumulativeGPA", Double.class)));

        return studentInfo;
    }

    /**
     * Extract lecturer-specific data from token
     */
    public Map<String, Object> extractLecturerInfo(String token) {
        if (!isLecturerToken(token)) {
            return new HashMap<>();
        }

        Map<String, Object> lecturerInfo = new HashMap<>();
        lecturerInfo.put("employeeId", extractClaim(token, claims -> claims.get("employeeId", String.class)));
        lecturerInfo.put("department", extractClaim(token, claims -> claims.get("department", String.class)));
        lecturerInfo.put("specialization", extractClaim(token, claims -> claims.get("specialization", String.class)));
        lecturerInfo.put("officeLocation", extractClaim(token, claims -> claims.get("officeLocation", String.class)));

        return lecturerInfo;
    }

    /**
     * Extract admin-specific data from token
     */
    public Map<String, Object> extractAdminInfo(String token) {
        if (!isAdminToken(token)) {
            return new HashMap<>();
        }

        Map<String, Object> adminInfo = new HashMap<>();
        adminInfo.put("employeeId", extractClaim(token, claims -> claims.get("employeeId", String.class)));
        adminInfo.put("department", extractClaim(token, claims -> claims.get("department", String.class)));
        adminInfo.put("accessLevel", extractClaim(token, claims -> claims.get("accessLevel", String.class)));

        return adminInfo;
    }
}