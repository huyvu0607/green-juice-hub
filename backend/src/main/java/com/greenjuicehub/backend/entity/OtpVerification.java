package com.greenjuicehub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 15, nullable = false)
    private String phone;

    @Column(name = "otp_code", length = 6, nullable = false)
    private String otpCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OtpType type;

    @Column(name = "is_used", nullable = false)
    private Boolean isUsed = false;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum OtpType {
        register, login, reset_password
    }
}