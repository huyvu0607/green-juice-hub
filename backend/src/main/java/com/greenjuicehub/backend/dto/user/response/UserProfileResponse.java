package com.greenjuicehub.backend.dto.user.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String name;
    private String phone;
    private Boolean phoneVerified;
    private String email;
    private String username;
    private String avatarUrl;
    private String role;
    private Boolean hasPassword;
    private LocalDateTime createdAt;
}