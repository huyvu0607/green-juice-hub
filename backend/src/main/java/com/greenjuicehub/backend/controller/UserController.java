package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.user.request.ChangePasswordRequest;
import com.greenjuicehub.backend.dto.user.request.UpdateProfileRequest;
import com.greenjuicehub.backend.dto.user.response.UserProfileResponse;
import com.greenjuicehub.backend.service.user.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;

    /**
     * GET /api/users/me
     * Lấy thông tin profile của user đang đăng nhập
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    /**
     * PUT /api/users/me
     * Cập nhật thông tin cá nhân (name, email, username, avatar)
     */
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    /**
     * PUT /api/users/me/password
     * Đổi mật khẩu (nhập mật khẩu cũ + mật khẩu mới)
     */
    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }
}