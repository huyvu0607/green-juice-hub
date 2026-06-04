package com.greenjuicehub.backend.dto.cart.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {

    private Long cartItemId;
    private Long productId;
    private String productName;
    private String productSlug;
    private String imageUrl;

    private Long variantId;
    private String flavorName;
    private String sizeName;
    private String variantLabel;

    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private Integer discountPercent;

    private Integer quantity;
    private BigDecimal subtotal;

    private Integer stockQty;
    private Boolean inStock;
}