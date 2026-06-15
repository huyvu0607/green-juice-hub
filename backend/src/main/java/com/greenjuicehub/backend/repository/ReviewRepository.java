package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Kiểm tra user đã review SP này trong đơn này chưa
    boolean existsByProductIdAndUserIdAndOrderId(Long productId, Long userId, Long orderId);

    // Lấy review đã duyệt của 1 sản phẩm (public)
    Page<Review> findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(Long productId, Pageable pageable);

    // Lấy tất cả review chờ duyệt (admin/staff)
    Page<Review> findByIsApprovedFalseOrderByCreatedAtDesc(Pageable pageable);

    // Phân bổ sao (chỉ tính review đã duyệt)
    @Query("SELECT r.rating, COUNT(r) FROM Review r " +
            "WHERE r.product.id = :productId AND r.isApproved = true " +
            "GROUP BY r.rating")
    List<Object[]> countRatingDistribution(@Param("productId") Long productId);

    // Tính lại avg_rating sau khi approve/reject
    @Query("SELECT AVG(r.rating) FROM Review r " +
            "WHERE r.product.id = :productId AND r.isApproved = true")
    Double calculateAvgRating(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r " +
            "WHERE r.product.id = :productId AND r.isApproved = true")
    Integer countApprovedByProductId(@Param("productId") Long productId);

    /** Check Sản phẩm được viết đánh giá chưa **/
    @Query("SELECT r.product.id FROM Review r WHERE r.order.id = :orderId AND r.user.id = :userId")
    List<Long> findReviewedProductIdsByOrderIdAndUserId(
            @Param("orderId") Long orderId,
            @Param("userId") Long userId
    );

    /** Lấy review đã duyệt, có thể filter theo số sao **/
    @Query("SELECT r FROM Review r WHERE r.product.id = :productId AND r.isApproved = true " +
            "AND (:rating IS NULL OR r.rating = :rating) " +
            "ORDER BY r.createdAt DESC")
    Page<Review> findByProductIdAndRating(
            @Param("productId") Long productId,
            @Param("rating") Integer rating,
            Pageable pageable);

    // ==================== DASHBOARD: Đếm review chờ duyệt ====================
    long countByIsApprovedFalse();
}