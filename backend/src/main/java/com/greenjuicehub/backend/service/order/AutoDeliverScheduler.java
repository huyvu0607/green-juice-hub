// service/order/AutoDeliverScheduler.java
package com.greenjuicehub.backend.service.order;

import com.greenjuicehub.backend.entity.Order;
import com.greenjuicehub.backend.entity.Payment;
import com.greenjuicehub.backend.repository.OrderRepository;
import com.greenjuicehub.backend.repository.PaymentRepository;
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
public class AutoDeliverScheduler {

    private final OrderRepository  orderRepository;
    private final PaymentRepository paymentRepository;

    /**
     * Chạy mỗi ngày lúc 2:00 AM.
     * Tìm tất cả đơn SHIPPING đã quá 7 ngày → tự động DELIVERED.
     * Nếu COD → đánh dấu PAID luôn.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void autoDeliverExpiredShipping() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);

        List<Order> expiredOrders = orderRepository
                .findByStatusAndUpdatedAtBefore(Order.OrderStatus.SHIPPING, cutoff);

        if (expiredOrders.isEmpty()) return;

        log.info("[AutoDeliver] Tìm thấy {} đơn SHIPPING quá 7 ngày, đang xử lý...", expiredOrders.size());

        for (Order order : expiredOrders) {
            try {
                order.setStatus(Order.OrderStatus.DELIVERED);

                // COD → tự động PAID
                paymentRepository
                        .findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                        .ifPresent(payment -> {
                            if (payment.getMethod() == Payment.PaymentMethod.COD
                                    && payment.getStatus() != Payment.PaymentStatus.SUCCESS) {
                                payment.setStatus(Payment.PaymentStatus.SUCCESS);
                                payment.setPaidAt(LocalDateTime.now());
                                paymentRepository.save(payment);
                                order.setPaymentStatus(Order.PaymentStatus.PAID);
                            }
                        });

                orderRepository.save(order);
                log.info("[AutoDeliver] Đơn #{} → DELIVERED", order.getOrderCode());

            } catch (Exception e) {
                log.error("[AutoDeliver] Lỗi khi xử lý đơn #{}: {}", order.getOrderCode(), e.getMessage());
            }
        }

        log.info("[AutoDeliver] Hoàn tất xử lý {} đơn.", expiredOrders.size());
    }
}