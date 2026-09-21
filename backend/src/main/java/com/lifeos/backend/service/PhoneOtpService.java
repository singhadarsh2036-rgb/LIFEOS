package com.lifeos.backend.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PhoneOtpService {

    private final SecureRandom random = new SecureRandom();

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    public String sendOtp(String phone) {

        String otp = String.format("%06d", random.nextInt(1_000_000));

        otpStore.put(
            phone,
            new OtpData(
                otp,
                LocalDateTime.now().plusMinutes(5)
            )
        );

        System.out.println("=================================");
        System.out.println("📱 PHONE OTP");
        System.out.println("Phone: " + phone);
        System.out.println("OTP: " + otp);
        System.out.println("Expires in: 5 minutes");
        System.out.println("=================================");

        return otp;
    }

    public boolean verifyOtp(String phone, String otp) {

        OtpData data = otpStore.get(phone);

        if (data == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(data.expiry())) {
            otpStore.remove(phone);
            return false;
        }

        if (!data.otp().equals(otp)) {
            return false;
        }

        otpStore.remove(phone);

        return true;
    }

    private record OtpData(
        String otp,
        LocalDateTime expiry
    ) {}
}