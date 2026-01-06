package com.unt.academic_system.service;

public interface OTPService {

    void generateAndSendOTP(String email);

    boolean verifyOTP(String email, String code);

    void cleanupExpiredOTPs();
}