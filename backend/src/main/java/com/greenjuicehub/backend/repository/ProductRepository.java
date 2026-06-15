package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>,
        JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlugAndIsActiveTrue(String slug);
    Page<Product> findAllByIsActiveTrue(Pageable pageable);
    @Query(value = """
    SELECT p.* FROM products p
    JOIN (
        SELECT product_id, MIN(sale_price) AS min_price
        FROM product_variants
        WHERE is_active = true
        GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
    ORDER BY v.min_price ASC
    """,
            countQuery = """
    SELECT COUNT(*) FROM products p
    JOIN (
        SELECT product_id FROM product_variants WHERE is_active = true GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
    """,
            nativeQuery = true)
    Page<Product> findAllOrderByMinPriceAsc(Pageable pageable);

    @Query(value = """
    SELECT p.* FROM products p
    JOIN (
        SELECT product_id, MIN(sale_price) AS min_price
        FROM product_variants
        WHERE is_active = true
        GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
    ORDER BY v.min_price DESC
    """,
            countQuery = """
    SELECT COUNT(*) FROM products p
    JOIN (
        SELECT product_id FROM product_variants WHERE is_active = true GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
    """,
            nativeQuery = true)
    Page<Product> findAllOrderByMinPriceDesc(Pageable pageable);
    List<Product> findByCategoryIdAndIsActiveTrueAndIdNot(
            Long categoryId,
            Long excludeId,
            Pageable pageable
    );

    // ── Admin-side (thêm mới) ──────────────────────────────────────────────────

    // Tìm tất cả sản phẩm (cả active lẫn inactive) theo keyword + category
    @Query("""
            SELECT p FROM Product p
            WHERE (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
            ORDER BY p.createdAt DESC
            """)
    Page<Product> findAllForAdmin(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            Pageable pageable);

    // Kiểm tra slug trùng khi tạo/sửa (loại trừ chính nó khi update)
    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsBySlug(String slug);

    Optional<Product> findById(Long id);
}