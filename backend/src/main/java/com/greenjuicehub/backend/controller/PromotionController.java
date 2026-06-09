package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.order.request.GetAvailablePromosRequest;
import com.greenjuicehub.backend.dto.order.response.AvailablePromoResponse;
import com.greenjuicehub.backend.service.promotion  .IPromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class PromotionController {

    private final IPromotionService promotionService;

    /**
     * POST /api/promos/available
     * Body cart:    { "cartItemIds": [1, 2, 3] }
     * Body buyNow:  { "variantId": 5, "quantity": 2 }
     */
    @PostMapping("/available")
    public ResponseEntity<List<AvailablePromoResponse>> getAvailablePromos(
            @AuthenticationPrincipal Long userId,
            @RequestBody GetAvailablePromosRequest request
    ) {
        return ResponseEntity.ok(promotionService.getAvailablePromos(userId, request));
    }
}