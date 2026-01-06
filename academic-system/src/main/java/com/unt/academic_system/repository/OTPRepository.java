package com.unt.academic_system.repository;

import com.unt.academic_system.model.OTP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OTPRepository extends JpaRepository<OTP, Long> {

    Optional<OTP> findByEmailAndCodeAndIsUsedFalse(String email, String code);

    void deleteByEmail(String email);

    int deleteByExpiryTimeBefore(LocalDateTime dateTime);
}