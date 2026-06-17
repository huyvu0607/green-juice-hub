package com.greenjuicehub.backend.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "otp")
public class OtpProperties {
    private int expirationMinutes;
    private int maxSendPerDay;
    private int maxWrongAttempts;
    private int lockMinutes;
}