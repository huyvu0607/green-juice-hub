package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.cart.request.AddToCartRequest;
import com.greenjuicehub.backend.dto.cart.request.UpdateCartItemRequest;
import com.greenjuicehub.backend.dto.cart.response.CartResponse;
import com.greenjuicehub.backend.service.cart.ICartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    private final ICartService cartService;

    /**
     * GET /api/cart
     * Lấy toàn bộ giỏ hàng của user đang đăng nhập
     */
    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @AuthenticationPrincipal Long userId
    ) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    /**
     * POST /api/cart/items
     * Thêm sản phẩm vào giỏ (nếu đã có → cộng thêm số lượng)
     */
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody AddToCartRequest request
    ) {
        return ResponseEntity.ok(cartService.addItem(userId, request));
    }

    /**
     * PUT /api/cart/items/{cartItemId}
     * Cập nhật số lượng của 1 item trong giỏ
     */
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> updateItem(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return ResponseEntity.ok(cartService.updateItem(userId, cartItemId, request));
    }

    /**
     * DELETE /api/cart/items/{cartItemId}
     * Xoá 1 item khỏi giỏ
     */
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> removeItem(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long cartItemId
    ) {
        return ResponseEntity.ok(cartService.removeItem(userId, cartItemId));
    }

    /**
     * DELETE /api/cart
     * Xoá toàn bộ giỏ hàng
     */
    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @AuthenticationPrincipal Long userId
    ) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}