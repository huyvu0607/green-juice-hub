package com.greenjuicehub.backend.service.order;

import com.greenjuicehub.backend.dto.adminOrder.request.AdminRefundRequest;
import com.greenjuicehub.backend.dto.adminOrder.request.AdminUpdateOrderStatusRequest;
import com.greenjuicehub.backend.dto.adminOrder.response.TopProductResponse;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface IAdminOrderService {

    /** Danh sách đơn hàng — lọc status + paymentStatus, tìm orderCode, phân trang */
    Page<OrderResponse> getOrders(
            String status,
            String paymentStatus,
            String search,
            String dateFrom,
            String dateTo,
            Pageable pageable
    );

    /** Đếm số lượng đơn trên ngày — dùng cho mini calendar */
    Map<String, Long> getOrderCountsByDate(int year, int month);

    /**
     * Đếm số đơn theo từng ngày trong 7 ngày gần nhất — dùng cho mini bar chart.
     * Trả về map { "2026-06-10": 4, "2026-06-11": 7, ... }
     */
    Map<String, Long> getWeeklyOrderCounts();

    /**
     * Top sản phẩm bán chạy trong 30 ngày gần nhất.
     * @param limit số lượng sản phẩm trả về (mặc định 5)
     */
    List<TopProductResponse> getTopProducts(int limit);

    /** Chi tiết 1 đơn hàng bất kỳ */
    OrderResponse getOrderDetail(Long orderId);

    /** Cập nhật trạng thái đơn hàng */
    OrderResponse updateStatus(Long orderId, AdminUpdateOrderStatusRequest request);

    /** Xử lý hoàn tiền */
    OrderResponse refund(Long orderId, AdminRefundRequest request);

    /**
     * Đếm số đơn theo từng trạng thái đơn hàng VÀ trạng thái thanh toán.
     * Shape:
     * {
     *   "ALL": 120,
     *   "PENDING": 5, "CONFIRMED": 3, "SHIPPING": 8, "DELIVERED": 100, "CANCELLED": 4,
     *   "PAY_ALL": 120,
     *   "PAY_PENDING": 10, "PAY_PAID": 90, "PAY_REFUND_PENDING": 7, "PAY_REFUNDED": 13
     * }
     */
    Map<String, Long> getStatusCounts();
}