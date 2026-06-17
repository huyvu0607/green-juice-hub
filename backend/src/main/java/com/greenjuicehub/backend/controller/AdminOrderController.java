// controller/AdminOrderController.java
package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.adminOrder.request.AdminRefundRequest;
import com.greenjuicehub.backend.dto.adminOrder.request.AdminUpdateOrderStatusRequest;
import com.greenjuicehub.backend.dto.adminOrder.response.TopProductResponse;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import com.greenjuicehub.backend.service.order.IAdminOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminOrderController {

    private final IAdminOrderService adminOrderService;

    /**
     * GET /api/admin/orders?page=0&size=15&status=PENDING&paymentStatus=REFUND_PENDING&search=GJH-xxx
     */
    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getOrders(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                adminOrderService.getOrders(status, paymentStatus, search, dateFrom, dateTo, pageable)
        );
    }

    /**
     * GET /api/admin/orders/counts-by-date?year=2026&month=6
     * Dùng cho mini calendar — map { "2026-06-01": 3, ... }
     */
    @GetMapping("/counts-by-date")
    public ResponseEntity<Map<String, Long>> getCountsByDate(
            @RequestParam int year,
            @RequestParam int month
    ) {
        return ResponseEntity.ok(adminOrderService.getOrderCountsByDate(year, month));
    }

    /**
     * GET /api/admin/orders/weekly-counts
     * Dùng cho mini bar chart — map { "2026-06-10": 4, "2026-06-11": 7, ... } (7 ngày gần nhất)
     */
    @GetMapping("/weekly-counts")
    public ResponseEntity<Map<String, Long>> getWeeklyCounts() {
        return ResponseEntity.ok(adminOrderService.getWeeklyOrderCounts());
    }

    /**
     * GET /api/admin/orders/top-products?limit=5
     * Top sản phẩm bán chạy trong 30 ngày gần nhất
     */
    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponse>> getTopProducts(
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(adminOrderService.getTopProducts(limit));
    }

    /**
     * GET /api/admin/orders/status-counts
     */
    @GetMapping("/status-counts")
    public ResponseEntity<Map<String, Long>> getStatusCounts() {
        return ResponseEntity.ok(adminOrderService.getStatusCounts());
    }

    /**
     * GET /api/admin/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderDetail(@PathVariable Long orderId) {
        return ResponseEntity.ok(adminOrderService.getOrderDetail(orderId));
    }

    /**
     * PATCH /api/admin/orders/{orderId}/status
     * Body: { "status": "CONFIRMED", "cancelReason": "..." }
     */
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long orderId,
            @RequestBody AdminUpdateOrderStatusRequest request
    ) {
        return ResponseEntity.ok(adminOrderService.updateStatus(orderId, request));
    }

    /**
     * PATCH /api/admin/orders/{orderId}/refund
     * Body: { "note": "Hoàn tiền do..." }
     */
    @PatchMapping("/{orderId}/refund")
    public ResponseEntity<OrderResponse> refund(
            @PathVariable Long orderId,
            @RequestBody(required = false) AdminRefundRequest request
    ) {
        if (request == null) request = new AdminRefundRequest();
        return ResponseEntity.ok(adminOrderService.refund(orderId, request));
    }
}