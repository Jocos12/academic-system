package com.unt.academic_system.config;

import com.unt.academic_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;

/**
 * ONE-TIME MIGRATION: Re-encodes all plain text passwords in the database to BCrypt
 *
 * IMPORTANT: After running this ONCE, comment out or delete the @Bean annotation
 * to prevent it from running on every application startup.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DatabasePasswordMigration {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Bean // COMMENT THIS OUT AFTER RUNNING ONCE!
    public CommandLineRunner migratePasswords() {
        return args -> {
            log.warn("=================================================");
            log.warn("STARTING PASSWORD MIGRATION - ONE TIME OPERATION");
            log.warn("=================================================");

            try {
                // Use direct JDBC to avoid Hibernate issues
                String selectQuery = "SELECT id, email, password FROM users";
                List<Map<String, Object>> users = jdbcTemplate.queryForList(selectQuery);

                int migrated = 0;

                for (Map<String, Object> user : users) {
                    Long id = ((Number) user.get("id")).longValue();
                    String email = (String) user.get("email");
                    String currentPassword = (String) user.get("password");

                    // Check if password is already BCrypt encoded
                    // BCrypt hashes start with "$2a$", "$2b$", or "$2y$" and are 60 characters long
                    if (currentPassword != null &&
                            !currentPassword.startsWith("$2") &&
                            currentPassword.length() < 60) {

                        log.info("Migrating password for user: {}", email);

                        // The current password is plain text, so encode it
                        String encodedPassword = passwordEncoder.encode(currentPassword);

                        // Update directly via JDBC
                        String updateQuery = "UPDATE users SET password = ? WHERE id = ?";
                        jdbcTemplate.update(updateQuery, encodedPassword, id);

                        migrated++;
                        log.info("✅ Password encoded for: {}", email);
                    } else {
                        log.info("⏭️  Password already encoded for: {}", email);
                    }
                }

                log.warn("=================================================");
                log.warn("PASSWORD MIGRATION COMPLETE");
                log.warn("Migrated {} passwords", migrated);
                log.warn("NOW COMMENT OUT THE @Bean ANNOTATION IN DatabasePasswordMigration.java");
                log.warn("=================================================");

            } catch (Exception e) {
                log.error("❌ ERROR DURING PASSWORD MIGRATION", e);
                throw e;
            }
        };
    }
}