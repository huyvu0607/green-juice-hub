package com.greenjuicehub.backend.dto.product.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class ProductSummaryResponse {
    private Long id;
    private String name;
    private String slug;
    private String primaryImage;
    private Float avgRating;
    private Integer reviewCount;
    private BigDecimal minSalePrice;
    private BigDecimal maxSalePrice;
    private BigDecimal minOriginalPrice;
    private BigDecimal maxDiscountPercent;
    private List<String> tags;
    private Boolean inStock;
    private String categoryName;
    private Long defaultVariantId;
}