package com.greenjuicehub.backend.service.promotion.impl;

import com.greenjuicehub.backend.dto.order.request.GetAvailablePromosRequest;
import com.greenjuicehub.backend.dto.order.response.AvailablePromoResponse;
import com.greenjuicehub.backend.entity.Promotion;
import com.greenjuicehub.backend.entity.ProductVariant;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.promotion.IPromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements IPromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AvailablePromoResponse> getAvailablePromos(Long userId, GetAvailablePromosRequest request) {
        BigDecimal subtotal = resolveSubtotal(userId ,request);
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> promos = new ArrayList<>();
        promos.addAll(promotionRepository.findAllAvailablePublic(now));
        promos.addAll(promotionRepository.findAllAvailablePersonal(userId, now));

        return promos.stream()
                .map(p -> {
                    String reason = resolveIneligibleReason(p, userId, subtotal);
                    return AvailablePromoResponse.builder()
                            .code(p.getCode())
                            .name(p.getName())
                            .discountType(p.getType().name())
                            .discountValue(p.getValue())
                            .minOrderValue(p.getMinOrderValue())
                            .isEligible(reason == null)
                            .reason(reason)
                            .build();
                })
                .sorted(Comparator
                        // 1. Eligible lên trước
                        .comparingInt((AvailablePromoResponse r) -> r.getIsEligible() ? 0 : 1)
                        // 2. Trong cùng nhóm, sort theo số tiền giảm thực tế giảm dần
                        .thenComparing(Comparator.comparingLong((AvailablePromoResponse r) ->
                                calculateActualDiscount(r, subtotal)).reversed())
                )
                .toList();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private long calculateActualDiscount(AvailablePromoResponse promo, BigDecimal subtotal) {
        if ("PERCENT".equals(promo.getDiscountType())) {
            return subtotal.multiply(promo.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.FLOOR)
                    .longValue();
        }
        // FIXED — không được giảm hơn subtotal
        return promo.getDiscountValue().min(subtotal).longValue();
    }
    /** Tính subtotal từ DB — không tin số từ client */
    private BigDecimal resolveSubtotal(Long userId, GetAvailablePromosRequest request) {
        // BuyNow: dùng variantId + quantity
        if (request.getVariantId() != null) {
            ProductVariant variant = productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));
            BigDecimal price = variant.getSalePrice() != null
                    ? variant.getSalePrice()
                    : variant.getOriginalPrice();
            return price.multiply(BigDecimal.valueOf(request.getQuantity()));
        }

        // Cart: dùng cartItemIds
        if (request.getCartItemIds() != null && !request.getCartItemIds().isEmpty()) {
            return cartItemRepository.findAllById(request.getCartItemIds())
                    .stream()
                    .filter(i -> i.getCart().getUser().getId().equals(userId)) // ← giờ có userId rồi
                    .map(i -> {
                        BigDecimal price = i.getVariant().getSalePrice() != null
                                ? i.getVariant().getSalePrice()
                                : i.getVariant().getOriginalPrice();
                        return price.multiply(BigDecimal.valueOf(i.getQuantity()));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        return BigDecimal.ZERO;
    }

    private String resolveIneligibleReason(Promotion p, Long userId, BigDecimal subtotal) {
        if (subtotal.compareTo(p.getMinOrderValue()) < 0) {
            return "Đơn tối thiểu " + p.getMinOrderValue().toPlainString() + "đ";
        }
        if (p.getMaxUsesPerUser() != null) {
            int used = promotionUsageRepository.countByPromotionIdAndUserId(p.getId(), userId);
            if (used >= p.getMaxUsesPerUser()) {
                return "Bạn đã dùng hết lượt";
            }
        }
        return null;
    }
}