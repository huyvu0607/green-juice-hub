package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByProductIdAndUserIdAndOrderId(Long productId, Long userId, Long orderId);

    Page<Review> findByProductIdAndIsApprovedTrueOrderByCreatedAtDesc(Long productId, Pageable pageable);

    Page<Review> findByIsApprovedFalseOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT r.rating, COUNT(r) FROM Review r " +
            "WHERE r.product.id = :productId AND r.isApproved = true " +
            "GROUP BY r.rating")
    List<Object[]> countRatingDistribution(@Param("productId") Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r " +
            "WHERE r.product.id = :productId AND r.isApproved = true")
    Double calculateAvgRating(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r " +
            "WHERE r.product.id = :productId AND r.isApproved = true")
    Integer countApprovedByProductId(@Param("productId") Long productId);

    @Query("SELECT r.product.id FROM Review r WHERE r.order.id = :orderId AND r.user.id = :userId")
    List<Long> findReviewedProductIdsByOrderIdAndUserId(
            @Param("orderId") Long orderId,
            @Param("userId") Long userId);

    @Query("SELECT r FROM Review r WHERE r.product.id = :productId AND r.isApproved = true " +
            "AND (:rating IS NULL OR r.rating = :rating) " +
            "ORDER BY r.createdAt DESC")
    Page<Review> findByProductIdAndRating(
            @Param("productId") Long productId,
            @Param("rating") Integer rating,
            Pageable pageable);

    // ── Admin filter — THÊM MỚI ───────────────────────────────────────────────
    /**
     * Lấy tất cả reviews với filter isApproved + rating tuỳ chọn
     * isApproved = null  → lấy tất cả
     * rating     = null  → không lọc sao
     */
    @Query("SELECT r FROM Review r " +
            "WHERE (:isApproved IS NULL OR r.isApproved = :isApproved) " +
            "AND (:rating IS NULL OR r.rating = :rating) " +
            "ORDER BY r.createdAt DESC")
    Page<Review> findAllForAdmin(
            @Param("isApproved") Boolean isApproved,
            @Param("rating") Integer rating,
            Pageable pageable);

    long countByIsApprovedFalse();
}