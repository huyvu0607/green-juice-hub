package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.order.request.ShippingFeeRequest;
import com.greenjuicehub.backend.dto.order.response.ShippingFeeResponse;
import com.greenjuicehub.backend.entity.CartItem;
import com.greenjuicehub.backend.entity.ProductVariant;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.shipping.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class ShippingFeeController {

    private final GhnService ghnService;
    private final AddressRepository addressRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;

    /**
     * POST /api/orders/shipping-fee
     * Tính phí ship realtime trước khi đặt hàng
     */
    @PostMapping("/shipping-fee")
    public ResponseEntity<ShippingFeeResponse> calculateShippingFee(
            @AuthenticationPrincipal Long userId,
            @RequestBody ShippingFeeRequest request
    ) {
        // 1. Lấy địa chỉ → district_id + ward_code
        var address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Địa chỉ không tồn tại"));

        if (address.getDistrictId() == null || address.getWardCode() == null) {
            // Địa chỉ cũ chưa có GHN data → fallback
            return ResponseEntity.ok(ShippingFeeResponse.builder()
                    .shippingFee(BigDecimal.valueOf(30_000))
                    .build());
        }

        // 2. Tính tổng trọng lượng
        int totalWeight = calculateTotalWeight(userId, request);

        // 3. Gọi GHN
        BigDecimal fee = ghnService.calculateShippingFee(
                address.getDistrictId(),
                address.getWardCode(),
                totalWeight
        );

        return ResponseEntity.ok(ShippingFeeResponse.builder()
                .shippingFee(fee)
                .build());
    }

    // ── Tính tổng weight từ cart items hoặc buyNow ─────────────────
    private int calculateTotalWeight(Long userId, ShippingFeeRequest request) {
        // BuyNow
        if (request.getVariantId() != null) {
            ProductVariant variant = productVariantRepository
                    .findById(request.getVariantId())
                    .orElse(null);
            int w = (variant != null && variant.getWeightGram() != null)
                    ? variant.getWeightGram() : 500;
            return w * (request.getQuantity() != null ? request.getQuantity() : 1);
        }

        // Cart
        if (request.getCartItemIds() != null && !request.getCartItemIds().isEmpty()) {
            var cart = cartRepository.findByUserId(userId).orElse(null);
            if (cart == null) return 500;

            List<CartItem> items = cartItemRepository
                    .findAllByCartIdWithDetails(cart.getId())
                    .stream()
                    .filter(i -> request.getCartItemIds().contains(i.getId()))
                    .toList();

            if (items.isEmpty()) return 500; // fallback nếu không tìm thấy

            return items.stream()
                    .mapToInt(i -> {
                        int w = (i.getVariant().getWeightGram() != null)
                                ? i.getVariant().getWeightGram() : 500;
                        return w * i.getQuantity();
                    })
                    .sum();
        }

        return 500;
    }
}