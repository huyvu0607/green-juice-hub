package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.PromotionUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionUsageRepository extends JpaRepository<PromotionUsage, Long> {

    /** Đếm số lần user đã dùng mã này */
    int countByPromotionIdAndUserId(Long promotionId, Long userId);
}