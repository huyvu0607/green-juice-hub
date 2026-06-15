// controller/AdminOrderController.java
package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.dto.adminOrder.request.AdminRefundRequest;
import com.greenjuicehub.backend.dto.adminOrder.request.AdminUpdateOrderStatusRequest;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import com.greenjuicehub.backend.service.order.IAdminOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminOrderController {

    private final IAdminOrderService adminOrderService;

    /**
     * GET /api/admin/orders?page=0&size=15&status=PENDING&search=GJH-xxx
     * Danh sách đơn hàng — lọc + tìm kiếm + phân trang
     */
    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getOrders(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminOrderService.getOrders(status, search, pageable));
    }

    /**
     * GET /api/admin/orders/status-counts
     * Số đơn theo từng trạng thái — dùng cho tab badge
     */
    @GetMapping("/status-counts")
    public ResponseEntity<Map<String, Long>> getStatusCounts() {
        return ResponseEntity.ok(adminOrderService.getStatusCounts());
    }

    /**
     * GET /api/admin/orders/{orderId}
     * Chi tiết 1 đơn hàng bất kỳ
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderDetail(@PathVariable Long orderId) {
        return ResponseEntity.ok(adminOrderService.getOrderDetail(orderId));
    }

    /**
     * PATCH /api/admin/orders/{orderId}/status
     * Cập nhật trạng thái đơn hàng
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
     * Xử lý hoàn tiền
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