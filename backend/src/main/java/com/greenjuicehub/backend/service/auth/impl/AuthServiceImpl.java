package com.greenjuicehub.backend.service.auth.impl;

import com.greenjuicehub.backend.config.JwtUtil;
import com.greenjuicehub.backend.config.OtpProperties;
import com.greenjuicehub.backend.dto.auth.request.*;
import com.greenjuicehub.backend.dto.auth.response.*;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.auth.IAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final UserRepository userRepository;
    private final OtpVerificationRepository otpRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final JwtUtil jwtUtil;
    private final OtpProperties otpProperties;
    private final PasswordEncoder passwordEncoder;

    // ==================== GỬI OTP ====================
    @Override
    @Transactional
    public OtpResponse sendOtp(SendOtpRequest request) {
        String phone = request.getPhone();

        // Kiểm tra giới hạn gửi OTP trong ngày
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        int sentToday = otpRepository.countByPhoneAndTypeAndCreatedAtAfter(
                phone, OtpVerification.OtpType.valueOf(request.getType()), startOfDay);

        if (sentToday >= otpProperties.getMaxSendPerDay()) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã gửi OTP quá " + otpProperties.getMaxSendPerDay() + " lần hôm nay");
        }

        // Tạo OTP 6 số
        String otpCode = String.format("%06d", new Random().nextInt(999999));

        OtpVerification otp = OtpVerification.builder()
                .phone(phone)
                .otpCode(otpCode)
                .type(OtpVerification.OtpType.valueOf(request.getType()))
                .isUsed(false)
                .expiresAt(LocalDateTime.now().plusMinutes(otpProperties.getExpirationMinutes()))
                .build();

        otpRepository.save(otp);

        // TODO: Gửi SMS thật (Twilio, ESMS...) — hiện tại log ra console
        System.out.println("📱 OTP cho " + phone + ": " + otpCode);

        // Kiểm tra SĐT mới hay cũ để FE biết hiện gì
        boolean isNewUser = !userRepository.existsByPhone(phone);
        boolean hasPassword = false;
        if (!isNewUser) {
            hasPassword = userRepository.findByPhone(phone)
                    .map(User::getHasPassword).orElse(false);
        }

        return OtpResponse.builder()
                .success(true)
                .message("Đã gửi OTP đến " + phone)
                .isNewUser(isNewUser)
                .hasPassword(hasPassword)
                .build();
    }

    // ==================== XÁC NHẬN OTP ====================
    @Override
    @Transactional
    public OtpResponse verifyOtp(VerifyOtpRequest request) {
        String phone = request.getPhone();
        OtpVerification.OtpType type = OtpVerification.OtpType.valueOf(request.getType());

        OtpVerification otp = otpRepository
                .findTopByPhoneAndTypeAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        phone, type, LocalDateTime.now())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST,
                        "OTP không hợp lệ hoặc đã hết hạn"));

        if (!otp.getOtpCode().equals(request.getOtpCode())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "OTP không đúng");
        }

        // Đánh dấu OTP đã dùng
        otp.setIsUsed(true);
        otpRepository.save(otp);

        // Nếu là user mới → tạo tài khoản
        boolean isNewUser = !userRepository.existsByPhone(phone);
        if (isNewUser) {
            User newUser = User.builder()
                    .phone(phone)
                    .phoneVerifiedAt(LocalDateTime.now())
                    .hasPassword(false)
                    .role(User.Role.customer)
                    .isActive(true)
                    .build();
            userRepository.save(newUser);
        } else {
            // Cập nhật phoneVerifiedAt
            userRepository.findByPhone(phone).ifPresent(u -> {
                u.setPhoneVerifiedAt(LocalDateTime.now());
                userRepository.save(u);
            });
        }

        User user = userRepository.findByPhone(phone).orElseThrow();

        return OtpResponse.builder()
                .success(true)
                .message("Xác nhận OTP thành công")
                .isNewUser(isNewUser)
                .hasPassword(user.getHasPassword())
                .build();
    }

    // ==================== ĐĂNG NHẬP BẰNG MẬT KHẨU ====================
    @Override
    public AuthResponse loginWithPassword(LoginPasswordRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tài khoản không tồn tại"));

        if (!user.getHasPassword()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tài khoản chưa có mật khẩu");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Mật khẩu không đúng");
        }

        if (!user.getIsActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khoá");
        }

        return buildAuthResponse(user);
    }

    // ==================== TẠO MẬT KHẨU ====================
    @Override
    @Transactional
    public AuthResponse setPassword(SetPasswordRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tài khoản không tồn tại"));

        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setHasPassword(true);
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    // ==================== ĐĂNG NHẬP GOOGLE ====================
    @Override
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        // TODO: Verify idToken với Google API
        // GoogleIdToken.Payload payload = verifyGoogleToken(request.getIdToken());
        // String googleId = payload.getSubject();
        // String email = payload.getEmail();
        // String name = (String) payload.get("name");

        // Placeholder — thay bằng verify thật
        throw new AppException(HttpStatus.NOT_IMPLEMENTED, "Google OAuth chưa được cấu hình");
    }

    // ==================== REFRESH TOKEN ====================
    @Override
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtil.isTokenValid(refreshToken)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Refresh token không hợp lệ");
        }
        if (!"refresh".equals(jwtUtil.extractType(refreshToken))) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Token không đúng loại");
        }

        Long userId = jwtUtil.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User không tồn tại"));

        return buildAuthResponse(user);
    }

    // ==================== HELPER ====================
    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .role(user.getRole().name())
                .isNewUser(false)
                .hasPassword(user.getHasPassword())
                .build();
    }
}