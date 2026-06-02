package com.greenjuicehub.backend.dto.product.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Builder
public class ProductVariantResponse {
    private Long id;
    private FlavorResponse flavor;
    private SizeResponse size;
    private BigDecimal originalPrice;
    private BigDecimal salePrice;
    private BigDecimal discountPercent;
    private Integer stockQty;
    private Integer sortOrder;
}