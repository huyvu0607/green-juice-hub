package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findAllByProductIdAndIsActiveTrueOrderBySortOrderAsc(Long productId);
}