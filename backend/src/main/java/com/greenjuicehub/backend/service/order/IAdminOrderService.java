// service/order/IAdminOrderService.java
package com.greenjuicehub.backend.service.order;

import com.greenjuicehub.backend.dto.adminOrder.request.AdminRefundRequest;
import com.greenjuicehub.backend.dto.adminOrder.request.AdminUpdateOrderStatusRequest;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface IAdminOrderService {

    /** Danh sách đơn hàng — lọc status, tìm orderCode, phân trang */
    Page<OrderResponse> getOrders(String status, String search, Pageable pageable);

    /** Chi tiết 1 đơn hàng bất kỳ */
    OrderResponse getOrderDetail(Long orderId);

    /** Cập nhật trạng thái đơn hàng */
    OrderResponse updateStatus(Long orderId, AdminUpdateOrderStatusRequest request);

    /** Xử lý hoàn tiền */
    OrderResponse refund(Long orderId, AdminRefundRequest request);

    /** Đếm số đơn theo từng status — dùng cho tab badge */
    Map<String, Long> getStatusCounts();
}