package com.greenjuicehub.backend.service.auth;

public interface ITempTokenService {
    String generate(Long userId);
    Long validate(String token); // trả userId hoặc throw
    void invalidate(String token);
}
