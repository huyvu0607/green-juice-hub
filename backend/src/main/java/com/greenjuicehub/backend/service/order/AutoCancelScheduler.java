// service/order/AutoCancelScheduler.java
package com.greenjuicehub.backend.service.order;

import com.greenjuicehub.backend.entity.Order;
import com.greenjuicehub.backend.entity.OrderItem;
import com.greenjuicehub.backend.repository.OrderItemRepository;
import com.greenjuicehub.backend.repository.OrderRepository;
import com.greenjuicehub.backend.service.order.impl.OrderServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoCancelScheduler {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderServiceImpl orderServiceImpl; // dùng method dùng chung restockAndRefundPromo

    /**
     * Chạy mỗi 5 phút.
     * Tìm tất cả đơn PENDING đã quá hạn thanh toán (expiresAt < now) → tự động CANCELLED.
     * Chỉ áp dụng cho đơn thanh toán online (QR/chuyển khoản); COD không có expiresAt nên không bị ảnh hưởng.
     */
    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional
    public void autoCancelExpiredOrders() {
        LocalDateTime now = LocalDateTime.now();

        List<Order> expiredOrders = orderRepository
                .findAllByStatusAndExpiresAtBefore(Order.OrderStatus.PENDING, now);

        if (expiredOrders.isEmpty()) return;

        log.info("[AutoCancel] Tìm thấy {} đơn PENDING quá hạn thanh toán, đang xử lý...", expiredOrders.size());

        for (Order order : expiredOrders) {
            try {
                // Double-check: nếu đã thanh toán xong giữa lúc query và lúc xử lý thì bỏ qua
                if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
                    log.info("[AutoCancel] Bỏ qua đơn #{} vì đã thanh toán", order.getOrderCode());
                    continue;
                }

                List<OrderItem> items = orderItemRepository.findAllByOrderIdWithDetails(order.getId());

                orderServiceImpl.restockAndRefundPromo(order, items);

                order.setCancelReason("Hệ thống tự huỷ do quá hạn thanh toán");
                order.setStatus(Order.OrderStatus.CANCELLED);
                order.setCancelledBy(Order.CancelledBy.SYSTEM);
                orderRepository.save(order);

                log.info("[AutoCancel] Đơn #{} → CANCELLED (hết hạn thanh toán)", order.getOrderCode());

            } catch (Exception e) {
                log.error("[AutoCancel] Lỗi khi xử lý đơn #{}: {}", order.getOrderCode(), e.getMessage());
            }
        }

        log.info("[AutoCancel] Hoàn tất xử lý {} đơn.", expiredOrders.size());
    }
}