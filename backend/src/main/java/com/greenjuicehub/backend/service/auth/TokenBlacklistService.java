package com.greenjuicehub.backend.service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final StringRedisTemplate redis;
    private static final String PREFIX = "blacklist:";

    public void blacklist(String token, long ttlSeconds) {
        redis.opsForValue().set(PREFIX + token, "1", Duration.ofSeconds(ttlSeconds));
    }

    public boolean isBlacklisted(String token) {
    try {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX + token));
    } catch (Exception e) {
        return false; // ← Redis lỗi thì cho qua, đừng crash
    }
}
}