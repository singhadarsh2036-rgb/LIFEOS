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

        response.setHeader(
                "Access-Control-Allow-Origin",
                "https://lifeos-frontend-h7fb.onrender.com"
        );

        response.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, DELETE, OPTIONS"
        );

        response.setHeader(
                "Access-Control-Allow-Headers",
                "Authorization, Content-Type"
        );

        response.setHeader(
                "Access-Control-Allow-Credentials",
                "true"
        );

        String path = request.getRequestURI();

        /*
         * PUBLIC ENDPOINTS
         *
         * These endpoints can be accessed
         * without a JWT token.
         */
        if (
                request.getMethod().equalsIgnoreCase("OPTIONS")
                        || path.equals("/users/login")
                        || path.equals("/users")
                        || path.equals("/users/check-email")
                        || path.equals("/users/check-phone")
                        || path.equals("/otp/send")
                        || path.equals("/otp/verify")
                        || path.equals("/otp/phone/send")
                        || path.equals("/otp/phone/verify")
                        || path.equals("/push/public-key")
        ) {

            filterChain.doFilter(request, response);
            return;
        }

        /*
         * ALL OTHER ENDPOINTS REQUIRE JWT
         */
        String authHeader =
                request.getHeader("Authorization");

        if (
                authHeader == null
                        || !authHeader.startsWith("Bearer ")
        ) {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.getWriter().write(
                    "Authentication required"
            );

            return;
        }

        String token =
                authHeader.substring(7);

        try {

            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String email =
                    claims.getSubject();

            request.setAttribute(
                    "userEmail",
                    email
            );

        } catch (Exception e) {

            response.setStatus(
                    HttpServletResponse.SC_UNAUTHORIZED
            );

            response.getWriter().write(
                    "Invalid or expired token"
            );

            return;
        }

        filterChain.doFilter(
                request,
                response
        );
    }
}