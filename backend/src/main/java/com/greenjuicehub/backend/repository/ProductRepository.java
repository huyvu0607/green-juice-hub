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

    // ── Public-side ──────────────────────────────────────────────────────────

    Optional<Product> findBySlugAndIsActiveTrueAndIsDeletedFalse(String slug);

    Page<Product> findAllByIsActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndIsActiveTrueAndIsDeletedFalseAndIdNot(
            Long categoryId,
            Long id,
            Pageable pageable
    );

    @Query(value = """
    SELECT p.* FROM products p
    JOIN (
        SELECT product_id, MIN(sale_price) AS min_price
        FROM product_variants
        WHERE is_active = true
        GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
      AND p.is_deleted = false
    ORDER BY v.min_price ASC
    """,
            countQuery = """
    SELECT COUNT(*) FROM products p
    JOIN (
        SELECT product_id FROM product_variants WHERE is_active = true GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
      AND p.is_deleted = false
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
      AND p.is_deleted = false
    ORDER BY v.min_price DESC
    """,
            countQuery = """
    SELECT COUNT(*) FROM products p
    JOIN (
        SELECT product_id FROM product_variants WHERE is_active = true GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
      AND p.is_deleted = false
    """,
            nativeQuery = true)
    Page<Product> findAllOrderByMinPriceDesc(Pageable pageable);

    @Query(value = """
    SELECT p.* FROM products p
    JOIN (
        SELECT product_id, MAX(discount_percent) AS max_discount
        FROM product_variants
        WHERE is_active = true
        GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
      AND p.is_deleted = false
      AND v.max_discount > 0
      AND (:categoryId IS NULL OR p.category_id = :categoryId)
    ORDER BY v.max_discount DESC
    """,
            countQuery = """
    SELECT COUNT(*) FROM products p
    JOIN (
        SELECT product_id, MAX(discount_percent) AS max_discount
        FROM product_variants
        WHERE is_active = true
        GROUP BY product_id
    ) v ON v.product_id = p.id
    WHERE p.is_active = true
      AND p.is_deleted = false
      AND v.max_discount > 0
      AND (:categoryId IS NULL OR p.category_id = :categoryId)
    """,
            nativeQuery = true)
    Page<Product> findAllOrderByMaxDiscountDesc(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query(value = """
    SELECT DISTINCT c.id AS id, c.name AS name, c.slug AS slug
    FROM categories c
    JOIN products p ON p.category_id = c.id
    JOIN product_variants v ON v.product_id = p.id
    WHERE p.is_active = true
      AND p.is_deleted = false
      AND c.is_active = true
      AND v.is_active = true
      AND v.discount_percent > 0
    ORDER BY c.name ASC
    """, nativeQuery = true)
    List<Object[]> findCategoriesWithActiveDeals();

    // ── Admin-side ──────────────────────────────────────────────────────────

    // Tìm tất cả sản phẩm theo keyword + category + isActive + tag, tách riêng
    // danh sách "đang hoạt động" (isDeleted = false) và "thùng rác" (isDeleted = true)
    @Query(
            value = """
        SELECT DISTINCT p FROM Product p
        LEFT JOIN p.tags t
        WHERE (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL OR p.category.id = :categoryId)
          AND (:isActive IS NULL OR p.isActive = :isActive)
          AND (:tag IS NULL OR t.tag = :tag)
          AND p.isDeleted = :isDeleted
        ORDER BY p.createdAt DESC
        """,
            countQuery = """
        SELECT COUNT(DISTINCT p.id) FROM Product p
        LEFT JOIN p.tags t
        WHERE (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:categoryId IS NULL OR p.category.id = :categoryId)
          AND (:isActive IS NULL OR p.isActive = :isActive)
          AND (:tag IS NULL OR t.tag = :tag)
          AND p.isDeleted = :isDeleted
        """
    )
    Page<Product> findAllForAdmin(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("isActive") Boolean isActive,
            @Param("tag") String tag,
            @Param("isDeleted") Boolean isDeleted,
            Pageable pageable);

    // Kiểm tra slug trùng khi tạo/sửa (loại trừ chính nó khi update)
    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsBySlug(String slug);

    Optional<Product> findById(Long id);

    boolean existsByCategoryId(Long categoryId);

    List<Product> findByIsDeletedFalseAndIsActiveTrue();
}