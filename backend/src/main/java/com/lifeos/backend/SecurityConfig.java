package com.lifeos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            // Enable CORS before Spring Security authorization
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // Disable CSRF because this is a REST API
            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth

                // Allow browser CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public authentication endpoints
                .requestMatchers(
                    "/users/login",
                    "/users/register"
                ).permitAll()

                // Everything else requires authentication
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // Production frontend
        configuration.setAllowedOrigins(List.of(
            "https://lifeos-frontend-h7fb.onrender.com",

            // Local development
            "http://localhost:5173",
            "http://localhost:3000"
        ));

        // Methods allowed from frontend
        configuration.setAllowedMethods(List.of(
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ));

        // Headers allowed in requests
        configuration.setAllowedHeaders(List.of(
            "Origin",
            "Content-Type",
            "Accept",
            "Authorization",
            "X-Requested-With"
        ));

        // Headers the frontend is allowed to read
        configuration.setExposedHeaders(List.of(
            "Authorization",
            "Content-Type"
        ));

        // Required if frontend sends credentials/cookies
        configuration.setAllowCredentials(true);

        // Cache preflight response for 1 hour
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