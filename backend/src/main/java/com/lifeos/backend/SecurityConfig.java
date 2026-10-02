package com.lifeos.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
            // =========================
            // CORS
            // =========================
            .cors(cors ->
                cors.configurationSource(
                    corsConfigurationSource()
                )
            )

            // =========================
            // CSRF
            // =========================
            .csrf(csrf ->
                csrf.disable()
            )

            // =========================
            // Disable default login
            // =========================
            .formLogin(form ->
                form.disable()
            )

            // =========================
            // Disable HTTP Basic
            // =========================
            .httpBasic(basic ->
                basic.disable()
            )

            // =========================
            // Authorization
            // =========================
            .authorizeHttpRequests(auth -> auth

                // Allow CORS preflight requests
                .requestMatchers(
                    HttpMethod.OPTIONS,
                    "/**"
                ).permitAll()

                // Currently all endpoints are public
                .anyRequest().permitAll()
            )

            // =========================
            // JWT Filter
            // =========================
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        // =========================
        // ALLOWED FRONTENDS
        // =========================
        configuration.setAllowedOrigins(List.of(

            // Production frontend
            "https://lifeos-frontend-h7fb.onrender.com",

            // Local Vite development ports
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:5177",
            "http://localhost:5178",
            "http://localhost:5179",
            "http://localhost:5180",

            // Other local development
            "http://localhost:3000"
        ));

        // =========================
        // ALLOWED METHODS
        // =========================
        configuration.setAllowedMethods(List.of(
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ));

        // =========================
        // ALLOWED HEADERS
        // =========================
        configuration.setAllowedHeaders(List.of(
            "Origin",
            "Authorization",
            "Content-Type",
            "Accept",
            "X-Requested-With"
        ));

        // =========================
        // EXPOSED HEADERS
        // =========================
        configuration.setExposedHeaders(List.of(
            "Authorization",
            "Content-Type"
        ));

        // =========================
        // Credentials
        // =========================
        configuration.setAllowCredentials(true);

        // =========================
        // Preflight cache
        // =========================
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