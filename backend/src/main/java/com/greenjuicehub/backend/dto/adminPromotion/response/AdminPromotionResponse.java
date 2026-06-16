package com.greenjuicehub.backend.dto.adminPromotion.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminPromotionResponse {
    private Long id;
    private String code;
    private String name;
    private String type;            // PERCENT / FIXED
    private BigDecimal value;
    private BigDecimal minOrderValue;
    private Boolean freeShipping;
    private String target;          // PUBLIC / PERSONAL
    private Long targetUserId;
    private String targetUserName;
    private String targetUserPhone;
    private Integer maxUses;        // null = không giới hạn
    private Integer maxUsesPerUser;
    private Integer usedCount;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Boolean isActive;
    private String status;          // UPCOMING / RUNNING / EXHAUSTED / EXPIRED / INACTIVE
}