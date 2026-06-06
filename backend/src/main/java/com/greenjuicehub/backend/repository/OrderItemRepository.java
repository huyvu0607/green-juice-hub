package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}