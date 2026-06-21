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

    // ── User ─────────────────────────────────────────────────────────────────

    /** Lấy danh sách đơn hàng của user, mới nhất trước */
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Lấy chi tiết đơn hàng — chỉ cho phép xem đơn của chính mình */
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    /** Kiểm tra mã đơn hàng có tồn tại chưa (tránh trùng) */
    boolean existsByOrderCode(String orderCode);

    /** Lấy số lượng đơn hàng của User */
    long countByUserId(Long userId);

    /** Lấy số lượng đơn hàng của status theo user */
    long countByUserIdAndStatus(Long userId, Order.OrderStatus status);

    /** Lấy đơn hàng của user theo status, mới nhất trước */
    Page<Order> findByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId, Order.OrderStatus status, Pageable pageable);

    /** Tìm Order theo code */
    Optional<Order> findByOrderCode(String orderCode);

    // ── Dashboard ─────────────────────────────────────────────────────────────

    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.paymentStatus = 'PAID'
              AND o.createdAt >= :from
              AND o.createdAt < :to
            """)
    BigDecimal sumRevenueBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    long countByStatus(Order.OrderStatus status);

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

    // ── Admin: các method cũ (giữ nguyên) ────────────────────────────────────

    /** Admin: lấy tất cả đơn, mới nhất trước */
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Admin: lọc theo order status */
    Page<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status, Pageable pageable);

    /** Admin: tìm theo orderCode (LIKE) */
    Page<Order> findByOrderCodeContainingIgnoreCaseOrderByCreatedAtDesc(
            String orderCode, Pageable pageable);

    /** Admin: tìm theo orderCode + order status */
    Page<Order> findByOrderCodeContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(
            String orderCode, Order.OrderStatus status, Pageable pageable);

    // ── Admin: MỚI — đếm + filter theo paymentStatus ─────────────────────────

    /** Đếm số đơn theo trạng thái thanh toán — dùng cho tab badge */
    long countByPaymentStatus(Order.PaymentStatus paymentStatus);

    /**
     * Query tổng hợp cho admin — xử lý mọi tổ hợp filter:
     *   status        = null  → bỏ qua filter order status
     *   paymentStatus = null  → bỏ qua filter payment status
     *   search        = null  → bỏ qua tìm kiếm orderCode
     * Kết quả sắp xếp mới nhất trước.
     */
    @Query("""
            SELECT o FROM Order o
            WHERE (:status        IS NULL OR o.status        = :status)
              AND (:paymentStatus IS NULL OR o.paymentStatus = :paymentStatus)
              AND (:search        IS NULL OR LOWER(o.orderCode) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:dateFrom      IS NULL OR o.createdAt    >= :dateFrom)
              AND (:dateTo        IS NULL OR o.createdAt    <  :dateTo)
            ORDER BY o.createdAt DESC
            """)
    Page<Order> findWithFilters(
            @Param("status")        Order.OrderStatus   status,
            @Param("paymentStatus") Order.PaymentStatus paymentStatus,
            @Param("search")        String              search,
            @Param("dateFrom")      LocalDateTime       dateFrom,
            @Param("dateTo")        LocalDateTime       dateTo,
            Pageable pageable
    );

    /**
     * Đếm số đơn theo từng ngày trong khoảng thời gian — dùng cho mini calendar
     */
    @Query(value = """
        SELECT DATE(o.created_at) AS day, COUNT(*) AS cnt
        FROM orders o
        WHERE o.created_at >= :from
          AND o.created_at <  :to
        GROUP BY DATE(o.created_at)
        """, nativeQuery = true)
    List<Object[]> countGroupByDate(
            @Param("from") LocalDateTime from,
            @Param("to")   LocalDateTime to
    );
    // ── Scheduler ────────────────────────────────────────────────────────────

    /** Tìm đơn SHIPPING đã quá hạn — dùng cho scheduled job */
    List<Order> findByStatusAndUpdatedAtBefore(Order.OrderStatus status, LocalDateTime before);

    /** Tìm đơn PENDING đã quá hạn thanh toán (QR/chuyển khoản) — dùng cho AutoCancelScheduler */
    List<Order> findAllByStatusAndExpiresAtBefore(Order.OrderStatus status, LocalDateTime before);
}