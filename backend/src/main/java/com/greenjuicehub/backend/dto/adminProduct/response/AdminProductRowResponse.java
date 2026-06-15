package com.greenjuicehub.backend.dto.adminProduct.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminProductRowResponse {
    private Long id;
    private String name;
    private String slug;
    private String primaryImage;
    private String categoryName;
    private Integer variantCount;
    private Integer totalStock;
    private BigDecimal minSalePrice;
    private BigDecimal maxDiscountPercent;
    private Float avgRating;
    private Integer reviewCount;
    private Boolean isActive;
    private LocalDateTime createdAt;
}