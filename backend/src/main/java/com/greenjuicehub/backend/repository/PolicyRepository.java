package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.ShippingPolicy;
import com.greenjuicehub.backend.entity.ShippingPolicy.PolicyType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PolicyRepository extends JpaRepository<ShippingPolicy, Long> {

    // ── Public ───────────────────────────────────────────────────────────────
    Optional<ShippingPolicy> findByTypeAndIsActiveTrue(PolicyType type);

    List<ShippingPolicy> findAllByIsActiveTrueOrderBySortOrderAsc();

    // ── Admin ─────────────────────────────────────────────────────────────────
    /** Lấy tất cả (kể cả inactive) để hiển thị trong trang quản trị */
    List<ShippingPolicy> findAllByOrderBySortOrderAsc();

    /** Kiểm tra type đã tồn tại chưa — dùng khi tạo mới */
    boolean existsByType(PolicyType type);

    /** Kiểm tra type đã tồn tại ở bản ghi khác — dùng khi update đổi type */
    boolean existsByTypeAndIdNot(PolicyType type, Long id);
}