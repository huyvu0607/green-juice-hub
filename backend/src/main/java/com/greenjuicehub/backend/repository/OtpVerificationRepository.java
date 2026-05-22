package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    // Tìm OTP mới nhất chưa dùng còn hạn
    Optional<OtpVerification> findTopByPhoneAndTypeAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String phone, OtpVerification.OtpType type, LocalDateTime now);

    // Đếm số lần gửi OTP trong ngày
    int countByPhoneAndTypeAndCreatedAtAfter(
            String phone, OtpVerification.OtpType type, LocalDateTime since);

    // Kiểm tra cooldown 60 giây
    boolean existsByPhoneAndTypeAndIsUsedFalseAndCreatedAtAfter(
            String phone, OtpVerification.OtpType type, LocalDateTime after);

    // Invalidate OTP cũ
    @Modifying
    @Query("UPDATE OtpVerification o SET o.isUsed = true WHERE o.phone = :phone AND o.type = :type AND o.isUsed = false")
    void invalidateAllByPhoneAndType(
            @Param("phone") String phone,
            @Param("type") OtpVerification.OtpType type);
}