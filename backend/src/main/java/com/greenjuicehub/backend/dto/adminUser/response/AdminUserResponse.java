package com.greenjuicehub.backend.dto.adminUser.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String username;
    private String avatarUrl;
    private String role;           // CUSTOMER / STAFF / ADMIN
    private Boolean isActive;
    private Boolean hasPassword;
    private LocalDateTime phoneVerifiedAt;
    private LocalDateTime createdAt;
}