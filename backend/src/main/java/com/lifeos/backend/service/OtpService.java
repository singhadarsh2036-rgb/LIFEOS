package com.lifeos.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final JavaMailSender mailSender;

    private final SecureRandom random = new SecureRandom();

    private final Map<String, OtpData> otpStore =
            new ConcurrentHashMap<>();

    @Value("${spring.mail.username}")
    private String senderEmail;

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String email) {

        String otp = String.format(
                "%06d",
                random.nextInt(1_000_000)
        );

        long expiryTime =
                System.currentTimeMillis() + (5 * 60 * 1000);

        otpStore.put(
                email.toLowerCase(),
                new OtpData(otp, expiryTime)
        );

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(email);
        message.setSubject("LIFEOS - Email Verification OTP");

        message.setText(
                "Hello,\n\n" +
                "Your LIFEOS verification OTP is:\n\n" +
                otp +
                "\n\n" +
                "This OTP will expire in 5 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "LIFEOS"
        );

        mailSender.send(message);

        System.out.println(
                "OTP SENT TO: " + email
        );
    }

    public boolean verifyOtp(
            String email,
            String enteredOtp
    ) {

        String normalizedEmail =
                email.toLowerCase();

        OtpData otpData =
                otpStore.get(normalizedEmail);

        if (otpData == null) {
            return false;
        }

        if (System.currentTimeMillis()
                > otpData.expiryTime) {

            otpStore.remove(normalizedEmail);

            return false;
        }

        if (!otpData.otp.equals(enteredOtp)) {
            return false;
        }

        otpStore.remove(normalizedEmail);

        return true;
    }

    private static class OtpData {

        private final String otp;
        private final long expiryTime;

        private OtpData(
                String otp,
                long expiryTime
        ) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }
}