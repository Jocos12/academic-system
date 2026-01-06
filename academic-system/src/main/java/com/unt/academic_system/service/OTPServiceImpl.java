package com.unt.academic_system.service;

import com.unt.academic_system.model.OTP;
import com.unt.academic_system.repository.OTPRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OTPServiceImpl implements OTPService {

    private final OTPRepository otpRepository;
    private final JavaMailSender mailSender;

    @Value("${otp.dev.mode:true}")
    private boolean devMode;

    @Override
    public void generateAndSendOTP(String email) {
        // Delete any existing OTPs for this email
        otpRepository.deleteByEmail(email);

        // Generate 6-digit OTP
        String code = String.format("%06d", new Random().nextInt(999999));

        // Create OTP entity
        OTP otp = new OTP();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(5)); // Valid for 5 minutes
        otp.setIsUsed(false);

        otpRepository.save(otp);

        // Send email or log in dev mode
        if (devMode) {
            log.warn("===========================================");
            log.warn("DEV MODE: OTP Email NOT sent to: {}", email);
            log.warn("OTP CODE: {}", code);
            log.warn("===========================================");
        } else {
            sendOTPEmail(email, code);
        }
    }

    @Override
    public boolean verifyOTP(String email, String code) {
        Optional<OTP> otpOptional = otpRepository.findByEmailAndCodeAndIsUsedFalse(email, code);

        if (otpOptional.isPresent()) {
            OTP otp = otpOptional.get();

            // Check if expired
            if (otp.getExpiryTime().isAfter(LocalDateTime.now())) {
                otp.setIsUsed(true);
                otpRepository.save(otp);
                return true;
            } else {
                log.warn("OTP expired for email: {}", email);
            }
        } else {
            log.warn("Invalid OTP or OTP already used for email: {}", email);
        }

        return false;
    }

    @Override
    public void cleanupExpiredOTPs() {
        LocalDateTime now = LocalDateTime.now();
        int deletedCount = otpRepository.deleteByExpiryTimeBefore(now);
        log.info("Cleaned up {} expired OTPs", deletedCount);
    }

    private void sendOTPEmail(String email, String code) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("UNT Academic System - Login OTP");
            message.setText(
                    "Your OTP code is: " + code + "\n\n" +
                            "This code will expire in 5 minutes.\n\n" +
                            "If you didn't request this, please ignore this email."
            );

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", email);

        } catch (MailException e) {
            log.error("Failed to send OTP email to {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send OTP email: Mail server connection failed. " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending OTP email to {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage(), e);
        }
    }
}