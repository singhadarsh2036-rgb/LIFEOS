package com.lifeos.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.CorsConfiguration;
import org.springframework.http.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
            .cors(cors ->
                cors.configurationSource(corsConfigurationSource())
            )

            .csrf(csrf ->
                csrf.disable()
            )

            .formLogin(form ->
                form.disable()
            )

            .httpBasic(basic ->
                basic.disable()
            )

            .authorizeHttpRequests(auth -> auth

                // -------------------------
                // CORS PREFLIGHT
                // -------------------------
                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                // -------------------------
                // PUBLIC AUTH ENDPOINTS
                // -------------------------
                .requestMatchers(
                    "/users/login",
                    "/users/register",
                    "/users",
                    "/users/check-email",
                    "/users/check-phone",
                    "/otp/**"
                ).permitAll()

                // -------------------------
                // PUSH PUBLIC KEY
                // -------------------------
                .requestMatchers(
                    "/push/public-key"
                ).permitAll()

                // -------------------------
                // EVERYTHING ELSE
                // -------------------------
                .anyRequest()
                .authenticated()
            );

        return http.build();
    }


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
            new CorsConfiguration();

        configuration.setAllowedOrigins(
            List.of(
                "https://lifeos-frontend-h7fb.onrender.com",
                "http://localhost:5173",
                "http://localhost:5180",
                "http://localhost:3000"
            )
        );

        configuration.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )
        );

        configuration.setAllowedHeaders(
            List.of(
                "Origin",
                "Content-Type",
                "Accept",
                "Authorization",
                "X-Requested-With"
            )
        );

        configuration.setExposedHeaders(
            List.of(
                "Authorization",
                "Content-Type"
            )
        );

        configuration.setAllowCredentials(true);

        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            configuration
        );

        return source;
    }
}