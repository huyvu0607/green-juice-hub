package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.PromotionUsage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Long> {

    /** Đếm số lần user đã dùng mã này */
    int countByPromotionIdAndUserId(Long promotionId, Long userId);

    /** Lịch sử sử dụng mã — kèm user + order, mới nhất trước */
    @Query("""
        SELECT pu FROM PromotionUsage pu
        JOIN FETCH pu.user u
        JOIN FETCH pu.order o
        WHERE pu.promotion.id = :promotionId
        ORDER BY pu.usedAt DESC
    """)
    Page<PromotionUsage> findAllByPromotionId(@Param("promotionId") Long promotionId, Pageable pageable);
}