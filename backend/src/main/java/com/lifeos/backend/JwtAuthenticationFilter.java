package com.lifeos.backend;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final String SECRET_KEY =
            "LIFEOS_SECRET_KEY_123456789012345678901234567890";

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
                SECRET_KEY.getBytes(StandardCharsets.UTF_8)
        );
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // =========================================
        // CORS
        // =========================================

        String origin = request.getHeader("Origin");

        if (
                "http://localhost:5173".equals(origin)
                        || "http://localhost:5180".equals(origin)
                        || "http://localhost:3000".equals(origin)
                        || "https://lifeos-frontend-h7fb.onrender.com".equals(origin)
        ) {
            response.setHeader(
                    "Access-Control-Allow-Origin",
                    origin
            );
        }

        response.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        );

        response.setHeader(
                "Access-Control-Allow-Headers",
                "Origin, Authorization, Content-Type, Accept, X-Requested-With"
        );

        response.setHeader(
                "Access-Control-Allow-Credentials",
                "true"
        );

        // =========================================
        // REQUEST PATH
        // =========================================

        String path = request.getRequestURI();

        // =========================================
        // PUBLIC ENDPOINTS
        // =========================================
        //
        // These DO NOT require JWT.
        //

        if (
                request.getMethod().equalsIgnoreCase("OPTIONS")

                        // Authentication
                        || path.equals("/users/login")
                        || path.equals("/users")
                        || path.equals("/users/register")

                        // Account checks
                        || path.equals("/users/check-email")
                        || path.equals("/users/check-phone")

                        // OTP
                        || path.equals("/otp/send")
                        || path.equals("/otp/verify")
                        || path.equals("/otp/phone/send")
                        || path.equals("/otp/phone/verify")

                        // Push public VAPID key
                        || path.equals("/push/public-key")
        ) {

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }

        // =========================================
        // JWT AUTHENTICATION
        // =========================================

        String authHeader =
                request.getHeader("Authorization");

        if (
                authHeader == null
                        || !authHeader.startsWith("Bearer ")
        ) {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.setContentType(
                    "text/plain;charset=UTF-8"
            );

            response.getWriter().write(
                    "Authentication required"
            );

            return;
        }

        // =========================================
        // EXTRACT TOKEN
        // =========================================

        String token =
                authHeader.substring(7).trim();

        if (token.isEmpty()) {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.setContentType(
                    "text/plain;charset=UTF-8"
            );

            response.getWriter().write(
                    "Invalid authentication token"
            );

            return;
        }

        // =========================================
        // VALIDATE JWT
        // =========================================

        try {

            Claims claims =
                    Jwts.parser()
                            .verifyWith(getSigningKey())
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();

            String email =
                    claims.getSubject();

            if (
                    email == null
                            || email.isBlank()
            ) {

                response.setStatus(
                        HttpServletResponse.SC_UNAUTHORIZED
                );

                response.getWriter().write(
                        "Invalid token subject"
                );

                return;
            }

            // Make email available to controllers
            request.setAttribute(
                    "userEmail",
                    email
            );

        } catch (Exception e) {

            System.out.println(
                    "JWT VALIDATION ERROR: "
                            + e.getMessage()
            );

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.setContentType(
                    "text/plain;charset=UTF-8"
            );

            response.getWriter().write(
                    "Invalid or expired token"
            );

            return;
        }

        // =========================================
        // CONTINUE REQUEST
        // =========================================

        filterChain.doFilter(
                request,
                response
        );
    }
}