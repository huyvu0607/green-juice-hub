package com.greenjuicehub.backend.service.user.impl;

import com.greenjuicehub.backend.dto.user.request.ChangePasswordRequest;
import com.greenjuicehub.backend.dto.user.request.UpdateProfileRequest;
import com.greenjuicehub.backend.dto.user.response.UserProfileResponse;
import com.greenjuicehub.backend.entity.User;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.UserRepository;
import com.greenjuicehub.backend.service.user.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = findUserOrThrow(userId);
        return toProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUserOrThrow(userId);

        // Kiểm tra email đã tồn tại chưa (nếu có thay đổi)
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            boolean emailTaken = userRepository.existsByEmailAndIdNot(request.getEmail(), userId);
            if (emailTaken) {
                throw new AppException(HttpStatus.CONFLICT, "Email này đã được sử dụng bởi tài khoản khác");
            }
            user.setEmail(request.getEmail());
        }

        // Kiểm tra username đã tồn tại chưa (nếu có thay đổi)
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            boolean usernameTaken = userRepository.existsByUsernameAndIdNot(request.getUsername(), userId);
            if (usernameTaken) {
                throw new AppException(HttpStatus.CONFLICT, "Username này đã được sử dụng bởi tài khoản khác");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        userRepository.save(user);
        return toProfileResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUserOrThrow(userId);

        // Validate confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu xác nhận không khớp");
        }

        // Nếu user đã có password → yêu cầu nhập đúng mật khẩu cũ
        if (Boolean.TRUE.equals(user.getHasPassword())) {
            if (user.getPasswordHash() == null ||
                    !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setHasPassword(true);
        userRepository.save(user);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Người dùng không tồn tại"));
    }

    private UserProfileResponse toProfileResponse(User user) {
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