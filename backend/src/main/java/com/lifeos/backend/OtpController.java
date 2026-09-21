package com.lifeos.backend;

import com.lifeos.backend.service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send")
    public ResponseEntity<String> sendOtp(
            @RequestParam String email
    ) {

        try {

            otpService.sendOtp(email);

            return ResponseEntity.ok(
                    "OTP sent successfully"
            );

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .body("Failed to send OTP");
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verifyOtp(
            @RequestParam String email,
            @RequestParam String otp
    ) {

        boolean verified =
                otpService.verifyOtp(email, otp);

        if (verified) {

            return ResponseEntity.ok(
                    "Email verified successfully"
            );
        }

        return ResponseEntity
                .badRequest()
                .body("Invalid or expired OTP");
    }
}