package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    // Tìm OTP mới nhất chưa dùng còn hạn
    Optional<OtpVerification> findTopByPhoneAndTypeAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phone, OtpVerification.OtpType type, LocalDateTime now);

    // Đếm số lần gửi OTP trong ngày
    int countByPhoneAndTypeAndCreatedAtAfter(
            String phone, OtpVerification.OtpType type, LocalDateTime since);
}