package com.lifeos.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final SecureRandom random = new SecureRandom();

    private final Map<String, OtpData> otpStore =
            new ConcurrentHashMap<>();

    private final HttpClient httpClient =
            HttpClient.newHttpClient();

    @Value("${resend.api-key}")
    private String resendApiKey;

    public void sendOtp(String email) {

        String otp = String.format(
                "%06d",
                random.nextInt(1_000_000)
        );

        long expiryTime =
                System.currentTimeMillis() + (5 * 60 * 1000);

        String normalizedEmail =
                email.toLowerCase();

        otpStore.put(
                normalizedEmail,
                new OtpData(otp, expiryTime)
        );

        String subject =
                "LIFEOS - Email Verification OTP";

        String html =
                "<div style=\"font-family:Arial,sans-serif;max-width:500px;margin:auto;\">" +
                "<h2 style=\"color:#111827;\">LIFEOS Email Verification</h2>" +
                "<p>Hello,</p>" +
                "<p>Your LIFEOS verification OTP is:</p>" +
                "<div style=\"font-size:32px;font-weight:bold;letter-spacing:8px;" +
                "padding:16px;background:#f3f4f6;text-align:center;border-radius:10px;\">" +
                otp +
                "</div>" +
                "<p>This OTP will expire in <b>5 minutes</b>.</p>" +
                "<p>If you did not request this, please ignore this email.</p>" +
                "<p>— LIFEOS</p>" +
                "</div>";

        String json =
                "{"
                + "\"from\":\"onboarding@resend.dev\","
                + "\"to\":[\"" + normalizedEmail + "\"],"
                + "\"subject\":\"" + subject + "\","
                + "\"html\":\"" + escapeJson(html) + "\""
                + "}";

        try {

            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(
                                    "https://api.resend.com/emails"
                            ))
                            .header(
                                    "Authorization",
                                    "Bearer " + resendApiKey
                            )
                            .header(
                                    "Content-Type",
                                    "application/json"
                            )
                            .POST(
                                    HttpRequest.BodyPublishers
                                            .ofString(json)
                            )
                            .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            if (response.statusCode() < 200 ||
                    response.statusCode() >= 300) {

                System.out.println(
                        "RESEND ERROR: " +
                        response.statusCode() +
                        " " +
                        response.body()
                );

                throw new RuntimeException(
                        "Failed to send OTP email"
                );
            }

            System.out.println(
                    "OTP SENT TO: " + normalizedEmail
            );

        } catch (Exception e) {

            otpStore.remove(normalizedEmail);

            System.out.println(
                    "OTP EMAIL ERROR: " +
                    e.getMessage()
            );

            throw new RuntimeException(
                    "Failed to send OTP email",
                    e
            );
        }
    }

    private String escapeJson(String value) {

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
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