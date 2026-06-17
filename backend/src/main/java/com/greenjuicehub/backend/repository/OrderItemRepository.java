package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.OrderItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /** Lấy tất cả items của 1 đơn hàng kèm product + variant (tránh N+1) */
    @Query("""
            SELECT oi FROM OrderItem oi
            JOIN FETCH oi.product p
            LEFT JOIN FETCH p.images img
            JOIN FETCH oi.variant v
            WHERE oi.order.id = :orderId
            """)
    List<OrderItem> findAllByOrderIdWithDetails(@Param("orderId") Long orderId);

    /**
     * Top sản phẩm bán chạy — đếm tổng quantity theo product, trong khoảng thời gian.
     * Chỉ tính đơn DELIVERED hoặc SHIPPING (không tính CANCELLED).
     * Trả về: [productId, productName, variantLabel, totalQty]
     * variantLabel = flavor + size ghép lại cho dễ hiển thị
     */
    @Query("""
            SELECT
                oi.product.id,
                oi.product.name,
                SUM(oi.quantity)
            FROM OrderItem oi
            JOIN oi.order o
            WHERE o.status IN (
                com.greenjuicehub.backend.entity.Order.OrderStatus.DELIVERED,
                com.greenjuicehub.backend.entity.Order.OrderStatus.SHIPPING,
                com.greenjuicehub.backend.entity.Order.OrderStatus.CONFIRMED
            )
              AND (:from IS NULL OR o.createdAt >= :from)
              AND (:to   IS NULL OR o.createdAt <  :to)
            GROUP BY oi.product.id, oi.product.name
            ORDER BY SUM(oi.quantity) DESC
            """)
    List<Object[]> findTopProducts(
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to,
            Pageable pageable
    );
}