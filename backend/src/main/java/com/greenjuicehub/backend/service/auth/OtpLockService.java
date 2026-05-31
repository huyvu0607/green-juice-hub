package com.greenjuicehub.backend.service.auth;

import com.greenjuicehub.backend.config.OtpProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpLockService {

    private final StringRedisTemplate redis;
    private final OtpProperties otpProperties;  // inject vào

    private static final String PREFIX_ATTEMPTS = "otp:attempts:";
    private static final String PREFIX_LOCKED   = "otp:locked:";

    public boolean isLocked(String phone) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX_LOCKED + phone));
    }

    public int recordFailedAttempt(String phone) {
        String key = PREFIX_ATTEMPTS + phone;
        Long attempts = redis.opsForValue().increment(key);
        if (attempts == 1) {
            redis.expire(key, Duration.ofMinutes(otpProperties.getLockMinutes()));
        }
        if (attempts >= otpProperties.getMaxWrongAttempts()) {
            redis.opsForValue().set(PREFIX_LOCKED + phone, "1",
                    Duration.ofMinutes(otpProperties.getLockMinutes()));
            redis.delete(key);
        }
        return otpProperties.getMaxWrongAttempts() - attempts.intValue();
    }

    public void clearAttempts(String phone) {
        redis.delete(PREFIX_ATTEMPTS + phone);
        redis.delete(PREFIX_LOCKED + phone);
    }

    public int remainingAttempts(String phone) {
        String val = redis.opsForValue().get(PREFIX_ATTEMPTS + phone);
        int used = val == null ? 0 : Integer.parseInt(val);
        return otpProperties.getMaxWrongAttempts() - used;
    }
}