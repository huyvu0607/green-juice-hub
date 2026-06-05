package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.auth.response.AccountCheckResponse;
import com.greenjuicehub.backend.dto.auth.response.AuthResponse;
import com.greenjuicehub.backend.dto.auth.response.OtpResponse;
import com.greenjuicehub.backend.entity.SocialAccount;
import com.greenjuicehub.backend.entity.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class AuthMapper {

    // ==================== ENTITY → RESPONSE ====================

    /**
     * User + tokens → AuthResponse (dùng sau login / setPassword / resetPassword)
     */
    public AuthResponse toAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRole().name())
                .isNewUser(false)
                .hasPassword(user.getHasPassword())
                .build();
    }

    /**
     * User → AccountCheckResponse (dùng trong checkAccount)
     */
    public AccountCheckResponse toAccountCheckResponse(User user) {
        return AccountCheckResponse.builder()
                .exists(true)
                .isNewUser(false)
                .hasPassword(Boolean.TRUE.equals(user.getHasPassword()))
                .build();
    }

    /**
     * AccountCheckResponse cho trường hợp user chưa tồn tại
     */
    public AccountCheckResponse toNewAccountCheckResponse() {
        return AccountCheckResponse.builder()
                .exists(false)
                .isNewUser(true)
                .hasPassword(false)
                .build();
    }

    /**
     * OtpResponse thành công khi gửi OTP
     */
    public OtpResponse toSendOtpResponse(String phone, boolean isNewUser, boolean hasPassword) {
        return OtpResponse.builder()
                .success(true)
                .message("Đã gửi OTP đến " + phone)
                .isNewUser(isNewUser)
                .hasPassword(hasPassword)
                .build();
    }

    /**
     * OtpResponse thành công khi verify OTP
     */
    public OtpResponse toVerifyOtpResponse(boolean isNewUser, boolean hasPassword, String tempToken) {
        return OtpResponse.builder()
                .success(true)
                .message("Xác nhận OTP thành công")
                .isNewUser(isNewUser)
                .hasPassword(hasPassword)
                .tempToken(tempToken)
                .build();
    }

    // ==================== TẠO ENTITY MỚI ====================

    /**
     * Tạo User mới từ số điện thoại (sau khi verify OTP thành công)
     */
    public User toNewUserFromPhone(String phone) {
        return User.builder()
                .phone(phone)
                .phoneVerifiedAt(LocalDateTime.now())
                .hasPassword(false)
                .role(User.Role.CUSTOMER)
                .isActive(true)
                .build();
    }

    /**
     * Tạo User mới từ Google payload
     */
    public User toNewUserFromGoogle(String email, String name) {
        return User.builder()
                .email(email)
                .name(name)
                .phone(null)
                .hasPassword(false)
                .role(User.Role.CUSTOMER)
                .isActive(true)
                .build();
    }

    /**
     * Tạo User mới từ google
     */
    public SocialAccount toSocialAccount(User user, String googleId, String email) {
        return SocialAccount.builder()
                .user(user)
                .provider(SocialAccount.Provider.GOOGLE)
                .providerId(googleId)
                .email(email)
                .build();
    }
}