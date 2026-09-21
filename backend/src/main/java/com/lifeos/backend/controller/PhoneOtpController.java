package com.lifeos.backend.controller;

import com.lifeos.backend.service.PhoneOtpService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/otp/phone")
public class PhoneOtpController {

    private final PhoneOtpService phoneOtpService;

    public PhoneOtpController(PhoneOtpService phoneOtpService) {
        this.phoneOtpService = phoneOtpService;
    }

    @PostMapping("/send")
    public String sendOtp(@RequestParam String phone) {

        phoneOtpService.sendOtp(phone);

        return "Phone OTP generated successfully";
    }

    @PostMapping("/verify")
    public boolean verifyOtp(
            @RequestParam String phone,
            @RequestParam String otp) {

        return phoneOtpService.verifyOtp(phone, otp);
    }
}
