package com.greenjuicehub.backend.service.auth.impl;

import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.service.auth.ITempTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class TempTokenServiceImpl implements ITempTokenService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final long EXPIRATION_MINUTES = 5;
    private static final String PREFIX = "temp_token:";

    @Override
    public String generate(Long userId) {
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                PREFIX + token,
                userId.toString(),
                EXPIRATION_MINUTES, TimeUnit.MINUTES
        );
        return token;
    }

    @Override
    public Long validate(String token) {
        String userId = redisTemplate.opsForValue().get(PREFIX + token);
        if (userId == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Phiên xác thực không hợp lệ hoặc đã hết hạn");
        }
        return Long.parseLong(userId);
    }

    @Override
    public void invalidate(String token) {
        redisTemplate.delete(PREFIX + token);
    }
}
