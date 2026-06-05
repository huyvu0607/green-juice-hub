package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.user.response.UserProfileResponse;
import com.greenjuicehub.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    // ==================== User → UserProfileResponse ====================
    public UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .phoneVerified(user.getPhoneVerifiedAt() != null)
                .email(user.getEmail())
                .username(user.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole().name())
                .hasPassword(user.getHasPassword())
                .createdAt(user.getCreatedAt())
                .build();
    }
}