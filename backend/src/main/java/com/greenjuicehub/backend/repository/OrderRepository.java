package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    /** Lấy danh sách đơn hàng của user, mới nhất trước */
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Lấy chi tiết đơn hàng — chỉ cho phép xem đơn của chính mình */
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    /** Kiểm tra mã đơn hàng có tồn tại chưa (tránh trùng) */
    boolean existsByOrderCode(String orderCode);

    /** Lấy số lượng đơn hàng của User **/
    long countByUserId(Long userId);

    /** Lấy số lượng đơn hàng của status **/
    long countByUserIdAndStatus(Long userId, Order.OrderStatus status);

    /** Lấy số lượng đơn hàng của status theo ngày tạo**/
    Page<Order> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, Order.OrderStatus status, Pageable pageable);

    /** Tìm Order theo code  **/
    Optional<Order> findByOrderCode(String orderCode);

    // ==================== DASHBOARD: Tổng doanh thu trong khoảng thời gian ====================
    // Chỉ tính order có payment_status = PAID
    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.paymentStatus = 'PAID'
              AND o.createdAt >= :from
              AND o.createdAt < :to
            """)
    BigDecimal sumRevenueBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // ==================== DASHBOARD: Số đơn hàng mới (pending) ====================
    long countByStatus(Order.OrderStatus status);

    // ==================== DASHBOARD: Doanh thu + số đơn theo từng ngày (raw) ====================
    // Trả về [ngày (DATE), tổng doanh thu, số đơn] để service group lại theo range
    @Query(value = """
            SELECT DATE(o.created_at) AS day,
                   COALESCE(SUM(o.total_amount), 0) AS revenue,
                   COUNT(*) AS order_count
            FROM orders o
            WHERE o.payment_status = 'PAID'
              AND o.created_at >= :from
              AND o.created_at < :to
            GROUP BY DATE(o.created_at)
            ORDER BY day ASC
            """, nativeQuery = true)
    List<Object[]> sumRevenueGroupByDay(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    // ==================== DASHBOARD: Doanh thu + số đơn theo từng tháng (raw) ====================
    @Query(value = """
            SELECT YEAR(o.created_at) AS y,
                   MONTH(o.created_at) AS m,
                   COALESCE(SUM(o.total_amount), 0) AS revenue,
                   COUNT(*) AS order_count
            FROM orders o
            WHERE o.payment_status = 'PAID'
              AND o.created_at >= :from
              AND o.created_at < :to
            GROUP BY YEAR(o.created_at), MONTH(o.created_at)
            ORDER BY y ASC, m ASC
            """, nativeQuery = true)
    List<Object[]> sumRevenueGroupByMonth(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

}