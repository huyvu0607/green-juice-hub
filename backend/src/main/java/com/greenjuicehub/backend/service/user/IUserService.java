package com.greenjuicehub.backend.service.user;

import com.greenjuicehub.backend.dto.user.request.ChangePasswordRequest;
import com.greenjuicehub.backend.dto.user.request.UpdateProfileRequest;
import com.greenjuicehub.backend.dto.user.response.UserProfileResponse;

public interface IUserService {

    /** Lấy thông tin profile của user đang đăng nhập */
    UserProfileResponse getProfile(Long userId);

    /** Cập nhật thông tin cá nhân (name, email, username, avatarUrl) */
    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);

    /** Đổi mật khẩu (yêu cầu nhập mật khẩu cũ) */
    void changePassword(Long userId, ChangePasswordRequest request);
}