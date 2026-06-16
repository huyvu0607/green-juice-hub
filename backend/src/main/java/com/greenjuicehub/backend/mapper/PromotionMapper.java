package com.greenjuicehub.backend.mapper;

import com.greenjuicehub.backend.dto.adminPromotion.response.AdminPromotionResponse;
import com.greenjuicehub.backend.dto.adminPromotion.response.PromotionUsageResponse;
import com.greenjuicehub.backend.entity.Order;
import com.greenjuicehub.backend.entity.Promotion;
import com.greenjuicehub.backend.entity.PromotionUsage;
import org.springframework.stereotype.Component;

@Component
public class PromotionMapper {

    public AdminPromotionResponse toAdminResponse(Promotion p, String status) {
        return AdminPromotionResponse.builder()
                .id(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .type(p.getType().name())
                .value(p.getValue())
                .minOrderValue(p.getMinOrderValue())
                .freeShipping(p.getFreeShipping())
                .target(p.getTarget().name())
                .targetUserId(p.getUser() != null ? p.getUser().getId() : null)
                .targetUserName(p.getUser() != null ? p.getUser().getName() : null)
                .targetUserPhone(p.getUser() != null ? p.getUser().getPhone() : null)
                .maxUses(p.getMaxUses())
                .maxUsesPerUser(p.getMaxUsesPerUser())
                .usedCount(p.getUsedCount())
                .startsAt(p.getStartsAt())
                .endsAt(p.getEndsAt())
                .isActive(p.getIsActive())
                .status(status)
                .build();
    }

    public PromotionUsageResponse toUsageResponse(PromotionUsage pu) {
        Order order = pu.getOrder();
        return PromotionUsageResponse.builder()
                .id(pu.getId())
                .userId(pu.getUser().getId())
                .userName(pu.getUser().getName())
                .userPhone(pu.getUser().getPhone())
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .orderTotalAmount(order.getTotalAmount())
                .orderStatus(order.getStatus() != null ? order.getStatus().name() : null)
                .usedAt(pu.getUsedAt())
                .build();
    }
}