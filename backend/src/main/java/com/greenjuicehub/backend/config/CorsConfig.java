package com.greenjuicehub.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Config cho webhook — cho phép tất cả origin
        CorsConfiguration webhookConfig = new CorsConfiguration();
        webhookConfig.setAllowedOrigins(List.of("*"));
        webhookConfig.setAllowedMethods(List.of("POST"));
        webhookConfig.setAllowedHeaders(List.of("*"));

        // Config cho frontend
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "https://green-juice-hub.vercel.app",
                "https://green-juice-db22om0mr-huyvu7788.vercel.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/webhooks/**", webhookConfig);
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}