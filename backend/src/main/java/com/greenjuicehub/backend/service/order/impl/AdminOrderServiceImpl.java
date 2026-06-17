// service/order/impl/AdminOrderServiceImpl.java
package com.greenjuicehub.backend.service.order.impl;

import com.greenjuicehub.backend.dto.adminOrder.request.AdminRefundRequest;
import com.greenjuicehub.backend.dto.adminOrder.request.AdminUpdateOrderStatusRequest;
import com.greenjuicehub.backend.dto.adminOrder.response.TopProductResponse;
import com.greenjuicehub.backend.dto.order.response.OrderResponse;
import com.greenjuicehub.backend.entity.*;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.mapper.OrderMapper;
import com.greenjuicehub.backend.repository.*;
import com.greenjuicehub.backend.service.order.IAdminOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminOrderServiceImpl implements IAdminOrderService {

    private final OrderRepository          orderRepository;
    private final OrderItemRepository      orderItemRepository;
    private final PaymentRepository        paymentRepository;
    private final PromotionRepository      promotionRepository;
    private final OrderMapper              orderMapper;
    private final ProductVariantRepository productVariantRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // DANH SÁCH ĐƠN HÀNG
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(
            String status,
            String paymentStatus,
            String search,
            String dateFrom,
            String dateTo,
            Pageable pageable
    ) {
        Order.OrderStatus   orderStatus   = (status        != null && !status.isBlank())
                ? parseOrderStatus(status)          : null;
        Order.PaymentStatus payStatus     = (paymentStatus != null && !paymentStatus.isBlank())
                ? parsePaymentStatus(paymentStatus) : null;
        String              searchTrimmed = (search        != null && !search.isBlank())
                ? search.trim()                     : null;

        LocalDateTime from = parseDate(dateFrom, false);
        LocalDateTime to   = parseDate(dateTo,   true);

        Page<Order> page = orderRepository.findWithFilters(
                orderStatus, payStatus, searchTrimmed, from, to, pageable
        );

        return page.map(this::mapToResponse);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ĐẾM THEO NGÀY (CALENDAR)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getOrderCountsByDate(int year, int month) {
        LocalDateTime from = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime to   = from.plusMonths(1);

        List<Object[]> rows = orderRepository.countGroupByDate(from, to);

        Map<String, Long> result = new HashMap<>();
        for (Object[] row : rows) {
            String day   = row[0].toString();
            Long   count = ((Number) row[1]).longValue();
            result.put(day, count);
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WEEKLY CHART — 7 NGÀY GẦN NHẤT
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getWeeklyOrderCounts() {
        LocalDateTime to   = LocalDate.now().plusDays(1).atStartOfDay(); // exclusive
        LocalDateTime from = LocalDate.now().minusDays(6).atStartOfDay(); // 7 ngày: D-6 → D

        List<Object[]> rows = orderRepository.countGroupByDate(from, to);

        // Map đã có từ DB
        Map<String, Long> dbMap = new HashMap<>();
        for (Object[] row : rows) {
            dbMap.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        // Đảm bảo đủ 7 ngày, ngày nào không có đơn thì = 0, giữ thứ tự
        Map<String, Long> result = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            String key = LocalDate.now().minusDays(i).toString(); // "2026-06-10"
            result.put(key, dbMap.getOrDefault(key, 0L));
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOP PRODUCTS — 30 NGÀY GẦN NHẤT
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts(int limit) {
        LocalDateTime to   = LocalDate.now().plusDays(1).atStartOfDay();
        LocalDateTime from = LocalDate.now().minusDays(29).atStartOfDay(); // 30 ngày

        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> rows = orderItemRepository.findTopProducts(from, to, pageable);

        List<TopProductResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(TopProductResponse.builder()
                    .productId(((Number) row[0]).longValue())
                    .name((String) row[1])
                    .totalSold(((Number) row[2]).longValue())
                    .build());
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHI TIẾT ĐƠN HÀNG
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderDetail(Long orderId) {
        return mapToResponse(findOrderOrThrow(orderId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CẬP NHẬT TRẠNG THÁI
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrderResponse updateStatus(Long orderId, AdminUpdateOrderStatusRequest request) {
        Order order = findOrderOrThrow(orderId);
        Order.OrderStatus targetStatus = parseOrderStatus(request.getStatus());

        validateTransition(order.getStatus(), targetStatus);

        if (targetStatus == Order.OrderStatus.CANCELLED) {
            List<OrderItem> items = orderItemRepository.findAllByOrderIdWithDetails(orderId);
            List<ProductVariant> variantsToUpdate = items.stream()
                    .map(item -> {
                        ProductVariant v = item.getVariant();
                        v.setStockQty(v.getStockQty() + item.getQuantity());
                        return v;
                    })
                    .toList();
            productVariantRepository.saveAll(variantsToUpdate);

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

        if (order.getPaymentStatus() != Order.PaymentStatus.PAID
                && order.getPaymentStatus() != Order.PaymentStatus.REFUND_PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Đơn hàng không ở trạng thái có thể hoàn tiền");
        }

        paymentRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId).ifPresent(payment -> {
            payment.setStatus(Payment.PaymentStatus.REFUNDED);
            payment.setNote(request.getNote() != null && !request.getNote().isBlank()
                    ? request.getNote()
                    : "Đã hoàn tiền cho khách");
            paymentRepository.save(payment);
        });

        order.setPaymentStatus(Order.PaymentStatus.REFUNDED);
        order = orderRepository.save(order);
        return mapToResponse(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ĐẾM SỐ ĐƠN THEO STATUS (TAB BADGE)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getStatusCounts() {
        Map<String, Long> counts = new HashMap<>();

        counts.put("ALL", orderRepository.count());

        for (Order.OrderStatus s : Order.OrderStatus.values()) {
            counts.put(s.name(), orderRepository.countByStatus(s));
        }

        counts.put("PAY_ALL", orderRepository.count());

        for (Order.PaymentStatus ps : Order.PaymentStatus.values()) {
            counts.put("PAY_" + ps.name(), orderRepository.countByPaymentStatus(ps));
        }

        return counts;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private LocalDateTime parseDate(String date, boolean nextDay) {
        if (date == null || date.isBlank()) return null;
        try {
            LocalDate d = LocalDate.parse(date);
            return nextDay ? d.plusDays(1).atStartOfDay() : d.atStartOfDay();
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Định dạng ngày không hợp lệ: " + date);
        }
    }

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

    private Order.OrderStatus parseOrderStatus(String status) {
        try {
            return Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Trạng thái đơn hàng không hợp lệ: " + status);
        }
    }

    private Order.PaymentStatus parsePaymentStatus(String paymentStatus) {
        try {
            return Order.PaymentStatus.valueOf(paymentStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Trạng thái thanh toán không hợp lệ: " + paymentStatus);
        }
    }

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
                    "Không thể chuyển trạng thái từ " + current.name() + " → " + target.name());
        }
    }
}