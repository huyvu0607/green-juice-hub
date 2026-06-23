package com.greenjuicehub.backend.config;

import com.greenjuicehub.backend.middleware.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/check-account",
                                "/api/auth/send-otp",
                                "/api/auth/verify-otp",
                                "/api/auth/login-with-otp",
                                "/api/auth/login",
                                "/api/auth/set-password",
                                "/api/auth/reset-password",
                                "/api/auth/google",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/products/**",
                                "/api/reviews/product/**",
                                "/api/webhooks/**",
                                "/api/contacts",
                                "/api/policies/**",
                                "/api/shipping/**",
                                "/api/banners",
                                "/api/payment/vnpay/ipn",
                                "/api/payment/vnpay/return"
                        ).permitAll()
                        // Tất cả còn lại phải authenticated
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);


        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
