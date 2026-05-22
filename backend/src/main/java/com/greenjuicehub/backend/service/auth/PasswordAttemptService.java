package com.greenjuicehub.backend.service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class PasswordAttemptService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String PREFIX_ATTEMPTS = "pwd_attempts:";
    private static final String PREFIX_LOCK     = "pwd_lock:";
    private static final int    MAX_BEFORE_CAPTCHA = 5;
    private static final int    MAX_BEFORE_LOCK    = 10;
    private static final long   LOCK_MINUTES       = 15;

    public record AttemptResult(int count, boolean requiresCaptcha, boolean isLocked) {}

    public AttemptResult recordFailed(String identifier) {
        String attemptsKey = PREFIX_ATTEMPTS + identifier;
        Long count = redisTemplate.opsForValue().increment(attemptsKey);
        redisTemplate.expire(attemptsKey, LOCK_MINUTES, TimeUnit.MINUTES);

        if (count >= MAX_BEFORE_LOCK) {
            redisTemplate.opsForValue().set(PREFIX_LOCK + identifier, "1",
                    LOCK_MINUTES, TimeUnit.MINUTES);
            return new AttemptResult(count.intValue(), true, true);
        }

        boolean requiresCaptcha = count >= MAX_BEFORE_CAPTCHA;
        return new AttemptResult(count.intValue(), requiresCaptcha, false);
    }

    public boolean isLocked(String identifier) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey(PREFIX_LOCK + identifier));
    }

    public boolean requiresCaptcha(String identifier) {
        String val = redisTemplate.opsForValue().get(PREFIX_ATTEMPTS + identifier);
        if (val == null) return false;
        return Integer.parseInt(val) >= MAX_BEFORE_CAPTCHA;
    }

    public void clearAttempts(String identifier) {
        redisTemplate.delete(PREFIX_ATTEMPTS + identifier);
        redisTemplate.delete(PREFIX_LOCK + identifier);
    }
}