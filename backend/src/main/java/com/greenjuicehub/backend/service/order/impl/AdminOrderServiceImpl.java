// service/order/impl/AdminOrderServiceImpl.java
package com.greenjuicehub.backend.service.order.impl;

import com.greenjuicehub.backend.dto.adminOrder.request.AdminRefundRequest;
import com.greenjuicehub.backend.dto.adminOrder.request.AdminUpdateOrderStatusRequest;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.OrderMapper;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.order.IAdminOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminOrderServiceImpl implements IAdminOrderService {

    private final OrderRepository         orderRepository;
    private final OrderItemRepository     orderItemRepository;
    private final PaymentRepository       paymentRepository;
    private final PromotionRepository     promotionRepository;
    private final OrderMapper             orderMapper;
    private final ProductVariantRepository productVariantRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // DANH SÁCH ĐƠN HÀNG
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(String status, String search, Pageable pageable) {

        boolean hasStatus = status != null && !status.isBlank();
        boolean hasSearch = search != null && !search.isBlank();

        Page<Order> page;

        if (hasSearch && hasStatus) {
            Order.OrderStatus orderStatus = parseStatus(status);
            page = orderRepository
                    .findByOrderCodeContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
                            search, orderStatus, pageable);

        } else if (hasSearch) {
            page = orderRepository
                    .findByOrderCodeContainingIgnoreCaseOrderByCreatedAtDesc(search, pageable);

        } else if (hasStatus) {
            Order.OrderStatus orderStatus = parseStatus(status);
            page = orderRepository.findByStatusOrderByCreatedAtDesc(orderStatus, pageable);

        } else {
            page = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return page.map(this::mapToResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHI TIẾT ĐƠN HÀNG
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(Long orderId) {
        Order order = findOrderOrThrow(orderId);
        return mapToResponse(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CẬP NHẬT TRẠNG THÁI
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse updateStatus(Long orderId, AdminUpdateOrderStatusRequest request) {
        Order order = findOrderOrThrow(orderId);
        Order.OrderStatus targetStatus = parseStatus(request.getStatus());

        validateTransition(order.getStatus(), targetStatus);

        if (targetStatus == Order.OrderStatus.CANCELLED) {
            // Hoàn lại tồn kho
            List<OrderItem> items = orderItemRepository.findAllByOrderIdWithDetails(orderId);
            List<ProductVariant> variantsToUpdate = items.stream()
                    .map(item -> {
                        ProductVariant v = item.getVariant();
                        v.setStockQty(v.getStockQty() + item.getQuantity());
                        return v;
                    })
                    .toList();
            productVariantRepository.saveAll(variantsToUpdate);

            // Hoàn lại lượt dùng mã khuyến mãi
            if (order.getPromotion() != null) {
                Promotion promo = order.getPromotion();
                promo.setUsedCount(Math.max(0, promo.getUsedCount() - 1));
                promotionRepository.save(promo);
            }

            String reason = (request.getCancelReason() != null && !request.getCancelReason().isBlank())
                    ? request.getCancelReason().trim()
                    : "Admin huỷ đơn";
            order.setCancelReason(reason);

            if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
                paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                        .ifPresent(payment -> {
                            payment.setNote("Chờ hoàn tiền do admin huỷ đơn: " + reason);
                            paymentRepository.save(payment);
                        });
                order.setPaymentStatus(Order.PaymentStatus.REFUND_PENDING);
            }
        }


        order.setStatus(targetStatus);
        order = orderRepository.save(order);
        return mapToResponse(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HOÀN TIỀN
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public OrderResponse refund(Long orderId, AdminRefundRequest request) {
        Order order = findOrderOrThrow(orderId);

        if (order.getStatus() != Order.OrderStatus.DELIVERED
                && order.getStatus() != Order.OrderStatus.CANCELLED) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Chỉ có thể hoàn tiền đơn hàng đã giao hoặc đã huỷ");
        }

        // Chấp nhận cả PAID (hoàn từ DELIVERED) lẫn REFUND_PENDING (xác nhận đã chuyển tiền)
        if (order.getPaymentStatus() != Order.PaymentStatus.PAID
                && order.getPaymentStatus() != Order.PaymentStatus.REFUND_PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Đơn hàng không ở trạng thái có thể hoàn tiền");
        }

        paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId).ifPresent(payment -> {
            payment.setStatus(Payment.PaymentStatus.REFUNDED);
            payment.setNote(request.getNote() != null ? request.getNote() : "Đã hoàn tiền cho khách");
            paymentRepository.save(payment);
        });

        order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
        order = orderRepository.save(order);
        return mapToResponse(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ĐẾM SỐ ĐƠN THEO STATUS
    // ─────────────────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getStatusCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("ALL", orderRepository.count());
        for (Order.OrderStatus s : Order.OrderStatus.values()) {
            counts.put(s.name(), orderRepository.countByStatus(s));
        }
        return counts;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private Order findOrderOrThrow(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn hàng #" + orderId));
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findAllByOrderIdWithDetails(order.getId());
        Payment payment = paymentRepository
                .findTopByOrderIdOrderByCreatedAtDesc(order.getId())
                .orElse(null);
        return orderMapper.toOrderResponse(order, items, payment);
    }

    private Order.OrderStatus parseStatus(String status) {
        try {
            return Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Trạng thái không hợp lệ: " + status);
        }
    }

    /**
     * Luồng hợp lệ:
     * PENDING → CONFIRMED | CANCELLED
     * CONFIRMED → SHIPPING | CANCELLED
     * SHIPPING → DELIVERED | CANCELLED
     * DELIVERED / CANCELLED → không được đổi nữa
     */
    private void validateTransition(Order.OrderStatus current, Order.OrderStatus target) {
        boolean valid = switch (current) {
            case PENDING   -> target == Order.OrderStatus.CONFIRMED
                    || target == Order.OrderStatus.CANCELLED;
            case CONFIRMED -> target == Order.OrderStatus.SHIPPING
                    || target == Order.OrderStatus.CANCELLED;
            case SHIPPING  -> target == Order.OrderStatus.DELIVERED
                    || target == Order.OrderStatus.CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };

        if (!valid) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Không thể chuyển trạng thái từ " + current.name()
                            + " → " + target.name());
        }
    }
}