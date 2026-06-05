package com.greenjuicehub.backend.service.auth.impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.greenjuicehub.backend.config.JwtUtil;
import com.greenjuicehub.backend.config.OtpProperties;
import com.greenjuicehub.backend.dto.auth.request.*;
import com.greenjuicehub.backend.dto.auth.response.*;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.AuthMapper;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.auth.*;
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
    private final OtpLockService otpLockService;
    private final ITempTokenService tempTokenService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final PasswordAttemptService passwordAttemptService;
    private final CaptchaVerifier captchaVerifier;
    private final TokenBlacklistService tokenBlacklistService;
    private final AuthMapper authMapper;



    // ==================== KIỂM TRA TÀI KHOẢN ====================
    @Override
    public AccountCheckResponse checkAccount(CheckAccountRequest request) {
        String phone = request.getPhone();
        return userRepository.findByPhone(phone)
                .map(authMapper::toAccountCheckResponse)
                .orElseGet(authMapper::toNewAccountCheckResponse);

    }

    // ==================== GỬI OTP ====================
    @Override
    @Transactional
    public OtpResponse sendOtp(SendOtpRequest request) {
        String phone = request.getPhone();
        OtpVerification.OtpType otpType = OtpVerification.OtpType.valueOf(request.getType());

        // 1. Kiểm tra cooldown 60 giây
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusSeconds(60);
        boolean recentlySent = otpRepository
                .existsByPhoneAndTypeAndIsUsedFalseAndCreatedAtAfter(phone, otpType, oneMinuteAgo);
        if (recentlySent) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Vui lòng chờ 60 giây trước khi gửi lại OTP");
        }

        // 2. Kiểm tra giới hạn ngày
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        int sentToday = otpRepository.countByPhoneAndTypeAndCreatedAtAfter(phone, otpType, startOfDay);
        if (sentToday >= otpProperties.getMaxSendPerDay()) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã gửi OTP quá " + otpProperties.getMaxSendPerDay() + " lần hôm nay");
        }

        // 3. Invalidate tất cả OTP cũ chưa dùng
        otpRepository.invalidateAllByPhoneAndType(phone, otpType);

        // Tạo OTP mới
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        OtpVerification otp = OtpVerification.builder()
                .phone(phone)
                .otpCode(otpCode)
                .type(otpType)
                .isUsed(false)
                .expiresAt(LocalDateTime.now().plusMinutes(otpProperties.getExpirationMinutes()))
                .build();
        otpRepository.save(otp);

        System.out.println("📱 OTP cho " + phone + ": " + otpCode);

        boolean isNewUser = !userRepository.existsByPhone(phone);
        boolean hasPassword = false;
        if (!isNewUser) {
            hasPassword = userRepository.findByPhone(phone)
                    .map(User::getHasPassword).orElse(false);
        }

        return authMapper.toSendOtpResponse(phone, isNewUser, hasPassword);
    }

    // ==================== XÁC NHẬN OTP ====================
    @Override
    @Transactional
    public OtpResponse verifyOtp(VerifyOtpRequest request) {
        String phone = request.getPhone();
        OtpVerification.OtpType type = OtpVerification.OtpType.valueOf(request.getType().toUpperCase());

        // Kiểm tra đang bị khóa
        if (otpLockService.isLocked(phone)) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Nhập sai OTP quá " + otpProperties.getMaxWrongAttempts() +
                            " lần, vui lòng thử lại sau " + otpProperties.getLockMinutes() + " phút");
        }

        OtpVerification otp = otpRepository
                .findTopByPhoneAndTypeAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        phone, type, LocalDateTime.now())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST,
                        "OTP không hợp lệ hoặc đã hết hạn"));

        if (!otp.getOtpCode().equals(request.getOtpCode())) {
            int remaining = otpLockService.recordFailedAttempt(phone);
            if (remaining <= 0) {
                throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                        "Nhập sai OTP quá 3 lần, vui lòng thử lại sau 15 phút");
            }
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "OTP không đúng, còn " + remaining + " lần thử");
        }

        // Đúng → clear attempts
        otpLockService.clearAttempts(phone);
        otp.setIsUsed(true);
        otpRepository.save(otp);

        boolean isNewUser = !userRepository.existsByPhone(phone);
        if (isNewUser) {
            User newUser = authMapper.toNewUserFromPhone(phone);
            userRepository.save(newUser);
        } else {
            userRepository.findByPhone(phone).ifPresent(u -> {
                u.setPhoneVerifiedAt(LocalDateTime.now());
                userRepository.save(u);
            });
        }

        User user = userRepository.findByPhone(phone).orElseThrow();
        String tempToken = tempTokenService.generate(user.getId());

        return authMapper.toVerifyOtpResponse(isNewUser, user.getHasPassword(), tempToken);
    }

    // ==================== ĐĂNG NHẬP BẰNG MẬT KHẨU ====================
    @Override
    public AuthResponse loginWithPassword(LoginPasswordRequest request) {
        // Tìm user theo phone, email, hoặc username
        User user = userRepository.findByPhone(request.getIdentifier())
                .or(() -> userRepository.findByEmail(request.getIdentifier()))
                .or(() -> userRepository.findByUsername(request.getIdentifier()))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tài khoản không tồn tại"));

        // Kiểm tra lock
        if (passwordAttemptService.isLocked(request.getIdentifier())) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Tài khoản tạm khóa do nhập sai quá nhiều lần, thử lại sau 15 phút");
        }

        // Verify captcha nếu đã sai >= 5 lần
        if (passwordAttemptService.requiresCaptcha(request.getIdentifier())) {
            captchaVerifier.verify(request.getCaptchaToken());
        }

        if (!user.getHasPassword()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tài khoản chưa có mật khẩu");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            PasswordAttemptService.AttemptResult result =
                    passwordAttemptService.recordFailed(request.getIdentifier());
            if (result.isLocked()) {
                throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                        "Sai mật khẩu quá 10 lần, tài khoản bị khóa 15 phút");
            }
            if (result.requiresCaptcha()) {
                throw new AppException(HttpStatus.FORBIDDEN,
                        "Mật khẩu không đúng, vui lòng xác minh captcha để tiếp tục");
            }
            int remaining = 5 - result.count();
            if (remaining > 0) {
                throw new AppException(HttpStatus.UNAUTHORIZED,
                        "Mật khẩu không đúng, còn " + remaining + " lần thử trước khi yêu cầu captcha");
            } else {
                throw new AppException(HttpStatus.FORBIDDEN,
                        "Mật khẩu không đúng, vui lòng xác minh captcha để tiếp tục");
            }
        }

        if (!user.getIsActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khoá");
        }

        // Đúng → clear attempts
        passwordAttemptService.clearAttempts(request.getIdentifier());
        return buildAuthResponse(user);
    }

    // ==================== TẠO MẬT KHẨU ====================
    @Override
    @Transactional
    public AuthResponse setPassword(SetPasswordRequest request) {
        Long userId = tempTokenService.validate(request.getTempToken());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tài khoản không tồn tại"));

        if (user.getHasPassword()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tài khoản đã có mật khẩu, dùng đổi mật khẩu");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setHasPassword(true);
        userRepository.save(user);

        tempTokenService.invalidate(request.getTempToken()); // dùng 1 lần
        return buildAuthResponse(user);
    }

    // ==================== ĐĂNG NHẬP GOOGLE ====================
    @Override
    @Transactional
    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(request.getIdToken());

        String googleId = payload.getSubject();
        String email    = payload.getEmail();
        String name     = (String) payload.get("name");

        // 1. Tìm theo googleId trong social_accounts
        User user = socialAccountRepository.findByProviderAndProviderId(SocialAccount.Provider.GOOGLE, googleId)
                .map(SocialAccount::getUser)
                .orElseGet(() -> {
                    // 2. Tìm theo email trong users
                    User existing = userRepository.findByEmail(email).orElse(null);

                    if (existing == null) {
                        // 3. Tạo user mới
                        existing = authMapper.toNewUserFromGoogle(email, name);
                        userRepository.save(existing);
                    }

                    // Tạo social_account liên kết
                    SocialAccount social = authMapper.toSocialAccount(existing,googleId,email);
                    socialAccountRepository.save(social);

                    return existing;
                });

        if (!user.getIsActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khoá");
        }

        return buildAuthResponse(user);
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

        return authMapper.toAuthResponse(user, accessToken, refreshToken);
    }

    @Override
    public AuthResponse loginWithTempToken(String tempToken) {
        Long userId = tempTokenService.validate(tempToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tài khoản không tồn tại"));

        if (!user.getIsActive()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khoá");
        }

        tempTokenService.invalidate(tempToken); // dùng 1 lần
        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request, Long currentUserId) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tài khoản không tồn tại"));

        if (!user.getHasPassword()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Tài khoản chưa có mật khẩu");
        }
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Mật khẩu cũ không đúng");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu mới không được trùng mật khẩu cũ");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        Long userId = tempTokenService.validate(request.getTempToken());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tài khoản không tồn tại"));

        if (user.getHasPassword() &&
                passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu mới không được trùng mật khẩu cũ");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setHasPassword(true);
        userRepository.save(user);

        tempTokenService.invalidate(request.getTempToken());
        return buildAuthResponse(user);
    }
    @Override
    public void logout(String accessToken) {
        if (!jwtUtil.isTokenValid(accessToken)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ");
        }
        long ttl = jwtUtil.getRemainingSeconds(accessToken);
        tokenBlacklistService.blacklist(accessToken, ttl);
    }
}
