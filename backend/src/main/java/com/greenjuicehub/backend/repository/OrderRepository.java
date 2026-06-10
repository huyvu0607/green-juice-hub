package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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


}