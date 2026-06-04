package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("""
            SELECT ci FROM CartItem ci
            JOIN FETCH ci.product p
            JOIN FETCH ci.variant v
            LEFT JOIN FETCH v.flavor
            LEFT JOIN FETCH v.size
            WHERE ci.cart.id = :cartId
            """)
    List<CartItem> findAllByCartIdWithDetails(@Param("cartId") Long cartId);

    Optional<CartItem> findByCartIdAndVariantId(Long cartId, Long variantId);

    boolean existsByCartIdAndId(Long cartId, Long cartItemId);

    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.cart.id = :cartId")
    void deleteAllByCartId(@Param("cartId") Long cartId);
}