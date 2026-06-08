package com.greenjuicehub.backend.service.order;

import com.greenjuicehub.backend.dto.order.request.*;
import com.greenjuicehub.backend.dto.order.request.ApplyPromoRequest;
import com.greenjuicehub.backend.dto.order.request.PlaceOrderRequest;
import com.greenjuicehub.backend.dto.order.response.ApplyPromoResponse;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface IOrderService {

    /** Đặt hàng — tạo Order + OrderItems + Payment record */
    OrderResponse placeOrder(Long userId, PlaceOrderRequest request);

    /** Xem danh sách đơn hàng của user (có phân trang) */
    Page<OrderResponse> getMyOrders(Long userId, String status, Pageable pageable);

    /** Mua ngay — không qua giỏ hàng */
    OrderResponse buyNow(Long userId, BuyNowRequest request);

    /** Xem chi tiết 1 đơn hàng */
    OrderResponse getOrderDetail(Long userId, Long orderId);

    /** Huỷ đơn — chỉ cho phép khi status = PENDING */
    OrderResponse cancelOrder(Long userId, Long orderId);

    /** Kiểm tra & tính toán mã giảm giá trước khi đặt */
    ApplyPromoResponse applyPromo(Long userId, ApplyPromoRequest request);

    /** Đếm số lượng của Status **/
    Map<String, Long> getStatusCounts(Long userId);

}