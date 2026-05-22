package com.greenjuicehub.backend.service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpLockService {

    private final StringRedisTemplate redis;

    private static final String PREFIX_ATTEMPTS = "otp:attempts:";
    private static final String PREFIX_LOCKED   = "otp:locked:";
    private static final int    MAX_ATTEMPTS    = 3;
    private static final long   LOCK_MINUTES    = 15;

    // Kiểm tra đang bị khóa không
    public boolean isLocked(String phone) {
        return Boolean.TRUE.equals(redis.hasKey(PREFIX_LOCKED + phone));
    }

    // Ghi nhận lần sai, trả về số lần sai hiện tại
    public int recordFailedAttempt(String phone) {
        String key = PREFIX_ATTEMPTS + phone;
        Long attempts = redis.opsForValue().increment(key);
        if (attempts == 1) {
            // Lần đầu sai → set TTL 15 phút
            redis.expire(key, Duration.ofMinutes(LOCK_MINUTES));
        }
        if (attempts >= MAX_ATTEMPTS) {
            // Khóa 15 phút
            redis.opsForValue().set(PREFIX_LOCKED + phone, "1", Duration.ofMinutes(LOCK_MINUTES));
            redis.delete(key);
        }
        return attempts.intValue();
    }

    // Xóa sau khi nhập đúng
    public void clearAttempts(String phone) {
        redis.delete(PREFIX_ATTEMPTS + phone);
        redis.delete(PREFIX_LOCKED + phone);
    }

    // Còn bao nhiêu lần
    public int remainingAttempts(String phone) {
        String val = redis.opsForValue().get(PREFIX_ATTEMPTS + phone);
        int used = val == null ? 0 : Integer.parseInt(val);
        return MAX_ATTEMPTS - used;
    }
}