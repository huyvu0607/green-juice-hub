package com.greenjuicehub.backend.dto.adminPromotion.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PromotionUsageResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userPhone;
    private Long orderId;
    private String orderCode;
    private BigDecimal orderTotalAmount;
    private String orderStatus;
    private LocalDateTime usedAt;
}