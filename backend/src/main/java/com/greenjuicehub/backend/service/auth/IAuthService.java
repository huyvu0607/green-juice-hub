package com.greenjuicehub.backend.service.auth;

import com.greenjuicehub.backend.dto.auth.request.*;
import com.greenjuicehub.backend.dto.auth.response.*;

public interface IAuthService {
    AccountCheckResponse checkAccount(CheckAccountRequest request);
    OtpResponse sendOtp(SendOtpRequest request);
    OtpResponse verifyOtp(VerifyOtpRequest request);
    AuthResponse loginWithPassword(LoginPasswordRequest request);
    AuthResponse setPassword(SetPasswordRequest request);
    AuthResponse loginWithGoogle(GoogleLoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    AuthResponse loginWithTempToken(String tempToken);
    void changePassword(ChangePasswordRequest request, Long currentUserId);
    AuthResponse resetPassword(ResetPasswordRequest request);
}
