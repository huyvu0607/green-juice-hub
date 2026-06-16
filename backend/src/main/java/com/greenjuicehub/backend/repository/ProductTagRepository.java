package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.ProductTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductTagRepository extends JpaRepository<ProductTag, Long> {
    @Modifying
    @Query("DELETE FROM ProductTag t WHERE t.product.id = :productId")
    void deleteAllByProductId(@Param("productId") Long productId);
}
