package com.greenjuicehub.backend.dto.auth.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String role;
    private boolean isNewUser;
    private boolean hasPassword;
}