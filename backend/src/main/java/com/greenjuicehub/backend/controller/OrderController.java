package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.order.request.ApplyPromoRequest;
import com.greenjuicehub.backend.dto.order.request.BuyNowRequest;
import com.greenjuicehub.backend.dto.order.request.PlaceOrderRequest;
import com.greenjuicehub.backend.dto.order.response.ApplyPromoResponse;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import com.greenjuicehub.backend.service.order.IOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class OrderController {

    private final IOrderService orderService;

    /**
     * POST /api/orders
     * Đặt hàng từ các item đã chọn trong giỏ
     */
    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        return ResponseEntity.ok(orderService.placeOrder(userId, request));
    }

    /**
     * GET /api/orders?page=0&size=10
     * Lấy danh sách đơn hàng của user (có phân trang)
     */
    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(orderService.getMyOrders(userId, pageable));
    }

    /**
     * GET /api/orders/{orderId}
     * Lấy chi tiết 1 đơn hàng
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderDetail(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(orderService.getOrderDetail(userId, orderId));
    }
    /**
     * POST /api/orders/buy-now
     * Mua ngay — không qua giỏ hàng
     */
    @PostMapping("/buy-now")
    public ResponseEntity<OrderResponse> buyNow(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody BuyNowRequest request
    ) {
        return ResponseEntity.ok(orderService.buyNow(userId, request));
    }
    /**
     * PATCH /api/orders/{orderId}/cancel
     * Huỷ đơn hàng (chỉ khi status = PENDING)
     */
    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(orderService.cancelOrder(userId, orderId));
    }

    /**
     * POST /api/orders/apply-promo
     * Kiểm tra và tính toán mã giảm giá trước khi đặt hàng
     */
    @PostMapping("/apply-promo")
    public ResponseEntity<ApplyPromoResponse> applyPromo(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody ApplyPromoRequest request
    ) {
        return ResponseEntity.ok(orderService.applyPromo(userId, request));
    }
}